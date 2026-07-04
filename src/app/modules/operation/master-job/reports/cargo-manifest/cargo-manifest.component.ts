import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { generateCargoManifestDocument } from 'src/app/common/pdf/generators/cargo-manifest-pdf.generator';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { OperationService } from '../../../operation.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { InsertMilestoneByMasterJobPayload, ShipmentMilestoneService } from 'src/app/modules/operation/services/shipment-milestone.service';

@Component({
  selector: 'app-cargo-manifest',
  standalone: true,
  imports: [CommonModule, CustomDatePipe,PrintHeaderComponent,PrintFooterComponent],
  templateUrl: './cargo-manifest.component.html',
  styles:``
})
export class CargoManifestComponent {
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
  @Input()  selectedFCLLCL:any;
  @Input() portList: any[] = []; // Add this input
  @Input() currentMenuId: number | null = null;
  @Input() autoInsertMilestone: boolean = false;
  @Input() milestonePayload?: InsertMilestoneByMasterJobPayload;
  @Output() reloadMilestone = new EventEmitter<void>();
  private pdfDepsPromise?: Promise<{ pdfMake: any }>;
  private milestoneInserted: boolean = false;

  constructor(
    private appSettingsService: AppSettingsService,
    private activeModal: NgbActiveModal,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    public logoService : LogoService,
    public mps: MenuPermissionService,
    private operationService: OperationService,
    private modalService: NgbModal,
    private emailTriggerService: EmailTriggerService,
    private milestoneService: ShipmentMilestoneService,
    private companySettings: CompanySettingsManagerService
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
    this.milestoneInserted = false;
    this.loadCityName();
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
  loadCityName(): void {
    if (!this.currentBranchCityId) return;

    this.spinner.show();

    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
        }

        this.spinner.hide();
      },
      error: (error) => {
        console.error("Failed to load city:", error);
        this.spinner.hide();
      }
    });
  }



  private hasValue(value: any): boolean {
    return value !== null && value !== undefined && String(value).trim() !== '';
  }

  private firstValue(...values: any[]): string {
    const value = values.find(item => this.hasValue(item));
    return this.hasValue(value) ? String(value).trim() : '';
  }

  private getFirstHouseJob(): any {
    return this.masterJobData?.houseJob?.[0] || this.masterJobData?.HouseJob?.[0] || null;
  }

  private getFirstVoyage(): any {
    return this.masterJobData?.voyages?.[0] || this.masterJobData?.Voyages?.[0] || null;
  }

  getAgentName(AgentSid: number) {
    if (!AgentSid || this.agentList.length === 0) return '';
    const agent = this.agentList.find(agent => Number(agent.CustomerMasterSid) === Number(AgentSid));
    return agent ? (agent.CustomerName || agent.customerName || '') : '';
  }

  getAgentAddress(AgentSid: number) {
    if (!AgentSid || this.agentList.length === 0) return '';
    const agent = this.agentList.find(agent => Number(agent.CustomerMasterSid) === Number(AgentSid));
    return agent ? (agent.Address || agent.CustomerAddress || agent.CustomerAddress1 || '') : '';
  }

  getDestinationAgentNameForPrint(): string {
    const houseJob = this.getFirstHouseJob();
    return this.firstValue(
      this.getAgentName(this.masterJobData?.DestinationAgent),
      this.masterJobData?.DestinationAgentName,
      this.masterJobData?.AgentName,
      houseJob?.AgentName,
      houseJob?.DestinationAgentName,
    );
  }

  getDestinationAgentAddressForPrint(): string {
    const houseJob = this.getFirstHouseJob();
    return this.firstValue(
      this.masterJobData?.DestinationAgentAddress,
      this.getAgentAddress(this.masterJobData?.DestinationAgent),
      this.masterJobData?.AgentAddress,
      houseJob?.AgentAddress,
      houseJob?.DestinationAgentAddress,
    );
  }

  getOriginAgentNameForPrint(): string {
    return this.firstValue(
      this.getAgentName(this.masterJobData?.OriginAgent),
      this.masterJobData?.OriginAgentName,
      this.masterJobData?.ForwarderName,
    );
  }

  getOriginAgentAddressForPrint(): string {
    return this.firstValue(
      this.getAgentAddress(this.masterJobData?.OriginAgent),
      this.masterJobData?.OriginAgentAddress,
      this.masterJobData?.ForwarderAddress,
    );
  }

  getVesselNameForPrint(): string {
    const voyage = this.getFirstVoyage();
    const houseJob = this.getFirstHouseJob();
    return this.firstValue(houseJob?.VesselName, this.masterJobData?.VesselName, voyage?.VesselName);
  }

  getVoyageNoForPrint(): string {
    const voyage = this.getFirstVoyage();
    const houseJob = this.getFirstHouseJob();
    return this.firstValue(houseJob?.VoyageNo, this.masterJobData?.VoyageNo, voyage?.VoyageNo);
  }

  getCarrierNameForPrint(): string {
    const voyage = this.getFirstVoyage();
    const houseJob = this.getFirstHouseJob();
    return this.firstValue(houseJob?.CarrierName, this.masterJobData?.CarrierName, voyage?.CarrierName);
  }

  getPOLForPrint(): string {
    const houseJob = this.getFirstHouseJob();
    return this.firstValue(houseJob?.POL, this.masterJobData?.POL);
  }

  getPODForPrint(): string {
    const houseJob = this.getFirstHouseJob();
    return this.firstValue(houseJob?.POD, this.masterJobData?.POD);
  }

  getFPDForPrint(): string {
    const houseJob = this.getFirstHouseJob();
    return this.firstValue(houseJob?.FPD, this.masterJobData?.FPD);
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

  getHousePackages(houseJob: any): number {
    return (houseJob?.Cargo || []).reduce((total, cargo) => {
      return total + (+cargo?.NoOfPackage || 0);
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

  getHouseGrossWeight(houseJob: any): number {
    return (houseJob?.Cargo || []).reduce((total, cargo) => {
      return total + (+cargo?.GrossWeight || 0);
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

  getHouseVolume(houseJob: any): number {
    return (houseJob?.Cargo || []).reduce((total, cargo) => {
      return total + (+cargo?.Volume || 0);
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
      const docDefinition = await this.buildCargoManifestDocDefinition();
      if (!docDefinition) {
        this.appSettingService.showError('No data available to generate PDF');
        return;
      }

      const { pdfMake } = await this.getPdfDependencies();
      const fileName = `Cargo_manifest_${this.masterJobData?.MasterJobNumber || ''}.pdf`;
      pdfMake.createPdf(docDefinition).download(fileName);
      this.appSettingService.showSuccess('PDF downloaded successfully!');
      this.createPdfAuditLog();
    } catch (error) {
      console.error('Cargo manifest PDF generation failed:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }

  async generatePDFBlob(): Promise<Blob | null> {
    try {
      const docDefinition = await this.buildCargoManifestDocDefinition();
      if (!docDefinition) {
        this.appSettingService.showError('No data available to generate PDF');
        return null;
      }

      const { pdfMake } = await this.getPdfDependencies();
      return await new Promise<Blob>((resolve, reject) => {
        try {
          pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => resolve(blob));
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error generating cargo manifest PDF blob:', error);
      return null;
    }
  }

  async openEmailModal(): Promise<void> {
    this.spinner.show();
    try {
      const blob = await this.generatePDFBlob();
      if (!blob) {
        return;
      }

      const documentName = 'Cargo Manifest';
      const documentNo = this.masterJobData?.MasterJobNumber || '';
      const documentDate = this.formatEmailDate(this.masterJobData?.MasterJobDate);
      const destinationAgentSid = Number(this.masterJobData?.DestinationAgent);
      if (!Number.isFinite(destinationAgentSid) || destinationAgentSid <= 0) {
        this.appSettingService.showError('Destination Agent is required to send email.');
        return;
      }

      const emailRecipients = await this.emailTriggerService.resolveCustomerBranchEmailRecipientsByMenu({
        customerBranchSid: null,
        customerMasterSid: destinationAgentSid,
        menuMasterSid: this.getCurrentMenuMasterSidForEmail()
      });

      if (emailRecipients.toEmail.length === 0) {
        this.appSettingService.showError('No email found in customer branch email.');
        return;
      }

      const emailContent = this.emailTriggerService.buildOperationEmailContent({
        documentName,
        documentNoLabel: 'Master Job No.',
        documentNo,
        documentDate,
        pol: this.masterJobData?.POL || '',
        pod: this.masterJobData?.POD || '',
        fpd: this.masterJobData?.FPD || '',
        userName: this.userData?.userName || '',
        introLine: `Please find attached the ${documentName} for your reference.`,
        followupLine: 'Kindly review the attached details at your convenience.'
      });

      const file = new File([blob], `Cargo_Manifest_${documentNo || 'Report'}.pdf`, { type: 'application/pdf' });
      const attachmentRequired = await this.emailTriggerService.isAttachmentRequiredForMenu(
        this.currentCompany?.CompanyMasterSid,
        this.getCurrentMenuMasterSidForEmail()
      );
      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        EmailTo: emailRecipients.toEmail,
        EmailCC: emailRecipients.ccEmail,
        EmailBCC: [],
        Subject: emailContent.subject,
        Mailbody: emailContent.body,
        context: {
          documentName,
          documentNoLabel: 'Master Job No',
          menuName: documentName,
          documentNo,
          date: documentDate,
          pol: this.masterJobData?.POL || '',
          pod: this.masterJobData?.POD || '',
          fpd: this.masterJobData?.FPD || ''
        },
        attachmentRequired,
        // Print "Send Mail" always carries the generated PDF, even when the
        // menu's Mail Configuration has AttachmentRequire = No.
        attachments: [file]
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.createEmailAuditLog(documentName);
        this.createPdfAuditLog();
        this.insertMilestoneSafelyForMail();
      });
    } catch (error) {
      console.error('Cargo Manifest email error:', error);
      this.appSettingService.showError('Error preparing email');
    } finally {
      this.spinner.hide();
    }
  }

  private createEmailAuditLog(documentName: string): void {
    const payload = {
      tableName: 'MasterJob',
      recordId: String(this.masterJobData?.MasterJobSid),
      operation: 'EMAIL',
      changedBy: this.appSettingService.userSettingSource.value['userEmail'],
      changes: {
        action: 'Send Mail'
      },
      newVal: {
        Email: `${documentName} Mail Send`
      }
    };

    this.operationService.createAuditLog(payload).subscribe({
      next: () => { },
      error: (err) => console.error(err)
    });
  }

  private createPdfAuditLog(): void {
    const payload = {
      tableName: 'MasterJob',
      recordId: String(this.masterJobData?.MasterJobSid),
      operation: 'PDF',
      changedBy: this.appSettingService.userSettingSource.value['userEmail'],
      changes: {
        action: 'PDF Downloaded'
      },
      newVal: {
        PDF: 'Cargo Manifest PDF Downloaded'
      }
    };

    this.operationService.createAuditLog(payload).subscribe({
      next: () => { },
      error: (err) => console.error(err)
    });
  }

  private getCurrentMenuMasterSidForEmail(): number | null {
    const sid = Number(
      this.currentMenuId ||
      this.masterJobData?.MenuMasterSid ||
      sessionStorage.getItem('currentMenuId')
    );

    return Number.isFinite(sid) && sid > 0 ? sid : null;
  }

  private formatEmailDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB');
  }

  private async insertMilestoneSafelyForMail(): Promise<void> {
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
      }
    } catch (error) {
      console.error('Error inserting milestone', error);
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

  private async buildCargoManifestDocDefinition(): Promise<any | null> {
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
      printSettings: this.companySettings.getPrintSettings(),
      logo
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
  
printDiv(divId: string): void {
  this.showPrintLogo = true;
  this.showPdfLogo = false;

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
