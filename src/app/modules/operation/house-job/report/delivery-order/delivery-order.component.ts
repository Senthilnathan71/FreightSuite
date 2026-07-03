import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
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
import { ShipmentMilestoneService, SafeInsertShipmentMilestone } from 'src/app/modules/operation/services/shipment-milestone.service';

@Component({
  selector: 'app-delivery-order',
  standalone: true,
  imports: [CommonModule, CustomDatePipe,PrintFooterComponent,PrintHeaderComponent],
  templateUrl: './delivery-order.component.html',
  styles: ``
})
export class DeliveryOrderComponent {

  currentCompany: any
  currentBranch: any;
  userData: any
  currentDate = new Date()
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  companyCurrency: any;
  currentCurrencyCode: string;
  currency: any[] = [];
  @Input() housejobData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL: any;
  @Input() TandCList: any;
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() packageTypeList: any;
  @Input() containerTypeList: any;
  @Input() houseMenuMasterSid: number | null = null;
  @Input() milestonePayload?: SafeInsertShipmentMilestone; // DO milestone, built by the parent (house-job entry)
  @Output() reloadMilestone = new EventEmitter<void>(); // ask the parent to refresh the milestone tab after insert
  private doMilestoneCaptured = false;
  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.companyCurrency = this.companySettings.getCurrencySettings();
    this.currentCurrencyCode = this.companyCurrency.code;
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
    this.loadCurrencyList();
  }


  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;

  loadCityName(): void {
    if (!this.currentBranchCityId) return;


    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
          // console.log("Final City Name:", this.currentBranchCityName);
        }


      },
      error: (error) => {
        console.error("Failed to load city:", error);

      }
    });
  }


  loadCurrencyList(): void {
    this.masterService.getAllCurrencies().subscribe({
      next: (response: any) => {
        this.currency = response || [];
         this.numberToWords.initializeCurrencies(this.currency);
      },
      
      error: (error) => {
        console.error('Failed to load currencies:', error);
      }
    });
  }
  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private pdfMakeService: PdfMakeService,
    private spinner: NgxSpinnerService,
    private numberToWords: NumberToWordsService,
    private companySettings: CompanySettingsManagerService,
    public logoService : LogoService,
    public mps: MenuPermissionService,
    private operationService: OperationService,
    private modalService: NgbModal,
    private emailTriggerService: EmailTriggerService,
    private shipmentMilestoneService: ShipmentMilestoneService
  ) { }

  // Capture the "DO Issued" (DO) milestone the first time the Delivery Order is downloaded/emailed.
  // MilestoneDate is omitted in the payload so the backend stamps now() (the real print/send time).
  // Backend dedups on (HouseJobSid + MilestoneMasterSid + Status='A'), so a second action
  // (download-then-email) throws "already exist" and is a silent no-op. Import-only in the catalog,
  // so the backend silently no-ops for Export.
  private captureDeliveryOrderMilestone(): void {
    if (this.doMilestoneCaptured) return;
    const payload = this.milestonePayload;
    if (!payload || !payload.ShipmentNo || !payload.MilestoneCode) return;

    this.doMilestoneCaptured = true;
    this.shipmentMilestoneService.safeInsertMilestone(payload).subscribe({
      next: (resp: any) => {
        if (resp?.status) {
          this.reloadMilestone.emit(); // refresh the milestone tab now that a new row exists
        }
      },
      error: (err) => {
        // "already exist" / "not found" (non-import) are expected no-ops; allow a retry on the next action
        this.doMilestoneCaptured = false;
        console.error('Delivery Order milestone capture skipped:', err);
      }
    });
  }

  getUnitCode(ChargeUomSid: number) {

 

    if (!ChargeUomSid || !this.uomList || this.uomList.length === 0) {
      return '';
    }
    const uom = this.uomList.find(item => item.UOMMasterSid === ChargeUomSid);
    return uom ? uom.UOMCode : '';
  }

  getCurrencyCode(revenueCurrencyMasterSid: number): string {
    const currency = this.currencyList.find(
      c => c.CurrencyMasterSid === revenueCurrencyMasterSid
    );
    return currency ? currency.currencyCode : '';
  }

  getCurrencyCodeCost(CostCurrencyMasterSid: number): string {
    const currency = this.currencyList.find(
      c => c.CurrencyMasterSid === CostCurrencyMasterSid
    );
    return currency ? currency.currencyCode : '';
  }
  getTotalLocalRevenuAmount(): number {

    return (this.housejobData?.costRevenueCharges || [])
      .reduce((sum, rate) => sum + Number(rate.RevenueRate || 0), 0);
  }

  TotalAmount(): number {
    return (this.housejobData?.costRevenueCharges || [])
      .reduce((sum, rate) => sum + Number(rate.RevenueAmount || 0), 0);

  }

  TotalLocalAmount(): number {
    return (this.housejobData?.costRevenueCharges || [])
      .reduce((sum, rate) => sum + Number(rate.RevenueLocalAmount || 0), 0);

  }

  getCostAmount(): number {
    return (this.housejobData?.costRevenueCharges || [])
      .reduce((sum, rate) => sum + Number(rate.CostRate || 0), 0);

  }

  CostAmount(): number {
    return (this.housejobData?.costRevenueCharges || [])
      .reduce((sum, rate) => sum + Number(rate.CostAmount || 0), 0);

  }

  getPkgTypeName(PackageTypeMasterSid: number) {

    if (!PackageTypeMasterSid || this.packageTypeList.length === 0) {
      return "";
    }
    return this.packageTypeList.find(pkg => pkg.UOMMasterSid === PackageTypeMasterSid)?.UOMName || "";
  }

  getContainerName(ContainerTypeMasterSid: number) {


    if (!ContainerTypeMasterSid || this.containerTypeList.length === 0) {
      return "";
    }

    return this.containerTypeList.find(con => con.ContainerTypeMasterSid === ContainerTypeMasterSid)?.ContainerName || ""
  }

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
        this.pdfMakeService.generateDeliveryOrderFromApi(
          this.housejobData,
          this.currentCompany,
          this.currentBranch,
          this.userData,
          logo,
          this.getDeliveryOrderPdfOptions(),
        );
        this.appSettingService.showSuccess('PDF downloaded successfully!');
        this.captureDeliveryOrderMilestone();
        const payload = {
        tableName: 'HouseJob',
        recordId: String(this.housejobData?.HouseJobSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          PDF: 'Delivery Order PDF Downloaded'
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
      } catch (error) {
        console.error('Delivery order PDF generation failed:', error);
        this.appSettingService.showError('Error generating PDF. Please try again.');
      } finally {
        this.spinner.hide();
      }
    }, 50);
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

//  getAmountInWords(): string {
//   const total = this.TotalLocalAmount();
//   if (!total || isNaN(total)) return '';

//   const wholePart = Math.floor(total);
//   const decimalPart = Math.round((total - wholePart) * 100);

//   const currencyCode = this.currentCurrencyCode
//     ? this.currentCurrencyCode.toUpperCase()
//     : '';

//   const amountInWords =
//     wholePart > 0
//       ? this.numberToWords.convert(wholePart)
//       : 'Zero';

//   // Traditional currency names
//   const currencyMap: any = {
//     AED: 'Dirhams',
//     INR: 'Rupees',
//     USD: 'Dollars',
//     EUR: 'Euros',
//     GBP: 'Pounds',
//     SAR: 'Riyals'
//   };

//   const currencyName = currencyMap[currencyCode] || currencyCode;

//   // ✅ EXACT REQUIRED OUTPUT
//   return `${currencyCode} ${amountInWords} only ${currencyName}`;
// }



getAmountInWords(): string {
  const total = this.TotalLocalAmount();
  if (!total) return '';

  const currencySid = this.currentCompany?.CurrencyMasterSid;
  return this.numberToWords.convert(total, currencySid);
}
  




// Helper method to get currency name from code
getCurrencyNameFromCode(currencyCode: string): string {
  const currencyNames: { [key: string]: string } = {
    'USD': 'Dollars',
    'AED': 'Dirhams',
    'INR': 'Rupees',
    'EUR': 'Euros',
    'GBP': 'Pounds',
    'SAR': 'Riyals',
    'QAR': 'Qatari Riyals',
    'OMR': 'Rials',
    'KWD': 'Kuwaiti Dinars'
  };
  return currencyNames[currencyCode?.toUpperCase()] || currencyCode || 'Units';
}

// Helper method to get sub-currency name from code
getSubCurrencyNameFromCode(currencyCode: string): string {
  const subCurrencyNames: { [key: string]: string } = {
    'USD': 'Cents',
    'AED': 'Fils',
    'INR': 'Paise',
    'EUR': 'Cents',
    'GBP': 'Pence',
    'SAR': 'Halalas',
    'QAR': 'Dirhams',
    'OMR': 'Baisa',
    'KWD': 'Fils'
  };
  return subCurrencyNames[currencyCode?.toUpperCase()] || 'Cents';
}


  async generatePDFBlob(): Promise<Blob | null> {
    try {
      const logo = this.pdfMakeService.getReportLogo();
      return await this.pdfMakeService.generateDeliveryOrderBlobFromApi(
        this.housejobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        this.getDeliveryOrderPdfOptions(),
      );
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

      const documentName = 'Delivery Order';
      const documentNo = this.housejobData?.Others?.[0]?.DONo || this.housejobData?.HBLNo || this.housejobData?.ShipmentNo || '';
      const hblNo = this.housejobData?.HBLNo || '';
      const documentDate = this.formatEmailDate(this.housejobData?.Others?.[0]?.DODate);
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
        documentNoLabel: 'DO No.',
        documentNo,
        documentDate,
        pol: this.housejobData?.POL || '',
        pod: this.housejobData?.POD || '',
        fpd: this.housejobData?.FPD || '',
        userName: this.userData?.userName || '',
        introLine: `Please find attached the ${documentName} for your reference.`,
        followupLine: 'Kindly review the attached details at your convenience.'
      });

      const file = new File([blob], `Delivery_Order_${documentNo || hblNo || 'Report'}.pdf`, { type: 'application/pdf' });
      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        EmailTo: toEmail,
        EmailCC: this.userData?.userEmail ? [this.userData.userEmail] : [],
        EmailBCC: [],
        Subject: emailContent.subject,
        Mailbody: emailContent.body,
        context: {
          documentName,
          documentNoLabel: 'DO No',
          menuName: documentName,
          documentNo,
          hblNo,
          date: documentDate,
          pol: this.housejobData?.POL || '',
          pod: this.housejobData?.POD || '',
          fpd: this.housejobData?.FPD || ''
        },
        attachmentRequired,
        ...(attachmentRequired ? { attachments: [file] } : {})
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.createEmailAuditLog(documentName);
        this.captureDeliveryOrderMilestone();
      });
    } catch (error) {
      console.error('Delivery Order email error:', error);
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

  private getDeliveryOrderPdfOptions() {
    return {
      masterJobContainers: this.masterJobContainers || [],
      selectedFCLLCL: this.selectedFCLLCL || '',
      currencyList: this.currencyList || [],
      uomList: this.uomList || [],
      containerTypeList: this.containerTypeList || [],
      packageTypeList: this.packageTypeList || [],
      terms: this.TandCList || [],
      amountInWords: this.getAmountInWords(),
      printSettings: this.companySettings.getPrintSettings(),
    };
  }
}
