import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { InvoicePdfData } from 'src/app/common/pdf/interfaces/pdf-document.interfaces';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CurrencySettings } from 'src/app/core/services/company-settings-manager.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { OperationService } from 'src/app/modules/operation/operation.service';

@Component({
  selector: 'app-performa-invoice',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './performa-invoice.component.html',
  providers: [CustomDatePipe],
  styles: ``,
})
export class PerformaInvoiceComponent implements OnInit {
  @Input() housejobData: any;
  @Input() masterJobContainers: any[] = [];
  @Input() packageTypeList: any[] = [];
  @Input() TandCList: any[] = [];
  @Input() selectedFCLLCL: string = 'LCL';
  @Input() portList: any[] = [];
  @Input() containerTypeList: any[] = [];
  @Input() currencyList: any[] = [];
  @Input() houseMenuMasterSid: number | null = null;

  userData: any;
  currentCompany: any;
  currentBranch: any;
  currentCompanyCountryCode: string = '';
  currentCompanyCurrency: CurrencySettings | any;
  currentDate = new Date();

  invoicePrintData: any;
  bankDetails: any[] = [];
  departmentList: any[] = [];
  isVATMode = false;

  printTaxDisplayConfig = {
    showCGST: false,
    showSGST: false,
    showUGST: false,
    showIGST: false,
    showVAT: false,
  };

  constructor(
    public activeModal: NgbActiveModal,
    public logoService: LogoService,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
    private pdfMakeService: PdfMakeService,
    private numberToWords: NumberToWordsService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.loadSessionContext();
    await this.ensureCurrencyList();
    this.numberToWords.initializeCurrencies(this.currencyList || []);
    this.preparePrintData();
  }

  private loadSessionContext(): void {
    this.userData = this.safeDecrypt(localStorage.getItem('userData')) || {};
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingService.getCurrentBranchInfo();
    const country = this.safeDecrypt(localStorage.getItem('selected-country')) || this.currentCompany?.countryMaster || {};
    this.currentCompanyCountryCode = String(country?.countryCode || this.currentCompany?.countryCode || '').toLowerCase();
    this.currentCompanyCurrency =
      this.safeDecrypt(localStorage.getItem('selected-currency')) ||
      this.currentCompany?.currencyMaster ||
      { code: this.currentCompany?.CurrencyCode || '' };
    this.isVATMode = this.currentCompanyCountryCode !== 'in';
    this.printTaxDisplayConfig = this.isVATMode
      ? { showCGST: false, showSGST: false, showUGST: false, showIGST: false, showVAT: true }
      : { showCGST: true, showSGST: true, showUGST: false, showIGST: false, showVAT: false };
  }

  private safeDecrypt(value: string | null): any {
    if (!value) return null;
    try {
      return this.appSettingService.decrypt(value);
    } catch {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
  }

  private async ensureCurrencyList(): Promise<void> {
    if (Array.isArray(this.currencyList) && this.currencyList.length > 0) {
      return;
    }

    try {
      const response: any = await firstValueFrom(this.operationService.getAllCurrencies());
      this.currencyList = Array.isArray(response) ? response : response?.data || [];
    } catch (error) {
      console.error('Error loading currencies for proforma invoice:', error);
      this.currencyList = [];
    }
  }

  preparePrintData(): void {
    const house = this.housejobData || {};
    const master = house.masterJob || house.MasterJob || {};
    const cargo = this.getFirstCargo(house);
    const firstRevenueCharge = this.getRevenueCharges(house)?.[0];
    const currencyMasterSid =
      house.CurrencyMasterSid ||
      house.currencyMasterSid ||
      firstRevenueCharge?.RevenueCurrencyMasterSid ||
      firstRevenueCharge?.CurrencyMasterSid ||
      this.currentCompanyCurrency?.CurrencyMasterSid ||
      this.currentCompanyCurrency?.currencyMasterSid;
    const currencyCode =
      house.CurrencyCode ||
      house.currencyCode ||
      this.getCurrencyCodeBySid(currencyMasterSid) ||
      this.currentCompanyCurrency?.code ||
      '';
    const exchangeRate = house.ExchangeRate || house.exchangeRate || 1;
    const containers = this.getContainerDisplay();

    const voucherDetails = this.getVoucherDetails(house);
    const totalPartyAmount = this.getVoucherTotal(voucherDetails);

    this.invoicePrintData = {
      invoiceTitle: 'PROFORMA INVOICE',
      GSTCode: this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT || '',
      BilledTo: house.CustomerName || house.customerMaster?.CustomerName || house.ConsigneeName || '',
      BillingAddress: house.CustomerAddress || house.customerBranch?.Address || house.ConsigneeAddress || '',
      PAN: this.currentCompany?.Pan || this.currentCompany?.PAN || '',
      InvoiceNo: house.ProformaInvoiceNo || house.HBLNo || house.HouseJobNo || '',
      InvoiceDate: new Date(),
      GST_VAT: house.GST_VAT || house.customerBranch?.GSTNo || house.customerBranch?.VATNo || '',
      IRNNumber: '',
      ShipperName: house.ShipperName || '',
      ConsigneeName: house.ConsigneeName || '',
      Vessel: house.VesselName || master.VesselName || master.voyages?.[0]?.VesselName || '',
      VoyageNo: house.VoyageNo || master.VoyageNo || master.voyages?.[0]?.VoyageNo || '',
      POL: house.POL || master.POL || this.getPortName(house.POLPortMasterSid || master.POLPortMasterSid),
      FPD: house.FPD || master.FPD || this.getPortName(house.FPDPortMasterSid || master.FPDPortMasterSid),
      ETD: house.ETD || master.ETD || master.voyages?.[0]?.ETD || '',
      ETA: house.ETA || master.ETA || master.voyages?.[0]?.ETA || '',
      HBLNo: house.HBLNo || '',
      MBLNo: master.MBLNo || house.MBLNo || '',
      MasterJobNumber: master.MasterJobNumber || house.MasterJobNumber || '',
      MasterJobDate: master.MasterJobDate || '',
      DocumentNumber: house.CustomerRefNo || house.DocumentNumber || house.BookingNo || '',
      ContainerType: containers.types,
      ContainerNumber: containers.numbers,
      DepartmentMasterSid: master.DepartmentMasterSid || house.DepartmentMasterSid || '',
      FreightTerms: house.FreightTerms || master.FreightPPCC || '',
      JobType: house.JobType || '',
      IsServiceJob: house.IsServiceJob || '',
      BookingNumber: house.BookingNo || '',
      InvoiceDueDate: house.InvoiceDueDate || '',
      CurrExRate: `${currencyCode} / ${Number(exchangeRate || 1).toFixed(4)}`,
      voucherDetails,
      CurrencyCode: currencyCode,
      totalPartyAmount: this.formatAmount(totalPartyAmount),
      AmountInWords: this.getAmountInWords(totalPartyAmount, currencyMasterSid),
      Remarks: house.Remarks || '',
      BankDetails: this.bankDetails,
      TermsAndConditions: this.TandCList || [],
      pkg: cargo.NoOfPackage ?? cargo.PackageCount ?? '',
      grosswt: cargo.GrossWeight ?? '',
      desc: cargo.CommodityDescription ?? cargo.Description ?? '',
      ChargeableWeight: cargo.ChargeableWeight ?? '',
      cbm: cargo.Volume ?? cargo.CBM ?? '',
    };
  }

  private getFirstCargo(house: any): any {
    return house?.Cargo?.[0] || house?.cargo?.[0] || house?.Products?.[0] || {};
  }

  private getVoucherDetails(house: any): any[] {
    const charges = this.getRevenueCharges(house);
    if (!Array.isArray(charges)) return [];

    return charges.filter((detail: any) => this.isUngeneratedRevenueCharge(detail)).map((detail: any, index: number) => {
      const taxableAmount = Number(detail.TaxableAmount || detail.Amount || detail.RevenueAmount || 0);
      const taxRate1 = Number(detail.TaxPercentage1 || detail.TaxRate || 0);
      const taxRate2 = Number(detail.TaxPercentage2 || 0);
      const taxAmount1 = Number(detail.TaxAmount1 || ((taxableAmount * taxRate1) / 100) || 0);
      const taxAmount2 = Number(detail.TaxAmount2 || ((taxableAmount * taxRate2) / 100) || 0);
      const localAmount = Number(detail.LocalAmount || detail.RevenueLocalAmount || taxableAmount + taxAmount1 + taxAmount2 || 0);
      const partyAmount = Number(detail.PartyAmount || detail.RevenueAmount || localAmount || 0);

      return {
        Sno: index + 1,
        ChargeDescription: detail.ChargeDescription || detail.chargeMaster?.chargeName || detail.chargeMaster?.chargeCode || '',
        HSSACCode: detail.HSSACCode || detail.hssacMaster?.HSSACCode || '',
        RevenueCurrencyMasterSid: detail.RevenueCurrencyMasterSid,
        CurrencyCode: this.getCurrencyCodeBySid(detail.RevenueCurrencyMasterSid) || detail.CurrencyCode || detail.revenueCurrencyMaster?.currencyCode || '',
        NumberOfUnit: this.formatNumber(detail.NumberOfUnit || detail.RevenueNumberOfUnit || 0, 3),
        Rate: this.formatAmount(detail.Rate || detail.RevenueRate || 0),
        ExchangeRate: this.formatNumber(detail.ExchangeRate || detail.RevenueExchangeRate || 1, 4),
        TaxableAmount: this.formatAmount(taxableAmount),
        cgstRate: this.formatNumber(taxRate1, 3),
        cgstAmt: this.formatAmount(taxAmount1),
        sgstRate: this.formatNumber(taxRate2, 3),
        sgstAmt: this.formatAmount(taxAmount2),
        ugstRate: this.formatNumber(taxRate2, 3),
        ugstAmt: this.formatAmount(taxAmount2),
        igstRate: this.formatNumber(taxRate1, 3),
        igstAmt: this.formatAmount(taxAmount1),
        vatRate: this.formatNumber(taxRate1, 3),
        vatAmt: this.formatAmount(taxAmount1),
        LocalAmount: this.formatAmount(localAmount),
        PartyAmount: this.formatAmount(partyAmount),
      };
    });
  }

  private getRevenueCharges(house: any): any[] {
    const charges =
      house?.costRevenueCharges ||
      house?.CostRevenueCharges ||
      house?.VoucherDetail ||
      house?.voucherDetails ||
      house?.Charges ||
      house?.charges ||
      [];
    return Array.isArray(charges) ? charges : [];
  }

  getCurrencyCodeBySid(currencyMasterSid: any): string {
    if (!currencyMasterSid || !Array.isArray(this.currencyList)) return '';

    const currency = this.currencyList.find((item: any) => {
      return Number(item?.CurrencyMasterSid || item?.currencyMasterSid) === Number(currencyMasterSid);
    });

    return currency?.currencyCode || currency?.CurrencyCode || currency?.code || '';
  }

  private isUngeneratedRevenueCharge(detail: any): boolean {
    return this.isEmptyVoucherId(detail?.RevenueVoucherHeaderSid) &&
      this.isEmptyVoucherId(detail?.RevenueVoucherTypeMasterSid);
  }

  private isEmptyVoucherId(value: any): boolean {
    return value === null || value === undefined || value === '' || Number(value) === 0;
  }

  private getVoucherTotal(details: any[]): number {
    return details.reduce((sum, detail) => sum + Number(String(detail.PartyAmount || '0').replace(/,/g, '')), 0);
  }

  private getAmountInWords(total: number, currencySid: any): string {
    if (!total) return '';
    return this.numberToWords.convert(total, Number(currencySid));
  }

  private getContainerDisplay(): { numbers: string; types: string } {
    const containers = Array.isArray(this.masterJobContainers) ? this.masterJobContainers : [];
    const numbers = containers
      .map((container: any) => container.ContainerNumber || container.containerNumber)
      .filter(Boolean)
      .join(', ');
    const types = containers
      .map((container: any) => {
        const typeSid = container.ContainerTypeMasterSid || container.containerTypeMasterSid;
        const type = this.containerTypeList?.find((item: any) => Number(item.ContainerTypeMasterSid) === Number(typeSid));
        return container.ContainerType || container.containerType || type?.ContainerType || type?.containerType;
      })
      .filter(Boolean)
      .join(', ');

    return { numbers, types };
  }

  private getPortName(portSid: any): string {
    if (!portSid || !Array.isArray(this.portList)) return '';
    const port = this.portList.find((item: any) => Number(item.PortMasterSid) === Number(portSid));
    return port?.portName || port?.PortName || '';
  }

  isSeaDepartment(): boolean {
    const text = [
      this.housejobData?.DepartmentName,
      this.housejobData?.departmentMaster?.departmentName,
      this.housejobData?.masterJob?.departmentMaster?.departmentName,
      this.housejobData?.masterJob?.departmentMaster?.departmentType,
    ]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();

    return text.includes('SEA') || this.selectedFCLLCL === 'FCL' || this.selectedFCLLCL === 'LCL';
  }

  shouldShowForeignCurrencyColumn(): boolean {
    const localCurrency = this.currentCompanyCurrency?.code || this.currentCompany?.CurrencyCode || '';
    return !!this.invoicePrintData?.CurrencyCode && this.invoicePrintData.CurrencyCode !== localCurrency;
  }

  shouldShowIndiaGstAmountTotals(configOverride = this.printTaxDisplayConfig): boolean {
    return this.currentCompanyCountryCode === 'in' && !!configOverride.showCGST && !!configOverride.showSGST;
  }

  shouldShowVatAmountTotals(configOverride = this.printTaxDisplayConfig): boolean {
    return this.currentCompanyCountryCode === 'ae' && !!configOverride.showVAT;
  }

  shouldShowDetailedTaxAmountTotals(configOverride = this.printTaxDisplayConfig): boolean {
    return this.shouldShowIndiaGstAmountTotals(configOverride) || this.shouldShowVatAmountTotals(configOverride);
  }

  calculateBaseInvoicePrintColspan(): number {
    return 6;
  }

  calculateTotalColspan(config = this.printTaxDisplayConfig): number {
    let columns = this.calculateBaseInvoicePrintColspan();
    if (config.showCGST) columns += 2;
    if (config.showSGST) columns += 2;
    if (config.showUGST) columns += 2;
    if (config.showIGST) columns += 2;
    return columns;
  }

  getInvoicePrintAmountTotal(fieldName: 'cgstAmt' | 'sgstAmt' | 'vatAmt' | 'LocalAmount'): string {
    const total = (this.invoicePrintData?.voucherDetails || []).reduce((sum: number, detail: any) => {
      return sum + Number(String(detail?.[fieldName] || '0').replace(/,/g, ''));
    }, 0);

    return this.formatAmount(total);
  }

  getBankCurrencyCode(bankDetail: any): string {
    return bankDetail?.CurrencyCode || bankDetail?.currencyCode || bankDetail?.currencyMaster?.currencyCode || this.invoicePrintData?.CurrencyCode || '';
  }

  get effectiveTermsAndConditions(): any[] {
    if (Array.isArray(this.TandCList) && this.TandCList.length > 0) {
      return this.TandCList;
    }
    return this.invoicePrintData?.TermsAndConditions || [];
  }

  printDiv(divId: string): void {
    const printContents = document.getElementById(divId)?.innerHTML;
    if (!printContents) return;

    const popupWin = window.open('', '_blank', 'width=1200,height=800');
    if (!popupWin) return;

    popupWin.document.open();
    popupWin.document.write(`
      <html>
        <head>
          <title>Proforma Invoice</title>
          <style>
            body { margin: 0; font-family: Arial, sans-serif; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          </style>
        </head>
        <body onload="window.print(); window.close();">${printContents}</body>
      </html>
    `);
    popupWin.document.close();
  }

  async downloadPDF(): Promise<void> {
    try {
      this.preparePrintData();
      this.pdfMakeService.generateProformaInvoice(this.buildProformaPdfData());
    } catch (error) {
      console.error('Error generating proforma invoice PDF:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    }
  }

  private buildProformaPdfData(): InvoicePdfData {
    const printData = this.invoicePrintData || {};
    const localCurrency = this.currentCompanyCurrency?.code || this.currentCompany?.CurrencyCode || '';
    const partyTotal = this.parseAmount(printData.totalPartyAmount);
    const localTotal = this.getVoucherLocalTotal(printData.voucherDetails || []);
    const logo = this.pdfMakeService.getReportLogo();
    const companyRegistrationNo = this.getCompanyRegistrationNo();

    const pdfData: any = {
      company: {
        companyName: this.currentCompany?.companyName || this.currentCompany?.CompanyName || '',
        addressLine1: this.currentCompany?.addressLine1 || this.currentCompany?.Address || this.currentCompany?.address || '',
        addressLine2: this.currentCompany?.addressLine2 || this.currentCompany?.AddressLine2 || '',
        city: this.currentCompany?.City || this.currentCompany?.city || this.currentCompany?.cityMaster?.cityName || '',
        countryCode: this.currentCompanyCountryCode,
        country: this.currentCompany?.countryMaster?.countryName || this.currentCompany?.countryName || '',
        postalCode: this.currentCompany?.postalCode || this.currentCompany?.postal_code || this.currentCompany?.ZipCode || '',
        phoneNumber: this.currentCompany?.phoneNumber || this.currentCompany?.Phone || this.currentCompany?.PhoneNumber || ''
      },
      branch: {
        branchName: this.currentBranch?.branchName || this.currentBranch?.BranchName || '',
        addressLine1: this.currentBranch?.addressLine1 || this.currentBranch?.Address || this.currentBranch?.address || '',
        addressLine2: this.currentBranch?.addressLine2 || this.currentBranch?.AddressLine2 || '',
        cityName: this.currentBranch?.cityMaster?.cityName || this.currentBranch?.cityName || this.currentBranch?.City || this.currentBranch?.branchName || this.currentBranch?.BranchName || '',
        countryCode: this.currentCompanyCountryCode,
        country: this.currentBranch?.countryMaster?.countryName || this.currentBranch?.countryName || '',
        postalCode: this.currentBranch?.postalCode || this.currentBranch?.postal_code || this.currentBranch?.ZipCode || '',
        phoneNumber: this.currentBranch?.phoneNumber || this.currentBranch?.Phone || this.currentBranch?.PhoneNumber || '',
        cityMaster: this.currentBranch?.cityMaster
      },
      userData: {
        userName: this.userData?.userName || this.userData?.UserName || '',
        email: this.userData?.email || this.userData?.Email || ''
      },
      logo,
      invoiceTitle: printData.invoiceTitle || 'PROFORMA INVOICE',
      companyGstCode: printData.GSTCode || companyRegistrationNo,
      companyPan: companyRegistrationNo,
      invoice: {
        invoiceNo: printData.InvoiceNo || '',
        invoiceDate: printData.InvoiceDate || new Date(),
        dueDate: printData.InvoiceDueDate || '',
        customerName: printData.BilledTo || '',
        customerAddress: printData.BillingAddress || '',
        customerGstVat: printData.GST_VAT || '',
        jobNo: printData.MasterJobNumber || '',
        hblNo: printData.HBLNo || '',
        mblNo: printData.MBLNo || '',
        bookingNo: printData.BookingNumber || '',
        vesselVoyage: printData.Vessel && printData.VoyageNo ? `${printData.Vessel} / ${printData.VoyageNo}` : (printData.Vessel || printData.VoyageNo || ''),
        pol: printData.POL || '',
        fpd: printData.FPD || '',
        exchangeRate: this.parseExchangeRate(printData.CurrExRate),
        currencyCode: printData.CurrencyCode || '',
        postStatus: 'P',
        remarks: printData.Remarks || '',
        shipperName: printData.ShipperName || '',
        consigneeName: printData.ConsigneeName || '',
        freightTerms: printData.FreightTerms || '',
        etd: printData.ETD || '',
        eta: printData.ETA || '',
        containerType: printData.ContainerType || '',
        containerNumber: this.buildContainerNumberType(printData),
        shipperRefNo: printData.DocumentNumber || '',
        loadingPort: printData.POL || '',
        finalDestination: printData.FPD || '',
        invoiceDueDate: printData.InvoiceDueDate || '',
        vesselName: printData.Vessel || '',
        voyageNo: printData.VoyageNo || '',
        irnNumber: printData.IRNNumber || ''
      },
      charges: this.mapProformaCharges(printData.voucherDetails || []),
      totals: {
        subTotal: localTotal,
        taxAmount: 0,
        grandTotal: partyTotal,
        currency: printData.CurrencyCode || localCurrency || ''
      },
      bankDetails: this.bankDetails || [],
      terms: this.effectiveTermsAndConditions
        .map((term: any) => ({ content: term?.TandC || term?.Terms || term?.content || '' }))
        .filter((term: any) => !!String(term.content || '').trim()),
      amountInWords: printData.AmountInWords || '',
      localCurrency,
      taxDisplayConfig: this.printTaxDisplayConfig,
      companyVatNo: companyRegistrationNo,
      isSeaMode: this.isSeaDepartment(),
      isVATMode: this.isVATMode,
      authorisedSignatory: true,
      cargoDetails: {
        packages: printData.pkg,
        commodityDesc: printData.desc,
        grossWeight: printData.grosswt,
        chargeableWeight: printData.ChargeableWeight,
        cbm: printData.cbm
      },
      invoicePrintData: {
        ...printData,
        invoiceTitle: printData.invoiceTitle || 'PROFORMA INVOICE',
        BilledTo: printData.BilledTo || '',
        BillingAddress: printData.BillingAddress || ''
      }
    };

    pdfData.company.CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    return pdfData as InvoicePdfData;
  }

  private getCompanyRegistrationNo(): string {
    const branchTax =
      this.currentBranch?.taxRegistrationNo ||
      this.currentBranch?.TaxRegistrationNo ||
      this.currentBranch?.GST_VAT ||
      this.currentBranch?.GSTNo ||
      this.currentBranch?.VATNo ||
      '';

    const companyTax =
      this.currentCompany?.GST_VAT ||
      this.currentCompany?.GSTNo ||
      this.currentCompany?.VATNo ||
      this.currentCompany?.TaxRegistrationNo ||
      '';

    const pan = this.currentCompany?.Pan || this.currentCompany?.PAN || '';

    return this.currentCompanyCountryCode === 'in'
      ? (this.invoicePrintData?.GSTCode || branchTax || companyTax || pan || '')
      : (companyTax || branchTax || pan || '');
  }

  private mapProformaCharges(details: any[]): any[] {
    return (details || []).map((detail: any, index: number) => ({
      sno: detail.Sno || index + 1,
      chargeName: detail.ChargeDescription || '',
      hsnSacCode: detail.HSSACCode || '',
      drCr: 'C',
      unit: '',
      qty: this.parseAmount(detail.NumberOfUnit),
      currency: detail.CurrencyCode || '',
      currencyCode: detail.CurrencyCode || '',
      rate: this.parseAmount(detail.Rate),
      amount: this.parseAmount(detail.TaxableAmount || detail.LocalAmount),
      exchangeRate: this.parseAmount(detail.ExchangeRate) || 1,
      roe: this.parseAmount(detail.ExchangeRate) || 1,
      taxableAmount: this.parseAmount(detail.TaxableAmount || detail.LocalAmount),
      cgstPercent: this.parseAmount(detail.cgstRate),
      cgstAmount: this.parseAmount(detail.cgstAmt),
      sgstPercent: this.parseAmount(detail.sgstRate),
      sgstAmount: this.parseAmount(detail.sgstAmt),
      igstPercent: this.parseAmount(detail.igstRate),
      igstAmount: this.parseAmount(detail.igstAmt),
      vatPercent: this.parseAmount(detail.vatRate),
      vatAmount: this.parseAmount(detail.vatAmt),
      localAmount: this.parseAmount(detail.LocalAmount),
      partyAmount: this.parseAmount(detail.PartyAmount)
    }));
  }

  private getVoucherLocalTotal(details: any[]): number {
    return (details || []).reduce((sum: number, detail: any) => sum + this.parseAmount(detail.LocalAmount), 0);
  }

  private parseAmount(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    return Number(String(value).replace(/,/g, '')) || 0;
  }

  private parseExchangeRate(value: any): number {
    const parts = String(value || '').split('/');
    return this.parseAmount(parts.length > 1 ? parts[1] : value) || 1;
  }

  private buildContainerNumberType(printData: any): string {
    const number = printData?.ContainerNumber || '';
    const type = printData?.ContainerType || '';
    if (number && type) return `${number} / ${type}`;
    return number || type || '';
  }

  private formatAmount(value: any): string {
    return Number(value || 0).toFixed(2);
  }

  private formatNumber(value: any, digits: number): string {
    return Number(value || 0).toFixed(digits);
  }
}
