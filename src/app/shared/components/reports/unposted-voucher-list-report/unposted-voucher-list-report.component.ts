import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { RouterModule } from '@angular/router';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PrintHeaderComponent } from '../../print-header/print-header.component';

@Component({
  selector: 'app-unposted-voucher-list-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule, RouterModule,PrintHeaderComponent],
  templateUrl: './unposted-voucher-list-report.component.html',
  styles: ``
})
export class UnpostedVoucherListReportComponent {


  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService,
    private modalService : NgbModal
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('unposted-voucher-list').pdfOrientation;
  }

  get fullData(): any {
    return this.data || {};
  }

  get tableData():any{
    console.log(this.data);
    const tableD = this.data?.data?.fullData;
    console.log(tableD);
    return tableD;
  }

  get params(): any {
    return this.data?.params || {};
  }

  get bucketLabels(): any {
    return this.fullData?.bucketLabels || [];
  }



  getExcelData(): ComplexReportExportConfig {
  const tableHeaders: ExcelHeader[] = [
    { key: 'Branch', label: 'Branch' },
    { key: 'VoucherNo', label: 'Voucher No' },
    { key: 'VoucherDate', label: 'Voucher Date' },
    { key: 'VoucherType', label: 'Voucher Type' },
    { key: 'Party', label: 'Party' },
    { key: 'CreatedBy', label: 'Created On' },
    { key: 'CreatedOn', label: 'Created Date' },
    { key: 'PostStatus', label: 'Post Status' }
  ];

  const rows: ExcelRow[] = (this.fullData?.tableData || []).map(item => ({
    cells: [
      { value: item.branch || '' , alignment:{horizontal:'center'}},
      { value: item.voucherNo || '' },
      { value: this.formatDate(item.voucherDate) },
      { value: item.voucherType || '' },
      { value: item.party || '' },
      { value: item.createdBy || '' },
      { value: this.formatDate(item.createdOn) },
      { value: item.postStatus || '' , alignment:{horizontal:'center'}}
    ],
    style: 'data'
  }));

  return {
    fileName: 'Unposted-Voucher-List-Report',
    sheetName: 'UnpostedVoucherList',
    reportHeader: {
      companyName: this.currentCompany?.companyName || '',
      reportTitle: `Unposted Voucher List Report`,
      additionalInfo: [
        { label: 'From Date', value: this.formatDate(this.params?.VoucherFromDate) },
        { label: 'To Date', value: this.formatDate(this.params?.VoucherToDate) },
        { label: 'Branch', value: this.fullData?.brancesInvoled || '' }
      ]
    },
    tableHeaders,
    rows,
    columnWidths: [10, 24, 18, 18, 28, 22, 15, 10] // adjust widths as needed
  };
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

 
  private formatDate(date: any): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-GB');
    } catch {
      return String(date);
    }
  }

  closeAllModal(){
    this.modalService.dismissAll();
  }
}
