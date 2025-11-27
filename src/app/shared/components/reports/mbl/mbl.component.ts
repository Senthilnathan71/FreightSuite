import { CommonModule } from '@angular/common';
import { Component, Inject, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
@Component({
  selector: 'app-mbl',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './mbl.component.html',
  styles: ``,
})
export class MblComponent {
  // currentCompany: any;
  // currentBranch: any;
  // userData: any;
  // currentDate = new Date();
  // branchDetails: any;
  // currentBranchCityName: string | null;
  // currentBranchCityId: number;
  // cityList: any;
  // cityMasterList: any[] = [];
  // @Input() masterJobData: any;
  // @Input() masterJobContainers: any[];
  // @Input() withOrWithoutCharge: boolean;
  // @Input() selectedFCLLCL: any;
  @Input() agentList: any;
  // @Input() currencyList: any;
  // @Input() uomList: any;
  // @Input() containerTypeList: any;
  // @Input() packageTypeList: any[] =[];

    constructor(@Inject(REPORT_DATA) public data: any) {
      console.log('Cargo Manifest Report Data:', this.data);
    }
  
    // Helper getters for cleaner template access
    get company() { return this.data?.data?.company || {}; }
    get masterJob() { return this.data?.data?.masterJob || {}; }
    get containers() { return this.data?.data?.containers || []; }
    get houseJobs() { return this.data?.data?.houseJobs || []; }
    get printInfo() { return this.data?.data?.printInfo || {}; }
  


  ngOnInit() {
    // this.userData = this.appSettingService.getDecryptedUserProfile();
    // this.currentCompany = this.appSettingService.decrypt(
    //   localStorage.getItem('selected-company')
    // );
    // this.currentBranch = this.appSettingService.decrypt(
    //   localStorage.getItem('selected-branch')
    // );
    // this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    // console.log(this.branchDetails, "BRANCH DETAILS");
    // this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    // this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    // this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    // this.loadCityName();
  }

    // async loadLookups() {
    //   this.spinner.show();
    //   const companyRaw = localStorage.getItem('selected-company');
    //   const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;
    //   const filterOption = { CompanyMasterSid: company?.CompanyMasterSid, BranchMasterSid: company?.BranchMasterSid };
    //   Promise.all([
    //     firstValueFrom(this.masterService.getCityById(this.currentBranchCityId)),
    //   ]).then(([userCity]) => {
    //     this.currentBranchCityName = userCity ? userCity.cityName : null;
    //     this.spinner.hide();
    //   }).catch(error => {
    //     console.error('Error loading lookups:', error);
    //     this.spinner.hide();
    //     this.appSettingService.showError('Error loading lookup data');
    //   });
    // }
    // loadCityName(): void {
    //   if (!this.currentBranchCityId) return;
  
    //   this.spinner.show();
  
    //   this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
    //     next: (response: any) => {
    //       console.log("City API response:", response);
  
    //       if (response) {
    //         const ourCity = response;
  
    //         this.currentBranchCityName = ourCity ? ourCity.cityName : '';
    //         console.log("Final City Name:", this.currentBranchCityName);
    //       }
  
    //       this.spinner.hide();
    //     },
    //     error: (error) => {
    //       console.error("Failed to load city:", error);
    //       this.spinner.hide();
    //     }
    //   });
    // }

  // constructor(
  //   private activeModal: NgbActiveModal,
  //    private masterService: MasterService,
  //   private appSettingService: AppSettingsService,
  //   private spinner: NgxSpinnerService,
  // ) {}

  getDestinationAgentName(CustomerMasterSid: number | string): string {
    const agent = this.agentList.find(
      (a) => a.CustomerMasterSid == CustomerMasterSid
    );
    return agent ? agent.CustomerName : '';
  }

//   getAgentName(AgentSid: number) {
//     if (!AgentSid || this.agentList.length === 0) return '';
//     const agent = this.agentList.find(
//       (agent) => agent.CustomerMasterSid === AgentSid
//     );
//     return agent ? agent.CustomerName : '';
//   }

//   gettotalNoOfPkg(): number {
//     return this.masterJobContainers.reduce((sum, c) => {
//       const value = Number(c.NoOfPkg) || 0;
//       return sum + value;
//     }, 0);
//   }

// totalGrossWeight(): number {
//   const containers = this.masterJobData?.containers || [];

//   return containers.reduce((sum: number, item: any) => {
//     const weight = Number(item?.GrossWeight) || 0;
//     return sum + weight;
//   }, 0);
// }

// totalVolume(): number {
//   const containers = this.masterJobData?.containers || [];

//   return containers.reduce((sum: number, item: any) => {
//     const volume = Number(item?.Volume) || 0;
//     return sum + volume;
//   }, 0);
// }

//   getPackageTypeName(pkgTypeSid: number): string {
//   if (!pkgTypeSid) return 'Unknown';
//   const packageType = this.packageTypeList.find(pt => pt.UOMMasterSid === pkgTypeSid);
//   return packageType ? packageType.UOMName : 'Unknown';
// }
//   modalClose() {
//     this.activeModal.close();
//   }
}
