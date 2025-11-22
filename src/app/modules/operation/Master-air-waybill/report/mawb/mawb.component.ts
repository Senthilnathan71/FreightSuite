import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-mawb',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './mawb.component.html',
  styles: ``
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
  }



  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService
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




}
