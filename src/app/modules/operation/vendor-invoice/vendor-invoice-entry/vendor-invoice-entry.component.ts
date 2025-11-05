import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { NgbModal, NgbDatepickerModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import { OperationService } from 'src/app/modules/operation/operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';

interface NgbDateStructLike { day: number; month: number; year: number; }

@Component({
  selector: 'app-vendor-invoice-entry',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FeatherModule,
    NgbDatepickerModule,
    ReactiveFormsModule,
    FormsModule,
    NgxSpinnerModule,
    NumberFormatPipe,
    CustomDatePipe,
    SearchableDropdown
  ],
  templateUrl: './vendor-invoice-entry.component.html',
  styleUrls: ['./vendor-invoice-entry.component.scss'],
})
export class VendorInvoiceEntryComponent implements OnInit {
  vendorInvoiceForm!: FormGroup;
  headerId: number | null = null;
  currentCompany: any;
  currentBranch: any;
  vendorInvoiceData: any;

  currUserEmail: string | null = null;
  isViewMode: boolean = false;
  get isEditMode() { return !!this.headerId && !this.isViewMode; }

  // ViewChild references for modals
  @ViewChild('searchCostsModal') searchCostsModalRef: TemplateRef<any> | undefined;
  searchCostsModalInstance: NgbModalRef | null = null;

  // Lookups
  vendorList: any[] = [];
  vendorBranchList: any[] = [];
  currencyList: any[] = [];
  chargeList: any[] = [];
  hssacList: any[] = [];
  subledgerList: any[] = [];
  uomList: any[] = [];
  masterJobList: any[] = [];
  houseJobList: any[] = [];
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  userData: any;
  currentDate = new Date();

  // UI state
  selectedTab = 'VendorInvoice';
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }
  tabs = [
    { name: 'VendorInvoice', icon: 'fas fa-file-invoice' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' }
  ];

  invoiceType = [
    { id: 'R', name: 'Regular' },
    { id: 'RE', name: 'Reimbursement' },
    { id: 'ZREV', name: 'Zero Rate/Export Invoice' },
    { id: 'BOS', name: 'Bill Of Supply' },
    { id: 'SOA', name: 'SOA' },
  ];

  statusList = [
    { value: 'A', name: 'Active' },
    { value: 'S', name: 'Suspended' },
  ];

  isSaving: boolean = false;

  gstType = [
    { id: 'B2B', name: 'B2B - Business to Business' },
    { id: 'B2CS', name: 'B2CS - Business to Customer(Small)' },
    { id: 'B2CL', name: 'B2CL - Business to Customer(Large)' },
    { id: 'EXWP', name: 'EXWP - Export With Payment of Tax' },
    { id: 'EXWOP', name: 'EXWOP - Export Without Payment of Tax' },
  ];

  searchTypes = [
    { id: 'Master Job', name: 'Master Job' },
    { id: 'House Job', name: 'House Job' },
    { id: 'MBL No', name: 'MBL No' },
    { id: 'HBL No', name: 'HBL No' },
    { id: 'Container No', name: 'Container No' }
  ];

  // Search costs
  searchType: string = 'Master Job';
  searchValue: string = '';
  pendingCosts: any[] = [];
  selectedCosts: Set<number> = new Set();
  searchPerformed: boolean = false;
  searchResultsLoading: boolean = false;

  // TDS Configuration
  tdsConfig: any = null;

  // Country/Tax mode
  bookingModeCountry: string = 'india';

  get isIndiaGST(): boolean {
    return this.bookingModeCountry === 'india';
  }
  get isVATMode(): boolean {
    return !this.isIndiaGST;
  }

  get f(): { [key: string]: AbstractControl } {
    return this.vendorInvoiceForm.controls;
  }
  get details(): FormArray {
    return this.vendorInvoiceForm.get('voucherDetails') as FormArray;
  }
  get tdsGroup(): FormGroup {
    return this.vendorInvoiceForm.get('voucherTDS') as FormGroup;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private companySettings: CompanySettingsManagerService
  ) {}

  ngOnInit(): void {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    try {
      this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
      this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

      // Set country mode from company settings
      if (this.currentCompany?.CountryName) {
        this.bookingModeCountry = this.currentCompany.CountryName.toLowerCase();
      }
    } catch (e) {
      this.currentCompany = null;
      this.currentBranch = null;
    }

    this.initForm();
    this.loadLookups();

    try {
      const decryptedProfileRaw = localStorage.getItem('user-profile');
      const decryptedProfile = decryptedProfileRaw ? this.appSettingService.decrypt(decryptedProfileRaw) : null;
      this.currUserEmail = decryptedProfile?.email || localStorage.getItem('user-email') || null;
    } catch (err) {
      this.currUserEmail = localStorage.getItem('user-email') || null;
    }

    // Check if view mode from route data
    this.route.data.subscribe(data => {
      this.isViewMode = data['viewMode'] === true;
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.headerId = Number(id);
        this.loadVendorInvoiceById(this.headerId);
      } else {
        // New vendor invoice - set default currency
        const currencySettings = this.companySettings.getCurrencySettings();
        console.log(currencySettings,'currencySettings')
        this.vendorInvoiceForm.patchValue({
          CurrencyCode: currencySettings.code,
          ExchangeRate: 1
        });
      }
    });

    // Recalculate when currency/exchange rate changes
    this.vendorInvoiceForm.get('CurrencyCode')?.valueChanges.subscribe(() => {
      this.recalculateAllRows();
    });

    this.vendorInvoiceForm.get('ExchangeRate')?.valueChanges.subscribe(() => {
      this.recalculateAllRows();
    });
  }

  initForm() {
    this.vendorInvoiceForm = this.fb.group({
      // Header
      VoucherNumber: [{ value: '', disabled: true }],
      VoucherDate: [this.formatDateForNgb(new Date()), Validators.required],
      PartyMasterSid: [null, Validators.required], // Vendor
      PartyName: [{ value: '', disabled: true }],
      PartyAddress: [{ value: '', disabled: true }],
      GSTNo: [{ value: '', disabled: true }],
      PlaceOfSupply: [{ value: '', disabled: true }],
      PostedOn: [{ value: null, disabled: true }],
      CurrencyCode: ['', Validators.required],
      ExchangeRate: [1, [Validators.required, Validators.min(0)]],
      BillNo: ['', Validators.required],
      BillDate: [null, Validators.required],
      BillAmt: [0, [Validators.required, Validators.min(0)]],
      MBLNo: [''],
      HBLNo: [''],
      InvoiceType: ['B2B'],
      GSTType: [''],
      Narration: [''],
      Remarks: [''],
      MasterJobSid: [null],
      HouseJobSid: [null],
      Status: ['A'],

      // Details Array
      voucherDetails: this.fb.array([]),

      // TDS Section
      voucherTDS: this.fb.group({
        TDSSet: [{ value: '', disabled: true }],
        TDSCompany: [{ value: '', disabled: true }],
        ITSectionType: [{ value: '', disabled: true }],
        ITSectionCode: [{ value: '', disabled: true }],
        CertificateNo: [{ value: '', disabled: true }],
        Percentage: [{ value: 0, disabled: true }],
        TaxableAmt: [{ value: 0, disabled: true }],
        TDSAmt: [{ value: 0, disabled: true }],
        Reason: [''],
        TDSSectionCode:[''],
        TDSNature:[''],
        TDSCompanyType:[''],
        TDSPercent:[''],
        TDSAccountCode:['']
      }),

      // Others
      voucherOthers: this.fb.group({
        ContainerNumber: [''],
        VoucherNote: [''],
        Footer: ['']
      })
    });
  }

  createDetailGroup(data?: any): FormGroup {
    console.log(data,'createDetailGroup')
    return this.fb.group({
      Sno: [data?.Sno || this.details.length + 1],
      LedgerMasterSid: [data?.LedgerMasterSid || null],
      ChargeMasterSid: [data?.ChargeMasterSid || null, Validators.required],
      ChargeDescription: [data?.chargeMaster?.chargeName || ''],
      HSSACMasterSid: [data?.HSSACMasterSid || null],
      SACCode: [{ value: data?.SACCode || '', disabled: true }],
      ChargeUOMSid: [data?.ChargeUOMSid || null],
      Unit: [{ value: data?.Unit || '', disabled: true }],
      NumberOfUnit: [data?.NumberOfUnit || 1, [Validators.required, Validators.min(0)]],
      DrCr: [data?.DrCr || 'Dr'], // Vendor invoice = Debit (payable)
      CurrencyCode: [data?.CurrencyCode || this.vendorInvoiceForm?.get('CurrencyCode')?.value || ''],
      ExchangeRate: [data?.ExchangeRate || this.vendorInvoiceForm?.get('ExchangeRate')?.value || 1],
      Rate: [data?.Rate || 0, [Validators.required, Validators.min(0)]],
      Amount: [{ value: data?.Amount || 0, disabled: true }],
      TaxableAmount: [{ value: data?.TaxableAmount || 0, disabled: true }],
      // GST fields (India)
      CGSTPercentage: [data?.TaxPercentage1 || 0],
      CGST: [{ value: data?.TaxAmount1 || 0, disabled: true }],
      SGSTPercentage: [data?.TaxPercentage2 || 0],
      SGST: [{ value: data?.TaxAmount2 || 0, disabled: true }],
      // IGST field (India inter-state)
      IGSTPercentage: [data?.IGSTPercentage || 0],
      IGST: [{ value: data?.IGST || 0, disabled: true }],
      // VAT field (non-India)
      VATPercentage: [data?.VATPercentage || 0],
      VAT: [{ value: data?.VAT || 0, disabled: true }],
      LocalAmount: [{ value: data?.LocalAmount || 0, disabled: true }],
      MasterJobSid: [data?.MasterJobSid || null],
      HouseJobSid: [data?.HouseJobSid || null],
      Remarks: [data?.Remarks || '']
    });
  }

  addDetailRow() {
    const newRow = this.createDetailGroup();
    this.details.push(newRow);

    // Subscribe to changes for auto-calculation
    this.subscribeToRowChanges(newRow);
  }

  subscribeToRowChanges(row: FormGroup) {
    // Recalculate when NumberOfUnit or Rate changes
    row.get('NumberOfUnit')?.valueChanges.subscribe(() => this.recalculateRow(row));
    row.get('Rate')?.valueChanges.subscribe(() => this.recalculateRow(row));
    row.get('CGSTPercentage')?.valueChanges.subscribe(() => this.recalculateRow(row));
    row.get('SGSTPercentage')?.valueChanges.subscribe(() => this.recalculateRow(row));
    row.get('IGSTPercentage')?.valueChanges.subscribe(() => this.recalculateRow(row));
    row.get('VATPercentage')?.valueChanges.subscribe(() => this.recalculateRow(row));

    // When charge changes, fetch SAC code and UOM
    row.get('ChargeMasterSid')?.valueChanges.subscribe((chargeSid) => {
      if (chargeSid) {
        this.onChargeChange(row, chargeSid);
      }
    });
  }

  onChargeChange(row: FormGroup, chargeSid: number) {
    const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeSid);
    console.log(charge,'onChargeChange')

    const uom = this.uomList.find(u=>u.UOMMasterSid === charge.UOM)
    if (charge) {
      row.patchValue({
        ChargeDescription: charge.chargeName,
        SACCode: charge.HSNSAC || charge.HSNCode || '',
        Unit: uom.UOMCode || '',
        ChargeUOMSid: charge.ChargeUOMSid,
      }, { emitEvent: false });

      // Fetch HSN/SAC Master ID
      if (charge.SACCode || charge.HSNCode) {
        const hssac = this.hssacList.find(h =>
          h.HSSACCode === (charge.SACCode || charge.HSNSAC) ||
          h.SACCode === (charge.SACCode || charge.HSNCode)
        );
        if (hssac) {
          row.patchValue({ HSSACMasterSid: hssac.HSSACMasterSid }, { emitEvent: false });

          // Auto-fill tax percentage based on SAC code
          if (this.isIndiaGST) {
            const taxRate = hssac.TaxRate || 18; // Default 18% GST
            row.patchValue({
              CGSTPercentage: taxRate / 2,
              SGSTPercentage: taxRate / 2
            });
          } else {
            row.patchValue({
              VATPercentage: hssac.TaxRate || 5 // Default 5% VAT
            });
          }
        }
      }
    }
  }

  recalculateRow(row: FormGroup) {
    const numberOfUnit = Number(row.get('NumberOfUnit')?.value) || 0;
    const rate = Number(row.get('Rate')?.value) || 0;
    const exchangeRate = Number(row.get('ExchangeRate')?.value) || 1;

    // Calculate Amount
    const amount = numberOfUnit * rate;
    row.patchValue({ Amount: this.round(amount) }, { emitEvent: false });

    // Taxable Amount = Amount
    const taxableAmount = amount;
    row.patchValue({ TaxableAmount: this.round(taxableAmount) }, { emitEvent: false });

    // Calculate taxes
    let totalTax = 0;

    if (this.isIndiaGST) {
      const cgstPct = Number(row.get('CGSTPercentage')?.value) || 0;
      const sgstPct = Number(row.get('SGSTPercentage')?.value) || 0;
      const igstPct = Number(row.get('IGSTPercentage')?.value) || 0;

      if (igstPct > 0) {
        // Inter-state: IGST
        const igst = (taxableAmount * igstPct) / 100;
        row.patchValue({ IGST: this.round(igst), CGST: 0, SGST: 0 }, { emitEvent: false });
        totalTax = igst;
      } else {
        // Intra-state: CGST + SGST
        const cgst = (taxableAmount * cgstPct) / 100;
        const sgst = (taxableAmount * sgstPct) / 100;
        row.patchValue({
          CGST: this.round(cgst),
          SGST: this.round(sgst),
          IGST: 0
        }, { emitEvent: false });
        totalTax = cgst + sgst;
      }
    } else {
      // VAT for non-India
      const vatPct = Number(row.get('VATPercentage')?.value) || 0;
      const vat = (taxableAmount * vatPct) / 100;
      row.patchValue({ VAT: this.round(vat) }, { emitEvent: false });
      totalTax = vat;
    }

    // Local Amount = (Amount + Tax) * Exchange Rate
    const localAmount = (amount + totalTax) * exchangeRate;
    row.patchValue({ LocalAmount: this.round(localAmount) }, { emitEvent: false });

    // Recalculate TDS
    this.calculateTDS();
  }

  recalculateAllRows() {
    const headerExchangeRate = Number(this.vendorInvoiceForm.get('ExchangeRate')?.value) || 1;
    const headerCurrency = this.vendorInvoiceForm.get('CurrencyCode')?.value;

    this.details.controls.forEach((row: any) => {
      row.patchValue({
        CurrencyCode: headerCurrency,
        ExchangeRate: headerExchangeRate
      }, { emitEvent: false });
      this.recalculateRow(row as FormGroup);
    });
  }

  deleteDetailRow(index: number) {
    this.details.removeAt(index);
    this.renumberRows();
    this.calculateTDS();
  }

  renumberRows() {
    this.details.controls.forEach((row, i) => {
      row.patchValue({ Sno: i + 1 }, { emitEvent: false });
    });
  }

  calculateTDS() {
    // Calculate total taxable amount
    const totalTaxable = this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('TaxableAmount')?.value) || 0);
    }, 0);

    // Get TDS rate from config
    const tdsRate = this.tdsConfig?.tdsRate || 0;
    const tdsAmount = (totalTaxable * tdsRate) / 100;

    this.tdsGroup.patchValue({
      TaxableAmt: this.round(totalTaxable),
      TDSAmt: this.round(tdsAmount)
    }, { emitEvent: false });
  }

  calculateTotalAmount(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('Amount')?.value) || 0);
    }, 0);
  }

  calculateTotalTaxableAmount(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('TaxableAmount')?.value) || 0);
    }, 0);
  }

  calculateTotalCGST(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('CGST')?.value) || 0);
    }, 0);
  }

  calculateTotalSGST(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('SGST')?.value) || 0);
    }, 0);
  }

  calculateTotalIGST(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('IGST')?.value) || 0);
    }, 0);
  }

  calculateTotalVAT(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('VAT')?.value) || 0);
    }, 0);
  }

  calculateTotalLocalAmount(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('LocalAmount')?.value) || 0);
    }, 0);
  }

  onVendorBranchChange(vendorBranch: any) {
    const branch = (typeof vendorBranch === 'object' && vendorBranch !== null)
    ? (vendorBranch.CustomerBranchSid ?? vendorBranch)
    : vendorBranch;
    if (!branch) {
      this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
      this.vendorInvoiceForm.get('CustomerBranchSid')?.setValue(null);
      this.vendorInvoiceForm.get('GSTNo')?.setValue('');
      return;
    }

    const foundBranch = this.vendorBranchList.find(b => Number(b.CustomerBranchSid) === Number(branch));

    if (foundBranch) {
      console.log('DEBUG - Found Branch:', foundBranch);
      this.vendorInvoiceForm.get('CustomerBranchSid')?.setValue(Number(branch));

      const address = foundBranch.Address|| foundBranch.CustomerAddress1 || foundBranch.customerAddress || '';
      this.vendorInvoiceForm.get('PartyAddress')?.setValue(address);

      const customerMaster = foundBranch.CustomerMasterSid;
      if(customerMaster) {
        const customer = this.vendorList.find(c => c.CustomerMasterSid === customerMaster);
        if(customer) {
          console.log('DEBUG - Found Customer for branch:', customer);

          const countryCode = this.getCustomerCountryCode(customer);

          console.log('DEBUG - Customer CountryCode:', countryCode);
          console.log('DEBUG - Branch GSTNo:', foundBranch.GSTNo);
          
          if (countryCode === 'IN') {
            this.vendorInvoiceForm.get('GSTNo')?.setValue(foundBranch.GSTNo || '');
          } else {
            this.vendorInvoiceForm.get('GSTNo')?.setValue(customer.PanType || '');
          }
        }
      }
    } else {
      this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
      this.vendorInvoiceForm.get('GSTNo')?.setValue('');
    }
  }

  private getCustomerCountryCode(customer: any): string {
  console.log('DEBUG - Customer CountryMasterSid structure:', customer.CountryMasterSid);
  
  // Check the CountryMasterSid object structure from your customer data
  if (customer.CountryMasterSid && typeof customer.CountryMasterSid === 'object') {
    // If CountryMasterSid is an object with countryCode
    const code = customer.CountryMasterSid.countryCode || customer.CountryMasterSid.CountryCode;
    console.log('DEBUG - Extracted countryCode from customer:', code);
    return code || '';
  }
  
  // Fallback: check direct country code fields
  const countryCode = customer.CountryCode || 
                     customer.countryCode || 
                     customer.countryMaster?.countryCode ||
                     customer.country?.countryCode ||
                     customer.CountryMaster?.CountryCode ||
                     '';
  
  console.log('DEBUG - Fallback countryCode:', countryCode);
  
  // Final fallback: if customer has GSTNo in any branch, assume it's India
  if (!countryCode) {
    // Check if this customer has any branches with GSTNo
    const customerBranches = this.vendorBranchList.filter(b => b.CustomerMasterSid === customer.CustomerMasterSid);
    const hasGSTNo = customerBranches.some(branch => branch.GSTNo);
    if (hasGSTNo) {
      return 'IN';
    }
  }
  
  return countryCode;
}
  // Vendor selection
  onVendorChange(vendorSid: number) {
    if (!vendorSid) return;

    this.spinner.show();

    // Find vendor in subledger list
    const vendor = this.subledgerList.find(s => s.SubledgerMasterSid === vendorSid);

    console.log(vendor,'onVendorChange')
    if (vendor) {
      this.vendorInvoiceForm.patchValue({
        PartyName: vendor.SubledgerName,
        PartyAddress: vendor.Address || '',
        GSTNo: vendor.GSTNumber || '',
        PlaceOfSupply: vendor.StateName || ''
      });

      // Determine Invoice Type based on GST registration
      if (vendor.GSTNumber) {
        this.vendorInvoiceForm.patchValue({ InvoiceType: 'B2B' });
      } else {
        this.vendorInvoiceForm.patchValue({ InvoiceType: 'EXWP' });
      }

      // Determine GST Type (CGST+SGST or IGST)
      if (this.isIndiaGST && vendor.StateName && this.currentCompany?.StateName) {
        if (vendor.StateName === this.currentCompany.StateName) {
          this.vendorInvoiceForm.patchValue({ GSTType: 'CGST+SGST' });
        } else {
          this.vendorInvoiceForm.patchValue({ GSTType: 'IGST' });
        }
      }

      // Load TDS configuration for vendor
      this.loadVendorTDS(vendorSid);
    }

    this.spinner.hide();
  }

  onVendorSelect(vendor: any) {
    const vendors = (typeof vendor === 'object' && vendor !==null)
    ? (vendor.vendors ?? vendor)
    : vendor;
    if (!vendor) {
      this.vendorList = [];
      this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
      return;
    }
    this.vendorInvoiceForm.get('PartyAddress')?.setValue(vendor.Address || '');
  }

  loadVendorTDS(vendorSid: number) {
    this.operationService.getVendorTDSMapping(vendorSid).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.tdsConfig = response.data;

          this.tdsGroup.patchValue({
            TDSSet: this.tdsConfig.tdsSetName || '',
            TDSCompany: this.currentCompany?.CompanyName || '',
            ITSectionType: this.tdsConfig.companyType || '',
            ITSectionCode: this.tdsConfig.itSectionCode || '',
            CertificateNo: this.tdsConfig.certificateNo || '',
            Percentage: this.tdsConfig.tdsRate || 0
          });

          // Recalculate TDS
          this.calculateTDS();
        } else {
          // No TDS config found
          this.tdsConfig = null;
          this.tdsGroup.patchValue({
            TDSSet: '',
            TDSCompany: '',
            ITSectionType: '',
            ITSectionCode: '',
            CertificateNo: '',
            Percentage: 0,
            TDSAmt: 0
          });
        }
      },
      error: (error) => {
        console.error('Error loading TDS config:', error);
        this.tdsConfig = null;
      }
    });
  }

  // Search Pending Costs
  openSearchCostsModal() {
    if (!this.searchCostsModalRef) {
      this.appSettingService.showError('Search modal template not found');
      return;
    }

    this.searchType = 'Master Job';
    this.searchValue = '';
    this.pendingCosts = [];
    this.selectedCosts.clear();

    this.searchCostsModalInstance = this.modalService.open(this.searchCostsModalRef, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
  }

  searchPendingCostsAction() {
    if (!this.searchValue.trim()) {
      this.appSettingService.showWarning('Please enter a search value');
      return;
    }

    this.searchResultsLoading = true;
    const criteria = {
      searchType: this.searchType,
      searchValue: this.searchValue.trim(),
      vendorSid: this.vendorInvoiceForm.get('PartyMasterSid')?.value,
      source: 'booking' // or 'housejob' depending on context
    };

    this.operationService.searchPendingCosts(criteria).subscribe({
      next: (response) => {
        this.searchResultsLoading = false;
        this.searchPerformed = true;
        if (response.status && response.data) {
          this.pendingCosts = response.data;
          if (this.pendingCosts.length === 0) {
            this.appSettingService.showInfo('No pending costs found');
          }
        } else {
          this.appSettingService.showError('No pending costs found');
          this.pendingCosts = [];
        }
      },
      error: (error) => {
        this.searchResultsLoading = false;
        this.searchPerformed = true;
        this.appSettingService.showError('Error searching pending costs');
        console.error('Error:', error);
      }
    });
  }

  toggleCostSelection(costSid: number) {
    if (this.selectedCosts.has(costSid)) {
      this.selectedCosts.delete(costSid);
    } else {
      this.selectedCosts.add(costSid);
    }
  }

  addSelectedCosts() {
    if (this.selectedCosts.size === 0) {
      this.appSettingService.showWarning('Please select at least one cost');
      return;
    }

    const selectedCostItems = this.pendingCosts.filter(c => this.selectedCosts.has(c.BookingRatesSid || c.CostRevenueChargesSid));

    selectedCostItems.forEach(cost => {
      const detailRow = this.createDetailGroup({
        ChargeMasterSid: cost.ChargeMasterSid,
        ChargeDescription: cost.ChargeDescription,
        NumberOfUnit: cost.NumberOfUnit || 1,
        Rate: cost.CostAmount || cost.Rate || 0,
        CurrencyCode: cost.costCurrencyMaster?.currencyCode || this.vendorInvoiceForm.get('CurrencyCode')?.value,
        ExchangeRate: cost.CostExchangeRate || 1,
        MasterJobSid: cost.MasterJobSid,
        HouseJobSid: cost.HouseJobSid
      });

      this.details.push(detailRow);
      this.subscribeToRowChanges(detailRow);
    });

    this.renumberRows();
    this.recalculateAllRows();
    this.searchCostsModalInstance?.close();
    this.appSettingService.showSuccess(`${this.selectedCosts.size} cost(s) added successfully`);
  }

  getSelectedCosts(): any[] {
    return this.pendingCosts.filter(c => c.selected);
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.pendingCosts.forEach(cost => cost.selected = checked);
  }

  isAllSelected(): boolean {
    return this.pendingCosts.length > 0 && this.pendingCosts.every(c => c.selected);
  }

  closeSearchCostsModal() {
    this.searchCostsModalInstance?.close();
    this.selectedCosts.clear();
  }

  // Load lookups
  loadLookups() {
    this.spinner.show();
      const companyRaw = localStorage.getItem('selected-company');
      const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;
      const filterOption = { CompanyMasterSid: company?.CompanyMasterSid, BranchMasterSid: company?.BranchMasterSid };

    Promise.all([
      firstValueFrom(this.operationService.getAllCreditorWithCOAMapped(filterOption)),
      firstValueFrom(this.operationService.getAllCurrencies()),
      firstValueFrom(this.operationService.getAllCharges(this.currentCompany?.CompanyMasterSid || 1)),
      firstValueFrom(this.operationService.getAllHssac()),
      firstValueFrom(this.operationService.getAllUom())
    ]).then(([vendors,currencies, charges, hssac, uom]) => {
      this.vendorList = vendors.data || [];
      this.subledgerList = vendors.data || [];
      this.currencyList = currencies.data || [];
      this.chargeList = charges || [];
      this.hssacList = hssac || [];
      this.uomList = uom.data || [];

      this.spinner.hide();
    }).catch(error => {
      console.error('Error loading lookups:', error);
      this.spinner.hide();
      this.appSettingService.showError('Error loading lookup data');
    });
  }

  // Load vendor invoice by ID
  loadVendorInvoiceById(id: number) {
    this.spinner.show();
    this.operationService.getVendorInvoiceById(id).subscribe({
      next: (response) => {
        this.spinner.hide();
        if (response.status && response.data) {
          console.log(response.data,'loadVendorInvoiceById')
          this.vendorInvoiceData = response.data;
          this.populateForm(this.vendorInvoiceData);
          this.setFormReadonly();
        } else {
          this.appSettingService.showError('Vendor Invoice not found');
          this.router.navigate(['/operation/vendor-invoice/list']);
        }
      },
      error: (error) => {
        this.spinner.hide();
        this.appSettingService.showError('Error loading Vendor Invoice');
        console.error('Error:', error);
        this.router.navigate(['/operation/vendor-invoice/list']);
      }
    });
  }

  setFormReadonly() {
    if (this.isViewMode) {
      this.vendorInvoiceForm.disable();
    }
  }

  formatDateForDisplay(date: string | Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

  populateForm(data: any) {
    console.log('populateForm called with data:', data);

    const currency = this.currencyList.find(c=>c.CurrencyMasterSid === data.CurrencyMasterSid)
    console.log(currency,'currency')
    this.vendorInvoiceForm.patchValue({
      VoucherNumber: data.VoucherNumber,
      VoucherDate: this.formatDateForNgb(data.VoucherDate),
      PartyMasterSid: data.PartyMasterSid,
      PartyName: data.PartyName,
      PartyAddress: data.PartyAddress,
      GSTNo: data.GST_VAT,
      PlaceOfSupply: data.PlaceOfSupply,
      PostedOn: data.PostDate ? this.formatDateForDisplay(data.PostDate) : null,
      CurrencyCode: data.CurrencyCode || currency.currencyCode,
      ExchangeRate: data.ExchangeRate || 1,
      BillNo: data.DocumentNumber,
      BillDate: data.DocumentDate ? this.formatDateForNgb(data.DocumentDate) : null,
      BillAmt: data.Amount || 0,
      MBLNo: data.MasterNumber,
      HBLNo: data.HouseNumber,
      InvoiceType: data.InvoiceType || 'B2B',
      GSTType: data.GSTType,
      Narration: data.Narration || '',
      Remarks: data.Remarks || (data.VoucherOthers && data.VoucherOthers[0]?.Remarks) || '',
      MasterJobSid: data.MasterJobSid,
      HouseJobSid: data.HouseJobSid,
      Status: data.Status
    });

    // Populate details
    this.details.clear();
    console.log('Details array cleared, length:', this.details.length);

    if (data.VoucherDetail && Array.isArray(data.VoucherDetail)) {
      console.log('Populating details, count:', data.VoucherDetail.length);
      data.VoucherDetail.forEach((detail: any, index: number) => {
        console.log(`Processing detail ${index}:`, detail);
        const row = this.createDetailGroup({
          Sno: detail.Sno,
          LedgerMasterSid: detail.LedgerMasterSid,
          ChargeMasterSid: detail.ChargeMasterSid,
          ChargeDescription: detail.ChargeDescription,
          HSSACMasterSid: detail.HSSACMasterSid,
          ChargeUOMSid: detail.ChargeUOMSid,
          NumberOfUnit: detail.NumberOfUnit,
          DrCr: detail.DrCr,
          CurrencyCode: detail.CurrencyCode,
          ExchangeRate: detail.ExchangeRate,
          Rate: detail.Rate,
          Amount: detail.Amount,
          TaxableAmount: detail.TaxableAmount,
          TaxPercentage1: detail.TaxPercentage1,
          TaxAmount1: detail.TaxAmount1,
          TaxPercentage2: detail.TaxPercentage2,
          TaxAmount2: detail.TaxAmount2,
          LocalAmount: detail.LocalAmount,
          MasterJobSid: detail.MasterJobSid,
          HouseJobSid: detail.HouseJobSid,
          Remarks: detail.Remarks
        });
        console.log(`Created form group for detail ${index}:`, row.value);
        this.details.push(row);
        console.log(`Pushed row to details array, new length: ${this.details.length}`);
        this.subscribeToRowChanges(row);
      });
      console.log('Finished populating details. Final length:', this.details.length);
      console.log('Details controls:', this.details.controls);
    } else {
      console.log('VoucherDetail is missing or not an array');
    }

    // Populate TDS
    if (data.VoucherTDS && data.VoucherTDS.length > 0) {
      const tds = data.VoucherTDS[0];
      this.tdsGroup.patchValue({
        ITSectionCode: tds.ITSectionCode,
        Percentage: tds.TDSRate,
        TaxableAmt: tds.TaxableAmount,
        TDSAmt: tds.TDSAmount,
        Reason: tds.Reason || ''
      });
    }

    // Populate others
    if (data.VoucherOthers && data.VoucherOthers.length > 0) {
      const others = data.VoucherOthers[0];
      this.vendorInvoiceForm.get('voucherOthers')?.patchValue({
        ContainerNumber: others.ContainerNumber || '',
        VoucherNote: others.VoucherNote || '',
        Footer: others.Footer || ''
      });
    }
  }

  // Save
  onSave() {
    if (this.vendorInvoiceForm.invalid) {
      this.appSettingService.showWarning('Please fill all required fields');
      this.markFormGroupTouched(this.vendorInvoiceForm);
      return;
    }

    if (this.details.length === 0) {
      this.appSettingService.showWarning('Please add at least one charge detail');
      return;
    }

    const payload = this.preparePayload();

    this.spinner.show();
    if (this.isEditMode) {
      this.operationService.updateVendorInvoiceById(this.headerId!, payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          if (response.status) {
            this.appSettingService.showSuccess('Vendor Invoice updated successfully');
            this.router.navigate(['/operation/vendor-invoice/list']);
          } else {
            this.appSettingService.showError('Failed to update Vendor Invoice');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.appSettingService.showError('Error updating Vendor Invoice');
          console.error('Error:', error);
        }
      });
    } else {
      this.operationService.createVendorInvoice(payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          if (response.status) {
            this.appSettingService.showSuccess('Vendor Invoice created successfully');
            this.router.navigate(['/operation/vendor-invoice/list']);
          } else {
            this.appSettingService.showError(response.message || 'Failed to create Vendor Invoice');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.appSettingService.showError('Error creating Vendor Invoice');
          console.error('Error:', error);
        }
      });
    }
  }

  preparePayload(): any {
    const formValue = this.vendorInvoiceForm.getRawValue();

    const payload: any = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      PartyMasterSid: formValue.PartyMasterSid,
      PartyName: formValue.PartyName,
      PartyAddress: formValue.PartyAddress,
      GSTNo: formValue.GSTNo,
      PlaceOfSupply: formValue.PlaceOfSupply,
      CurrencyCode: formValue.CurrencyCode,
      CurrencyMasterSid: this.currencyList.find(c => c.currencyCode === formValue.CurrencyCode)?.CurrencyMasterSid,
      ExchangeRate: formValue.ExchangeRate,
      BillNo: formValue.BillNo,
      BillDate: this.parseNgbDateToISO(formValue.BillDate),
      BillAmt: formValue.BillAmt,
      MBLNo: formValue.MBLNo,
      HBLNo: formValue.HBLNo,
      InvoiceType: formValue.InvoiceType,
      GSTType: formValue.GSTType,
      Narration: formValue.Narration,
      MasterJobSid: formValue.MasterJobSid,
      HouseJobSid: formValue.HouseJobSid,
      VoucherDate: this.parseNgbDateToISO(formValue.VoucherDate),
      PostDate: formValue.PostedOn ? this.parseNgbDateToISO(formValue.PostedOn) : null,
      status: formValue.Status,
      CreatedBy: this.currUserEmail || 'System',
      UpdatedBy: this.currUserEmail || 'System'
    };

    // Add details
    payload.VoucherDetail = formValue.voucherDetails.map((detail: any, index: number) => ({
      Sno: index + 1,
      ChargeMasterSid: detail.ChargeMasterSid,
      ChargeDescription: detail.ChargeDescription,
      HSSACMasterSid: detail.HSSACMasterSid,
      ChargeUOMSid: detail.ChargeUOMSid,
      NumberOfUnit: detail.NumberOfUnit,
      Rate: detail.Rate,
      Amount: detail.Amount,
      TaxableAmount: detail.TaxableAmount,
      TaxPercentage1: detail.CGSTPercentage || detail.VATPercentage || 0,
      TaxAmount1: detail.CGST || detail.VAT || 0,
      TaxPercentage2: detail.SGSTPercentage || 0,
      TaxAmount2: detail.SGST || 0,
      LocalAmount: detail.LocalAmount,
      CurrencyCode: detail.CurrencyCode,
      CurrencyMasterSid: this.currencyList.find(c => c.currencyCode === detail.CurrencyCode)?.CurrencyMasterSid,
      ExchangeRate: detail.ExchangeRate,
      DrCr: detail.DrCr,
      LedgerMasterSid: detail.LedgerMasterSid,
      MasterJobSid: detail.MasterJobSid,
      HouseJobSid: detail.HouseJobSid,
      Remarks: detail.Remarks
    }));

    // Add TDS if available
    if (this.tdsConfig) {
      payload.VoucherTDS = {
        TDSSetRateSid: this.tdsConfig.tdsSetRateSid,
        ITSectionCode: formValue.voucherTDS.ITSectionCode,
        TDSRate: formValue.voucherTDS.Percentage,
        TaxableAmount: formValue.voucherTDS.TaxableAmt,
        TDSAmount: formValue.voucherTDS.TDSAmt,
        Reason: formValue.voucherTDS.Reason
      };
    }

    // Add others (include Remarks from root form)
    payload.VoucherOthers = {
      ...formValue.voucherOthers,
      Remarks: formValue.Remarks || ''
    };

    return payload;
  }

  onReset() {
    if (this.isEditMode) {
      this.loadVendorInvoiceById(this.headerId!);
    } else {
      this.vendorInvoiceForm.reset();
      this.details.clear();
      this.tdsGroup.reset();
      const currencySettings = this.companySettings.getCurrencySettings();
      this.vendorInvoiceForm.patchValue({
        CurrencyCode: currencySettings.code,
        ExchangeRate: 1,
        InvoiceType: 'B2B',
        Status: 'A'
      });
    }
  }

  onCancel() {
    this.router.navigate(['/operation/vendor-invoice/list']);
  }

  onPrint() {
    window.print();
  }

  getChargeName(chargeMasterSid: number): string {
    if (!chargeMasterSid) return '-';
    const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeMasterSid);
    return charge?.chargeCode ||  '-';
  }

  onSubmit() {
    if (this.vendorInvoiceForm.invalid) {
      this.markFormGroupTouched(this.vendorInvoiceForm);
      this.appSettingService.showError('Please fill all required fields');
      return;
    }

    if (this.details.length === 0) {
      this.appSettingService.showError('Please add at least one detail row');
      return;
    }

    const payload = this.preparePayload();
    this.isSaving = true;
    this.spinner.show();

    if (this.isEditMode && this.headerId) {
      // Update existing vendor invoice
      this.operationService.updateVendorInvoiceById(this.headerId, payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          this.isSaving = false;
          if (response.status) {
            this.appSettingService.showSuccess('Vendor Invoice updated successfully');
            this.router.navigate(['/operation/vendor-invoice/list']);
          } else {
            this.appSettingService.showError('Failed to update Vendor Invoice');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.isSaving = false;
          this.appSettingService.showError('Error updating Vendor Invoice');
          console.error('Error:', error);
        }
      });
    } else {
      // Create new vendor invoice
      this.operationService.createVendorInvoice(payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          this.isSaving = false;
          if (response.status) {
            this.appSettingService.showSuccess('Vendor Invoice created successfully');
            this.router.navigate(['/operation/vendor-invoice/list']);
          } else {
            this.appSettingService.showError('Failed to create Vendor Invoice');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.isSaving = false;
          this.appSettingService.showError('Error creating Vendor Invoice');
          console.error('Error:', error);
        }
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.vendorInvoiceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isDetailFieldInvalid(index: number, fieldName: string): boolean {
    const row = this.details.at(index) as FormGroup;
    const field = row.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  setToday(fieldName: string, datepicker: any): void {
    const today = new Date();
    const ngbDate = { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() };
    this.vendorInvoiceForm.get(fieldName)?.setValue(ngbDate);
    datepicker.close();
  }

  onCurrencyChange(event: any): void {
    console.log(event,'onCurrencyChange')
    const currencySid = event?.CurrencyMasterSid || event;
    if (!currencySid) return;

    const currency = this.currencyList.find(c => c.CurrencyMasterSid === currencySid);
    if (currency) {
      this.vendorInvoiceForm.patchValue({
        CurrencyCode: currency.currencyCode,
        ExchangeRate: currency.ExchangeRate || 1
      });
      this.recalculateAllRows();
    }
  }

  onExchangeRateChange(): void {
    this.recalculateAllRows();
  }

  // Utility methods
  round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  formatDateForNgb(date: string | Date | null): NgbDateStructLike | null {
    if (!date) return null;
    const d = new Date(date);
    return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  }

  parseNgbDateToISO(ngbDate: NgbDateStructLike | null): string | null {
    if (!ngbDate) return null;
    const d = new Date(ngbDate.year, ngbDate.month - 1, ngbDate.day);
    return d.toISOString();
  }

  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
