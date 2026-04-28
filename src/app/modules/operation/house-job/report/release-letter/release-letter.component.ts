import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { firstValueFrom } from 'rxjs';
import {
  generateReleaseLetterDocument,
  transformReleaseLetterApiData
} from 'src/app/common/pdf/generators/release-letter-pdf.generator';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { SafeInsertShipmentMilestone, ShipmentMilestoneService } from 'src/app/modules/operation/services/shipment-milestone.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { OperationService } from '../../../operation.service';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

@Component({
  selector: 'app-release-letter',
  standalone: true,
  imports: [CommonModule,CustomDatePipe,PrintFooterComponent,PrintHeaderComponent],
  templateUrl: './release-letter.component.html',
  styles: ``
})
export class ReleaseLetterComponent {
  userData: any;
  currentCompany: any;
  currentBranch: any;
  currentDate = new Date();
   branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;

  @Input() housejobData: any;
  @Input() cfsList: any[] = [];
  @Input() masterJobContainers: any[] = [];
  @Input() packageTypeList: any[] = [];
  @Input() masterJobData: any;
  @Input() containerTypeList: any;
  @Input() selectedFCLLCL: any;
  @Input() portList: any[] = [];
  @Input() houseMenuMasterSid: number | null = null;

  @Input() autoInsertMilestone: boolean = false;
  @Input() milestonePayload?: SafeInsertShipmentMilestone;
  @Output() reloadMilestone = new EventEmitter<void>();
  private milestoneInserted: boolean = false;

  constructor(
    private appSettingsService: AppSettingsService,
    private activeModal: NgbActiveModal,
    private masterService: MasterService,
    private spinner: NgxSpinnerService,
    public logoService : LogoService,
    private milestoneService: ShipmentMilestoneService,
    public mps: MenuPermissionService,
    private operationService: OperationService,
    private modalService: NgbModal,
    private emailTriggerService: EmailTriggerService
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
    this.branchDetails = this.appSettingsService.getCurrentBranchInfo();
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
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
        console.error("Failed to load city:", error);
   
      }
    });
  }

  getCfsValue(cfsSid: number): string {
    if (!cfsSid || this.cfsList.length === 0) return '';
    // Look for CFS by CustomerMasterSid instead of CfsMasterSid
    const cfs = this.cfsList.find((c) => c.CustomerMasterSid === cfsSid);
    return cfs ? cfs.CustomerName : '';
  }

get totalNoOfPkg(): number {
  return this.housejobData?.Cargo?.reduce((sum, c) => {
    const value = Number(c.NoOfPackage) || 0;
    return sum + value;
  }, 0) || 0;
}

get totalGrossWeight(): number {
  return this.housejobData?.Cargo?.reduce((sum, c) => {
    const value = Number(c.GrossWeight) || 0;
    return sum + value;
  }, 0) || 0;
}

  get totalVolume(): number {
  return this.housejobData?.Cargo?.reduce((sum, c) => {
    const value = Number(c.Volume) || 0;
    return sum + value;
  }, 0) || 0;
}

get isFcl(): boolean {
  return (this.selectedFCLLCL || '').toUpperCase() === 'FCL';
}

get releaseLetterCargoRows(): any[] {
  return (this.housejobData?.Cargo || []).filter((cargo: any) =>
    !!(
      cargo?.CargoType ||
      cargo?.ContainerType ||
      (Number(cargo?.NoOfPackage) || 0) ||
      (Number(cargo?.GrossWeight) || 0) ||
      (Number(cargo?.Volume) || 0) ||
      (Number(cargo?.NoofContainers) || 0)
    )
  );
}

get primaryCargoRow(): any {
  return this.releaseLetterCargoRows[0] || this.housejobData?.Cargo?.[0] || {};
}

 getContainerName(ContainerTypeMasterSid: number) {
    if (!ContainerTypeMasterSid || this.containerTypeList.length === 0) {
      return "";
    }
    return this.containerTypeList.find(con => con.ContainerTypeMasterSid === ContainerTypeMasterSid)?.ContainerName || ""
  }

  getPackageTypeName(pkgTypeSid: number): string {
    if (!pkgTypeSid) return 'Unknown';
    const packageType = this.packageTypeList.find(
      (pt) => pt.UOMMasterSid === pkgTypeSid
    );
    return packageType ? packageType.UOMName : 'Unknown';
  }


   getPortName(portCode: string): string {
    if (!portCode || !this.portList || this.portList.length === 0) {
      return portCode || '';
    }
    
    const port = this.portList.find(p => p.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  }

   async downloadPDF() {
  this.showPrintLogo = false;
  this.showPdfLogo = true;

  setTimeout(async () => {
    this.spinner.show();
   try {
      await this.insertMilestoneSafelyForPrint();
      const logo = localStorage.getItem('current_report_logo') || undefined;
      const pdfData = transformReleaseLetterApiData(
        this.housejobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        this.getReleaseLetterPdfOptions()
      );
      const docDefinition = generateReleaseLetterDocument(pdfData);
      const filename = `Release_Letter_${pdfData.releaseInfo?.bookingRef || 'Draft'}.pdf`;
      pdfMake.createPdf(docDefinition).download(filename);
      this.appSettingsService.showSuccess('PDF downloaded successfully!');
      const payload = {
        tableName: 'HouseJob',
        recordId: String(this.housejobData?.HouseJobSid),
        operation: 'PDF',
        changedBy: this.appSettingsService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          PDF: 'Release Letter PDF Downloaded'
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
          await this.insertMilestoneSafelyForPrint();
          try {
            const logo = localStorage.getItem('current_report_logo') || undefined;
            const pdfData = transformReleaseLetterApiData(
              this.housejobData,
              this.currentCompany,
              this.currentBranch,
              this.userData,
              logo,
              this.getReleaseLetterPdfOptions()
            );
            const docDefinition = generateReleaseLetterDocument(pdfData);
            return await new Promise<Blob>((resolve, reject) => {
              try {
                pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => resolve(blob));
              } catch (error) {
                reject(error);
              }
            });
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
        this.appSettingsService.showError('Error generating PDF. Please try again.');
        return;
      }

      const bookingRef = this.housejobData?.BookingNo || this.housejobData?.Others?.[0]?.CustomerRefNo || this.housejobData?.HBLNo || '';
      const documentName = 'Release Letter';
      const documentDate = this.formatEmailDate(this.housejobData?.HBLDate);
      const toEmail = await this.emailTriggerService.resolveCustomerBranchEmailsByMenu({
        customerBranchSid: this.getCustomerBranchSidForEmail(),
        customerMasterSid: this.getCustomerMasterSidForEmail(),
        menuMasterSid: this.getCurrentMenuMasterSidForEmail()
      });

      if (toEmail.length === 0) {
        this.appSettingsService.showError('No email found in customer branch email.');
        return;
      }

      const emailContent = this.emailTriggerService.buildOperationEmailContent({
        documentName,
        documentNoLabel: 'Booking Ref.',
        documentNo: bookingRef,
        documentDate,
        pol: this.housejobData?.POL || '',
        pod: this.housejobData?.POD || '',
        fpd: this.housejobData?.FPD || '',
        userName: this.userData?.userName || '',
        introLine: `Please find attached the ${documentName} for your reference.`,
        followupLine: 'Kindly review the attached details at your convenience.'
      });

      const file = new File([blob], `Release_Letter_${bookingRef || 'Draft'}.pdf`, { type: 'application/pdf' });
      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        EmailTo: toEmail,
        EmailCC: this.userData?.userEmail ? [this.userData.userEmail] : [],
        EmailBCC: [],
        Subject: emailContent.subject,
        Mailbody: emailContent.body,
        context: {
          documentName,
          documentNoLabel: 'Booking Ref',
          menuName: documentName,
          documentNo: bookingRef,
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
      console.error('Release Letter email error:', error);
      this.appSettingsService.showError('Error preparing email');
    } finally {
      this.spinner.hide();
    }
  }

  private createEmailAuditLog(documentName: string): void {
    const payload = {
      tableName: 'HouseJob',
      recordId: String(this.housejobData?.HouseJobSid),
      operation: 'EMAIL',
      changedBy: this.appSettingsService.userSettingSource.value['userEmail'],
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

  private getReleaseLetterPdfOptions(): {
    containerTypeList: any[];
    selectedFCLLCL: string;
    portList: any[];
  } {
    return {
      containerTypeList: this.containerTypeList || [],
      selectedFCLLCL: this.selectedFCLLCL || '',
      portList: this.portList || []
    };
  }


// Print

      
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
  }, 50); // small timeout so Angular updates DOM
}



  private async insertMilestoneSafelyForPrint(): Promise<void> {
    if (!this.autoInsertMilestone || !this.milestonePayload || this.milestoneInserted) {
      return;
    }

    try {
      const resp: any = await firstValueFrom(
        this.milestoneService.safeInsertMilestone(this.milestonePayload)
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

  modalClose() {
    this.activeModal.close();
  }
}
