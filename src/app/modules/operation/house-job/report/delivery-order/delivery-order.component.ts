import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { NgxSpinnerService } from 'ngx-spinner';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';

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
  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.companyCurrency = this.companySettings.getCurrencySettings();
    this.currentCurrencyCode = this.companyCurrency.code;
    console.log("CURRENT CURRENCY CODE", this.currentCurrencyCode);
    console.log("CURRENT CURRENCY", this.companyCurrency);
    console.log(this.branchDetails, "BRANCH DETAILS");
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
        console.log("City API response:", response);

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
          console.log("Final City Name:", this.currentBranchCityName);
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
        console.log('Currency List:', this.currency);
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
    private pdfService: PdfDownloadService,
    private spinner: NgxSpinnerService,
    private numberToWords: NumberToWordsService,
    private companySettings: CompanySettingsManagerService,
    public logoService : LogoService
  ) { }

  getUnitCode(ChargeUomSid: number) {
    console.log("GETUNITCODE", {
      currentUOMId: ChargeUomSid,
      uomList: this.uomList
    })
    if (!ChargeUomSid || !this.uomList || this.uomList.length === 0) {
      return '';
    }
    const uom = this.uomList.find(item => item.UOMMasterSid === ChargeUomSid);
    console.log(uom);
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
    console.log("getPkgMame", {
      PackageTypeMasterSid,
      pkgList: this.packageTypeList
    })
    if (!PackageTypeMasterSid || this.packageTypeList.length === 0) {
      return "";
    }
    return this.packageTypeList.find(pkg => pkg.UOMMasterSid === PackageTypeMasterSid)?.UOMName || "";
  }

  getContainerName(ContainerTypeMasterSid: number) {
    console.log(ContainerTypeMasterSid);
    if (!ContainerTypeMasterSid || this.containerTypeList.length === 0) {
      return "";
    }
    console.log("HERE", this.containerTypeList)
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
        const DONo = this.housejobData?.ShipmentNo || 'Receipt';


        await this.pdfService.downloadBalancedPDF(
          'printContent',
          `Delivery_Order_${DONo}`,
          () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
          (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
        );
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
    const printContent = document.getElementById('printContent');
    if (!printContent) {
      return null;
    }

    try {
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      return null;
    }



  }
}
