import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';

@Component({
  selector: 'app-ageing-report',
  standalone: true,
  imports: [
    CommonModule,
    CustomDatePipe,
  ],
  templateUrl: './ageing-report.component.html',
  styles: ``
})
export class AgeingReportComponent implements OnInit{

  currentCompany : any;
  currentBranch : any;
  orientation : 'portrait' | 'landscape' = 'portrait';

  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService : AppSettingsService,
    private reportRegistryService : ReportRegistryService
  ) { 
    console.log('Ageing Report Data:', this.data);
  }

  get fullData() : any {
    return this.data || {};
  }

  get params() : any {
    return this.data?.params || {};
  }
  
  get bucketLabels() : any{
    return this.fullData?.bucketLabels || [];
  }

  get ageingResults() : any {
    return this.data?.ageingResult || [];
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('ageing-report').pdfOrientation;
  }

  trackByCurrencyCode(index: number, group: any): string {
    return group.CurrencyCode;
  }

  trackBySubledger(index: number, sub: any): number {
    return sub.SubledgerMasterSid;
  }


}
