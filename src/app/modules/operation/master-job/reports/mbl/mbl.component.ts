import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  generateMblDocument,
  transformMblApiData
} from 'src/app/common/pdf/generators/mbl-pdf.generator';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { OperationService } from '../../../operation.service';

@Component({
  selector: 'app-mbl',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './mbl.component.html',
  styles: ``,
})
export class MblComponent {
  currentCompany: any;
  currentBranch: any;
  userData: any;
  currentDate = new Date();
  branchDetails: any;
  @Input() currentMenuId: any;
  TandCList: any[] = [];

  currentBranchCityName: string | null;
  currentBranchCityId: number;

  @Input() masterJobData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL: any;
  @Input() agentList: any;
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;
  @Input() packageTypeList: any[] = [];
  @Input() selectedReport: 'MBL' | 'MBLDraft' = 'MBL';

  private pdfDepsPromise?: Promise<{ pdfMake: any }>;

  showPrintLogo = false;
  showPdfLogo = true;

  constructor(
    private activeModal: NgbActiveModal,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    public logoService: LogoService,
    public mps: MenuPermissionService,
    private operationService: OperationService,
    private emailTriggerService: EmailTriggerService
  ) {}

  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company')
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch')
    );
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(
      (ucm) => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid
    ))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(
      (ubm) => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid
    ))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
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
        console.error('Failed to load city:', error);
        this.spinner.hide();
      }
    });
  }

  getDestinationAgentName(CustomerMasterSid: number | string): string {
    const agent = this.agentList.find(
      (a) => a.CustomerMasterSid == CustomerMasterSid
    );
    return agent ? agent.CustomerName : '';
  }

  getAgentName(AgentSid: number) {
    if (!AgentSid || this.agentList.length === 0) return '';
    const agent = this.agentList.find(
      (agent) => agent.CustomerMasterSid === AgentSid
    );
    return agent ? agent.CustomerName : '';
  }

  gettotalNoOfPkg(): number {
    return this.masterJobContainers.reduce((sum, c) => {
      const value = Number(c.NoOfPkg) || 0;
      return sum + value;
    }, 0);
  }

  totalGrossWeight(): number {
    const containers = this.masterJobData?.containers || [];

    return containers.reduce((sum: number, item: any) => {
      const weight = Number(item?.GrossWeight) || 0;
      return sum + weight;
    }, 0);
  }

  totalVolume(): number {
    const containers = this.masterJobData?.containers || [];

    return containers.reduce((sum: number, item: any) => {
      const volume = Number(item?.Volume) || 0;
      return sum + volume;
    }, 0);
  }

  getPackageTypeName(pkgTypeSid: number): string {
    if (!pkgTypeSid) return 'Unknown';
    const packageType = this.packageTypeList.find(
      (pt) => pt.UOMMasterSid === pkgTypeSid
    );
    return packageType ? packageType.UOMName : 'Unknown';
  }

  getContainerTypeName(containerTypeSid: number): string {
    if (!containerTypeSid || !this.containerTypeList?.length) return '';
    const containerType = this.containerTypeList.find(
      (ct: any) => Number(ct?.ContainerTypeMasterSid) === Number(containerTypeSid)
    );
    return (
      containerType?.ContainerName ||
      containerType?.ContainerType ||
      containerType?.ContainerCode ||
      ''
    );
  }

  modalClose() {
    this.activeModal.close();
  }

  async downloadPDF() {
    this.showPrintLogo = false;
    this.showPdfLogo = true;
    this.spinner.show();

    try {
      const { pdfMake } = await this.getPdfDependencies();
      const docDefinition = await this.buildMblDocDefinition();
      if (!docDefinition) {
        this.appSettingService.showError('No data available to generate PDF');
        return;
      }

      const mblNo = this.masterJobData?.MBLNo || 'Draft';
      const reportname = this.selectedReport === 'MBL' ? 'MBL' :  'MBLDraft';
      pdfMake.createPdf(docDefinition).download(`MBL_${mblNo}.pdf`);
      this.appSettingService.showSuccess('PDF downloaded successfully!');
      const payload = {
        tableName: 'MasterJob',
        recordId: String(this.masterJobData?.MasterJobSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          PDF: `${reportname} PDF Downloaded`,
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      console.error('MBL PDF generation error:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }

  async generatePDFBlob(): Promise<Blob | null> {
    try {
      const docDefinition = await this.buildMblDocDefinition();
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
      console.error('Error generating MBL PDF blob:', error);
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

      const documentName = this.selectedReport === 'MBL' ? 'MBL' : 'MBL Draft';
      const documentNo = this.masterJobData?.MBLNo || this.masterJobData?.MasterJobNumber || '';
      const documentDate = this.formatEmailDate(this.masterJobData?.MBLDate || this.masterJobData?.MasterJobDate);
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
        documentNoLabel: 'MBL No.',
        documentNo,
        documentDate,
        pol: this.masterJobData?.POL || '',
        pod: this.masterJobData?.POD || '',
        fpd: this.masterJobData?.FPD || '',
        userName: this.userData?.userName || '',
        introLine: `Please find attached the ${documentName} for your reference.`,
        followupLine: 'Kindly review the attached details at your convenience.'
      });

      const file = new File([blob], `${documentName.replace(/\s+/g, '_')}_${documentNo || 'Report'}.pdf`, { type: 'application/pdf' });
      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        EmailTo: emailRecipients.toEmail,
        EmailCC: emailRecipients.ccEmail,
        EmailBCC: [],
        Subject: emailContent.subject,
        Mailbody: emailContent.body,
        context: {
          documentName,
          documentNoLabel: 'MBL No',
          menuName: documentName,
          documentNo,
          date: documentDate,
          pol: this.masterJobData?.POL || '',
          pod: this.masterJobData?.POD || '',
          fpd: this.masterJobData?.FPD || ''
        },
        attachments: [file]
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.createEmailAuditLog(documentName);
      });
    } catch (error) {
      console.error('MBL email error:', error);
      this.appSettingService.showError('Error preparing email');
    } finally {
      this.spinner.hide();
    }
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

  openTandC() {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          const modelRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true,
          });
          modelRef.componentInstance.terms = this.TandCList;
          modelRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modelRef.componentInstance.DocumentSid = this.masterJobData?.MasterJobSid;
        } else {
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
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

  private async buildMblDocDefinition(): Promise<any | null> {
    if (!this.masterJobData) {
      return null;
    }

    const logo = await this.resolveReportLogo();
    const pdfData = transformMblApiData(
      this.masterJobData,
      {
        selectedReport: this.selectedReport,
        company: this.currentCompany,
        branch: this.currentBranch,
        userData: this.userData,
        currentDate: this.currentDate,
        currentBranchCityName: this.currentBranchCityName,
        packageTypeList: this.packageTypeList,
        agentList: this.agentList,
        containerTypeList: this.containerTypeList
      },
      logo
    );

    return generateMblDocument(pdfData);
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
      this.logoService.reportLogo$.pipe(take(1))
    );
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
}
