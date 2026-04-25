import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-print-footer',
  standalone: true,
  imports: [CustomDatePipe,CommonModule],
  templateUrl: './print-footer.component.html',
  styles: ``
})
export class PrintFooterComponent {
    @Input() showFooterNote: boolean = false;
    @Input() position: 'absolute' | 'static' = 'absolute';
    userData: any;
    currentCompany: any;
    currentBranch: any;
    branchDetails: any;
    currentBranchCityName: string | null;
    currentBranchCityId: number;
    currentDate = new Date();
  
    constructor(
      private appSettingsService: AppSettingsService,
      private appSettingService: AppSettingsService,
    ) { }
    ngOnInit() {
      this.userData = this.appSettingsService.getDecryptedUserProfile();
  
      this.currentCompany = this.appSettingsService.decrypt(
        localStorage.getItem('selected-company')
      );
      this.currentBranch = this.appSettingsService.decrypt(
        localStorage.getItem('selected-branch')
      );
      this.branchDetails = this.appSettingService.getCurrentBranchInfo();
      console.log(this.branchDetails, "BRANCH DETAILS");
      this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
      this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
      this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    }
}
