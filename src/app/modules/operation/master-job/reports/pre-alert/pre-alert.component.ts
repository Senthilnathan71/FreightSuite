import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { generateCargoManifestDocument } from 'src/app/common/pdf/generators/cargo-manifest-pdf.generator';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { InsertMilestoneByMasterJobPayload, ShipmentMilestoneService } from 'src/app/modules/operation/services/shipment-milestone.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';

@Component({
  selector: 'app-pre-alert',
  standalone: true,
  imports: [CommonModule, CustomDatePipe,PrintHeaderComponent,PrintFooterComponent],
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
   private pdfDepsPromise?: Promise<{ pdfMake: any }>;

   @Input() autoInsertMilestone: boolean = false;
   @Input() milestonePayload?: InsertMilestoneByMasterJobPayload;
   @Output() reloadMilestone = new EventEmitter<void>();
   private milestoneInserted: boolean = false;

   constructor(
     private appSettingsService: AppSettingsService,
     private activeModal: NgbActiveModal,
     private masterService: MasterService,
     private appSettingService: AppSettingsService,
     private spinner: NgxSpinnerService,
     private pdfService: PdfDownloadService,
    public logoService : LogoService,
    private milestoneService: ShipmentMilestoneService,
    private modalService: NgbModal
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
     this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
     this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
     this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    //  this.loadCityName();
     this.milestoneInserted = false;
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
    this.spinner.show();
    try {
      
      await this.insertMilestoneSafelyForPrint();
      const docDefinition = await this.buildPreAlertDocDefinition();
      if (!docDefinition) {
        this.appSettingService.showError('No data available to generate PDF');
        return;
      }

      const { pdfMake } = await this.getPdfDependencies();
      const fileName = `Pre_Alert_${this.masterJobData?.MasterJobNumber || ''}.pdf`;
      pdfMake.createPdf(docDefinition).download(fileName);
      this.appSettingService.showSuccess('PDF downloaded successfully!');
    } catch (error) {
      console.error('Pre alert PDF generation failed:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }

  private async getPdfDependencies(): Promise<{ pdfMake: any }> {
    if (!this.pdfDepsPromise) {
      this.pdfDepsPromise = (async () => {
        const pdfMakeModule = await import('pdfmake/build/pdfmake');
        const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
        const pdfMake: any = (pdfMakeModule as any).default || pdfMakeModule;
        const pdfFonts: any = (pdfFontsModule as any).default || pdfFontsModule;
        pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts;
        return { pdfMake };
      })();
    }

    return this.pdfDepsPromise;
  }

  private async buildPreAlertDocDefinition(): Promise<any | null> {
    if (!this.masterJobData) {
      return null;
    }

    const logo = await this.resolveReportLogo();
    return generateCargoManifestDocument({
      masterJobData: this.masterJobData,
      masterJobContainers: this.masterJobContainers,
      containerTypeList: this.containerTypeList,
      packageTypeList: this.packageTypeList,
      agentList: this.agentList,
      yardList: this.yardList,
      selectedFCLLCL: this.selectedFCLLCL,
      portList: this.portList,
      userData: this.userData,
      currentCompany: this.currentCompany,
      currentBranch: this.currentBranch,
      currentDate: this.currentDate,
      logo,
      title: 'Pre Alert'
    });
  }

  private async resolveReportLogo(): Promise<string | undefined> {
    const logoFromStream = await firstValueFrom(this.logoService.reportLogo$);
    const logoSource = logoFromStream || localStorage.getItem('current_report_logo') || '';

    if (!logoSource) return undefined;
    if (logoSource.startsWith('data:image')) return logoSource;
    return this.imageUrlToBase64(logoSource);
  }

  private imageUrlToBase64(url: string): Promise<string | undefined> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(undefined);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => resolve(undefined);
      img.src = url;
    });
  }

   
 async printDiv(divId: string): Promise<void> {
  //  this.showPrintLogo = true;
  //  this.showPdfLogo = false;
  await this.insertMilestoneSafelyForPrint();
 
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

 async sendEmail() {
    this.spinner.show();
    try {
      const docDefinition = await this.buildPreAlertDocDefinition();
      if (!docDefinition) {
        this.appSettingService.showError('No data available');
        return;
      }
      const { pdfMake } = await this.getPdfDependencies();
      const blob = await new Promise<Blob>((resolve) => {
        pdfMake.createPdf(docDefinition).getBlob(resolve);
      });
      const fileName = `Pre_Alert_${this.masterJobData?.MasterJobNumber || ''}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        Subject: `Pre Alert - ${this.masterJobData?.MasterJobNumber || ''}`,
        Mailbody: `Please find attached the Pre Alert for Job No: ${this.masterJobData?.MasterJobNumber || ''}`,
        attachments: [file]
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.insertMilestoneSafelyForPrint();
      });
    } catch (error) {
      console.error('Pre alert email error:', error);
      this.appSettingService.showError('Error preparing email');
    } finally {
      this.spinner.hide();
    }
  }

 private async insertMilestoneSafelyForPrint(): Promise<void> {
   if (!this.autoInsertMilestone || !this.milestonePayload || this.milestoneInserted) {
     return;
   }

   try {
     const resp: any = await firstValueFrom(
       this.milestoneService.insertMilestoneByMasterJob(this.milestonePayload)
     );

     if (resp.status) {
       this.milestoneInserted = true;
       this.autoInsertMilestone = false;
       this.reloadMilestone.emit();
       console.log('Milestone inserted successfully');
     }
   } catch (error) {
     console.error('Error inserting milestone', error);
   }
 }
 
 
 }
 
 interface ContainerDetails {
   tareWeight: number;
   size: string;
 }
