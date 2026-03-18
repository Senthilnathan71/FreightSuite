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

@Component({
  selector: 'app-container-wise-kpi',
  standalone: true,
  imports: [CustomDatePipe, CommonModule, PrintHeaderComponent],
  templateUrl: './container-wise-kpi.component.html',
  styles: ``,
})
export class ContainerWiseKpiComponent {
  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService,
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation =
      this.reportRegistryService.getReportConfig(
        'contanier-wise-kpi',
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
      { key: 'bookingNo', label: 'Booking No' },
      { key: 'bookingDate', label: 'Booking Date' },
      { key: 'reportMonth', label: 'Report Month' },
      { key: 'MBL', label: 'MBL' },
      { key: 'HBL', label: 'HBL' },
      { key: 'vesselVoy', label: 'Vessel / Voy' },
      { key: 'shipmentType', label: 'Shipment Type' },
      { key: 'consigneeName', label: 'Consignee Name' },
      { key: 'countryName', label: 'Destination of Country' },
      { key: 'postofOrigin', label: 'Port of Origin' },
      { key: 'portofDischarge', label: 'Port of Discharge' },
      { key: 'fnalDestination', label: 'Final Destination' },
      { key: 'ETD', label: 'ETD' },
      { key: 'ATDPOL', label: 'ATD' },
      { key: 'ETA', label: 'ETA Destination' },
      { key: 'ATA', label: 'ATA Destination' },
      { key: 'containerNo', label: 'Container No.' },
      { key: 'containerInfo', label: 'Container Type' },
      { key: 'vol', label: 'Volume' },
      { key: 'weight', label: 'Weight' },
      { key: 'freightRevenue', label: 'Freight Amount (SGD)' },
      { key: 'freightTerms', label: 'Freight Term' },
      { key: 'bookingConfirmationDate', label: 'Booking Confirmation Date' },
      { key: 'dgDelaration', label: 'DG Declaration on by container level' },
      {
        key: 'dgApplicationReceivedDate',
        label: 'DG Application on Received Date',
      },
      { key: 'dgApprovalDate', label: 'DG Approval Date' },
      { key: 'BLIssuedDate', label: 'BL Issued Date' },
      { key: 'taxInvoiceReleaseDate', label: 'Tax Invoice Release Date' },
    ];

    const rows: ExcelRow[] = (this.fullData?.data || []).map((item) => {
      const vesselVoy =
        item.vesselName && item.voyageNo
          ? `${item.vesselName} / ${item.voyageNo}`
          : item.vesselName || item.voyageNo || '';

      const cells: ExcelCell[] = [
        { value: item.bookingNo || '' },
        { value: item.bookingDate ? this.formatDate(item.bookingDate) : '' },
        {
          value: this.params?.FromHblDt
            ? new Date(this.params.FromHblDt).toLocaleString('default', {
                month: 'long',
              })
            : '',
        },
        { value: item.MBL || '' },
        { value: item.HBL || '' },
        { value: vesselVoy },
        { value: item.shipmentType || '' },
        { value: item.consigneeName || '' },
        { value: item.countryName || '' },
        { value: item.postofOrigin || '' },
        { value: item.portofDischarge || '' },
        { value: item.fnalDestination || '' },
        { value: item.ETD ? this.formatDate(item.ETD) : '' },
        { value: item.ATDPOL ? this.formatDate(item.ATDPOL) : '' },
        { value: item.ETA ? this.formatDate(item.ETA) : '' },
        { value: item.ATA ? this.formatDate(item.ATA) : '' },
        { value: item.containerNo || '' },
        { value: item.containerInfo || '' },
        { value: this.formatNumber(item.vol) || 0 },
        { value: this.formatNumber(item.weight) || 0 },
        { value: this.formatNumber(item.freightRevenue) || 0 },
        { value: item.freightTerms || '' },
        { value: '' }, // Booking Confirmation Date
        { value: item.dgDelaration === 'true' ? 'Y' : 'N' },
        { value: '' }, // DG Application on Received Date
        {
          value: item.dgAprrovelDate
            ? this.formatDate(item.dgAprrovelDate)
            : '',
        },
        { value: '' }, // BL Issued Date
        { value: '' }, // Tax Invoice Release Date
      ];

      return { cells, style: 'data' };
    });

    return {
      fileName: 'Container-Wise-KPI-Report',
      sheetName: 'ContainerKPIReport',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: 'Container Wise KPI',
        additionalInfo: [
          {
            label: 'HBL From Date',
            value: this.formatDate(this.params?.FromHblDt),
          },
          {
            label: 'HBL To Date',
            value: this.formatDate(this.params?.ToHblDt),
          },
          { label: 'Branch', value: this.fullData?.branchInvolved || '' },
          { label: 'Dept', value: this.fullData?.departmentNames || '' },
        ],
      },
      tableHeaders,
      rows,
      columnWidths: [
        15, 15, 15, 18, 18, 22, 18, 25, 20, 20, 20, 20, 15, 15, 18, 18, 18, 18,
        12, 12, 18, 15, 20, 20, 22, 18, 18, 22,
      ],
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
