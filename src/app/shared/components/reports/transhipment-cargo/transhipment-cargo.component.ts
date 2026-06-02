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
  selector: 'app-transhipment-cargo',
  standalone: true,
  imports: [
    CustomDatePipe,
    CommonModule,
    PrintHeaderComponent,
    PrintFooterComponent,
  ],
  templateUrl: './transhipment-cargo.component.html',
  styleUrl: './transhipment-cargo.component.scss'
})
export class TranshipmentCargoComponent {

  currentCompany: any;
  currentBranch: any;
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
        'transhipment-cargo',
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

  getExcelData(): ComplexReportExportConfig {
    const tableHeaders: ExcelHeader[] = [
      { key: 'HBLDate', label: 'HBL Date'},
      { key: 'HBLNo', label: 'HBL No.'},
      { key: 'MBLNo', label: 'MBL No.'},
      { key: 'OriginAgent', label: 'Origin Agent'},
      { key: 'BookingNo', label: 'Export Booking No.'},
      { key: 'ContainerNo', label: 'Imp.Cont.No.'},
      { key: 'PackageCount', label: 'Pkgs'},
      { key: 'ExternaPkg', label: 'PkgType'},
      { key: 'GrossWeight', label: 'Weight'},
      { key: 'Volume', label: 'Volume'},
      { key: 'FPD', label: 'Final Destination'},
      { key: 'Vessel', label: 'Vessel'},
      { key: 'VoyageNo', label: 'Voyage'},
      { key: 'ETA', label: 'Vessel Arrival Date'},
      { key: 'CargoReceivedDate', label: 'Des Struc Date'},
      { key: 'Coloader', label: 'Coloader'},
    ];

    const rows: ExcelRow[] = (this.fullData?.data || []).map((item) => ({
      cells: [
        { value: this.formatDate(item.HBLDate) },
        { value: item.HBLNo || '' },
        { value: item.MBLNo || '' },
        { value: item.OriginAgent || '' },
        { value: item.BookingNo || '' },
        { value: item.ContainerNo || '' },
        {
          value: this.formatNumber(item.PackageCount),
          alignment: { horizontal: 'right' },
        },
        { value: item.ExternaPkg || '' },
        {
          value: this.formatNumber(item.GrossWeight),
          alignment: { horizontal: 'right' },
        },
        {
          value: this.formatNumber(item.Volume),
          alignment: { horizontal: 'right' },
        },
        { value: item.FPD || '' },
        { value: item.Vessel || '' },
        { value: item.VoyageNo || '' },
        { value: this.formatDate(item.ETA) },
        { value: this.formatDate(item.CargoReceivedDate) },
        { value: item.Coloader || '' },
      ],
      style: 'data',
    }));

    const totals = this.totals; // reuse the existing getter

  rows.push({
    cells: [
      { value: '' },
      { value: '' },
      { value: '' },
      { value: '' },
      { value: '' },
      { value: '' },
      {
        value: this.formatNumber(totals.packageCount),
        alignment: { horizontal: 'right' },
      },
      { value: '' },
      {
        value: this.formatNumber(totals.grossWeight),
        alignment: { horizontal: 'right' },
      },
      {
        value: this.formatNumber(totals.volume),
        alignment: { horizontal: 'right' },
      },
      { value: '' },
      { value: '' },
      { value: '' },
      { value: '' },
      { value: '' },
      { value: '' },
    ],
    style: 'total', 
  });

    return {
      fileName: 'Transhipment-Cargo-Report',
      sheetName: 'Report',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: 'Transhipment Cargo Report',
        additionalInfo: [
          { label: 'To HBL Date', value: this.formatDate(this.params?.ToHblDt) },
          { label: 'Branch', value: this.fullData?.branchInvolved || '' },
        ],
      },
      tableHeaders,
      rows,
      columnWidths: [15, 18, 25, 20, 28, 15, 12, 14, 14, 14, 18, 20, 14, 18, 18, 20],
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

  get totals(): { packageCount: number; grossWeight: number; volume: number } {
  const data = this.fullData?.data || [];
  return data.reduce(
    (acc, item) => ({
      packageCount: acc.packageCount + (Number(item.PackageCount) || 0),
      grossWeight:  acc.grossWeight  + (Number(item.GrossWeight)  || 0),
      volume:       acc.volume       + (Number(item.Volume)       || 0),
    }),
    { packageCount: 0, grossWeight: 0, volume: 0 }
  );
}

}
