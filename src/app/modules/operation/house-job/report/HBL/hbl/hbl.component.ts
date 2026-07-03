import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  generateHblDocument,
  transformHblApiData,
} from 'src/app/common/pdf/generators/hbl-pdf.generator';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { SafeInsertShipmentMilestone, ShipmentMilestoneService } from 'src/app/modules/operation/services/shipment-milestone.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';

@Component({
  selector: 'app-hbl',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './hbl.component.html',
  styles: ``,
})
export class HblComponent {
  currentCompany: any;
  currentBranch: any;
  userData: any;
  currentDate = new Date();
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;

  @Input() housejobData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL: any;
  @Input() agentList: any;
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;
  @Input() selectedReport: 'HBL' | 'HBLDraft' = 'HBL';
  @Input() hblCount: number = 0;
  @Input() houseMenuMasterSid: number | null = null;
  @Output() hblCountUpdated = new EventEmitter<void>();

  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;
  private pdfDepsPromise?: Promise<{ pdfMake: any }>;

  @Input() autoInsertMilestone: boolean = false;
  @Input() milestonePayload?: SafeInsertShipmentMilestone;
  @Output() reloadMilestone = new EventEmitter<void>();
  private milestoneInserted: boolean = false;

  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private spinner: NgxSpinnerService,
    public logoService: LogoService,
    private operationService: OperationService,
    private milestoneService : ShipmentMilestoneService,
    public mps: MenuPermissionService,
    private modalService: NgbModal,
    private emailTriggerService: EmailTriggerService
  ) {}

  private isSwitchBLEnabled(): boolean {
    const switchBL =
      this.housejobData?.Others?.[0]?.SwitchBL ??
      this.housejobData?.houseJobProxy?.[0]?.SwitchBL ??
      this.housejobData?.HouseJobProxy?.[0]?.SwitchBL ??
      this.housejobData?.Proxy?.[0]?.SwitchBL ??
      this.housejobData?.SwitchBL;

    return String(switchBL || '').toUpperCase() === 'Y';
  }

  private getProxyPrintData(): any {
    return (
      this.housejobData?.HouseJobProxy?.[0] ||
      this.housejobData?.houseJobProxy?.[0] ||
      this.housejobData?.Proxy?.[0] ||
      this.housejobData?.Others?.[0] ||
      null
    );
  }

  private getPrintValue(primaryValue: any, proxyValue: any): string {
    const hasProxyValue =
      proxyValue !== null &&
      proxyValue !== undefined &&
      String(proxyValue).trim() !== '';

    const value = this.isSwitchBLEnabled()
      ? (hasProxyValue ? proxyValue : primaryValue)
      : primaryValue;
    return value === null || value === undefined ? '' : String(value);
  }

  getShipperNameForPrint(): string {
    const proxy = this.getProxyPrintData();
    return this.getPrintValue(this.housejobData?.ShipperName, proxy?.ShipperName);
  }

  getShipperAddressForPrint(): string {
    const proxy = this.getProxyPrintData();
    return this.getPrintValue(this.housejobData?.ShipperAddress, proxy?.ShipperAddress);
  }

  getConsigneeNameForPrint(): string {
    const proxy = this.getProxyPrintData();
    return this.getPrintValue(this.housejobData?.ConsigneeName, proxy?.ConsigneeName);
  }

  getConsigneeAddressForPrint(): string {
    const proxy = this.getProxyPrintData();
    return this.getPrintValue(this.housejobData?.ConsigneeAddress, proxy?.ConsigneeAddress);
  }

  getAgentNameForPrint(): string {
    const proxy = this.getProxyPrintData();
    const proxyAgentName = proxy?.AgentName || proxy?.DestinationAgentName;
    const primaryAgentName = this.getDestinationAgentName(this.housejobData?.DestinationAgent);
    return this.getPrintValue(primaryAgentName, proxyAgentName);
  }

  getAgentAddressForPrint(): string {
    const proxy = this.getProxyPrintData();
    return this.getPrintValue(this.housejobData?.AgentAddress, proxy?.AgentAddress);
  }

  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company'),
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch'),
    );
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(
      (ucm) => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid,
    ))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(
      (ubm) => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid,
    ))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
    this.milestoneInserted = false;
  }

  loadCityName(): void {
    if (!this.currentBranchCityId) return;

    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {
        if (response) {
          const ourCity = response;
          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
        }
      },
      error: (error) => {
        console.error('Failed to load city:', error);
      },
    });
  }

  grossAmount(): number {
    const cargoList = this.housejobData?.Cargo || [];
    return cargoList.reduce((sum: number, item: any) => {
      const weight = parseFloat(item?.GrossWeight) || 0;
      return sum + weight;
    }, 0);
  }

  volumeAmount(): number {
    const cargoList = this.housejobData?.Cargo || [];
    return cargoList.reduce((sum: number, item: any) => {
      const volume = parseFloat(item?.Volume) || 0;
      return sum + volume;
    }, 0);
  }

  get containerMappedProducts() {
    return (this.housejobData?.Products || []).filter(
      (p: any) => !!p.MasterJobContainerSid,
    );
  }

  getDestinationAgentName(CustomerMasterSid: number | string): string {
    const agent = this.agentList.find(
      (a) => a.CustomerMasterSid == CustomerMasterSid,
    );
    return agent ? agent.CustomerName : '';
  }

  getContainerTypeName(containerTypeSid: number): string {
    if (!containerTypeSid || !this.containerTypeList?.length) return '';
    const containerType = this.containerTypeList.find(
      (ct: any) => Number(ct?.ContainerTypeMasterSid) === Number(containerTypeSid),
    );
    return containerType?.ContainerName || containerType?.ContainerType || '';
  }

  joinPrintParts(parts: any[], separator: string = ' / '): string {
    return parts
      .map((part) => (part ?? '').toString().trim())
      .filter(Boolean)
      .join(separator);
  }

  getContainerMarksDisplay(rate: any): string {
    const containerType = this.getContainerTypeName(this.housejobData?.masterJob?.containers?.[0]?.ContainerType);
    const containerNo = this.joinPrintParts([
      rate?.ContainerNo,
      containerType ? `(${containerType})` : '',
    ], ' ');

    return this.joinPrintParts([
      containerNo,
      this.housejobData?.masterJob?.containers?.[0]?.LineSeal,
      this.housejobData?.Cargo?.[0]?.MarksAndNumber,
    ]);
  }

  getPackageDisplay(rate: any): string {
    return this.joinPrintParts([
      rate?.ExternlQty,
      this.housejobData?.Cargo?.[0]?.CommodityDescription,
      rate?.ExternaPkg,
    ]);
  }

  async downloadPDF() {
    if (this.selectedReport === 'HBLDraft') {
      await this.generateAndDownloadPdf();
      return;
    }

    const payload = {
      HouseJobSid: this.housejobData?.HouseJobSid,
      CompanyMasterSid: this.housejobData?.CompanyMasterSid,
      BranchMasterSid: this.housejobData?.BranchMasterSid,
    };

    this.spinner.show();

    this.operationService.incrementHBLCount(payload).subscribe({
      next: async (resp: any) => {
        if (resp.status) {
          await this.generateAndDownloadPdf(false);
          this.updateHBLCountInDisplay();
        } else {
          this.spinner.hide();
          this.appSettingService.showError('Error incrementing HBL Count');
        }
      },
      error: (error) => {
        this.spinner.hide();
        this.appSettingService.showError(error.message);
        console.error(error);
      },
    });
  }

  private async generateAndDownloadPdf(showSpinner: boolean = true): Promise<void> {
    if (showSpinner) {
      this.spinner.show();
    }

    try {
      await this.insertMilestoneSafelyForPrint();
      const { pdfMake } = await this.getPdfDependencies();
      const logo = await this.resolveReportLogo();

      const pdfData = transformHblApiData(
        this.housejobData,
        {
          selectedReport: this.selectedReport,
          hblCount: this.hblCount,
          company: this.currentCompany,
          branch: this.currentBranch,
          userData: this.userData,
          currentDate: this.currentDate,
          currentBranchCityName: this.currentBranchCityName,
          agentList: this.agentList,
        },
        logo,
      );

      const docDefinition = generateHblDocument(pdfData);
      const houseJob = this.housejobData?.HBLNo || 'Draft';
      pdfMake.createPdf(docDefinition).download(`HBL_${houseJob}.pdf`);
      this.appSettingService.showSuccess('PDF downloaded successfully!');
      const payload = {
        tableName: 'HouseJob',
        recordId: String(this.housejobData?.MasterJobSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          PDF: `${this.selectedReport} PDF Downloaded`
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      console.error('HBL PDF generation error:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }

  async sendMail(): Promise<void> {
    this.spinner.show();

    try {
      const file = await this.generateHblPdfFileForMail();
      const hblNo = this.housejobData?.HBLNo || '';
      const documentName = this.selectedReport === 'HBLDraft' ? 'HBL Draft' : 'HBL';
      const documentDate = this.formatEmailDate(
        this.housejobData?.HBLDate
      );
      const toEmail = await this.emailTriggerService.resolveCustomerBranchEmailsByMenu({
        customerBranchSid: this.getCustomerBranchSidForEmail(),
        customerMasterSid: this.getCustomerMasterSidForEmail(),
        menuMasterSid: this.getCurrentMenuMasterSidForEmail()
      });
      const attachmentRequired = await this.emailTriggerService.isAttachmentRequiredForMenu(this.appSettingService.getCurrentCompanyInfo()?.CompanyMasterSid, this.getCurrentMenuMasterSidForEmail());

      if (toEmail.length === 0) {
        this.appSettingService.showError('No email found in customer branch email.');
        return;
      }

      const emailContent = this.emailTriggerService.buildOperationEmailContent({
        documentName,
        documentNoLabel: 'HBL No.',
        documentNo: hblNo,
        documentDate,
        pol: this.housejobData?.POL || '',
        pod: this.housejobData?.POD || '',
        fpd: this.housejobData?.FPD || '',
        userName: this.userData?.userName || '',
        introLine: `Please find attached the ${documentName} for your reference.`,
        followupLine: 'Kindly review the attached details at your convenience.'
      });

      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        EmailTo: toEmail,
        EmailCC: this.userData?.userEmail ? [this.userData.userEmail] : [],
        EmailBCC: [],
        Subject: emailContent.subject,
        Mailbody: emailContent.body,
        context: {
          documentName,
          documentNoLabel: 'HBL No',
          menuName: documentName,
          documentNo: hblNo,
          date: documentDate,
          pol: this.housejobData?.POL || '',
          pod: this.housejobData?.POD || '',
          fpd: this.housejobData?.FPD || ''
        },
        attachmentRequired,
        ...(attachmentRequired ? { attachments: [file] } : {})
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.insertMilestoneSafelyForPrint();
        this.createEmailAuditLog(documentName);
      });
    } catch (error) {
      console.error('HBL email error:', error);
      this.appSettingService.showError('Error preparing email');
    } finally {
      this.spinner.hide();
    }
  }

  private async generateHblPdfFileForMail(): Promise<File> {
    const { pdfMake } = await this.getPdfDependencies();
    const logo = await this.resolveReportLogo();
    const pdfData = transformHblApiData(
      this.housejobData,
      {
        selectedReport: this.selectedReport,
        hblCount: this.hblCount,
        company: this.currentCompany,
        branch: this.currentBranch,
        userData: this.userData,
        currentDate: this.currentDate,
        currentBranchCityName: this.currentBranchCityName,
        agentList: this.agentList,
      },
      logo,
    );
    const docDefinition = generateHblDocument(pdfData);
    const blob = await new Promise<Blob>((resolve) => {
      pdfMake.createPdf(docDefinition).getBlob(resolve);
    });
    const houseJob = this.housejobData?.HBLNo || 'Draft';
    return new File([blob], `HBL_${houseJob}.pdf`, { type: 'application/pdf' });
  }

  private createEmailAuditLog(documentName: string): void {
    const payload = {
      tableName: 'HouseJob',
      recordId: String(this.housejobData?.HouseJobSid),
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

  private getCustomerBranchSidForEmail(): number | null {
    const candidates = [
      this.housejobData?.CustomerBranchSid,
      this.housejobData?.customerBranch?.CustomerBranchSid,
      this.housejobData?.CustomerBranch?.CustomerBranchSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCustomerMasterSidForEmail(): number | null {
    const candidates = [
      this.housejobData?.CustomerMasterSid,
      this.housejobData?.customerMaster?.CustomerMasterSid,
      this.housejobData?.CustomerMaster?.CustomerMasterSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCurrentMenuMasterSidForEmail(): number | null {
    const sid = Number(
      this.houseMenuMasterSid ||
      this.housejobData?.MenuMasterSid
    );

    return Number.isFinite(sid) && sid > 0 ? sid : null;
  }

  private formatEmailDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB');
  }

  async printDiv(divId: string): Promise<void> {
    this.showPrintLogo = true;
    this.showPdfLogo = false;
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

  modalClose() {
    this.activeModal.close();
  }

  updateHBLCountInDisplay() {
    this.activeModal.close('UPDATED');
  }

  private async getPdfDependencies(): Promise<{ pdfMake: any }> {
    if (this.pdfDepsPromise) {
      return this.pdfDepsPromise;
    }

    this.pdfDepsPromise = (async () => {
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

      const pdfMake: any = (pdfMakeModule as any).default || pdfMakeModule;
      const pdfFonts: any = (pdfFontsModule as any).default || pdfFontsModule;
      pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts;

      return { pdfMake };
    })();

    return this.pdfDepsPromise;
  }

  private async resolveReportLogo(): Promise<string | undefined> {
    const logoFromStream = await firstValueFrom(
      this.logoService.reportLogo$.pipe(take(1)),
    );
    const logoSource =
      logoFromStream || localStorage.getItem('current_report_logo') || '';

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

  private async insertMilestoneSafelyForPrint(): Promise<void> {
    if (!this.autoInsertMilestone || !this.milestonePayload || this.milestoneInserted) {
      return; // Already inserted or not needed
    }

    try {
      const resp: any = await firstValueFrom(
        this.milestoneService.safeInsertMilestone(this.milestonePayload)
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
