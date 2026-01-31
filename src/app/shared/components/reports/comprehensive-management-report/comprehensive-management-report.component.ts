import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';

@Component({
  selector: 'app-comprehensive-management-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
  templateUrl: './comprehensive-management-report.component.html',
  styles: ``
})
export class ComprehensiveManagementReportComponent {

  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  bookingRows: any[] = [];
  masterJobRows: any[] = [];
  houseJobRows: any[] = [];
  salesmanRows: any[] = [];
  customerRows: any[] = [];
  cashBankRows:any[] = [];
  vendorRows:any[] = [];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService
  ) {
    console.log('Comprehensive Management Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('comprehensive-management').pdfOrientation;

    const bookingObj = this.fullData?.bookingDeptSummary;
    this.bookingRows = bookingObj ? Object.values(bookingObj) : [];

    const masterObj = this.fullData?.reportMap;
    this.masterJobRows = masterObj ? Object.values(masterObj) : [];

    const houseObj = this.fullData?.houseWithAllCal;
    this.houseJobRows = houseObj ? Object.values(houseObj) : [];

    const SalesmanObj = this.fullData?.salesmanSummary;
    this.salesmanRows = SalesmanObj ? Object.values(SalesmanObj) : [];

    this.salesmanRows = this.fullData?.salesmanSummary;
    this.groupByDepartment(this.salesmanRows);

    const CustomerObj = this.fullData?.customerRows;
    this.customerRows = CustomerObj ? Object.values(CustomerObj) : [];

    const VendorObj = this.fullData?.vendorRows;
    this.vendorRows = VendorObj ? Object.values(VendorObj) : [];

    const CashOrBank = this.fullData?.AllCashAndBank;
    this.cashBankRows = CashOrBank ? Object.values(CashOrBank) : [];
  }

  groupedSalesmanRows: any[] = [];

    groupByDepartment(data: any[]) {
      const map = new Map<number, any>();

      data.forEach(item => {
        if (!map.has(item.DepartmentMasterSid)) {
          map.set(item.DepartmentMasterSid, {
            DepartmentMasterSid: item.DepartmentMasterSid,
            DepartmentName: item.DepartmentName,
            salesmen: []
          });
        }
        map.get(item.DepartmentMasterSid).salesmen.push(item);
      });

      this.groupedSalesmanRows = Array.from(map.values());
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
}
