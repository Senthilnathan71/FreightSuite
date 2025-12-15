import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';

@Component({
  selector: 'app-mawb',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './mawb.component.html',
  styleUrls: ['./mawb.component.scss']
})
export class MAWBComponent implements OnChanges {

  currentCompany: any;
  currentBranch: any;
  userData: any;
  currentDate = new Date();
  currentCountry: number;
  currentCurrency: number;
  currentCountryName: number;
  currentCurrencyCode: number;
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  @Input() masterAirWayData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL: any;
  @Input() agentList: any;
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;
  @Input() chargeList: any;
  @Input() packageTypeList: any[] = [];
  costRevenueCharges: any[] = [];
  freightCharges: any[] = [];
  otherCharges: any[] = [];
  companyCode:any;
  showPrintLogo: boolean = false;
    showPdfLogo: boolean = true;

  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.handleCharges()
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company')
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch')
    );

    if (this.currentCompany && this.userData?.userCompanyMaster) {
      const companyRecord = this.userData.userCompanyMaster.find(
        (c: any) => c.CompanyMasterSid === this.currentCompany.CompanyMasterSid
      );
      this.currentCompany = companyRecord?.companyMaster || this.currentCompany;
    }

    if (this.currentBranch && this.currentCompany?.userBranchMaster) {
      const branchRecord = this.currentCompany.userBranchMaster.find(
        (b: any) => b.BranchMasterSid === this.currentBranch.BranchMasterSid
      );
      this.currentBranch = branchRecord?.branchMaster || this.currentBranch;
    }

    // IDs
    this.currentCountry = Number(this.currentCompany?.CountryMasterSid);
    this.currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);

    // Convert ID → Name / Code
    this.currentCountryName = this.currentCompany?.countryMaster?.countryName;
    this.currentCurrencyCode = this.getCurrencyCodeById(this.currentCurrency);
    console.log("COUNTRY ID:", this.currentCountry);
    console.log("CURRENCY ID:", this.currentCurrency);
    console.log("COUNTRY NAME:", this.currentCountryName);
    console.log("CURRENCY CODE:", this.currentCurrencyCode);

    console.log("MAWB DATA:", this.masterAirWayData);
    console.log("House Job List:", this.masterAirWayData?.houseJob);

    if (this.masterAirWayData?.houseJob?.[0]) {
      console.log('Shipper Name:', this.masterAirWayData.houseJob[0].ShipperName);
      console.log('Shipper Address:', this.masterAirWayData.houseJob[0].ShipperAddress);
    }

    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    console.log(this.branchDetails, "BRANCH DETAILS");
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();

      this.companyCode = this.currentCompany?.companyCode;
   
    console.log(this.companyCode,"CompanyCode")
    
  }


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



  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private pdfService: PdfDownloadService,
    private spinner: NgxSpinnerService,
    private masterService: MasterService,
  ) { }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['masterAirWayData']) {
      console.log('Data changed', changes['masterAirWayData'])
      this.handleCharges();
    }
  }

  handleCharges() {
    this.costRevenueCharges = this.masterAirWayData.costRevenueCharges || [];
    const filteredCharges = this.costRevenueCharges.filter(cost => !!cost.ChargeMasterSid);
    console.log("Filtered Charges", filteredCharges);

    this.freightCharges = filteredCharges.filter(cr => {
      const chargeGroupName = cr.chargeMaster?.chargeGroup?.GroupName || '';
      return chargeGroupName === "Freight"
    })

    console.log("only freight charges", this.freightCharges);

    const freightChargeIds = this.freightCharges.map(c => c.ChargeMasterSid);
    console.log("Freight Charge Ids", freightChargeIds)

    this.otherCharges = filteredCharges.filter(c => {
      return !freightChargeIds.includes(c.ChargeMasterSid);
    })

    console.log("Other Charges", this.otherCharges)
  }

  getChargeCode(ChargeMasterSid: number) {
    const chargeCode = this.chargeList.find((c: any) => c.ChargeMasterSid === ChargeMasterSid);
    return chargeCode ? chargeCode.chargeCode : "";
  }


  modalClose() {
    this.activeModal.close();
  }


  getAgentName(AgentSid: number) {
    if (!AgentSid || this.agentList.length === 0) return '';
    const agent = this.agentList.find(
      (agent) => agent.CustomerMasterSid === AgentSid
    );
    return agent ? agent.CustomerName : '';
  }

  getCurrencyCodeById(id: number) {
    if (!id || !this.currencyList) return '';

    const currency = this.currencyList.find((c: any) => c.CurrencyMasterSid === id);
    return currency ? currency.currencyCode : '';
  }

  getFreightTotal() {
    if (!this.freightCharges || this.freightCharges.length === 0) return 0;

    return this.freightCharges.reduce((sum, c) => {
      return sum + ((Number(c.RevenueExchangeRate) || 0) * (Number(c.RevenueAmount) || 0));
    }, 0);
  }

  getTotalExchangeRate(): number {
    if (!this.otherCharges || this.otherCharges.length === 0) return 0;

    return this.otherCharges.reduce((sum, c) => {
      return sum + (Number(c.RevenueExchangeRate) || 0);
    }, 0);
  }

  getGrandTotal(): number {
    const exchangeTotal = this.getTotalExchangeRate() || 0;
    const freightAmount = Number(this.freightCharges?.[0]?.RevenueAmount) || 0;
    return exchangeTotal * freightAmount;
  }
  // In your component.ts

  getFreightTotals() {
    if (!this.freightCharges?.length) return { totalExchangeRate: 0, totalRevenueAmount: 0 };

    const totalExchangeRate = this.freightCharges.reduce(
      (sum, c) => sum + Number(c.RevenueExchangeRate || 0),
      0
    );

    const totalRevenueAmount = this.freightCharges.reduce(
      (sum, c) => sum + Number(c.RevenueAmount || 0),
      0
    );

    return { totalExchangeRate, totalRevenueAmount };
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
        <!DOCTYPE html>
        <html>
          <head>
            <title>MAWB - ${this.masterAirWayData?.MBLNo || 'Print'}</title>
            <style>${this.getPrintStyles()}</style>
          </head>
          <body onload="window.print();">
            ${printContents}
          </body>
        </html>
      `);
      popupWin.document.close();
    }
  }, 100);
}

  private getPrintStyles(): string {
    return `
      /* Base Reset */
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: Arial, sans-serif;
        font-size: 11px;
        line-height: 1.4;
        color: #000;
        background: #fff;
      }

      /* Page Container */
      .mawb-report *, .mawb-report *::before, .mawb-report *::after {
        box-sizing: border-box;
      }

      .mawb-page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: 5mm;
        background: #fff;
        color: #000;
        position: relative;
        page-break-after: always;
      }

      /* Header Row */
      .mawb-header-row {
        display: flex;
        width: 100%;
        margin-bottom: 0;
        align-items: stretch;
      }

      .mawb-left-col {
        width: 50%;
        font-size: 12px;
        display: flex;
        flex-direction: column;
      }

      .mawb-right-col {
        width: 50%;
        display: flex;
        flex-direction: column;
      }

      /* Party Sections */
      .mawb-party-section {
        display: flex;
        border: 1px solid #000;
        border-right: none;
      }

      .mawb-party-section.consignee {
        border-top: none;
      }

      .party-info {
        width: 65%;
        padding: 8px 10px;
      }

      .party-label {
        font-weight: bold;
        font-size: 10px;
      }

      .party-content {
        min-height: 50px;
        line-height: 1.3;
        padding: 4px 0;
      }

      .party-account {
        width: 35%;
        border-left: 1px solid #000;
        padding: 4px;
        height: 50px;
      }

      .account-label {
        font-size: 9px;
        font-weight: bold;
        padding: 2px;
      }

      .account-value {
        padding: 1px;
        text-align: center;
      }

      /* Carrier Agent */
      .mawb-carrier-agent {
        display: flex;
        flex-direction: column;
        border: 1px solid #000;
        border-top: none;
        border-right: none;
        padding: 8px 10px;
      }

      .carrier-label {
        font-weight: bold;
        white-space: nowrap;
      }

      .carrier-content {
        min-height: 50px;
      }

      /* Agent Info */
      .mawb-agent-info {
        display: flex;
        border: 1px solid #000;
        border-top: none;
        border-right: none;
      }

      .agent-cell {
        width: 50%;
        text-align: center;
        padding: 4px;
      }

      .agent-cell:last-child {
        border-left: 1px solid #000;
      }

      .agent-label {
        font-weight: bold;
        white-space: nowrap;
      }

      .agent-value {
        min-height: 20px;
      }

      /* Airport Departure */
      .mawb-airport-departure {
        text-align: center;
        border: 1px solid #000;
        border-top: none;
        border-right: none;
        padding: 8px;
      }

      .departure-label {
        font-weight: bold;
        white-space: nowrap;
      }

      .departure-value {
        min-height: 20px;
      }

      /* Company Info */
      .mawb-company-info {
        display: flex;
        flex-direction: column;
        border: 1px solid #000;
        padding: 10px;
      }

      .mawb-number {
        display: flex;
        padding-left: 10px;
      }

      .mawb-label {
        width: 70px;
        font-weight: bold;
        white-space: nowrap;
      }

      .company-branding {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 5px 0;
      }

      .company-logo {
        width: 50px;
        height: 50px;
        object-fit: contain;
      }

      .company-details {
        text-align: center;
        font-size: 12px;
      }

      .company-details h3 {
        margin: 0;
        font-weight: 700;
        font-size: 14px;
      }

      .company-details h4 {
        margin: 0;
        font-weight: 800;
        font-size: 13px;
      }

      .company-details p {
        margin: 2px 0;
        font-size: 11px;
      }

      /* Account Info */
      .mawb-account-info {
        display: flex;
        border: 1px solid #000;
        border-top: none;
        padding: 6px 10px;
      }

      .account-info-label {
        width: 150px;
        font-weight: bold;
        white-space: nowrap;
      }

      .account-info-value {
        min-height: 60px;
      }

      /* Reference Info */
      .mawb-reference-info {
        display: flex;
        border: 1px solid #000;
        border-top: none;
        padding: 8px;
      }

      .reference-cell {
        width: 50%;
        text-align: center;
      }

      .reference-cell:last-child {
        border-left: 1px solid #000;
      }

      .reference-label {
        font-weight: bold;
        white-space: nowrap;
      }

      .reference-value {
        min-height: 20px;
      }

      /* Routing Row */
      .mawb-routing-row {
        display: flex;
        width: 100%;
        margin-bottom: 0;
      }

      .mawb-routing-left {
        width: 50%;
        display: flex;
        border: 1px solid #000;
        border-top: none;
      }

      .mawb-routing-right {
        width: 50%;
        display: flex;
        border: 1px solid #000;
        border-top: none;
        border-left: none;
      }

      .routing-cell {
        width: 25%;
        text-align: center;
        padding: 4px;
        border-right: 1px solid #000;
      }

      .routing-cell:last-child {
        border-right: none;
      }

      .routing-label {
        font-weight: bold;
      }

      .routing-value {
        min-height: 16px;
      }

      /* Currency Cells */
      .currency-cell {
        width: 15%;
        text-align: center;
        border-right: 1px solid #000;
        padding: 2px;
      }

      .currency-label {
        font-weight: bold;
      }

      .wt-cell, .other-cell {
        width: 17%;
        text-align: center;
        border-right: 1px solid #000;
      }

      .wt-header {
        border-bottom: 1px solid #000;
        font-weight: bold;
        font-size: 10px;
      }

      .wt-content {
        display: flex;
      }

      .wt-sub {
        width: 50%;
        text-align: center;
        padding: 2px;
      }

      .wt-sub:last-child {
        border-left: 1px solid #000;
      }

      .wt-sub strong {
        font-size: 10px;
      }

      .declared-cell {
        width: 25.5%;
        text-align: center;
        border-right: 1px solid #000;
        padding: 2px;
      }

      .declared-cell:last-child {
        border-right: none;
      }

      .declared-label {
        font-weight: bold;
        font-size: 9px;
      }

      /* Flight Row */
      .mawb-flight-row {
        display: flex;
        width: 100%;
        margin-bottom: 0;
      }

      .flight-left, .flight-right {
        width: 50%;
        display: flex;
      }

      .flight-cell {
        width: 50%;
        border: 1px solid #000;
        border-top: none;
        text-align: center;
        padding: 4px;
      }

      .flight-cell:first-child {
        border-right: none;
      }

      .flight-label {
        font-weight: bold;
      }

      .flight-value {
        min-height: 20px;
      }

      /* Handling */
      .mawb-handling {
        border: 1px solid #000;
        border-top: none;
        padding: 4px 8px;
      }

      .handling-label {
        margin-bottom: 2px;
      }

      .handling-value {
        white-space: nowrap;
      }

      /* Data Table */
      .mawb-data-table {
        display: flex;
        flex-direction: column;
        width: 100%;
        margin-bottom: 0;
      }

      .table-header, .table-row, .table-totals {
        display: flex;
        width: 100%;
      }

      .table-header .table-cell {
        font-weight: bold;
        white-space: nowrap;
        border: 1px solid #000;
        border-top: none;
        text-align: center;
        padding: 2px;
      }

      .table-row .table-cell {
        border: 1px solid #000;
        border-top: none;
        text-align: center;
        padding: 4px;
        vertical-align: top;
      }

      .table-totals .table-cell {
        border: 1px solid #000;
        border-top: none;
        text-align: center;
        padding: 4px;
        font-weight: bold;
      }

      /* Column widths */
      .col-pieces { width: 9%; }
      .col-unit { width: 4%; border-left: none !important; }
      .col-gross { width: 12%; border-left: none !important; }
      .col-kglb { width: 8%; border-left: none !important; }
      .col-chargeable { width: 13%; border-left: none !important; }
      .col-rate { width: 10%; border-left: none !important; }
      .col-total { width: 12%; border-left: none !important; }
      .col-description { width: 32%; border-left: none !important; }

      .data-row-height {
        min-height: 150px;
      }

      .totals-row-height {
        height: 35px;
      }

      /* Charges Section */
      .mawb-charges-row {
        display: flex;
        width: 100%;
        margin-bottom: 0;
      }

      .charges-left {
        width: 50%;
        display: flex;
        flex-direction: column;
        border: 1px solid #000;
        border-top: none;
      }

      .charges-right {
        width: 50%;
        border: 1px solid #000;
        border-top: none;
        border-left: none;
        padding: 8px;
        font-size: 10px;
      }

      .charges-title {
        font-weight: bold;
      }

      .charge-row {
        display: flex;
        border-bottom: 1px solid #000;
      }

      .charge-row:last-child {
        border-bottom: none;
      }

      .charge-cell {
        width: 33.33%;
        text-align: center;
        padding: 4px 8px;
      }

      .charge-label {
        font-weight: bold;
        white-space: nowrap;
        text-align: center;
      }

      .charge-value {
        min-height: 20px;
        text-align: center;
      }

      .charge-full {
        width: 100%;
        padding: 4px 8px;
      }

      .center-divider {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        width: 1px;
        background-color: #000;
        transform: translateX(-50%);
      }

      /* Shipper Certificate */
      .shipper-certificate {
        padding: 8px;
        font-size: 10px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
      }

      .certificate-text {
        font-weight: bold;
      }

      .signature-block {
        text-align: center;
        margin-top: 15px;
      }

      .agent-name {
        margin-bottom: 0;
      }

      .signature-label {
        font-weight: bold;
      }

      /* Totals Row */
      .mawb-totals-row {
        display: flex;
        width: 100%;
        margin-bottom: 0;
      }

      .totals-left {
        width: 50%;
        display: flex;
        flex-direction: column;
        border-right: 1px solid #000;
      }

      .totals-right {
        width: 50%;
        border: 1px solid #000;
        border-top: none;
        border-left: none;
      }

      .total-row {
        display: flex;
        border: 1px solid #000;
        border-top: none;
        border-right: none;
      }

      .total-cell {
        width: 33.33%;
        text-align: center;
        padding: 4px 8px;
      }

      .total-label {
        font-weight: bold;
      }

      .total-value {
        min-height: 16px;
      }

      .total-divider {
        width: 33.33%;
        position: relative;
        min-height: 30px;
      }

      .center-line {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        width: 1px;
        background-color: #000;
        transform: translateX(-50%);
      }

      /* Execution Info */
      .execution-info {
        padding: 8px;
        padding-top: 25px;
      }

      .execution-row {
        display: flex;
        justify-content: space-between;
      }

      .execution-cell {
        text-align: center;
      }

      .execution-value {
        margin-bottom: 2px;
      }

      .execution-label {
        font-weight: bold;
        font-size: 10px;
      }

      /* Footer */
      .mawb-footer {
        position: absolute;
        bottom: 2mm;
        left: 5mm;
        right: 5mm;
        font-size: 9px;
        display: flex;
        justify-content: space-between;
      }

      /* Print Media */
      @media print {
        @page {
          size: A4 portrait;
          margin: 0;
        }

        body {
          margin: 0;
          padding: 0;
        }

        .mawb-page {
          width: 100%;
          margin: 0;
          padding: 5mm;
        }

        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }

      /* Utility classes */
      .d-flex { display: flex; }
      .justify-content-between { justify-content: space-between; }
      .fw-bold { font-weight: bold; }
    `;
  }


   async downloadPDF() {
  this.showPrintLogo = false;
  this.showPdfLogo = true;

  setTimeout(async () => {
    this.spinner.show();
   try {
       const BankPaymentNo = this.masterAirWayData?.MBLNo || '';
      await this.pdfService.downloadBalancedPDF(
        'printContent',
        `MAWB_${BankPaymentNo}`,
        () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
        (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
      );
    } finally {
      this.spinner.hide();
    }
  }, 50);
}


 


}
