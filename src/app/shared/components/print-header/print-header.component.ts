import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService, PrintSettings } from 'src/app/core/services/company-settings-manager.service';
import { LogoService } from 'src/app/core/services/logo.service';

@Component({
  selector: 'app-print-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './print-header.component.html',
  styles: ``
})
export class PrintHeaderComponent {
  @Input() showTaxRegistration = false;

  userData: any;
  currentCompany: any;
  currentBranch: any;
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  currentDate = new Date();
  printSettings: PrintSettings;

  logoPosition: 'left' | 'center' | 'right' = 'left';
  companyPosition: 'left' | 'center' | 'right' = 'center';
  companyAlignment: 'left' | 'center' | 'right' = 'center';

  /* ORDER — ensures correct placement */
  get logoOrder(): number {
    return this.logoPosition === 'left' ? 0 :
      this.logoPosition === 'center' ? 1 : 2;
  }

  get companyOrder(): number {
    return this.companyPosition === 'left' ? 0 :
      this.companyPosition === 'center' ? 1 : 2;
  }

  /* ALIGNMENT */
  get companyTextAlign(): string {
    return this.companyAlignment;
  }

  /* LOGO ALIGN FIX (important for center/right cases) */
  get logoJustify(): string {
    return this.logoPosition === 'left'
      ? 'flex-start'
      : this.logoPosition === 'center'
        ? 'center'
        : 'flex-end';
  }

  get companyCountryCode(): string {
    return String(
      this.currentBranch?.countryMaster?.countryCode ||
      this.currentBranch?.countryCode ||
      this.currentCompany?.countryMaster?.countryCode ||
      this.currentCompany?.countryCode ||
      ''
    ).toLowerCase();
  }

  get taxRegistrationLabel(): string {
    return this.companyCountryCode === 'in' ? 'GST No' : 'VAT No';
  }

  get taxRegistrationValue(): string {
    return String(
      this.companyCountryCode === 'in'
        ? (this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT || this.currentCompany?.Pan || this.currentCompany?.PAN || '')
        : (this.currentCompany?.Pan || this.currentCompany?.PAN || this.currentCompany?.GST_VAT || this.currentBranch?.taxRegistrationNo || '')
    );
  }

  constructor(
    private appSettingsService: AppSettingsService,
    public companySettings: CompanySettingsManagerService,
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
    this.branchDetails = this.appSettingsService.getCurrentBranchInfo();
    console.log(this.branchDetails, "BRANCH DETAILS");

    this.printSettings = this.companySettings.getPrintSettings();
    this.logoPosition = this.printSettings.logoPosition || 'left';
    this.companyPosition = this.printSettings.companyPosition || 'center';
    this.companyAlignment = this.printSettings.companyAlignment || 'center';

    console.log("Print Settings", this.printSettings);
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
  }
}
