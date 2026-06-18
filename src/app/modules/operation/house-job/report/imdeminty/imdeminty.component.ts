import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import {
  generateImdemintyDocument,
  transformImdemintyApiData
} from 'src/app/common/pdf/generators/imdeminty-pdf.generator';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { OperationService } from '../../../operation.service';

@Component({
  selector: 'app-imdeminty',
  standalone: true,
  imports: [CommonModule, CustomDatePipe,PrintFooterComponent,PrintHeaderComponent],
  templateUrl: './imdeminty.component.html',
  styles: ``
})
export class ImdemintyComponent {

  currentCompany: any
  currentBranch: any;
  userData: any
  currentDate = new Date()
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;

  @Input() housejobData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL: any;

  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;
  @Input() houseMenuMasterSid: number | null = null;
   containerList: string[] = [];
       showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;

  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
      this.prepareContainers();
  }

   prepareContainers() {
    if (this.housejobData?.Products?.length) {
      const set = new Set<string>();
      this.housejobData.Products.forEach((p: any) => {
        if (p.ContainerNo) {
          set.add(p.ContainerNo);
        }
      });
      this.containerList = Array.from(set);
    } else {
      this.containerList = ['—'];
    }
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
        console.error("Failed to load city:", error);
   
      }
    });
  }

  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private pdfMakeService: PdfMakeService,
    private spinner: NgxSpinnerService,
    public logoService : LogoService,
    public mps: MenuPermissionService,
    private operationService: OperationService,
    private modalService: NgbModal,
    private emailTriggerService: EmailTriggerService,
    private companySettings: CompanySettingsManagerService
  ) { }


  

  modalClose() {
    this.activeModal.close()
  }





async downloadPDF() {
  this.showPrintLogo = false;
  this.showPdfLogo = true;

  setTimeout(async () => {
    this.spinner.show();
    try {
      const logo = this.pdfMakeService.getReportLogo();
      const pdfData = transformImdemintyApiData(
        this.housejobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        { printSettings: this.companySettings.getPrintSettings() }
      );
      const docDefinition = generateImdemintyDocument(pdfData);
      const houseJob = this.housejobData?.ShipmentNo || this.housejobData?.HBLNo || 'Report';
      this.pdfMakeService.download(docDefinition, `Indemnity_${houseJob}`);
      this.appSettingService.showSuccess('PDF downloaded successfully!');
      const payload = {
        tableName: 'HouseJob',
        recordId: String(this.housejobData?.HouseJobSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          PDF: 'Indeminty PDF Downloaded'
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      console.error('Indemnity PDF generation failed:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }, 50);
}

    async generatePDFBlob(): Promise<Blob | null> {
          try {
            const logo = this.pdfMakeService.getReportLogo();
            const pdfData = transformImdemintyApiData(
              this.housejobData,
              this.currentCompany,
              this.currentBranch,
              this.userData,
              logo,
              { printSettings: this.companySettings.getPrintSettings() }
            );
            const docDefinition = generateImdemintyDocument(pdfData);
            return await this.pdfMakeService.getBlob(docDefinition);
          } catch (error) {
            console.error('Error generating PDF blob:', error);
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
      const documentName = 'Indemnity';
      const documentDate = this.formatEmailDate(this.housejobData?.HBLDate);
      const toEmail = await this.emailTriggerService.resolveCustomerBranchEmailsByMenu({
        customerBranchSid: this.getCustomerBranchSidForEmail(),
        customerMasterSid: this.getCustomerMasterSidForEmail(),
        menuMasterSid: this.getCurrentMenuMasterSidForEmail()
      });

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

      const file = new File([blob], `Indemnity_${hblNo || 'Report'}.pdf`, { type: 'application/pdf' });
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
        attachments: [file]
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.createEmailAuditLog(documentName);
      });
    } catch (error) {
      console.error('Indemnity email error:', error);
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
  }, 50); // small timeout so Angular updates DOM
}


}
