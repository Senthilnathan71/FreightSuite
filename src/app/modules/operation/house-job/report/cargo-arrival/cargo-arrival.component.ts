import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { OperationService } from '../../../operation.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { ShipmentMilestoneService, SafeInsertShipmentMilestone } from 'src/app/modules/operation/services/shipment-milestone.service';
@Component({
  selector: 'app-cargo-arrival',
  standalone: true,
  imports: [
    CustomDatePipe,
    CommonModule,
    PrintFooterComponent,
    PrintHeaderComponent
  ],
  templateUrl: './cargo-arrival.component.html',
  styleUrl: './cargo-arrival.component.scss'
})
export class CargoArrivalComponent {

  currentCompany:any
  currentBranch : any;
  userData : any
  currentDate = new Date()
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  @Input() housejobData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL : any;
  currency:any[] = [];
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList : any;
  @Input() packageTypeList:any;
  @Input() portList: any[] = []; // Add this input
  @Input() houseMenuMasterSid: number | null = null;
  @Input() milestonePayload?: SafeInsertShipmentMilestone; // ARRIVAL milestone, built by the parent (house-job entry)
  @Output() reloadMilestone = new EventEmitter<void>(); // ask the parent to refresh the milestone tab after insert
  private arrivalMilestoneCaptured = false;

  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;

  ngOnInit(){
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.numberToWords.initializeCurrencies(this.currencyList);
    
    this.loadCityName();
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
    private appSettingService : AppSettingsService,
    private masterService: MasterService,
    private pdfMakeService: PdfMakeService,
    private spinner: NgxSpinnerService,
    private numberToWords: NumberToWordsService,
    public logoService : LogoService,
    public mps: MenuPermissionService,
    private operationService: OperationService,
    private modalService: NgbModal,
    private emailTriggerService: EmailTriggerService,
    private companySettings: CompanySettingsManagerService,
    private shipmentMilestoneService: ShipmentMilestoneService
  ) { }

  // Capture the "Arrival Notice Sent" (ARRIVAL) milestone the first time the Cargo Arrival
  // Notice is generated/emailed — whichever of the with/without-charge variants comes first.
  // MilestoneDate is omitted in the payload so the backend stamps now() (the real print/send time).
  // Backend dedups on (HouseJobSid + MilestoneMasterSid + Status='A'), so a second action
  // (the other variant, or download-then-email) throws "already exist" and is a silent no-op.
  private captureArrivalNoticeMilestone(): void {
    if (this.arrivalMilestoneCaptured) return;
    const payload = this.milestonePayload;
    if (!payload || !payload.ShipmentNo || !payload.MilestoneCode) return;

    this.arrivalMilestoneCaptured = true;
    this.shipmentMilestoneService.safeInsertMilestone(payload).subscribe({
      next: (resp: any) => {
        if (resp?.status) {
          this.reloadMilestone.emit(); // refresh the milestone tab now that a new row exists
        }
      },
      error: (err) => {
        // "already exist" / "not found" (non-import) are expected no-ops; allow a retry on the next action
        this.arrivalMilestoneCaptured = false;
        console.error('Arrival Notice milestone capture skipped:', err);
      }
    });
  }


  getContainerName(ContainerTypeMasterSid: number) {
    if (!ContainerTypeMasterSid || this.containerTypeList.length === 0) {
      return "";
    }
    return this.containerTypeList.find(con => con.ContainerTypeMasterSid === ContainerTypeMasterSid)?.ContainerName || ""
  }

  getCurrencyCode(revenueCurrencyMasterSid: number): string {
    const currency = this.currencyList.find(
      c => c.CurrencyMasterSid === revenueCurrencyMasterSid
    );
    return currency ? currency.currencyCode : '';
  }

  getUnitCode(ChargeUomSid: number) {

    if (!ChargeUomSid || !this.uomList || this.uomList.length === 0) {
      return '';
    }
    const uom = this.uomList.find(item => item.UOMMasterSid === ChargeUomSid);
    return uom ? uom.UOMName : '';
  }

  getTotalLocalAmount(): number {
    return (this.housejobData?.costRevenueCharges || [])
      .reduce((sum, rate) => sum + Number(rate.RevenueLocalAmount || rate.LocalAmt || 0), 0);
  }

  getTotalAmount(): number {
    return (this.housejobData?.costRevenueCharges || [])
      .reduce((sum, rate) => sum + Number(rate.RevenueAmount || rate.Amt || 0), 0);
  }

  getTotalPerUnit(): number {
    return (this.housejobData?.costRevenueCharges || [])
      .reduce((sum, rate) => sum + Number(rate.RevenueRate || rate.LocalAmt || 0), 0);
  }


    getPackageTypeName(pkgTypeSid: number): string {
    if (!pkgTypeSid) return '';
    const packageType = this.packageTypeList.find(
      (pt) => pt.UOMMasterSid === pkgTypeSid
    );
    return packageType ? packageType.UOMName : '';
  }
  
   getPortName(portCode: string): string {
    if (!portCode || !this.portList || this.portList.length === 0) {
      return portCode || '';
    }
    
    const port = this.portList.find(p => p.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  }

  
  closePrint(){
    this.activeModal.close();
  }

    getAmountInWords() : string{
    const total = this.getTotalAmount();
    if(!total) return '';
    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    if(!companyCurrency){
      return '';
    }
    const amountInWords = this.numberToWords.convert(total,companyCurrency);
    return amountInWords || '';
  }

  // getAmountInWords(): string {
  //   const total = this.getTotalLocalAmount();
  //   if (!total) return '';

  //   const rupees = Math.floor(total);
  //   const paise = Math.round((total - rupees) * 100);

  //   const rupeesInWords = this.numberToWords.convert(rupees);
  //   const paiseInWords = paise > 0 ? this.numberToWords.convert(paise) : '';

  //   // Get currency code safely from first voucher
  //   const selectedCode = this.housejobData?.voucherMatchings?.[0]?.CurrencyCode;
  //   if (!selectedCode) return `${rupeesInWords}${paise > 0 ? ' and ' + paiseInWords : ''} Only`;

  //   // Find currency in the list
  //   const selectedCurrency = this.currency?.find(
  //     (c: any) => String(c.CurrencyCode).trim() === String(selectedCode).trim()
  //   );

  //   const currencyName = selectedCurrency?.CurrencyUnit || 'Rupees';
  //   const subCurrencyName = selectedCurrency?.CurrencySubUnit || 'Paise';

  //   return paise > 0
  //     ? `${rupeesInWords} ${currencyName} and ${paiseInWords} ${subCurrencyName} Only`
  //     : `${rupeesInWords} ${currencyName} Only`;
  // }
  


    async generatePDFBlob(): Promise<Blob | null> {
    try {
      const logo = this.pdfMakeService.getReportLogo();
      return await this.pdfMakeService.generateCargoArrivalBlobFromApi(
        this.housejobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        this.getCargoArrivalPdfOptions()
      );
    } catch (error) {
      console.error('Error generating cargo arrival PDF blob:', error);
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
      const charge = this.withOrWithoutCharge ? 'With Charges' : 'Without Charges';
      const documentName = `Cargo Arrival Notice ${charge}`;
      const documentDate = this.formatEmailDate(this.housejobData?.HBLDate);
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

      const file = new File([blob], `Cargo_Arrival_${charge.replace(/\s+/g, '_')}_${hblNo || 'Report'}.pdf`, { type: 'application/pdf' });
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
        this.captureArrivalNoticeMilestone();
      });
    } catch (error) {
      console.error('Cargo Arrival email error:', error);
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

  

  async downloadPDF() {
  this.showPrintLogo = false;
  this.showPdfLogo = true;

  setTimeout(async () => {
    this.spinner.show();
   try {
      const logo = this.pdfMakeService.getReportLogo();
      const charge = this.withOrWithoutCharge ? 'With' : 'Without'
      this.pdfMakeService.generateCargoArrivalFromApi(
        this.housejobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        this.getCargoArrivalPdfOptions()
      );
      this.appSettingService.showSuccess('PDF downloaded successfully!');
      this.captureArrivalNoticeMilestone();
      const payload = {
        tableName: 'HouseJob',
        recordId: String(this.housejobData?.HouseJobSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          PDF: `Cargo Arrival Notice ${charge} Charges PDF Downloaded`
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      console.error('Cargo arrival PDF generation failed:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }, 50);
}

  private getCargoArrivalPdfOptions() {
    return {
      masterJobContainers: this.masterJobContainers || [],
      withOrWithoutCharge: this.withOrWithoutCharge,
      selectedFCLLCL: this.selectedFCLLCL || '',
      currencyList: this.currencyList || [],
      uomList: this.uomList || [],
      containerTypeList: this.containerTypeList || [],
      packageTypeList: this.packageTypeList || [],
      portList: this.portList || [],
      amountInWords: this.getAmountInWords(),
      printSettings: this.companySettings.getPrintSettings()
    };
  }

}
