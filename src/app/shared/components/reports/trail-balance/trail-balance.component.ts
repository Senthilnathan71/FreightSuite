import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';

@Component({
  selector: 'app-trail-balance',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './trail-balance.component.html',
  styles: ``
})
export class TrailBalanceComponent {

  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  branchList: any[];
  groupedData: any[] = [];

  COAList: any[] = [];
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private masterService: MasterService,
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    console.log(this.data);
    this.prepareGroupedData();
    this.loadBranchName()
    this.loadCOA(this.currentCompany?.CompanyMasterSid);
  }


  loadBranchName(): void {
    if (!this.currentBranch?.BranchMasterSid) return;
    this.masterService.getAllBranches().subscribe({
      next: (response: any) => {
        console.log("Branch API response:", response);

        if (response) {
          this.branchList = response;
          console.log("Branch List:", this.branchList);
        }
      },
      error: (error) => {
        console.error("Failed to load branch:", error);
      }
    });
  }



  loadCOA(CompanyMasterSid: number): void {
    this.masterService.getAllCoa(CompanyMasterSid).subscribe({
      next: (response: any) => {
        console.log("Branch API response:", response);

        if (response) {
          this.COAList = response;
          console.log("Branch List:", this.COAList);
        }
      },
      error: (error) => {
        console.error("Failed to load branch:", error);
      }
    });
  }


  getBranchNameById(id: number): string {
    if (!id || !this.branchList?.length) return '';
    const branch = this.branchList.find(b => b.BranchMasterSid === id);
    return branch ? branch.branchName : '';
  }

  getGroupName(id: number): string {
    if (!id || !this.COAList?.length) return '';
    const group = this.COAList.find(b => b.COAMasterSid === id);
    return group ? group.GroupName : '';
  }



  prepareGroupedData(): void {
    const rawItems = this.data?.items || [];
    const items = Array.isArray(rawItems) ? rawItems : Object.values(rawItems);

    console.log("Converted items:", items);

    const groups: any = {};

    items.forEach(item => {
      const sub = item.SubGroupName || "NO SUBGROUP";

      if (!groups[sub]) {
        groups[sub] = {
          subGroupName: sub,
          items: [],
          totals: {
            OpeningDebit: 0,
            OpeningCredit: 0,
            CurrentDebit: 0,
            CurrentCredit: 0,
            ClosingDebit: 0,
            ClosingCredit: 0,
            ClosingNet: 0
          }
        };
      }

      groups[sub].items.push(item);

      groups[sub].totals.OpeningDebit += Number(item.OpeningDebit) || 0;
      groups[sub].totals.OpeningCredit += Number(item.OpeningCredit) || 0;
      groups[sub].totals.CurrentDebit += Number(item.CurrentDebit) || 0;
      groups[sub].totals.CurrentCredit += Number(item.CurrentCredit) || 0;
      groups[sub].totals.ClosingDebit += Number(item.ClosingDebit) || 0;
      groups[sub].totals.ClosingCredit += Number(item.ClosingCredit) || 0;
      groups[sub].totals.ClosingNet += Number(item.ClosingNet) || 0;
    });

    this.groupedData = Object.values(groups);
    console.log("Grouped Data:", this.groupedData);
  }


  get fullData(): any {
    console.log(this.data, "DATA")
    return this.data || {};
  }

  get params(): any {
    return this.data?.parameters || {};
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

  trackByCurrencyCode(index: number, group: any): string {
    return group.CurrencyCode;
  }

  trackBySubledger(index: number, sub: any): number {
    return sub.SubledgerMasterSid;
  }

}

