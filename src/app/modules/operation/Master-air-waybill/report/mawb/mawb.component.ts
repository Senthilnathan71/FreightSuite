import { CommonModule, formatDate } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { GlobalDateFormatService } from 'src/app/core/services/global-date-format.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { OperationService } from '../../../operation.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';

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
  currentUserCode: any;
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
  @Input() portList: any[] = [];
  @Input() selectedReport: 'MAWB' | 'MAWBDraft' = 'MAWB'; 
  costRevenueCharges: any[] = [];
  freightCharges: any[] = [];
  otherCharges: any[] = [];
  companyCode: any;
  bankDetails: any;
  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;
  dueCarrierCharges: any[] = [];
  dueAgentCharges: any[] = [];
  otherDueCarrierCharges: any[] = []; 
  otherDueAgentCharges: any[] = [];
  freightPrepaidCharges: any[] = [];
  freightCollectCharges: any[] = [];
  otherPrepaidCharges: any[] = [];  
  otherCollectCharges: any[] = [];
  otherCharges1: any[] = [];
  private pdfDepsPromise?: Promise<{ pdfMake: any }>;
  private mawbImageBase64: string | null = null;

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

    this.currentUserCode = this.userData?.userCode?.trim();
    console.log(this.currentUserCode, "User Code")
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

    console.log(this.companyCode, "CompanyCode")
    this.getBankDetails();
    this.preloadPdfDependencies();
    this.preloadMawbImage();
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
    private spinner: NgxSpinnerService,
    private masterService: MasterService,
    private operationService: OperationService,
    public logoService: LogoService,
    private globalDateService: GlobalDateFormatService,
    public mps: MenuPermissionService
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

    this.freightCharges = filteredCharges.filter(cr => this.isWeightCharge(cr));

    console.log("only freight charges", this.freightCharges);
     this.otherCharges = filteredCharges.filter(c => !this.isWeightCharge(c));
    this.otherCharges1 = filteredCharges.filter(c => {
      const chargeGroupName = String(c.chargeMaster?.chargeGroup?.GroupName || '').trim().toLowerCase();
      return chargeGroupName === 'other';
    });

    console.log("Other Charges", this.otherCharges)
    this.dueCarrierCharges = filteredCharges.filter(c => this.isCarrierCharge(c));
    this.dueAgentCharges = filteredCharges.filter(c => !this.isCarrierCharge(c));
    this.otherDueCarrierCharges = this.otherCharges.filter(c => this.isCarrierCharge(c));
    this.otherDueAgentCharges = this.otherCharges.filter(c => !this.isCarrierCharge(c));

    this.freightPrepaidCharges = this.freightCharges.filter(c => this.isPrepaidCharge(c));
    this.freightCollectCharges = this.freightCharges.filter(c => this.isCollectCharge(c));

    this.otherPrepaidCharges = this.otherCharges.filter(c => this.isPrepaidCharge(c));
    this.otherCollectCharges = this.otherCharges.filter(c => this.isCollectCharge(c));
  }

  private isCarrierCharge(charge: any): boolean {
    const groupName = String(charge?.chargeMaster?.chargeGroup?.GroupName || '').toLowerCase();
    const chargeName = String(charge?.chargeMaster?.ChargeName || charge?.chargeMaster?.chargeName || '').toLowerCase();
    const chargeCode = String(charge?.chargeMaster?.ChargeCode || charge?.chargeMaster?.chargeCode || '').toLowerCase();
 
    return groupName.includes('freight') ||
      groupName.includes('airline') ||
      chargeName.includes('surcharge') ||
      chargeName.includes('freight') ||
      chargeCode.includes('freight');
  }

  private isWeightCharge(charge: any): boolean {
    const groupName = String(charge?.chargeMaster?.chargeGroup?.GroupName || '').toLowerCase();
    const chargeName = String(charge?.chargeMaster?.ChargeName || charge?.chargeMaster?.chargeName || charge?.ChargeDescription || '').toLowerCase();
    const chargeCode = String(charge?.chargeMaster?.ChargeCode || charge?.chargeMaster?.chargeCode || '').toLowerCase();
 
    // Weight charge bucket should contain freight line items only.
    return groupName.includes('freight') &&
      (chargeName.includes('freight') || chargeCode.includes('frt'));
  }
  getBankDetails() {
    console.log('DEBUG - getBankDetails');

    const payload = {
      CompanyMasterSid:this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      CurrencyMasterSid:this.currentCompany?.CurrencyMasterSid,
    }
    this.operationService.getBankDetails(payload).subscribe({
      next: (resp: any) => {
        console.log('Bank Details Response:', resp);
        if (resp?.status && resp.data) {
          this.bankDetails = resp.data;
        } else {
          this.bankDetails = null;
        }
      },
      error: (err) => {
        console.error('Error fetching bank details', err);
        this.bankDetails = null;
      }
    });

  }

  getChargeCode(ChargeMasterSid: number) {
    const chargeCode = this.chargeList.find((c: any) => c.ChargeMasterSid === ChargeMasterSid);
    return chargeCode ? chargeCode.chargeCode : "";
  }

  getFormattedMBLNo(): string {
  const value = this.masterAirWayData?.MBLNo?.toString() || '';
  return value ? value.substring(0, 3) + ' - ' + value.substring(3) : '';
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

  getPortDisplay(code: string): string {
    if (!code) return '';
    const port = this.portList?.find((p: any) => p.PortCode === code);
    return port?.PortName || code;
  }

  getPortCodeByName(value: string): string {
  if (!value) return '';

  const normalizedValue = String(value).trim().toLowerCase();

  const port = this.portList?.find((p: any) =>
    String(p.PortName || '').trim().toLowerCase() === normalizedValue
  );

  return port?.PortCode || value;
}


  private getActiveConnections(): any[] {
    return (this.masterAirWayData?.masterJobConnection || []).filter(
      (connection: any) => !connection?.Status || connection.Status === 'A'
    );
  }

  getRoutingTo(index: number): string {
    const connection = this.getActiveConnections()[index];
    return connection?.POD || '';
  }

  getRoutingBy(index: number): string {
    const connection = this.getActiveConnections()[index];
    if (connection?.VesselName) {
      return connection.VesselName;
    }

    if (index === 0) {
      return this.masterAirWayData?.voyages?.[0]?.CarrierName || '';
    }

    return '';
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

  prepaidTotal(): number {
    return (this.freightCharges || [])
      .filter(c => this.isPrepaidCharge(c))
      .reduce((sum, c) => sum + this.getChargeValue(c), 0);
  }

  collectTotal(): number {
    return (this.freightCharges || [])
      .filter(c => this.isCollectCharge(c))
      .reduce((sum, c) => sum + this.getChargeValue(c), 0);
  }

  otherChargesTotal(): number {
    return (this.otherCharges || []).reduce((sum, c) => sum + (Number(c?.RevenueAmount) || 0), 0);
  }

  otherChargesPrepaidTotal(): number {
    return (this.otherCharges || [])
      .filter(c => c?.RevenuePrepaidCollect === 'Prepaid')
      .reduce((sum, c) => sum + (Number(c?.RevenueAmount) || 0), 0);
  }

  otherChargesCollectTotal(): number {
    return (this.otherCharges || [])
      .filter(c => c?.RevenuePrepaidCollect === 'Collect')
      .reduce((sum, c) => sum + (Number(c?.RevenueAmount) || 0), 0);
  }

  totalPrepaidCharges(): number {
    return this.prepaidTotal() + this.otherChargesPrepaidTotal();
  }

  totalCollectCharges(): number {
    return this.collectTotal() + this.otherChargesCollectTotal();
  }

    private getPrepaidCollect(charge: any): string {
    const rowTerm = String(charge?.RevenuePrepaidCollect ?? charge?.CostPrepaidCollect ?? '').trim().toLowerCase();
    if (rowTerm === 'prepaid' || rowTerm === 'pp') {
      return 'prepaid';
    }
    if (rowTerm === 'collect' || rowTerm === 'cc') {
      return 'collect';
    }
 
    // Fallback to master-level term when row-level PP/CC is missing.
    const masterTerm = String(this.masterAirWayData?.FreightPPCC ?? '').trim().toLowerCase();
    if (masterTerm === 'prepaid' || masterTerm === 'pp') {
      return 'prepaid';
    }
    if (masterTerm === 'collect' || masterTerm === 'cc') {
      return 'collect';
    }
 
    return '';
  }
 
  private isPrepaidCharge(charge: any): boolean {
    return this.getPrepaidCollect(charge) === 'prepaid';
  }
 
  private isCollectCharge(charge: any): boolean {
    return this.getPrepaidCollect(charge) === 'collect';
  }

    private getChargeValue(charge: any): number {
    return Number(charge?.RevenueAmount ?? charge?.RevenueExchangeRate ?? 0) || 0;
  }


  // total others charges due at Agent

    getOtherDueAgentPrepaidTotal(): number {
    if (!this.otherDueAgentCharges?.length) return 0;
    return this.otherDueAgentCharges
      .filter(c => this.isPrepaidCharge(c))
      .reduce((sum, c) => sum + this.getChargeValue(c), 0);
  }

    getOtherDueAgentCollectTotal(): number {
    if (!this.otherDueAgentCharges?.length) return 0;
    return this.otherDueAgentCharges
      .filter(c => this.isCollectCharge(c))
      .reduce((sum, c) => sum + this.getChargeValue(c), 0);
  }

    getOtherDueCarrierPrepaidTotal(): number {
    if (!this.otherDueCarrierCharges?.length) return 0;
    return this.otherDueCarrierCharges
      .filter(c => this.isPrepaidCharge(c))
      .reduce((sum, c) => sum + this.getChargeValue(c), 0);
  }
 
  getOtherDueCarrierCollectTotal(): number {
    if (!this.otherDueCarrierCharges?.length) return 0;
    return this.otherDueCarrierCharges
      .filter(c => this.isCollectCharge(c))
      .reduce((sum, c) => sum + this.getChargeValue(c), 0);
  }

   
  getFreightPrepaidTotal(): number {
    if (!this.freightPrepaidCharges?.length) return 0;
    return this.freightPrepaidCharges.reduce((sum, c) => sum + this.getChargeValue(c), 0);
  }
 
  getFreightCollectTotal(): number {
    if (!this.freightCollectCharges?.length) return 0;
    return this.freightCollectCharges.reduce((sum, c) => sum + this.getChargeValue(c), 0);
  }
 
getOtherPrepaidTotal(): number {
    if (!this.otherPrepaidCharges?.length) return 0;
    return this.otherPrepaidCharges.reduce((sum, c) => sum + this.getChargeValue(c), 0);
  }
 
  getOtherCollectTotal(): number {
    if (!this.otherCollectCharges?.length) return 0;
    return this.otherCollectCharges.reduce((sum, c) => sum + this.getChargeValue(c), 0);
  }
 
 
   getTotalPrepaidAmount(): number {
    return this.prepaidTotal() + this.getOtherDueAgentPrepaidTotal() + this.getOtherDueCarrierPrepaidTotal();
  }
 
  getTotalCollectAmount(): number {
    return this.collectTotal() + this.getOtherDueAgentCollectTotal() + this.getOtherDueCarrierCollectTotal();
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
        flex: 1;
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

    this.spinner.show();
    try {
      const BankPaymentNo = this.masterAirWayData?.MBLNo || '';
      await this.downloadPdfWithPdfMake(`MAWB_${BankPaymentNo}`);
      this.appSettingService.showSuccess('PDF downloaded successfully!');
      const payload = {
        tableName: 'MasterJob',
        recordId: String(this.masterAirWayData?.MasterJobSid),
        operation: 'EMAIL',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          PDF: 'MAWB Draft PDF Downloaded'
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      console.error('MAWB pdfmake export failed:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }

  private async downloadPdfWithPdfMake(filename: string): Promise<void> {
    const { pdfMake } = await this.getPdfDependencies();

    const page1Content = this.buildMawbPdfContent();
    const content: any[] = [...page1Content];

    const hasLegalPage = this.selectedReport === 'MAWB';
   
      content.push({ text: '', pageBreak: 'after' });
      const legalContent = this.getLegalTextContent();
      content.push(...legalContent);
    

    const pageWidthPt = 595.28;
    const pageHeightPt = 841.89;

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [0, 0, 0, 0] as [number, number, number, number],
      background: (currentPage: number) => {
        if (currentPage === 1 && this.mawbImageBase64) {
          return {
            image: this.mawbImageBase64,
            width: pageWidthPt * 1.08,
            height: pageHeightPt * 1.06,
            absolutePosition: { x: 0, y: 0 }
          };
        }
        return null;
      },
      content,
      styles: {
        legalTitle: {
          fontSize: 12,
          bold: true
        }
      },
      defaultStyle: {
        fontSize: 8
      }
    };

    await new Promise<void>((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition).download(`${filename}.pdf`, () => resolve());
      } catch (err) {
        reject(err);
      }
    });
  }

  private preloadPdfDependencies(): void {
    if (!this.pdfDepsPromise) {
      this.pdfDepsPromise = this.getPdfDependencies();
    }
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

  private preloadMawbImage(): void {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        this.mawbImageBase64 = canvas.toDataURL('image/png');
      }
    };
    img.src = 'assets/images/MAWB.png';
  }

  private buildMawbPdfContent(): any[] {
    // mm → pt conversion: CSS container is 280mm x 401mm, PDF is A4 (595.28pt x 841.89pt)
    // Scale factor = min(595.28/(280*2.8346), 841.89/(401*2.8346)) ≈ 0.741
    // So 1mm CSS = 2.8346 * 0.741 ≈ 2.10 pt
    const mm = (val: number) => val * 2.10;

    const data = this.masterAirWayData;
    const hj = data?.houseJob?.[0];
    const others = hj?.Others?.[0];
    const agg = data?.aggregatedTotals;
    const voyage = data?.voyages?.[0];
    const freightTotals = this.getFreightTotals();
    const freightPrepaidTotal = this.getFreightPrepaidTotal();
    const freightCollectTotal = this.getFreightCollectTotal();
    const otherPrepaidTotal = this.getOtherPrepaidTotal();
    const otherCollectTotal = this.getOtherCollectTotal();
    const totalPrepaidAmount = this.getTotalPrepaidAmount();
    const totalCollectAmount = this.getTotalCollectAmount();

      const fmtNum = (val: any, dec: number = 2): string => {
      const n = Number(val);
      if (isNaN(n) || val === null || val === undefined) return '';
      return n.toLocaleString('en-US', {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec
      });
    };


    const fmtDate = (val: any): string => {
      if (!val) return '';
      return this.globalDateService.formatDate(val);
    };

    const fmtDateTime = (val: any): string => {
  if (!val) return '';
  return formatDate(val, 'dd-MMM-yyyy HH:mm', 'en-US');
};




      const otherChargesText = this.otherCharges1.map(c => {
        return `${this.getChargeCode(c.ChargeMasterSid)} ${Number(c.RevenueAmount).toFixed(2)}`;
      }).join('  ');

    const goodsDesc = [data?.CommodityDescription, data?.MarksandNumber]
      .filter(Boolean).join('\n');
    const wrapField = (topMm: number, leftMm: number, text: string, widthMm: number, opts: any = {}): any => {
      if (!text && text !== '0') return null;
      return {
        absolutePosition: { x: mm(leftMm), y: mm(topMm) },
        columns: [
          {
            width: mm(widthMm),
            text,
            fontSize: opts.fontSize || 9,
            bold: opts.bold ?? true,
            lineHeight: opts.lineHeight || 1.1,
            noWrap: false
          }
        ],
        columnGap: 0
      };
    };

    // Helper to create a positioned text field
    const field = (topMm: number, leftMm: number, text: string, opts: any = {}): any => {
      if (!text && text !== '0') return null;
      return {
        text: text,
        fontSize: opts.fontSize || 9,
        bold: true,
        absolutePosition: { x: mm(leftMm), y: mm(topMm) },
        ...(opts.width ? { width: mm(opts.width) } : {}),
        ...(opts.alignment ? { alignment: opts.alignment } : {}),
         noWrap: false  
      };
    };

    const fields = [
      // Header — MAWB series & numbers
      field(12, 30, data?.POL || '', { fontSize: 9 }),
      field(12, 13, data?.MBLNo?.toString().substring(0, 3) || '', { fontSize: 8 }),
      field(12, 43, data?.MBLNo?.toString().substring(3) || '', { fontSize: 8 }),
      field(12, 220, this.getFormattedMBLNo(), { fontSize: 14}),

      // Shipper
      wrapField(27, 12, hj?.ShipperName || '', 123),
      wrapField(32, 12, hj?.ShipperAddress || '', 123),

      // Consignee
      wrapField(63, 12, hj?.ConsigneeName || '', 123),
      wrapField(68, 12, hj?.ConsigneeAddress || '', 123),

      // Agent
      field(100, 12, this.getAgentName(data?.DestinationAgent)),
      field(105, 12, data?.DestinationAgentAddress),
      // field(119, 12, this.currentUserCode || ''),

      // Airport departure
      field(131, -140, this.getPortDisplay(data?.POL) || '', { width: 80, alignment: 'center' }),

      // Right column — account & reference
      field(100, 148, `FREIGHT ${data?.FreightPPCC || ''}`),
      field(131, 42, others?.CustomerRefNo || '', { width: 40, alignment: 'center' }),

      // Routing
      field(147, -256, data?.POD || '', { width: 15, alignment: 'center' }),
      field(147, -190, voyage?.CarrierName || '', { width: 60, alignment: 'center' }),
      field(147, -90, this.getPortCodeByName(data?.masterJobConnection?.[0]?.POD) || '', { width: 15, alignment: 'center' }),
      field(147, -68, data?.masterJobConnection?.[0]?.VesselName || '', { width: 15, alignment: 'center' }),
      field(147, -40, this.getPortCodeByName(data?.masterJobConnection?.[1]?.POD) || '', { width: 15, alignment: 'center' }),
      field(147, -10, data?.masterJobConnection?.[1]?.VesselName || '', { width: 15, alignment: 'center' }),

      // Currency & charges
      field(147, 20, this.getCurrencyCodeById(this.currentCurrency)?.toString() || '', { width: 15, alignment: 'center' }),
      field(
        147,
        48,
        totalPrepaidAmount > 0 && totalCollectAmount > 0
          ? 'PP/CC'
          : (totalPrepaidAmount > 0 ? 'PP' : (totalCollectAmount > 0 ? 'CC' : '')),
        { width: 15, alignment: 'center', fontSize:7 }
      ),

      // PP/CC checkboxes
      field(147, 67, freightPrepaidTotal > 0 ? 'X' : '', { width: 10, alignment: 'center' }),
      field(147, 82, freightCollectTotal > 0 ? 'X' : '', { width: 10, alignment: 'center' }),
      field(147, 98, otherPrepaidTotal > 0 ? 'X' : '', { width: 10, alignment: 'center' }),
      field(147, 113, otherCollectTotal > 0 ? 'X' : '', { width: 10, alignment: 'center' }),

      // Declared values
      field(147, 160, others?.DeclaredValueOfCarriage?.toString() || '', { width: 30, alignment: 'center' }),
      field(147, 240, others?.DeclaredValueOfCustoms?.toString() || '', { width: 30, alignment: 'center' }),

      // Flight row
      field(159, -210, this.getPortDisplay(data?.FPD) || '', { width: 40, alignment: 'center' }),
      field(159, -110, voyage?.VesselName || '', { fontSize: 8, width: 40, alignment: 'center' }),
      field(159, -30, fmtDate(voyage?.ETA), { fontSize: 8, width: 40, alignment: 'center' }),
      field(159, 40, fmtNum(others?.ValueForInsurance), { width: 40, alignment: 'center' }),

      // Handling information
      wrapField(173, 9, others?.HandlingInformation || '' , 140, { fontSize: 8 }),
      field(170, 150, 'Notify', { width: 50, fontSize: 8, bold: true }),
      field(175, 150, hj?.Notify || '', { width: 50, fontSize: 8 }),
      wrapField(180, 150, hj?.NotifyAddress || '', 100, { fontSize: 8 }),
   
      // Package details
      field(206, -250, agg?.NoOfPkg?.toString() || '', { width: 20, alignment: 'center' }),
      field(206, -210, fmtNum(agg?.GrossWeight, 3), { width: 25, alignment: 'center' }),
      field(206, -72, fmtNum(agg?.ChargeableWeight, 3), { width: 30, alignment: 'center' }),
      field(206, -15, fmtNum(freightTotals.totalExchangeRate), { width: 25, alignment: 'center' }),
      field(206, 50, fmtNum(freightTotals.totalRevenueAmount), { width: 25, alignment: 'center' }),
      wrapField(206, 185, goodsDesc,  95 , {fontSize: 8}),
      wrapField(220, 10, hj?.GeneralNote || '', 70, { fontSize: 8 }),

      // Totals row
      field(275,-250, agg?.NoOfPkg?.toString() || '', { width: 20, alignment: 'center' }),
      field(275, -210, fmtNum(agg?.GrossWeight, 3), { width: 20, alignment: 'center' }),
      // field(275,  -70, fmtNum(agg?.ChargeableWeight, 3), { width: 30, alignment: 'center' }),
      // field(275, -15, fmtNum(freightTotals.totalExchangeRate), { width: 25, alignment: 'center' }),
      field(275, 50, fmtNum(freightTotals.totalRevenueAmount), { width: 25, alignment: 'center' }),

      // Charges section
      field(290, -230, fmtNum(this.prepaidTotal()), { width: 35, alignment: 'center' }),
      field(290, -120, fmtNum(this.collectTotal()), { width: 35, alignment: 'center' }),
      field(288, 120, otherChargesText, { width: 140 }),
      field(301, -230, fmtNum(others?.ValuationCharge), { width: 35, alignment: 'center' }),
      field(326, -230, fmtNum(this.getOtherDueAgentPrepaidTotal()), { width: 35, alignment: 'center' }),
      field(326, -120, fmtNum(this.getOtherDueAgentCollectTotal()), { width: 35, alignment: 'center' }),  
      field(338, -230, fmtNum(this.getOtherDueCarrierPrepaidTotal()), { width: 35, alignment: 'center' }),
      field(338, -120, fmtNum(this.getOtherDueCarrierCollectTotal()), { width: 35, alignment: 'center' }),

      // Agent certification
      field(345, 110, data?.houseJob?.[0]?.ShipperName, { width: 80, alignment: 'center' }),

      // Totals
      // field(363, 9, fmtNum(this.getGrandTotal()), { width: 35, alignment: 'center' }),
      field(363, -230, fmtNum(this.getTotalPrepaidAmount()), { width: 35, alignment: 'center' }),
      field(363, -120, fmtNum(this.getTotalCollectAmount()), { width: 35, alignment: 'center' }),
      field(375, -230, fmtNum(this.getTotalExchangeRate()), { width: 35, alignment: 'center' }),

      // Execution info
      field(370, -17, fmtDateTime(data?.MBLDate), { width: 40, alignment: 'center' }),
      field(370, 84, this.currentCountryName?.toString() || '', { alignment: 'center' }),
      field(370, 200, this.getAgentName(data?.DestinationAgent), { width: 60, alignment: 'center' }),

      // Bottom MAWB number
      field(386, 204, this.getFormattedMBLNo(), { fontSize: 14 }),
    ];

    return fields.filter(f => f !== null);
  }

  private getLegalTextContent(): any[] {
    const leftColumn = [
      { text: '1. In this contract and the Notices appearing hereon:\nCARRIER includes the air carrier issuing this air waybill and all carriers that carry or undertake to carry the cargo or perform any other services related to such carriage\nSPECIAL DRAWING RIGHT (SDR) is a Special Drawing Right as defined by the International Monetary Fund.\nWARSAW CONVENTION means whichever of the following instruments is applicable to the contract of carriage:\nthe Convention for the Unification of Certain Rules Relating to International Carriage by Air, signed at Warsaw, 12 October 1929;\nthat Convention as amended at The Hague on 28 September 1955;\nthat Convention as amended at The Hague 1955 and by Montreal Protocol No. 1, 2, or 4 (1975) as the case may be.\nMONTREAL CONVENTION means the Convention for the Unification of Certain Rules.', margin: [0, 0, 0, 4] },
      { text: '2.1 Carriage is subject to the rules relating to liability established by the Warsaw Convention or the Montreal Convention unless such carriage is not "international carriage" as defined by the applicable Conventions.', margin: [0, 0, 0, 4] },
      { text: '2.2 To the extent not in conflict with the foregoing, carriage and other related services performed by each Carrier are subject to:', margin: [0, 0, 0, 4] },
      { text: '2.2.1 applicable laws and government regulations;', margin: [0, 0, 0, 4] },
      { text: '2.2.2 provisions contained in the air waybill, Carrier\'s conditions of carriage and related rules, regulations, and timetables (but not the times of departure and arrival stated therein) and applicable tariffs of such Carrier, which are made part hereof, and which may be inspected at any airports or other cargo sales offices from which it operates regular services. When carriage is to/from the USA, the shipper and the consignee are entitled, upon request, to receive a free copy of the Carrier\'s conditions of carriage. The Carrier\'s conditions of carriage include, but are not limited to:', margin: [0, 0, 0, 4] },
      { text: '2.2.2.1 limits on the Carrier\'s liability for loss, damage or delay of goods, including fragile or perishable goods;', margin: [0, 0, 0, 4] },
      { text: '2.2.2.2 claims restrictions, including time periods within which shippers or consignees must file a claim or bring an action against the Carrier for its acts or omissions, or those of its agents;', margin: [0, 0, 0, 4] },
      { text: '2.2.2.3 rights, if any, of the Carrier to change the terms of the contract', margin: [0, 0, 0, 4] },
      { text: '2.2.2.4 rules about Carrier\'s right to refuse to carry', margin: [0, 0, 0, 4] },
      { text: '2.2.2.5 rights of the Carrier and limitations concerning delay or failure to perform service, including schedule changes, substitution of alternate Carrier or aircraft and rerouting.', margin: [0, 0, 0, 4] },
      { text: '3 The agreed stopping places (which may be altered by Carrier in case of necessity) are those places, except the place of departure and place of destination, set forth on the face hereof or shown in Carrier\'s timetables as scheduled stopping places for the route. Carriage to be performed hereunder by several successive Carriers is regarded as a single operation.', margin: [0, 0, 0, 4] },
      { text: '4 For carriage to which the Montreal Convention does not apply, Carrier\'s liability limitation for cargo lost, damaged or delayed shall be 19 SDRs per kilogram unless a greater per kilogram monetary limit is provided in any applicable Convention or in Carrier\'s tariffs or general conditions of carriage.', margin: [0, 0, 0, 4] },
      { text: '5 5.1 Except when the Carrier has extended credit to the consignee without the written consent of the shipper, the shipper guarantees payment of all charges for the carriage due in accordance with Carrier\'s tariff, conditions of carriage and related regulations, applicable laws (including national laws implementing the Warsaw Convention and the Montreal Convention), government regulations, orders and requirements', margin: [0, 0, 0, 4] },
      { text: '5.2 When no part of the consignment is delivered, a claim with respect to such consignment will be considered even though transportation charges thereon are unpaid.', margin: [0, 0, 0, 4] },
      { text: '6 6.1 For cargo accepted for carriage, the Warsaw Convention and the Montreal Convention permit shipper to increase the limitation of liability by declaring a higher value for carriage and paying a supplemental charge if required.', margin: [0, 0, 0, 4] },
    ];

    const rightColumn = [
      { text: '.2 In carriage to which neither the Warsaw Convention nor the Montreal Convention applies Carrier shall, in accordance with the procedures set forth in its general conditions of carriage and applicable tariffs, permit shipper to increase the limitation of liability by declaring a higher value for carriage and paying a supplemental charge if so required', margin: [0, 0, 0, 4] },
      { text: '7 7.1 In cases of loss of, damage or delay to part of the cargo, the weight to be taken into account in determining Carrier\'s limit of liability shall be only the weight of the package or packages concerned.', margin: [0, 0, 0, 4] },
      { text: '7.2 Notwithstanding any other provisions, for foreign air transportation as defined by the U.S. Transportation Code:', margin: [0, 0, 0, 4] },
      { text: '7.2.1 in the case of loss of, damage or delay to a shipment, the weight to be used in determining Carrier\'s limit of liability shall be the weight which is used to determine the charge for carriage of such shipment; and', margin: [0, 0, 0, 4] },
      { text: '7.2.2 in the case of loss of, damage or delay to a part of a shipment, the shipment weight in 7.2.1 shall be prorated to the packages covered by the same air waybill whose values is affected by the loss, damage or delay. The weight applicable in the case of loss or damage to one or more articles in a package shall be the weight of the entire package.', margin: [0, 0, 0, 4] },
      { text: '8 Any exclusion or limitation of liability applicable to Carrier shall apply to Carrier\'s agents, employees, and representatives and to any person whose aircraft or equipment is used by Carrier for carriage and such person\'s agents, employees and representatives', margin: [0, 0, 0, 4] },
      { text: '9 Carrier undertakes to complete the carriage with reasonable dispatch. Where permitted by applicable laws, tariffs and government regulations, Carrier may use alternative carriers, aircraft or modes of transport without notice but with due regard to interests of the shipper. Carrier is authorised by the shipper to select the routing and all intermediate stopping places that it deems appropriate or to change or deviate from the routing shown on the face hereof', margin: [0, 0, 0, 4] },
      { text: '10 Receipt by the person entitled to delivery of the cargo without complaint shall be prima facie evidence that the cargo has been delivered in good condition and in accordance with the contract of carriage', margin: [0, 0, 0, 4] },
      { text: '10.1 In the case of loss of, damage or delay to cargo a written complaint must be made to Carrier by the person entitled to delivery. Such complaint must be made;', margin: [0, 0, 0, 4] },
      { text: '10.1.1 in the case of damage to the cargo, immediately after discovery of the damage and at the latest within 14 days from the date of receipt of the cargo', margin: [0, 0, 0, 4] },
      { text: '10.1.2 in the case of delay, within 21 days from the date on which the cargo was placed at the disposal of the person entitled to delivery', margin: [0, 0, 0, 4] },
      { text: '10.1.3 in the case of non-delivery of the cargo, within 120 days from the date of issue of the air waybill, or if an air waybill has not been issued, within 120 days from the date of receipt of the cargo for transportation by the Carrier.', margin: [0, 0, 0, 4] },
      { text: '10.2 Such complaint may be made to the Carrier whose air waybill was used, or to the first Carrier or to the last Carrier or to the Carrier, which performed the carriage during which the loss, damage or delay took place', margin: [0, 0, 0, 4] },
      { text: '10.3 Unless a written complaint is made within the time limits specified in 10.1 no action may be brought against Carrier.', margin: [0, 0, 0, 4] },
      { text: '10.4 Any rights to damages against Carrier shall be extinguished unless an action is brought within two years from the date of arrival at the destination, or from the date on which the aircraft ought to have arrived, or from the date on which the carriage stopped.', margin: [0, 0, 0, 4] },
      { text: '11 Shipper shall comply with all applicable laws and government regulations of any country to or from which the cargo may be carried, including those relating to the packing, carriage or delivery of the cargo, and furnish such information and attach such documents to the air waybill as may be necessary to comply with such laws and regulations.Carrier is not liable to shipper and shipper shall indemnify Carrier for loss or expense due to shipper\'s failure to comply with this provision.', margin: [0, 0, 0, 4] },
      { text: '12 No agent, employee or representative of Carrier has authority to alter, modify or waive any provisions of this contract.', margin: [0, 0, 0, 4] },
    ];

    return [
      { text: 'NOTICE CONCERNING CARRIERS LIMITATION OF LIABILITY', style: 'legalTitle', alignment: 'center', margin: [20, 20, 20, 10] },
      { text: 'If the carriage involves an ultimate destination or stop in a country other than the country of departure, the Montreal Convention or the Warsaw Convention may be applicable to the liability of the Carrier in respect of loss of, damage or delay to cargo. Carrier\'s limitation of liability in accordance with those Conventions shall be as set forth in subparagraph 4 unless a higher value is declared.', margin: [20, 0, 20, 10] },
      { text: 'CONDITIONS OF CONTRACT', style: 'legalTitle', alignment: 'center', margin: [20, 10, 20, 10] },
      {
        columns: [
          { stack: leftColumn, width: '50%' },
          { stack: rightColumn, width: '50%' }
        ],
        columnGap: 10,
        margin: [20, 0, 20, 20]
      }
    ];
  }





}







