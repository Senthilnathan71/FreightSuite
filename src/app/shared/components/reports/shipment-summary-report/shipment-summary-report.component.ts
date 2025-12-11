import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';

@Component({
  selector: 'app-shipment-summary-report',
  standalone: true,
  imports: [CustomDatePipe,CommonModule],
  templateUrl: './shipment-summary-report.component.html',
  styles: ``
})
export class ShipmentSummaryReportComponent {


  
    currentCompany: any;
    currentBranch: any;
    salesmanList: any[];
    orientation : 'portrait' | 'landscape' = 'portrait';
    constructor(
      @Inject(REPORT_DATA) public data: any,
      private appSettingsService: AppSettingsService,
      private leadService: LeadService,
      private reportRegistryService : ReportRegistryService
    ) {
      console.log('Outstanding Report Data:', this.data);
    }
  
    ngOnInit(): void {
      this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
      this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
      console.log('Current Company:', this.currentCompany);
      console.log('Current Branch:', this.currentBranch);
       this.orientation = this.reportRegistryService.getReportConfig('ageing-report').pdfOrientation;
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

  
    trackByCurrencyCode(index: number, group: any): string {
      return group.CurrencyCode;
    }
  
    trackBySubledger(index: number, sub: any): number {
      return sub.SubledgerMasterSid;
    }
  
  
     
}
