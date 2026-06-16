import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import {
  ComplexReportExportConfig,
  ExcelCell,
  ExcelHeader,
  ExcelRow,
} from 'src/app/shared/excel-report-service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';

@Component({
  selector: 'app-unpicked-cargo',
  standalone: true,
  imports: [
    CustomDatePipe,
    CommonModule,
    PrintHeaderComponent,
    PrintFooterComponent,
  ],
  templateUrl: './unpicked-cargo.component.html',
  styles: ``,
})
export class UnpickedCargoComponent {
  currentCompany: any;
  currentBranch: any;
  selectedData: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService,
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    this.orientation =
      this.reportRegistryService.getReportConfig(
        'unpicked-cargo',
      ).pdfOrientation;
  }

  get fullData(): any {
    return this.data || {};
  }

  get params(): any {
    return this.data?.params || {};
  }

  get bucketLabels(): any {
    return this.fullData?.bucketLabels || [];
  }

  totalPkgs(): number {
    return (this.fullData?.data || []).reduce((sum, item) => {
      return sum + (Number(item?.Pkgs) || 0);
    }, 0);
  }

  totalGrossWt(): number {
    return (this.fullData?.data || []).reduce((sum, item) => {
      return sum + (Number(item?.Weight) || 0);
    }, 0);
  }

  totalVolume(): number {
    return (this.fullData?.data || []).reduce((sum, item) => {
      return sum + (Number(item?.Volume) || 0);
    }, 0);
  }

  getExcelData(): ComplexReportExportConfig {
    const tableHeaders: ExcelHeader[] = [
      { key: 'DwellPeriod', label: 'Dwell Period' },
      { key: 'HBLDate', label: 'HBL Date' },
      { key: 'HBLNo', label: 'HBL No' },
      { key: 'MBLNo', label: 'MBL No' },
      { key: 'OriginAgent', label: 'Origin Agent' },
      { key: 'ContainerNo', label: 'Container No' },
      { key: 'ETA', label: 'Vessel Arrival Date' },
      { key: 'FreeDays', label: 'Free Days' },
      { key: 'StorageFrom', label: 'Storage From' },
      { key: 'Pkgs', label: 'Pkgs' },
      { key: 'PkgType', label: 'Pkg Type' },
      { key: 'Weight', label: 'Weight' },
      { key: 'Volume', label: 'Volume' },
      { key: 'FPD', label: 'Final Destination' },
    ];

    const rows: ExcelRow[] = (this.fullData?.data || []).map((item) => ({
      cells: [
        { value: item.DwellPeriod || '' },
        { value: this.formatDate(item.HBLDate) },
        { value: item.HBLNo || '' },
        { value: item.MBLNo || '' },
        { value: item.OriginAgent || '' },
        { value: item.ContainerNo || '' },
        { value: this.formatDate(item.ETA) },
        { value: item.FreeDays || '' },
        { value: this.formatDate(item.StorageFrom) },
        { value: this.formatNumber(item.Pkgs) || 0 },
        { value: item.PkgType || '' },
        { value: this.formatNumber(item.Weight) || 0 },
        { value: this.formatNumber(item.Volume) || 0 },
        { value: item.FPD || '' },
      ],
      style: 'data',
    }));

    rows.push({
      cells: [
        {
          value: 'Total',
          colSpan: 9,
          alignment: { horizontal: 'right' },
        } as any,
        { value: '' },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: this.formatNumber(this.totalPkgs()) },
        { value: '' },
        { value: this.formatNumber(this.totalGrossWt()) },
        { value: this.formatNumber(this.totalVolume()) },
        { value: '' },
      ],
      style: 'total',
    });

    return {
      fileName: 'Unpicked-Cargo-Report',
      sheetName: 'UnpickedCargoReport',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: 'Unpicked Cargo Report',
        additionalInfo: [
          {
            label: 'HBL From Date',
            value: this.formatDate(this.params?.FromHblDt),
          },
          {
            label: 'HBL To Date',
            value: this.formatDate(this.params?.ToHblDt),
          },
          {
            label: 'Branch',
            value: this.fullData?.branchInvolved || '',
          },
        ],
      },
      tableHeaders,
      rows,
      columnWidths: [15, 15, 18, 18, 25, 25, 18, 12, 15, 12, 15, 15, 15, 25],
    };
  }

  private formatDate(date: any): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-GB');
    } catch {
      return String(date);
    }
  }

  private formatNumber(value: any): string {
    if (value === null || value === undefined) return '';

    const num = Number(value);
    if (isNaN(num)) return '';

    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
