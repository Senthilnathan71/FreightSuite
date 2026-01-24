import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';

@Component({
  selector: 'app-print-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './print-header.component.html',
  styles: ``
})
export class PrintHeaderComponent {
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
    public logoService: LogoService
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
