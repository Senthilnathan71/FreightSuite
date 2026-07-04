import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  generateProofOfDeliveryDocument,
  transformProofOfDeliveryApiData,
} from 'src/app/common/pdf/generators/proof-of-delivery-pdf.generator';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { OperationService } from '../../../operation.service';

@Component({
  selector: 'app-proof-of-delivery',
  standalone: true,
  imports: [CommonModule, CustomDatePipe,PrintFooterComponent,PrintHeaderComponent],
  templateUrl: './proof-of-delivery.component.html',
  styles: ``
})
export class ProofOfDeliveryComponent {
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
  @Input() packageTypeList: any[] = [];
  @Input() TandCList: any;
  @Input()  selectedFCLLCL:any;
  @Input() containerTypeList: any;
  @Input() portList: any[] = []; // Add this input
  @Input() selectedDepartmentType : any;
  @Input() houseMenuMasterSid: number | null = null;
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
    private modalService: NgbModal,
    private emailTriggerService: EmailTriggerService,
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
        console.error("Failed to load city:", error);
        this.spinner.hide();
      }
    });
  }

  getContainerName(ContainerTypeMasterSid: number) {
    console.log(this.containerTypeList,ContainerTypeMasterSid,'Contanier Type mater sid')
    if (!ContainerTypeMasterSid || this.containerTypeList.length === 0) {
      return "";
    }
    return this.containerTypeList.find(con => con.ContainerTypeMasterSid === ContainerTypeMasterSid)?.ContainerName || ""
  }

  get proofOfDeliveryRows(): any[] {
    const products = this.housejobData?.Products || [];
    if (products.length) {
      return products;
    }

    const cargoRows = this.housejobData?.Cargo || [];
    return cargoRows.map((cargo: any) => ({
      ProductName: cargo?.CommodityDescription,
      ContainerNo: cargo?.ContainerNo || cargo?.NoofContainers || '',
      ContainerType: cargo?.ContainerType,
      ExternlQty: cargo?.ExternlQty ?? cargo?.NoOfPackage,
      NoOfPackage: cargo?.NoOfPackage,
      GrossWeight: cargo?.GrossWeight,
      Volume: cargo?.Volume,
      NetWeight: cargo?.NetWeight,
      Volumetric: cargo?.Volumetric
    }));
  }

  getRemarks(): string {
    return this.housejobData?.InternalNote || this.housejobData?.Others?.[0]?.InternalNote || '';
  }


   modalClose() {
    this.activeModal.close();
  }

    
 getPortName(portCode: string): string {
    if (!portCode || !this.portList || this.portList.length === 0) {
      return portCode || '';
    }
    
    const port = this.portList.find(p => p.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
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



  async downloadPDF() {
  this.showPrintLogo = false;
  this.showPdfLogo = true;

  setTimeout(async () => {
    this.spinner.show();
   try {
      const { pdfMake } = await this.getPdfDependencies();
      const logo = await this.resolveReportLogo();
      const pdfData = transformProofOfDeliveryApiData(
        this.housejobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        {
          portList: this.portList,
          containerTypeList: this.containerTypeList,
          selectedFclLcl: this.selectedFCLLCL,
          printSettings: this.companySettings.getPrintSettings()
        }
      );
      const docDefinition = generateProofOfDeliveryDocument(pdfData);

      pdfMake
        .createPdf(docDefinition)
        .download(`Proof-of-Delivery-${this.housejobData?.HBLNo || 'Report'}.pdf`);
      this.appSettingsService.showSuccess('PDF downloaded successfully!');
      const payload = {
        tableName: 'HouseJob',
        recordId: String(this.housejobData?.HouseJobSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          PDF: 'Proof-of-Delivery PDF Downloaded',
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } finally {
      this.spinner.hide();
    }
  }, 50);
   }

  async generatePDFBlob(): Promise<Blob | null> {
    try {
      const { pdfMake } = await this.getPdfDependencies();
      const logo = await this.resolveReportLogo();
      const pdfData = transformProofOfDeliveryApiData(
        this.housejobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        {
          portList: this.portList,
          containerTypeList: this.containerTypeList,
          selectedFclLcl: this.selectedFCLLCL,
          printSettings: this.companySettings.getPrintSettings()
        }
      );
      const docDefinition = generateProofOfDeliveryDocument(pdfData);

      return await new Promise<Blob>((resolve) => {
        pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => resolve(blob));
      });
    } catch (error) {
      console.error('Proof of Delivery PDF blob error:', error);
      return null;
    }
  }

  async sendMail(): Promise<void> {
    this.spinner.show();

    try {
      const blob = await this.generatePDFBlob();
      if (!blob) {
        this.appSettingService.showError('Error generating PDF. Please try again.');
        return;
      }

      const hblNo = this.housejobData?.HBLNo || this.housejobData?.ShipmentNo || '';
      const documentName = 'Proof of Delivery';
      const documentDate = this.formatEmailDate(this.housejobData?.HBLDate || this.housejobData?.ETA);
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

      const file = new File([blob], `Proof_of_Delivery_${hblNo || 'Report'}.pdf`, { type: 'application/pdf' });
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
        // Print "Send Mail" always carries the generated PDF, even when the
        // menu's Mail Configuration has AttachmentRequire = No.
        attachments: [file]
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.createEmailAuditLog(documentName);
      });
    } catch (error) {
      console.error('Proof of Delivery email error:', error);
      this.appSettingService.showError('Error preparing email');
    } finally {
      this.spinner.hide();
    }
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
