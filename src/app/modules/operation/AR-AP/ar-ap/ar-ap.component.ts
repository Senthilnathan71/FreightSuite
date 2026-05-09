import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ArApMode, ArApRow, ArApService, ArApStatusFilter, ArApTotals, ArApVoucherFilter } from './ar-ap.service';

interface ArApFilter {
  voucherType: ArApVoucherFilter;
  status: ArApStatusFilter;
}

@Component({
  selector: 'app-ar-ap',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, FeatherModule],
  templateUrl: './ar-ap.component.html',
  styleUrl: './ar-ap.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ArApComponent implements OnChanges {
  @Input() mode: ArApMode = 'master-job';
  @Input() documentId: number | null | undefined;
  @Input() emptyDescription = 'No accounting records found for this document.';
  @Input() exportFileName = 'ARAP-Report';
  @Input() showPrint = false;
  @Input() refreshKey: any;

  @Output() totalsChange = new EventEmitter<ArApTotals>();
  @Output() dataChange = new EventEmitter<ArApRow[]>();
  @Output() loadingChange = new EventEmitter<boolean>();

  arapLoading = false;
  arapData: ArApRow[] = [];
  filteredData: ArApRow[] = [];
  arapFilter: ArApFilter = {
    voucherType: 'all',
    status: 'all'
  };

  totals: ArApTotals = {
    revenueAmount: 0,
    revenueLocalAmount: 0,
    costAmount: 0,
    costLocalAmount: 0,
    rowCount: 0
  };

  constructor(
    private arApService: ArApService,
    private appSettingService: AppSettingsService,
    private exportExcelService: ExcelExportService,
    private router: Router
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documentId'] || changes['mode'] || changes['refreshKey']) {
      this.loadARAPData();
    }
  }

  loadARAPData(): void {
    if (!this.documentId) {
      this.setData([]);
      this.arapLoading = false;
      this.loadingChange.emit(false);
      return;
    }

    this.arapLoading = true;
    this.loadingChange.emit(true);
    this.arApService.loadData(this.mode, Number(this.documentId)).subscribe({
      next: (data) => {
        this.setData(data);
        this.arapLoading = false;
        this.loadingChange.emit(false);
      },
      error: (error) => {
        console.error('Error loading AR/AP data:', error);
        this.setData([]);
        this.arapLoading = false;
        this.loadingChange.emit(false);
        this.appSettingService.showError('Failed to load AR/AP data');
      }
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  exportARAPReport(): void {
    if (this.filteredData.length === 0) {
      this.appSettingService.showWarning('No data to export');
      return;
    }

    const dataForExport = this.filteredData.map(item => ({
      'Voucher No': item.VoucherNumber,
      'Document Type': item.DocumentTypeCode,
      'Date': item.VoucherDate,
      'Currency': item.CurrencyCode,
      'Revenue Amount': this.getRevenueAmount(item) ?? '',
      'Revenue Local Amount': this.getRevenueLocalAmount(item) ?? '',
      'Cost Amount': this.getCostAmount(item) ?? '',
      'Cost Local Amount': this.getCostLocalAmount(item) ?? '',
      'Post Status': item.PostStatus
    }));

    this.exportExcelService.exportAsExcel({
      data: dataForExport,
      headers: [
        { key: 'Voucher No', label: 'Voucher No' },
        { key: 'Document Type', label: 'Document Type' },
        { key: 'Date', label: 'Date' },
        { key: 'Currency', label: 'Currency' },
        { key: 'Revenue Amount', label: 'Revenue Amount' },
        { key: 'Revenue Local Amount', label: 'Revenue Local Amount' },
        { key: 'Cost Amount', label: 'Cost Amount' },
        { key: 'Cost Local Amount', label: 'Cost Local Amount' },
        { key: 'Post Status', label: 'Post Status' }
      ],
      fileName: this.exportFileName,
      title: 'AR/AP Report'
    });
  }

  printARAPReport(): void {
    window.print();
  }

  openVoucherDetails(item: ArApRow): void {
    const voucherHeaderSid = item?.VoucherHeaderSid;
    const documentTypeCode = this.arApService.getDocumentTypeCode(item);
    if (!voucherHeaderSid) return;

    if (['INV', 'CRN'].includes(documentTypeCode)) {
      this.router.navigate(['operation/invoice/entry/', voucherHeaderSid]);
    } else if (['VIN', 'VINV', 'PMT', 'VCRN', 'VRN'].includes(documentTypeCode)) {
      this.router.navigate(['operation/vendor-invoice/entry/', voucherHeaderSid]);
    }
  }

  getRevenueAmount(item: ArApRow): number | null {
    return this.arApService.getRevenueAmount(item);
  }

  getRevenueLocalAmount(item: ArApRow): number | null {
    return this.arApService.getRevenueLocalAmount(item);
  }

  getCostAmount(item: ArApRow): number | null {
    return this.arApService.getCostAmount(item);
  }

  getCostLocalAmount(item: ArApRow): number | null {
    return this.arApService.getCostLocalAmount(item);
  }

  private setData(data: ArApRow[]): void {
    this.arapData = data;
    this.applyFilters();
    this.dataChange.emit(this.arapData);
  }

  private applyFilters(): void {
    this.filteredData = this.arApService.filterRows(
      this.arapData,
      this.arapFilter.voucherType,
      this.arapFilter.status
    );
    this.calculateTotals();
  }

  private calculateTotals(): void {
    this.totals = this.arApService.calculateTotals(this.filteredData);
    this.totalsChange.emit(this.totals);
  }

}
