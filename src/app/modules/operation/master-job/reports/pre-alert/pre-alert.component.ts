import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MasterService } from 'src/app/modules/master/master.service';

@Component({
  selector: 'app-pre-alert',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './pre-alert.component.html',
  styles: ``,
})
export class PreAlertComponent {
   userData: any;
   currentCompany: any;
   currentBranch: any;
   branchDetails: any;
   currentBranchCityName: string | null;
   currentBranchCityId: number;
   currentDate = new Date();
   cityList: any;
   cityMasterList: any[] = [];
   @Input() masterJobData: any;
   @Input() containerTypeList: any[] = [];
   @Input() masterJobContainers: any[] = [];
   @Input() packageTypeList: any[] = [];
   @Input() agentList: any[] = [];
   @Input() yardList: any[] = [];
   @Input() portList: any[] = []; // Add this input
     @Input()  selectedFCLLCL:any;
   constructor(
     private appSettingsService: AppSettingsService,
     private activeModal: NgbActiveModal,
     private masterService: MasterService,
     private appSettingService: AppSettingsService,
     private spinner: NgxSpinnerService,
     private pdfService: PdfDownloadService,
    public logoService : LogoService
   ) { }
 
    showPrintLogo: boolean = false;
     showPdfLogo: boolean = true;
 
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
    //  this.loadCityName();
   }
 
   async loadLookups() {
     this.spinner.show();
     const companyRaw = localStorage.getItem('selected-company');
     const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;
     const filterOption = { CompanyMasterSid: company?.CompanyMasterSid, BranchMasterSid: company?.BranchMasterSid };
     Promise.all([
       firstValueFrom(this.masterService.getCityById(this.currentBranchCityId)),
     ]).then(([userCity]) => {
       this.currentBranchCityName = userCity ? userCity.cityName : null;
       this.spinner.hide();
     }).catch(error => {
       console.error('Error loading lookups:', error);
       this.spinner.hide();
       this.appSettingService.showError('Error loading lookup data');
     });
   }
  //  loadCityName(): void {
  //    if (!this.currentBranchCityId) return;
 
  //    this.spinner.show();
 
  //    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
  //      next: (response: any) => {
  //        console.log("City API response:", response);
 
  //        if (response) {
  //          const ourCity = response;
 
  //          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
  //          console.log("Final City Name:", this.currentBranchCityName);
  //        }
 
  //        this.spinner.hide();
  //      },
  //      error: (error) => {
  //        console.error("Failed to load city:", error);
  //        this.spinner.hide();
  //      }
  //    });
  //  }
 
 
 
   getAgentName(AgentSid: number) {
     if (!AgentSid || this.agentList.length === 0) return '';
     const agent = this.agentList.find(agent => agent.CustomerMasterSid === AgentSid);
     return agent ? agent.CustomerName : '';
   }
   getAgentAddress(AgentSid: number) {
     if (!AgentSid || this.agentList.length === 0) return '';
     const agent = this.agentList.find(agent => agent.CustomerMasterSid === AgentSid);
     return agent ? agent.Address : '';
   }
 
   get totalNoOfPkg(): number {
     return this.masterJobContainers.reduce((sum, c) => {
       const value = Number(c.NoOfPkg) || 0;
       return sum + value;
     }, 0);
   }
 
   get totalGrossWeight(): number {
     return this.masterJobContainers.reduce((sum, c) => {
       const value = Number(c.GrossWeight) || 0;
       return sum + value;
     }, 0);
   }
 
   get totalVolume(): number {
     return this.masterJobContainers.reduce((sum, c) => {
       const value = Number(c.Volume) || 0;
       return sum + value;
     }, 0);
   }
 
   getYardName(yardSid: number): string {
     if (!yardSid || this.yardList.length === 0) return '';
     const yard = this.yardList.find(yard => yard.CustomerMasterSid === yardSid);
     return yard ? yard.CustomerName : '';
   }
 
   getPackageTypeName(pkgTypeSid: number): string {
     if (!pkgTypeSid) return 'Unknown';
     const packageType = this.packageTypeList.find(pt => pt.UOMMasterSid === pkgTypeSid);
     return packageType ? packageType.UOMName : 'Unknown';
   }
 
   getContainerTypeName(ContainerTypeMasterSid: number): string {
     if (!this.containerTypeList) return "";
     const containerType = this.containerTypeList.find(ct => ct.ContainerTypeMasterSid === ContainerTypeMasterSid);
     return containerType ? containerType.ContainerName : '';
   }
 
 
   getContainerSize(containerTypeMasterSid: number): string {
     console.log("SID RECEIVED:", containerTypeMasterSid);
     console.log("CONTAINER TYPE LIST:", this.containerTypeList);
 
     const containerType = this.containerTypeList?.find(
       ct => +ct.ContainerTypeMasterSid === +containerTypeMasterSid
     );
 
     return containerType?.ContainerSize?.trim() || '-';
   }
 
   getTareWeight(containerTypeMasterSid: number): string {
     const container = this.containerTypeList?.find(
       ct => +ct.ContainerTypeMasterSid === +containerTypeMasterSid
     );
 
     return container?.TareWeight || '-';
   }
 
 
   // Calculate total NoOfPackage for all houseJobs and their cargo
   getTotalPackages(): number {
     if (!this.masterJobData?.houseJob) return 0;
     return this.masterJobData.houseJob.reduce((totalH, h) => {
       const totalCargo = h.Cargo?.reduce((totalC, c) => totalC + (c.NoOfPackage || 0), 0) || 0;
       return totalH + totalCargo;
     }, 0);
   }
 
   // Calculate total GrossWeight
   getTotalGrossWeight(): number {
     if (!this.masterJobData?.houseJob) return 0;
     return this.masterJobData.houseJob.reduce((totalH, h) => {
       const totalCargo = h.Cargo?.reduce((totalC, c) => totalC + (+c.GrossWeight || 0), 0) || 0;
       return totalH + totalCargo;
     }, 0);
   }
 
   // Calculate total Volume
   getTotalVolume(): number {
     if (!this.masterJobData?.houseJob) return 0;
     return this.masterJobData.houseJob.reduce((totalH, h) => {
       const totalCargo = h.Cargo?.reduce((totalC, c) => totalC + (+c.Volume || 0), 0) || 0;
       return totalH + totalCargo;
     }, 0);
   }
 
       getPortName(portCode: string): string {
    if (!portCode || !this.portList || this.portList.length === 0) {
      return portCode || '';
    }
    
    const port = this.portList.find(p => p.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  }
 
   modalClose() {
     this.activeModal.close();
   }
 
 
 
    async downloadPDF() {
  //  this.showPrintLogo = false;
  //  this.showPdfLogo = true;
 
   setTimeout(async () => {
     this.spinner.show();
    try {
       await this.pdfService.downloadBalancedPDF(
         'printContent',
         `Cargo_manifest_${this.masterJobData?.MasterJobNumber || ''}`,
         () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
         (error) => this.appSettingService.showError('Error generating PDF. Please try again.'),
          'landscape'
       );
     } finally {
       this.spinner.hide();
     }
   }, 50);
 }
   
 printDiv(divId: string): void {
  //  this.showPrintLogo = true;
  //  this.showPdfLogo = false;
 
   setTimeout(() => {
     const printContents = document.getElementById(divId)?.innerHTML;
     if (!printContents) return;
 
     const popupWin = window.open('', '_blank', 'width=900,height=600');
     if (popupWin) {
       popupWin.document.open();
       popupWin.document.write(`
         <html>
           <head>
             <title>Print</title>
           </head>
           <body onload="window.print(); window.close();">
             ${printContents}
           </body>
         </html>
       `);
       popupWin.document.close();
     }
   }, 50); 
 }
 
 
 }
 
 interface ContainerDetails {
   tareWeight: number;
   size: string;
 }