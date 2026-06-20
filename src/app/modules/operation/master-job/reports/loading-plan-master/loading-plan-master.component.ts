import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  generateLoadingPlanMasterDocument,
  transformLoadingPlanMasterApiData,
} from 'src/app/common/pdf/generators/loading-plan-master-pdf.generator';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { OperationService } from '../../../operation.service';

@Component({
  selector: 'app-loading-plan-master',
  standalone: true,
  imports: [CommonModule, CustomDatePipe,PrintHeaderComponent,PrintFooterComponent],
  templateUrl: './loading-plan-master.component.html',
  styles: ``
})
export class LoadingPlanMasterComponent {
  userData: any;
  currentCompany: any;
  currentBranch: any;
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  currentDate = new Date();

  @Input() housejobData: any;
  @Input() masterJobData: any;
  @Input() masterJobContainers: any[] = [];
  @Input() containerTypeList: any[] = [];
  @Input() packageTypeList: any[] = [];
  @Input() TandCList: any;
  @Input() selectedFCLLCL: string = 'LCL';
  @Input() portList: any[] = []; 
  @Input() currentMenuId: number | null = null;
  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;
  private pdfDepsPromise?: Promise<{ pdfMake: any }>;

     constructor(
    private appSettingsService: AppSettingsService,
    private activeModal: NgbActiveModal,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    public logoService : LogoService,
    public mps: MenuPermissionService,
    private operationService: OperationService,
    private emailTriggerService: EmailTriggerService,
    private modalService: NgbModal,
    private companySettings: CompanySettingsManagerService
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
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    // this.loadCityName();
  }

  getPortName(portCode: string): string {
    if (!portCode || !this.portList || this.portList.length === 0) {
      return portCode || '';
    }
    
    const port = this.portList.find(p => p.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  }

  getHouseShipment(item: any): any {
    if (!item?.HouseJobSid) {
      return {};
    }

    return (this.masterJobData?.allShipments || []).find(
      (shipment: any) => String(shipment?.HouseJobSid) === String(item?.HouseJobSid)
    ) || {};
  }

  getHouseBlNo(item: any): string {
    const shipment = this.getHouseShipment(item);
    return item?.HBLNo || shipment?.HBLNo || '';
  }

  getHouseOrigin(item: any): string {
    const shipment = this.getHouseShipment(item);
    return shipment?.POO || item?.POO || '';
  }

  getHouseDestination(item: any): string {
    const shipment = this.getHouseShipment(item);
    return shipment?.FPD || item?.FPD || '';
  }

  get containersForPrint(): any[] {
    return this.masterJobData?.containers || this.masterJobContainers || [];
  }

  getContainerTypeName(containerTypeMasterSid: number): string {
    if (!containerTypeMasterSid || !this.containerTypeList?.length) {
      return '';
    }

    const containerType = this.containerTypeList.find(
      (ct) => String(ct?.ContainerTypeMasterSid) === String(containerTypeMasterSid)
    );

    return containerType?.ContainerName || '';
  }

  get totalGrossWeight(): number {
    return this.getCargoTotal('GrossWeight');
  }

  get totalNetWeight(): number {
    return this.getCargoTotal('NetWeight');
  }

  get totalVolume(): number {
    return this.getCargoTotal('Volume');
  }

  getHouseCargoTotal(item: any, field: 'NoOfPackage' | 'GrossWeight' | 'NetWeight' | 'Volume'): number {
    return (item?.Cargo || []).reduce((total: number, cargo: any) => {
      const value = Number(cargo?.[field]);
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  private getCargoTotal(field: 'GrossWeight' | 'NetWeight' | 'Volume'): number {
    return (this.masterJobData?.houseJob || []).reduce((total: number, item: any) => {
      return total + this.getHouseCargoTotal(item, field);
    }, 0);
  }

//     getParseInteger(value: any): string {
//   if (!value && value !== 0) return '0.000';
//   const num = parseFloat(value);
//   return isNaN(num) ? '0.000' : num.toFixed(3);
// }
//     getParseIntegerNoDecimal(value: any): string {
//   if (!value && value !== 0) return '0';
//   const num = parseFloat(value);
//   return isNaN(num) ? '0' : num.toString();
// }

    async downloadPDF() {
    this.showPrintLogo = false;
    this.showPdfLogo = true;
    this.spinner.show();

    try {
      const { pdfMake } = await this.getPdfDependencies();
      const docDefinition = await this.buildLoadingPlanDocDefinition();
      if (!docDefinition) {
        this.appSettingService.showError('No data available to generate PDF');
        return;
      }

      pdfMake
        .createPdf(docDefinition)
        .download(`Loading_Plan_${this.masterJobData?.MasterJobNumber || 'Report'}.pdf`);
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
          PDF: 'Loading Plan PDF Downloaded',
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      console.error('Loading Plan PDF generation error:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }

  async generatePDFBlob(): Promise<Blob | null> {
    try {
      const docDefinition = await this.buildLoadingPlanDocDefinition();
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
      console.error('Error generating Loading Plan PDF blob:', error);
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

      const documentName = 'Loading Plan';
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

      const file = new File([blob], `Loading_Plan_${documentNo || 'Report'}.pdf`, { type: 'application/pdf' });
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
        attachments: [file]
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.createEmailAuditLog(documentName);
      });
    } catch (error) {
      console.error('Loading Plan email error:', error);
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

modalClose() {
    this.activeModal.close();
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

  private async buildLoadingPlanDocDefinition(): Promise<any | null> {
    if (!this.masterJobData) {
      return null;
    }

    const logo = await this.resolveReportLogo();
    const pdfData = transformLoadingPlanMasterApiData(
      this.masterJobData,
      this.currentCompany,
      this.currentBranch,
      this.userData,
      logo,
      {
        portList: this.portList,
        containerTypeList: this.containerTypeList,
        printSettings: this.companySettings.getPrintSettings(),
      },
    );

    return generateLoadingPlanMasterDocument(pdfData);
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

}
