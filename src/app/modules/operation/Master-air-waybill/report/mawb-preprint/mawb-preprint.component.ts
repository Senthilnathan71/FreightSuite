import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { OperationService } from '../../../operation.service';

@Component({
  selector: 'app-mawb-preprint',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './mawb-preprint.component.html',
  styleUrls: ['./mawb-preprint.component.scss']
})
export class MawbPreprintComponent implements OnChanges {

  @Input() masterAirWayData: any;
  @Input() agentList: any;
  @Input() currencyList: any;
  @Input() chargeList: any;
  @Input() costRevenueCharges: any[] = [];
  
  userData: any;
  currentDate = new Date();
  currentCountryName: string;
  currentCurrency: number;
  currentUserCode: string;
  
  freightCharges: any[] = [];
  otherCharges: any[] = [];

  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private pdfService: PdfDownloadService,
    private spinner: NgxSpinnerService,
    private masterService: MasterService,
    private operationService: OperationService
  ) { }

  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentUserCode = this.userData?.userCode?.trim();
    
    // Get current company and country
    const currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company')
    );
    
    this.currentCountryName = currentCompany?.countryMaster?.countryName;
    this.currentCurrency = Number(currentCompany?.CurrencyMasterSid);
    
    this.handleCharges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['masterAirWayData'] || changes['costRevenueCharges']) {
      this.handleCharges();
    }
  }

  handleCharges() {
    const filteredCharges = this.costRevenueCharges?.filter(cost => !!cost.ChargeMasterSid) || [];

    this.freightCharges = filteredCharges.filter(cr => {
      const chargeGroupName = cr.chargeMaster?.chargeGroup?.GroupName || '';
      return chargeGroupName === "Freight";
    });

    const freightChargeIds = this.freightCharges.map(c => c.ChargeMasterSid);
    
    this.otherCharges = filteredCharges.filter(c => {
      return !freightChargeIds.includes(c.ChargeMasterSid);
    });
  }

  // Helper methods
  getAgentName(AgentSid: number) {
    if (!AgentSid || !this.agentList?.length) return '';
    const agent = this.agentList.find(
      (agent: any) => agent.CustomerMasterSid === AgentSid
    );
    return agent ? agent.CustomerName : '';
  }

  getCurrencyCodeById(id: number) {
    if (!id || !this.currencyList) return '';
    const currency = this.currencyList.find((c: any) => c.CurrencyMasterSid === id);
    return currency ? currency.currencyCode : '';
  }

  getChargeCode(ChargeMasterSid: number) {
    if (!this.chargeList) return '';
    const charge = this.chargeList.find((c: any) => c.ChargeMasterSid === ChargeMasterSid);
    return charge ? charge.chargeCode : '';
  }

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

  getTotalExchangeRate(): number {
    if (!this.otherCharges?.length) return 0;
    return this.otherCharges.reduce((sum, c) => {
      return sum + (Number(c.RevenueExchangeRate) || 0);
    }, 0);
  }

  getGrandTotal(): number {
    const exchangeTotal = this.getTotalExchangeRate() || 0;
    const freightAmount = Number(this.freightCharges?.[0]?.RevenueAmount) || 0;
    return exchangeTotal * freightAmount;
  }

  getOtherChargePosition(index: number): string {
    const baseTop = 190; // Starting position in mm
    const increment = 5; // Space between items
    return `${baseTop + (index * increment)}mm`;
  }

  // Additional methods for data fields
  getShipperAccountNo(): string {
    // Implement logic to get shipper account number
    return '';
  }

  getConsigneeAccountNo(): string {
    // Implement logic to get consignee account number
    return '';
  }

  getAgentAccountNo(): string {
    // Implement logic to get agent account number
    return '';
  }

  getReferenceNumber(): string {
    // Implement logic to get reference number
    return '';
  }

  getOptionalShippingInfo(): string {
    // Implement logic to get optional shipping information
    return '';
  }

  getSecondDestination(): string {
    // Implement logic for second destination if applicable
    return '';
  }

  getSecondCarrier(): string {
    // Implement logic for second carrier if applicable
    return '';
  }

  getThirdDestination(): string {
    // Implement logic for third destination if applicable
    return '';
  }

  getThirdCarrier(): string {
    // Implement logic for third carrier if applicable
    return '';
  }

  getChgsCode(): string {
    // Implement logic for CHGS code
    return '';
  }

  getInsuranceAmount(): string {
    // Implement logic for insurance amount
    return '';
  }

  getInsuranceInfo(): string {
    // Implement logic for insurance information
    return '';
  }

  getTotalCollect(): string {
    // Implement logic to get total collect amount
    return '';
  }

  getCurrencyConversion(): string {
    // Implement logic to get currency conversion rates
    return '';
  }

  getCCCharges(): string {
    // Implement logic to get CC charges in destination currency
    return '';
  }

  // PDF Download functionality
  async downloadPDF() {
    this.spinner.show();
    try {
      const mawbNo = this.masterAirWayData?.MBLNo || '';
      await this.pdfService.downloadBalancedPDF(
        'printContent',
        `MAWB_Preprint_${mawbNo}`,
        () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
        (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
      );
    } finally {
      this.spinner.hide();
    }
  }

  modalClose() {
    this.activeModal.close();
  }
}