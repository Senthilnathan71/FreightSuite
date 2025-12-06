import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';

@Component({
  selector: 'app-outstanding-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './outstanding-report.component.html',
  styles: ``
})
export class OutstandingReportComponent {


  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];

  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.loadSalesPerson();
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

  getTotal(data: any[], field: string): number {
    if (!data) return 0;

    return data.reduce((sum, item) => {
      const value = Number(item[field]) || 0;
      return sum + value;
    }, 0);
  }

  loadSalesPerson(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.leadService.getAllSalesman(CompanyMasterSid).subscribe(
      (resp: any) => {
        console.log(resp, 'SalesPerson')
        this.salesmanList = resp;
        console.log(this.salesmanList, "SALESMAN LIST")
      });
  }

  getSalesmanById(id: number) {
    if (!id || !this.salesmanList.length) return;
    const user = this.salesmanList.find(person => person.UserMasterSid === id);
    return user?.userName;
  }

  trackByCurrencyCode(index: number, group: any): string {
    return group.CurrencyCode;
  }

  trackBySubledger(index: number, sub: any): number {
    return sub.SubledgerMasterSid;
  }
}
