import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { OperationService } from '../../../operation.service';
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
    private operationService: OperationService
  ) { }


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
      amountInWords: this.getAmountInWords()
    };
  }

}
