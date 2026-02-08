import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ComplexReportExportConfig } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-operation-report',
  standalone: true,
  imports: [NgSelectModule, CommonModule,NgbDropdownModule],
  templateUrl: './operation-report.component.html',
  styleUrl: './operation-report.component.scss'
})
export class OperationReportComponent {

  constructor(
    private modalService: NgbModal,
    private pdfMakeService: PdfMakeService,
    private appSettingsService: AppSettingsService
  ) {}
  ModeofModules = [
    { id: 1, name: "Settings" },
    { id: 2, name: "CRM" },
    { id: 3, name: "Master" },
    { id: 4, name: "Operation" },
    { id: 5, name: "Accounts" }
  ]

  reports = [
    {
      id: 1,
      name: 'Agent DO uncollect',
      parameters: [
        { name: 'FROM DATE', value: '01-Jan-23' },
        { name: 'TO DATE', value: '31-Jan-23' }
      ]
    },
    {
      id: 2,
      name: 'B/L Issued List',
      parameters: [
        { name: 'FROM DATE', value: '14-Aug-22' },
        { name: 'TO DATE', value: '13-Sep-23' }
      ]
    },
    {
      id: 3,
      name: 'B/L Not Issued List',
      parameters: [
        { name: 'FROM DATE', value: '01-Jun-23' },
        { name: 'TO DATE', value: '30-Jun-23' }
      ]
    },
    {
      id: 4,
      name: 'Container Status Report',
      parameters: [
        { name: 'CONTAINER TYPE', value: '20FT' },
        { name: 'STATUS', value: 'In Transit' }
      ]
    },
    {
      id: 5,
      name: 'Shipment Tracking',
      parameters: [
        { name: 'SHIPMENT ID', value: 'SH12345' },
        { name: 'DATE', value: '12-Sep-23' }
      ]
    },
    {
      id: 6,
      name: 'Delivery Performance',
      parameters: [
        { name: 'START DATE', value: '01-Jan-23' },
        { name: 'END DATE', value: '31-Dec-23' }
      ]
    },
    {
      id: 7,
      name: 'Invoice Summary',
      parameters: [
        { name: 'CUSTOMER', value: 'ABC Corp' },
        { name: 'PERIOD', value: 'Q1 2023' }
      ]
    },
    {
      id: 8,
      name: 'Payment Status Report',
      parameters: [
        { name: 'DUE DATE', value: '30-Sep-23' },
        { name: 'STATUS', value: 'Pending' }
      ]
    },
    {
      id: 9,
      name: 'Warehouse Stock Levels',
      parameters: [
        { name: 'WAREHOUSE', value: 'Main' },
        { name: 'ITEM CATEGORY', value: 'Electronics' }
      ]
    },
    {
      id: 10,
      name: 'Customs Clearance Status',
      parameters: [
        { name: 'CLEARANCE DATE', value: '05-Sep-23' },
        { name: 'STATUS', value: 'Cleared' }
      ]
    }
  ];


  selectedReportId: number | null = null;

  selectReport(id: number) {
    this.selectedReportId = id;
  }

  get selectedReport() {
    return this.reports.find(r => r.id === this.selectedReportId) || null;
  }

  get selectedReportParameters() {
    return this.selectedReport?.parameters || [];
  }

  get selectedReportName() {
    return this.selectedReport?.name || '';
  }


   openPreviewModal(content: any) {
    this.modalService.open(content, { centered: true, size: 'xl' });
  }

  downloadPDF(): void {
    const report = this.selectedReport;
    if (!report) return;

    try {
      const company = this.appSettingsService.getCurrentCompanyInfo();
      const branch = this.appSettingsService.getCurrentBranchInfo();
      const userData = this.appSettingsService.getDecryptedUserProfile();
      const logo = this.pdfMakeService.getReportLogo();

      const exportConfig: ComplexReportExportConfig = {
        fileName: report.name.replace(/\s+/g, '_'),
        reportHeader: {
          companyName: company?.companyName || 'Company',
          reportTitle: report.name,
          additionalInfo: report.parameters.map(p => ({
            label: p.name,
            value: p.value
          }))
        },
        tableHeaders: [
          { key: 'vatPercent', label: 'VAT %' },
          { key: 'vat', label: 'VAT' }
        ],
        rows: [
          { cells: [{ value: 'RO' }, { value: 'OMR' }], style: 'data' },
          { cells: [{ value: 'RO' }, { value: 'OMR' }], style: 'data' },
          { cells: [{ value: 'RO' }, { value: 'OMR' }], style: 'data' }
        ]
      };

      this.pdfMakeService.generateGenericReport(
        exportConfig,
        company,
        branch,
        userData,
        logo,
        'portrait'
      );

      this.appSettingsService.showSuccess('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      this.appSettingsService.showError('Failed to download PDF');
    }
  }
}
