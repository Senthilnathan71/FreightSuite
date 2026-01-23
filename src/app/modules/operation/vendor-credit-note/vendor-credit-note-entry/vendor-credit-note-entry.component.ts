import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, AbstractControl, FormArray, FormBuilder, Validators, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { OperationService } from '../../operation.service';
import { catchError, firstValueFrom, of } from 'rxjs';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { CommonService } from 'src/app/common/common.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { toNumber } from 'src/app/common/helper';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';

interface NgbDateStructLike { day: number; month: number; year: number; }

@Component({
  selector: 'app-vendor-credit-note-entry',
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
    SearchableDropdown,
    NgbDropdownModule
  ],
  templateUrl: './vendor-credit-note-entry.component.html',
  styleUrl: './vendor-credit-note-entry.component.scss'
})
export class VendorCreditNoteEntryComponent {
  vendorCreditNoteForm!: FormGroup;
  headerId: number | null = null;
  currentCompany: any;
  currentBranch: any;
  vendorCreditNoteData: any;
  currentCompanyCurrency : any;
  currentCompanyCountry : any;

  currUserEmail: string | null = null;
  isViewMode: boolean = false;
  get isEditMode() { return !!this.headerId && !this.isViewMode; }
  vendorInvoiceList: any[] = [];
  vendorList: any[] = [];
  vendorBranchList: any[] = [];
  currencyList: any[] = [];
  chargeList: any[] = [];
  hssacList: any[] = [];
  subledgerList: any[] = [];
  uomList: any[] = [];
  masterJobList: any[] = [];
  houseJobList: any[] = [];
  stateList: any[] = [];
  houseJobListByMasterJob: { [key: number]: any[] } = {};
  selectedVendorForCosts: any = null; 
  allPendingCosts: any[] = []; 
  searchVendors: any[] = []; 
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;
  currentMenuId: number;
   MenuMasterSid: any;
     TandCList: any[]=[];
  CurrencyLookupConfig = {
  displayFields: ['currencyCode', 'currencyName','countryName'],
  displayLabels: ['Code', 'Name','Country'],
  labelFields: ['currencyCode'],
};

HSSACLookupConfig = {
  displayFields: ['HSSACCode', 'HSSACName'],
  displayLabels: ['Code', 'Name'],
  labelFields: ['HSSACCode'],
};
 departmentList: any[] = [];
  departmentLookupConfig = {
    displayFields: ['departmentCode', 'departmentName'],
    displayLabels: ['Code', 'Name'],
    labelFields: ['departmentName'],
  };
  // Add master job config with other configs
masterJobLookupConfig = {
  displayFields: ['MasterJobNumber', 'MBLNo'],
  displayLabels: ['Job No', 'MBL No'],
  labelFields: ['MasterJobNumber'],
};
  userData: any;
  currentDate = new Date();
  private pendingBranchToSelect: number | null = null;
  private originalInvoiceRates: Map<number, number> = new Map();
  invoiceOutstandingAmount: number = 0;
  selectedOutstandingInvoice: any = null;
  showOutstandingInfo: boolean = false;
  invoiceLookupConfig = DROPDOWN_CONFIGS.INVOICE;
  // UI state
  selectedTab = 'VendorCreditNote';
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }
  tabs = [
    { name: 'VendorCreditNote', icon: 'fas fa-file-invoice' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' }
  ];

  reason =[
    {id: 'Service Cancelled', name: 'Service Cancelled'},  
    {id: 'Discount', name: 'Discount'},
    {id: 'Service Deficiency', name: 'Service Deficiency'},
    {id: 'Correction on Invoice', name: 'Correction on Invoice'},
    {id: 'Tax Changes', name: 'Tax Changes'},
    {id: 'Place of Supply Change', name: 'Place of Supply Change'},
    {id: 'Others', name: 'Others'},
  ]

  invoiceTypes = [
  { id: 'REG', name: 'Regular' },
  { id: 'REIMB', name: 'Reimbursement' },
  { id: 'BOS', name: 'Bill of Supply' },
  { id: 'NONGST', name: 'Non GST/Zero' },
];

gstTypes = [
  { id: 'B2B', name: 'B2B - Business to Business' },
  { id: 'B2C', name: 'B2C - Business to Customer' },
  { id: 'EXWP', name: 'Export With Payment' },
  { id: 'EXWOP', name: 'Export Without Payment' }
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
    { id: 'Customer', name: 'Customer' },
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
  // tdsConfig: any = null;
  currentUserState: string;
  currentFinancialYear : number;
  currentCountry : number;
  currentCurrency: number;
  currentUserCurrency : string;
  currentUserCountry : string;
  // Country/Tax mode
  bookingModeCountry: string = 'india';

  get isIndiaGST(): boolean {
    return this.currentUserCountry === 'india';
  }
  get isVATMode(): boolean {
    return this.currentUserCountry !== 'india';
  }

  get f(): { [key: string]: AbstractControl } {
    return this.vendorCreditNoteForm.controls;
  }
  get details(): FormArray {
    return this.vendorCreditNoteForm.get('voucherDetails') as FormArray;
  }
  // get tdsGroup(): FormGroup {
  //   return this.vendorCreditNoteForm.get('voucherTDS') as FormGroup;
  // }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private companySettings: CompanySettingsManagerService,
    public mps: MenuPermissionService,
    private ngbModal: NgbModal,
    private commonService: CommonService,
    private masterService: MasterService,
    private currencyFormatter: CurrencyFormatService,
    private currencyConfigService : CurrencyConfigurationService,
  ) {}

  ngOnInit(): void {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    this.MenuMasterSid =  localStorage.getItem('currentMenuId');
    try {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.currentFinancialYear = Number(localStorage.getItem('current-year-id'));
    this.currentCompanyCountry = this.appSettingService.getCurrentCompanyCountry();
    this.currentCompanyCurrency = this.companySettings.getCurrencySettings();
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentUserCountry = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
    this.currentCountry= Number(this.currentCompany?.CountryMasterSid)
    this.currentCurrency=Number(this.currentCompany?.CurrencyMasterSid)
    this.currentUserCurrency = String(this.currentCompany?.currencyMaster?.currencyName).trim().toLowerCase();
    this.currentUserState = String(this.currentBranch?.stateMaster?.stateName).trim().toLowerCase();

    console.log('=== INITIAL COMPANY DATA ===');
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    console.log('Company State:', this.currentUserState);
    console.log('Company Currency:', this.currentUserCurrency);
    console.log('Current Country:', this.currentCountry);
    console.log('Current Currency:', this.currentCurrency);
    console.log('Current Financial Year:', this.currentFinancialYear);

    // Set country mode from company settings
    if (this.currentCompany?.CountryName) {
      this.bookingModeCountry = this.currentCompany.CountryName.toLowerCase();
      console.log('DEBUG - Booking mode country:', this.bookingModeCountry);
    }
  } catch (e) {
    console.error('Error loading company data:', e);
    this.currentCompany = null;
    this.currentBranch = null;
  }


    this.initForm();
    this.loadLookups();
    this.vendorCreditNoteForm.get('GSTType')?.valueChanges.subscribe((value) => {
    console.log('GSTType changed to:', value);
    this.recalculateAllRows();
  });
    this.mps.init().subscribe();
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
        this.isViewMode = false;
        this.loadVendorCreditNoteById(this.headerId);
      } else {
        const currencySettings = this.companySettings.getCurrencySettings();
        console.log(currencySettings,'currencySettings')
        this.vendorCreditNoteForm.patchValue({
          CurrencyCode: currencySettings.code,
          ExchangeRate: 1
        });
      }
    });

    // Recalculate when currency/exchange rate changes
    this.vendorCreditNoteForm.get('CurrencyCode')?.valueChanges.subscribe(() => {
      this.recalculateAllRows();
    });

    this.vendorCreditNoteForm.get('ExchangeRate')?.valueChanges.subscribe(() => {
      this.recalculateAllRows();
    });
  }

  initForm() {
    this.vendorCreditNoteForm = this.fb.group({
      // Header
      VoucherNumber: [{ value: '', disabled: true }],
      ReversalVoucher:[null],
      VoucherDate: [this.formatDateForNgb(new Date()), Validators.required],
      PartyMasterSid: [{ value: null, disabled: true }], // Vendor
      PartyName:  [{ value: '', disabled: true }],
      PartyAddress: [{ value: '', disabled: true }],
      GSTNo: [{ value: '', disabled: true }],
      PlaceOfSupply: [{ value: '', disabled: true }],
      PostedOn: [{ value: null, disabled: true }],
      CustomerBranchSid: [{ value: null, disabled: true }],
      CurrencyCode: [{ value: '', disabled: true }],
      ExchangeRate: [{ value: 1, disabled: true }],
      IRNNumber: [{ value: '', disabled: true }],
      IRNStatus: [{ value: '', disabled: true }],
      State : [{ value: '', disabled: true }],
      DepartmentMasterSid: [{ value: null, disabled: true }],
      HouseNumber: [{ value: '', disabled: true }],
      MasterNumber: [{ value: '', disabled: true }],
      BookingHeaderSid: [{ value: null, disabled: true }],
      CurrencyMasterSid: [{ value: null, disabled: true }],
      BillNo: [{ value: '', disabled: true }],
      BillDate: [{ value: null, disabled: true }],
      BillAmt: [{ value: 0, disabled: true }],
      MBLNo: [{ value: '', disabled: true }],
      HBLNo: [{ value: '', disabled: true }],
      PostStatus:[{ value: 'U', disabled: true }],
      InvoiceType: [{ value: 'B2B', disabled: true }],
      GSTType: [{ value: '', disabled: true }],
      Narration: [{ value: '', disabled: true }],
      Remarks: [{ value: '', disabled: true }],
      MasterJobSid: [{ value: null, disabled: true }],
      HouseJobSid: [{ value: null, disabled: true }],
      CreditNoteReason: [''],
      Status: [{ value: 'A', disabled: true }],

      // Details Array
      voucherDetails: this.fb.array([]),

      // TDS Section
      // voucherTDS: this.fb.group({
      //   TDSSet: [{ value: '', disabled: true }],
      //   TDSCompany: [{ value: '', disabled: true }],
      //   ITSectionType: [{ value: '', disabled: true }],
      //   ITSectionCode: [{ value: 'null', disabled: true }],
      //   CertificateNo: [{ value: '', disabled: true }],
      //   Percentage: [{ value: 0, disabled: true }],
      //   TaxableAmt: [{ value: 0, disabled: true }],
      //   TDSSetRateSid: [{ value: 0, disabled: true }],
      //   TDSAmt: [{ value: 0, disabled: true }],
      //   Reason: [''],
      //   TDSSectionCode:[''],
      //   TDSNature:[''],
      //   TDSCompanyType:[''],
      //   TDSPercent:[''],
      //   TDSAccountCode:['']
      // }),

      // Others
      voucherOthers: this.fb.group({
        ContainerNumber: [''],
        VoucherNote: [''],
        Footer: ['']
      })
    });
  }

  private autoGenerateNarration(reversalVoucher: any): string {
  if (!reversalVoucher) return '';
  
  let voucherNumber = '';
  let voucherType = '';
  
  // Extract voucher number
  if (typeof reversalVoucher === 'object' && reversalVoucher !== null) {
    voucherNumber = reversalVoucher.VoucherNumber || reversalVoucher.voucherNumber || '';
    voucherType = reversalVoucher.VoucherType || reversalVoucher.voucherType || '';
  } else {
    // If it's just an ID, find the voucher in the list
    const foundVoucher = this.vendorInvoiceList.find(inv => 
      inv.VoucherHeaderSid === reversalVoucher || inv.voucherHeaderSid === reversalVoucher
    );
    if (foundVoucher) {
      voucherNumber = foundVoucher.VoucherNumber || foundVoucher.voucherNumber || '';
      voucherType = foundVoucher.VoucherType || foundVoucher.voucherType || '';
    }
  }
  
  if (voucherNumber) {
    return `Being reversal of ${voucherNumber}${voucherType ? ` - ${voucherType}` : ''}`;
  }
  
  return '';
}

  getVendorInvoiceData(data?:any) {
    const id = data || this.vendorCreditNoteForm.get('ReversalVoucher')?.value;
    if (!id) {
      this.appSettingService.showWarning('Please select an vendor invoice first.');
      return;
    }

    let reversalVoucherId = id;
    let vendorInvoiceNumber = '';

    if (typeof reversalVoucherId === 'object' && reversalVoucherId !== null) {
      vendorInvoiceNumber = reversalVoucherId.VoucherNumber || reversalVoucherId.voucherNumber || '';
      reversalVoucherId = reversalVoucherId.VoucherHeaderSid || reversalVoucherId.voucherHeaderSid;
          const autoNarration = this.autoGenerateNarration(reversalVoucherId);
    this.vendorCreditNoteForm.get('Narration')?.setValue(autoNarration);
    } else {
      const foundVendorInvoice = this.vendorInvoiceList.find(inv => 
        inv.VoucherHeaderSid === reversalVoucherId || inv.voucherHeaderSid === reversalVoucherId
      );
      vendorInvoiceNumber = foundVendorInvoice?.VoucherNumber || foundVendorInvoice?.voucherNumber || '';
       const autoNarration = this.autoGenerateNarration(reversalVoucherId);
    this.vendorCreditNoteForm.get('Narration')?.setValue(autoNarration);
    }
    this.spinner.show();
    this.operationService.getVendorInvoicesById(id).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          this.vendorCreditNoteForm.patchValue({
            ReversalVoucher: reversalVoucherId
          });
          this.patchVendorInvoiceData(resp.data);
          this.searchOutstandingForVendorInvoice(vendorInvoiceNumber, resp.data);
          this.appSettingService.showSuccess('Vendor Invoice data loaded successfully.');
        } else {
          this.spinner.hide();
          this.appSettingService.showError('Error loading vendor invoice data.');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Error fetching vendor invoice:', err);
        this.appSettingService.showError('Failed to load vendor invoice data.');
      }
    });
  }

  private searchOutstandingForVendorInvoice(invoiceNumber: string, invoiceData: any) {
  if (!invoiceNumber || !this.currentCompany?.CompanyMasterSid) {
    this.spinner.hide();
    console.log('DEBUG - Cannot search outstanding: missing invoice number or company');
    return;
  }

  const searchDto = {
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    InvoiceNumber: invoiceNumber,
    IncludeFullyPaid: false
  };

  console.log('DEBUG - Searching outstanding for invoice:', searchDto);

  this.operationService.searchOutstandingInvoices(searchDto).subscribe({
    next: (response: any) => {
      this.spinner.hide();
      console.log('DEBUG - Outstanding invoices response:', response);
      
      // Extract the array from the response
      const outstandingInvoices = response.data || response || [];
      
      // Find the specific invoice in outstanding results
      const matchingOutstanding = outstandingInvoices.find((inv: any) => 
        inv.VoucherNumber === invoiceNumber
      );
      
      if (matchingOutstanding) {
        const outstandingAmount = Math.abs(matchingOutstanding.OutstandingLocalAmount);
        
        console.log('DEBUG - Outstanding amount found:', {
          invoiceNumber: invoiceNumber,
          outstandingAmount: outstandingAmount,
          originalAmount: matchingOutstanding.OriginalAmount,
          matchedAmount: matchingOutstanding.MatchedAmount,
          currency: matchingOutstanding.CurrencyCode
        });
        
        // Store the outstanding information
        this.invoiceOutstandingAmount = outstandingAmount;
        this.selectedOutstandingInvoice = matchingOutstanding;
        this.showOutstandingInfo = true;
        
        
      } else {
        this.invoiceOutstandingAmount = 0;
        this.showOutstandingInfo = false;
        console.log('DEBUG - No outstanding amount found for invoice:', invoiceNumber);
        this.appSettingService.showInfo('No outstanding amount found for this invoice.');
      }
    },
    error: (error) => {
      this.spinner.hide();
      console.error('Error searching outstanding invoices:', error);
      this.invoiceOutstandingAmount = 0;
      this.showOutstandingInfo = false;
      this.appSettingService.showWarning('Could not fetch outstanding amount, but invoice data was loaded.');
    }
  });
}

  private patchVendorInvoiceData(data: any) {
    const header = data;
    const vendorCreditNote = header.VoucherHeaderSid || header.voucherHeaderSid || null;
    this.originalInvoiceRates = new Map();
      const currentNarration = this.vendorCreditNoteForm.get('Narration')?.value;
  const autoNarration = this.autoGenerateNarration(this.vendorCreditNoteForm.get('ReversalVoucher')?.value);
    this.vendorCreditNoteForm.patchValue({
      ReversalVoucher: vendorCreditNote,
      Narration: autoNarration || header.Narration || '',
      PartyMasterSid: header.PartyMasterSid || null,
      PartyName: header.PartyName || '',
      PartyAddress: header.PartyAddress || '',
      CustomerBranchSid: header.CustomerBranchSid || null,
      COAMasterSid: header.COAMasterSid || null,
      GSTNo: header.GST_VAT || '',
      GSTType: header.GSTType || '',
      PlaceOfSupply: header.PlaceOfSupply || '',
      InvoiceType: header.InvoiceType || '',
      IRNNumber: header.IRNNumber || '',
      IRNStatus: header.IRNStatus || '',
      State: header.State || "",
      DepartmentMasterSid: header.DepartmentMasterSid || null,
      HouseNumber: header.HouseNumber || "",
      MasterNumber: header.MasterNumber || "",
      HouseJobSid: header.HouseJobSid || null,
      BookingHeaderSid: header.BookingHeaderSid || null,
      CurrencyMasterSid: header.CurrencyMasterSid || null,
      CurrencyCode: header.currencyMaster?.currencyCode || header.CurrencyCode || null,
      ExchangeRate: header.ExchangeRate || header.ExRate || 1,
      BillAmount: header.Amount || 0,
      BillDate: this.toNgbDate(header.DocumentDate),
      BillNo: header.DocumentNumber || '',
      MBLNo: header.MasterNumber || '',
      HBLNo: header.HouseNumber || '',
      Remarks: header.Remarks || '',
    });
    const customerMasterSid = header.CustomerMasterSid;
    if (customerMasterSid) {
      this.vendorCreditNoteForm.get('CustomerMasterSid')?.setValue(customerMasterSid);
      const customer = this.vendorList.find(c => c.CustomerMasterSid === customerMasterSid);
      if (customer) {
        this.vendorCreditNoteForm.get('PartName')?.setValue(customer.CustomerName || '');
        if (customer.SubledgerMasterSid) {
          this.vendorCreditNoteForm.get('PartyMasterSid')?.setValue(Number(customer.SubledgerMasterSid));
        }
      }
      this.getVendorBranchByVendor(Number(customerMasterSid));
      const branchSid = header.CustomerBranchSid;
      if (branchSid) {
        setTimeout(() => {
          this.vendorCreditNoteForm.get('CustomerBranchSid')?.setValue(Number(branchSid));
          const foundBranch = this.vendorBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));
          if (foundBranch) {
            this.vendorCreditNoteForm.get('PartyAddress')?.setValue(foundBranch.Address || foundBranch.CustomerAddress1 || '');
          }
        }, 500);
      }
    }

    let detailsFromVendorInvoice: any[] = [];

    if (header.VoucherTransaction && Array.isArray(header.VoucherTransaction)) {
      detailsFromVendorInvoice = header.VoucherTransaction
      .filter((transaction: any) => transaction.voucherDetail) // Only transactions with voucherDetail
      .map((transaction: any) => {
        const detail = transaction.voucherDetail;
        const transactionData = transaction; // Main transaction data
        if (detail.ChargeMasterSid && detail.Rate != null) {
          const chargeId = Number(detail.ChargeMasterSid);
          const originalRate = Number(detail.Rate);
          
          this.originalInvoiceRates.set(chargeId, originalRate);
          
          console.log(`DEBUG - Stored original rate for charge ${chargeId}: ${originalRate}`);
        }
        return {
          ...detail,
          // Include transaction-level data that might be needed
          Amount: transaction.Amount || detail.Amount,
          LocalAmount: transaction.LocalAmount || detail.LocalAmount,
          TaxAmount1: transaction.TaxAmount1 || detail.TaxAmount1,
          TaxAmount2: transaction.TaxAmount2 || detail.TaxAmount2,
          TaxPercentage1: transaction.TaxPercentage1 || detail.TaxPercentage1,
          TaxPercentage2: transaction.TaxPercentage2 || detail.TaxPercentage2,
        };
      });
    }
    if (detailsFromVendorInvoice.length === 0) {
    detailsFromVendorInvoice = data.voucherDetails 
      || data.voucherDetail 
      || data.VoucherDetail 
      || data.VoucherDetails 
      || [];
  }
  console.log('DEBUG - Extracted voucher details:', detailsFromVendorInvoice);
  this.details.clear();
  detailsFromVendorInvoice.forEach((detail: any) => {
    const amount = detail.Amount ? (Number(detail.Amount)) : 0;
    const taxableAmount = detail.TaxableAmount ? (Number(detail.TaxableAmount)) : 0;
    const taxAmount1 = detail.TaxAmount1 ? (Number(detail.TaxAmount1)) : 0;
    const taxAmount2 = detail.TaxAmount2 ? (Number(detail.TaxAmount2)) : 0;
    const localAmount = detail.LocalAmount ? (Number(detail.LocalAmount)) : 0;
    const partyAmount = detail.PartyAmount ? (Number(detail.PartyAmount)) : 0;

    const taxPercentage1 = detail.TaxPercentage1 !== undefined ? Number(detail.TaxPercentage1) : 
                        detail.taxPercentage1 !== undefined ? Number(detail.taxPercentage1) : 0;
  
    const taxPercentage2 = detail.TaxPercentage2 !== undefined ? Number(detail.TaxPercentage2) : 
                        detail.taxPercentage2 !== undefined ? Number(detail.taxPercentage2) : 0;
  
    console.log('DEBUG - Tax percentages for detail:', {
      taxPercentage1,
      taxPercentage2,
      taxAmount1,
      taxAmount2,
      chargeDescription: detail.ChargeDescription
    });

    // For credit note, typically use 'Cr' for credit entries
    const originalDrCr = detail.DrCr || detail.drCr || 'D';
    const swappedDrCr = originalDrCr === 'C' ? 'D' : 'C';

    console.log('DEBUG - Dr/Cr swap:', {
      original: originalDrCr,
      swapped: swappedDrCr,
      chargeDescription: detail.ChargeDescription
    });
    const gstType = this.vendorCreditNoteForm.get('GSTType')?.value || header.GSTType;
    console.log('DEBUG - Using GST Type for tax mapping:', gstType);
    let mappedTaxValues = {
      TaxPercentage1: 0,
      TaxAmount1: 0,
      TaxPercentage2: 0,
      TaxAmount2: 0,
    };
    if (this.currentUserCountry !== 'india') {
      // VAT mode - use TaxPercentage1/TaxAmount1 for VAT
      mappedTaxValues = {
        TaxPercentage1: taxPercentage1,
        TaxAmount1: taxAmount1,
        TaxPercentage2: 0,
        TaxAmount2: 0,
        
      };
    } else {
      // India GST - map based on GST type
      if (gstType === 'CGST+SGST') {
        // CGST+SGST mode - both taxes present
        mappedTaxValues = {
          TaxPercentage1: taxPercentage1,
          TaxAmount1: taxAmount1,
          TaxPercentage2: taxPercentage2,
          TaxAmount2: taxAmount2,
          
        };
      } else if (gstType === 'IGST') {
        // IGST mode - single IGST tax
        mappedTaxValues = {
          TaxPercentage1: taxPercentage1,
          TaxAmount1: taxAmount1,
          TaxPercentage2: 0,
          TaxAmount2: 0,
        
        };
      } else if (gstType === 'B2C') {
        // B2C mode - only CGST
        mappedTaxValues = {
          TaxPercentage1: taxPercentage1,
          TaxAmount1: taxAmount1,
          TaxPercentage2: 0,
          TaxAmount2: 0,
          
        };
      } else {
        // Default: preserve all values as they are
        mappedTaxValues = {
          TaxPercentage1: taxPercentage1,
          TaxAmount1: taxAmount1,
          TaxPercentage2: taxPercentage2,
          TaxAmount2: taxAmount2,
          
        };
      }
    }
    this.details.push(this.createDetailGroup({
      VoucherDetailSid: detail.VoucherDetailSid,
      ChargeMasterSid: detail.ChargeMasterSid,
      ChargeDescription: detail.ChargeDescription,
      HSSACMasterSid: detail.HSSACMasterSid,
      LedgerMasterSid : detail.LedgerMasterSid,
      COAMasterSid : detail.COAMasterSid,
      ChargeUOMSid: detail.ChargeUOMSid,
      DepartmentMasterSid: detail.DepartmentMasterSid,
      NumberOfUnit: detail.NumberOfUnit,
      DrCr: swappedDrCr,
      CurrencyCode: detail.CurrencyCode,
      Rate: detail.Rate != null ? Number(detail.Rate) : 0,
      ExchangeRate: detail.ExchangeRate,
      Amount: amount,
      TaxableAmount: taxableAmount,
      TaxPercentage1: mappedTaxValues.TaxPercentage1,
      TaxAmount1: mappedTaxValues.TaxAmount1,
      TaxPercentage2: mappedTaxValues.TaxPercentage2,
      TaxAmount2: mappedTaxValues.TaxAmount2,
      MasterNumber : header.MasterNumber || detail.masterJob?.MasterJobNumber,
      HouseNumber : header.HouseNumber || detail.houseJob?.HouseNo,
      YearMasterSid : detail.YearMasterSid,
      LocalAmount: localAmount,
      PartyAmount: partyAmount,
      MasterJobSid: detail.MasterJobSid,
      HouseJobSid: detail.HouseJobSid
    }));
  });

  this.recalculateAllRows();

  const voucherOthersSource = data.VoucherOthers 
      || data.voucherOthers 
      || (Array.isArray(data.voucherOthers) ? data.voucherOthers[0] : undefined);
  
    if (voucherOthersSource) {
      const vg = this.vendorCreditNoteForm.get('voucherOthers') as FormGroup;
      vg.patchValue({
        ContainerNumber: voucherOthersSource.ContainerNumber || '',
        VoucherNote: voucherOthersSource.VoucherNote || '',
        Footer: voucherOthersSource.Footer || '',
        ReverseCreditNote: voucherOthersSource.ReverseCreditNote || '',
        DueDate: this.toNgbDate(voucherOthersSource.DueDate),
        IRNNumber: voucherOthersSource.IRNNumber || ''
      });
    }
  
    console.log('DEBUG - Final details array length:', this.details.length);

  }

  private toNgbDate(d: any): NgbDateStructLike | null {
    if (!d) return null;
    const dt = (typeof d === 'string' || typeof d === 'number') ? new Date(d) : d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return null;
    return { year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() };
  }

  onFinalSave() {
  if (this.vendorCreditNoteForm.invalid) {
    this.vendorCreditNoteForm.markAllAsTouched();
    this.appSettingService.showWarning('Please fill required vendor creditNote fields.');
    return;
  }

  if (this.details.length === 0) {
    this.appSettingService.showWarning('Please add at least one charge line.');
    return;
  }

  this.recalculateAllRows();
  this.saveVendorCreditNote(true); // true indicates final save
}

private saveVendorCreditNote(isFinal: boolean) {
  const payload = this.preparePayload();

  this.spinner.show();
  
  const saveObservable = this.headerId 
    ? this.operationService.updateVendorCreditNoteById(this.headerId, payload)
    : this.operationService.createVendorCreditNote(payload);

  saveObservable.subscribe({
    next: async (resp: any) => {
      if (resp?.status) {
        const voucherHeaderSid = resp.data?.newVoucher?.VoucherHeaderSid || resp.data?.VoucherHeaderSid || this.headerId;
        
        if (isFinal && voucherHeaderSid) {
          // If final save, post the voucher
          await this.postVoucher(voucherHeaderSid);
        } else {
          this.spinner.hide();
          const message = isFinal ? 'Vendor creditNote saved and posted successfully!' : 'Vendor creditNote saved as draft successfully!';
          this.appSettingService.showSuccess(message);
          
          if (!this.headerId && voucherHeaderSid) {
            this.headerId = voucherHeaderSid;
            this.router.navigate(['operation/vendor-credit-note/entry', voucherHeaderSid]);
          }
        }
      } else {
        this.spinner.hide();
        this.appSettingService.showError('Error saving vendor creditNote.');
      }
    },
    error: (err) => {
      this.spinner.hide();
      console.error('Save vendor creditNote error', err);
      this.appSettingService.showError('Failed to save vendor creditNote.');
    }
  });
}

private async postVoucher(voucherHeaderSid: number) {
  try {
    const currentCompany = this.currentCompany;
    const currentBranch = this.currentBranch;
    const currentFinancialYear = Number(localStorage.getItem('current-year-id'));
    const currentCountry =Number(this.currentCompany?.CountryMasterSid);
    const currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
    const currentCountryName = String(this. currentCompany?.countryMaster?.countryName).trim().toLowerCase();
    const currentUserEmail =  this.userData?.userEmail;
    
 
    
    if (!currentCompany || !currentBranch || !currentFinancialYear || !currentCountry || !currentCurrency) {
      throw new Error('Company, branch, or financial year or country information is missing');
     
    }

    const postPayload = {
      VoucherHeaderSid: voucherHeaderSid,
      CompanyMasterSid: currentCompany.CompanyMasterSid,
      BranchMasterSid: currentBranch.BranchMasterSid,
      YearMasterSid: currentFinancialYear,
      LocalCurrencyMasterSid: currentCurrency  ,
      LocalCurrencyCode:this.currentCompanyCurrency.code , 
      PostedBy: currentUserEmail ,
      TaxDetails: {
        CountryMasterSid: currentCountry,
        countryCode: String(this.currentCompanyCountry.countryCode).toLowerCase(),
        TaxCategory: 'Inter', 
        EffectiveFrom: new Date().toISOString(),
        TaxType: 'Output' 
      }
    };

    const result = await firstValueFrom(this.operationService.postVoucherByVoucherSid(postPayload));
    
    this.spinner.hide();
    if (result.status) {
      this.appSettingService.showSuccess('Vendor Credit Note posted successfully!');
      this.vendorCreditNoteData.PostStatus = 'P'; // Update local state
      
      // Navigate to list or stay on page but disable edits
      this.router.navigate(['operation/vendor-credit-note/list']);
    } else {
      this.appSettingService.showError(result.message || 'Failed to post Vendor Credit Note.');
    }
  } catch (error) {
    this.spinner.hide();
    console.error('Post voucher error:', error);
    this.appSettingService.showError('Failed to post Vendor Credit Note. Please try again.');
  }
}

async loadDepartments(companyMasterSid: number) {
  if (!companyMasterSid) {
    this.departmentList = [];
    return;
  }
  try {
    const departments: any = await firstValueFrom(this.operationService.getAllDepartments(companyMasterSid));
    if (departments && Array.isArray(departments)) {
      this.departmentList = departments;
    } else if (departments?.data && Array.isArray(departments.data)) {
      this.departmentList = departments.data;
    } else if (departments?.status && Array.isArray(departments.data)) {
      this.departmentList = departments.data;
    } else {
      this.departmentList = departments || [];
    }
  } catch (error) {
    console.error('Error loading departments:', error);
    this.departmentList = [];
    throw error;
  }
}
onGSTTypeChange() {
  console.log('GST Type changed to:', this.vendorCreditNoteForm.get('GSTType')?.value);
  this.recalculateAllRows();
}

  createDetailGroup(data?: any): FormGroup {
  return this.fb.group({
    VoucherDetailSid:[data?.VoucherDetailSid || null],
    CostRevenueChargesSid: [data?.CostRevenueChargesSid || null], // Store original cost ID
    ChargeMasterSid: [{value: data?.ChargeMasterSid || null, disabled: true}],
    ChargeDescription: [{value:data?.ChargeDescription || '', disabled: true}],
    HSSACMasterSid: [{value:data?.HSSACMasterSid || null, disabled: true}],
    ChargeUOMSid: [{value:data?.ChargeUOMSid || null, disabled: true}],
    NumberOfUnit: [{value:data?.NumberOfUnit || 1, disabled: true}],
    DrCr: [{value: data?.DrCr || 'D', disabled: true}],
    CurrencyCode: [{value: data?.CurrencyCode || this.vendorCreditNoteForm.get('CurrencyCode')?.value || null, disabled: true}],
    Rate: [data?.Rate != null ? Number(data.Rate) : 0, 
          [Validators.required, Validators.min(0), this.rateValidator.bind(this)]],
    ExchangeRate: [{value:data?.ExchangeRate || this.vendorCreditNoteForm.get('ExchangeRate')?.value || 1, disabled: true}],
    Amount: [{value:data?.Amount || 0 , disabled: true}],
    TaxableAmount: [{value: data?.TaxableAmount || 0, disabled: true}],
    TaxPercentage1: [{value:data?.TaxPercentage1 || 0, disabled: true}],
    TaxAmount1: [{value:data?.TaxAmount1 || 0, disabled: true}],
    TaxPercentage2: [{value:data?.TaxPercentage2 || 0, disabled: true}],
    TaxAmount2: [{value:data?.TaxAmount2 || 0, disabled: true}],
    LocalAmount: [data?.LocalAmount || 0],
    PartyAmount: [data?.PartyAmount || 0],
    MasterJobSid: [{value: data?.MasterJobSid || null, disabled: true}],
    HouseJobSid: [{value: data?.HouseJobSid || null, disabled: true}],
    DepartmentMasterSid: [{value:data?.DepartmentMasterSid || null, disabled: true}],
    LedgerMasterSid: [data?.LedgerMasterSid || null],
    COAMasterSid: [data?.COAMasterSid || null],
    MasterNumber : [data?.masterJob?.MasterJobNumber || data?.MasterNumber || ''],
    HouseNumber : [data?.houseJob?.HouseNo || data?.HouseNumber || ''],
    YearMasterSid : [data?.YearMasterSid || null]
  });
}

private rateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value && control.value !== 0) {
    return null; // Let required validator handle empty values
  }

  const rate = Number(control.value);
  const rowIndex = this.getRowIndexFromControl(control);
  
  if (rowIndex === -1) return null;

  const row = this.details.at(rowIndex);
  if (!row) return null;

  const chargeMasterSid = row.get('ChargeMasterSid')?.value;
  
  if (!chargeMasterSid || !this.originalInvoiceRates) {
    return null; // No original rate to compare against
  }

  const originalRate = this.originalInvoiceRates.get(Number(chargeMasterSid));
  
  // Allow rates less than or equal to original rate, but not greater
  if (originalRate !== undefined && rate > originalRate) {
    return { 
      rateExceeded: {
        actualRate: rate,
        maxAllowedRate: originalRate
      }
    };
  }

  return null;
}
private getRowIndexFromControl(control: AbstractControl): number {
  if (!this.details) return -1;
  
  for (let i = 0; i < this.details.length; i++) {
    const row = this.details.at(i);
    if (row.get('Rate') === control) {
      return i;
    }
  }
  return -1;
}

getDepartmentName(departmentSid: number): string {
  if (!departmentSid || this.departmentList.length === 0) {
    return '-';
  }
  const department = this.departmentList.find(dept => 
    dept.DepartmentMasterSid === departmentSid || 
    dept.departmentMasterSid === departmentSid
  );
  return department?.DepartmentName || department?.departmentName || '-';
}
onDetailChange(index: number, field?: string) {
  if (['NumberOfUnit', 'Rate', 'ExchangeRate', 'TaxPercentage1', 'TaxPercentage2', 'CurrencyCode'].includes(field || '')) {
    this.recalcRow(index);
  } else if (field === 'ChargeMasterSid') {
    const chargeSid = this.details.at(index).get('ChargeMasterSid')?.value;
    const selectedCharge = this.chargeList?.find((c: any) => c.ChargeMasterSid === chargeSid);
    
    if (selectedCharge) {
      const description = selectedCharge.ChargeDescription || selectedCharge.chargeName || selectedCharge.ChargeName || '';
      let hssacId = selectedCharge.HSSACMasterSid ?? selectedCharge.HSSACMasterSid ?? null;
      
      // Auto-set HSN/SAC code from ChargeTaxMaster
      if (!hssacId && Array.isArray(selectedCharge.ChargeTaxMaster) && selectedCharge.ChargeTaxMaster.length > 0) {
        const firstTax = selectedCharge.ChargeTaxMaster[0];
        const hsnCode = firstTax?.HSNCode;
        
        // Find matching HSSAC from hssacList using HSNCode
        if (hsnCode) {
          const matchingHssac = this.hssacList.find(h => 
            h.HSSACCode === hsnCode || h.HSNCode === hsnCode
          );
          if (matchingHssac) {
            hssacId = matchingHssac.HSSACMasterSid;
          }
        }
      }
      
      const chargeUomId = selectedCharge.ChargeUOMSid ?? selectedCharge.UOM ?? selectedCharge.UOMMasterSid ?? null;

      // Auto-set LedgerMasterSid and COAMasterSid
      const ledgerMasterSid = selectedCharge.SubledgerMasterSid || null;
      const coaMasterSid = selectedCharge.DrCOAMappedId || null;

      this.details.at(index).patchValue({
        ChargeDescription: description,
        HSSACMasterSid: hssacId || null,
        ChargeUOMSid: chargeUomId || null,
        Rate: selectedCharge.DefaultRate || selectedCharge.Rate || this.details.at(index).get('Rate')?.value || 0,
        LedgerMasterSid: ledgerMasterSid,
        COAMasterSid: coaMasterSid
      });

      this.recalcRow(index);
    }
  }
}

private async recalcRow(index: number) {
  const row = this.details.at(index);
  if (!row) return;
  const headerCurrency = this.vendorCreditNoteForm.get('CurrencyCode')?.value;
  // if (row.get('CurrencyCode')?.value !== headerCurrency) {
  //   row.get('CurrencyCode')?.setValue(headerCurrency);
  // }

  const unit = Number(row.get('NumberOfUnit')?.value || 0);
  const rate = Number(row.get('Rate')?.value || 0);
  const exRate = Number(row.get('ExchangeRate')?.value || this.vendorCreditNoteForm.get('ExchangeRate')?.value || 1);

  // Calculate basic amounts
  const amount = unit * rate;
  const taxableAmount = amount * exRate;
  const localAmount = amount * exRate;

  // Get GST Type and determine tax applicability
  const gstType = this.vendorCreditNoteForm.get('GSTType')?.value;
  const placeOfSupply = this.vendorCreditNoteForm.get('PlaceOfSupply')?.value;
  const companyState = this.getCompanyState();
  

  console.log('=== TAX CALCULATION DEBUG ===');
  console.log('GST Type:', gstType);
  console.log('Place of Supply:', placeOfSupply);
  console.log('Company State:', companyState);
  const currentTaxPercentage1 = Number(row.get('TaxPercentage1')?.value || 0);
  const currentTaxPercentage2 = Number(row.get('TaxPercentage2')?.value || 0);
  let cgstRate = currentTaxPercentage1;
  let sgstRate = currentTaxPercentage2;
  let vatRate = currentTaxPercentage1;
  const chargeSid = row.get('ChargeMasterSid')?.value;
    if (chargeSid && (cgstRate === 0 && sgstRate === 0  && vatRate === 0)) {
    const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeSid);
    if (charge) {
      const taxLedger = await this.getTaxLedgerForCharge(charge, placeOfSupply);
      
      if (taxLedger && taxLedger.length > 0) {
        // Extract individual tax rates from tax master records
        for (const tax of taxLedger) {
          console.log('Processing tax record:', tax);
          switch (tax.TaxCode) {
            case 'CGST':
              cgstRate = parseFloat(tax.TaxRate || 0);
              break;
            case 'SGST':
              sgstRate = parseFloat(tax.TaxRate || 0);
              break;
            case 'IGST':
              cgstRate = parseFloat(tax.TaxRate || 0);
              break;
            case 'VAT':
              vatRate = parseFloat(tax.TaxRate || 0);
              break;
          }
        }
      } else {
        // Fallback to HSSAC tax rate
        const hssacSid = row.get('HSSACMasterSid')?.value;
        const hssac = this.hssacList.find(h => h.HSSACMasterSid === hssacSid);
        
        if (this.currentUserCountry !== 'india') {
          // VAT - use 5% as default for UAE/non-India
          vatRate = hssac?.TaxRate || 5;
        } else {
          // India GST - use 18% as default
          const defaultTaxRate = hssac?.TaxRate || 18;
          
          if (gstType === 'CGST+SGST') {
            cgstRate = defaultTaxRate / 2;
            sgstRate = defaultTaxRate / 2;
          } else if (gstType === 'IGST') {
            cgstRate = defaultTaxRate;
          } else if (gstType === 'B2C') {
            cgstRate = defaultTaxRate;
          } else {
            cgstRate = defaultTaxRate;
          }
        }
      }
    }
  }

  // Calculate tax amounts based on current rates
  let cgstAmt = 0, sgstAmt = 0, vatAmt = 0;
  
  console.log('Using Tax Rates:', {
    cgstRate,
    sgstRate,
    vatRate,
    gstType,
    taxableAmount
  });

  if (this.currentUserCountry !== 'india') {
    // VAT calculation
    vatAmt = (taxableAmount * vatRate) / 100;
    console.log('VAT Calculation:', {
      taxableAmount,
      vatRate,
      vatAmt,
      formula: `(${taxableAmount} * ${vatRate}) / 100 = ${vatAmt}`
    });
  } else {
    // India GST calculations
    if (gstType === 'CGST+SGST') {
      cgstAmt = (taxableAmount * cgstRate) / 100;
      sgstAmt = (taxableAmount * sgstRate) / 100;
      console.log('CGST+SGST Calculation:', {
        cgstAmt,
        sgstAmt,
        cgstRate,
        sgstRate
      });
    } else if (gstType === 'IGST') {
      cgstAmt = (taxableAmount * cgstRate) / 100;
      console.log('IGST Calculation:', {
        cgstAmt,
        cgstRate
      });
    } else if (gstType === 'B2C') {
      cgstAmt = (taxableAmount * cgstRate) / 100;
      console.log('B2C Calculation:', {
        cgstAmt,
        cgstRate
      });
    } else if (gstType === 'EXWP' || gstType === 'EXWOP') {
      // Export - no tax
      console.log('Export - No tax applied');
    } else {
      // Default to IGST
      cgstAmt = (taxableAmount * cgstRate) / 100;
      console.log('Default IGST Calculation:', {
        cgstAmt,
        cgstRate
      });
    }
  }

  console.log('=== FINAL CALCULATED AMOUNTS ===');
  console.log('CGST Amount:', cgstAmt);
  console.log('SGST Amount:', sgstAmt);
  console.log('IGST Amount:', cgstAmt);
  console.log('VAT Amount:', vatAmt);

  // Update row values - DO NOT CLEAR RATES
  row.get('Amount')?.setValue(this.round(amount));
  row.get('TaxableAmount')?.setValue(this.round(taxableAmount));
  
  // Set tax RATES (keep them as they are or use calculated ones)
  // Set tax AMOUNTS (recalculate based on new taxable amount)
  
  if (this.currentUserCountry !== 'india') {
    // VAT - use TaxPercentage1 for VAT rate, TaxAmount1 for VAT amount
    row.get('TaxPercentage1')?.setValue(this.round(vatRate));
    row.get('TaxAmount1')?.setValue(this.round(vatAmt));
    console.log('Setting VAT - Rate:', vatRate, 'Amount:', vatAmt);
  } else {
    // India GST
    if (gstType === 'CGST+SGST') {
      row.get('TaxPercentage1')?.setValue(this.round(cgstRate));
      row.get('TaxAmount1')?.setValue(this.round(cgstAmt));
      row.get('TaxPercentage2')?.setValue(this.round(sgstRate));
      row.get('TaxAmount2')?.setValue(this.round(sgstAmt));
      console.log('Setting CGST+SGST');
    } else if (gstType === 'IGST') {
      row.get('TaxPercentage1')?.setValue(this.round(cgstRate));
      row.get('TaxAmount1')?.setValue(this.round(cgstAmt));
      console.log('Setting IGST');
    } else if (gstType === 'B2C') {
      row.get('TaxPercentage1')?.setValue(this.round(cgstRate));
      row.get('TaxAmount1')?.setValue(this.round(cgstAmt));
      console.log('Setting B2C');
    } else {
      // Default
      row.get('TaxPercentage1')?.setValue(this.round(cgstRate));
      row.get('TaxAmount1')?.setValue(this.round(cgstAmt));
      console.log('Setting default GST');
    }
  }
  
  row.get('LocalAmount')?.setValue(this.round(localAmount));
  row.get('PartyAmount')?.setValue(this.getPartyAmount(row.value));

  this.updateBillAmount();
  console.log('=== RATE CHANGE DEBUG - END ===');
}
private async getTaxLedgerForCharge(
  charge: any, 
  placeOfSupplyState: string
): Promise<any> {
  try {
    console.log('=== GET TAX LEDGER DEBUG ===');
    console.log('Charge object:', charge);
    
    const taxGroupSid = this.getTaxGroupSidFromCharge(charge);
    console.log('Extracted TaxGroupSid:', taxGroupSid);
    
    if (!taxGroupSid) {
      console.log('No TaxGroupSid found for charge:', charge?.ChargeDescription);
      return null;
    }

    const currentCountry = Number(this.currentCompany?.CountryMasterSid);
    
    // Determine Input/Output - INVOICE = OUTPUT (selling goods/services)
    const inputOrOutput: 'Input' | 'Output' = 'Output'; 
    
    const companyState = this.getCompanyState();
    const customerCountry = this.getCustomerCountryFromCharge(charge);
    const taxCategory = this.determineTaxCategory(companyState, placeOfSupplyState, customerCountry);

    console.log('Tax Ledger Parameters:', {
      charge: charge?.ChargeDescription,
      taxGroupSid,
      inputOrOutput,
      taxCategory,
      companyState,
      placeOfSupplyState,
      customerCountry,
      currentCountry
    });

    const payload = {
      taxGroup: taxGroupSid,
      InputOrOutput: inputOrOutput,
      TaxCategory: taxCategory,
      CountryMasterSid: currentCountry
    };

    console.log('Calling tax ledger API with payload:', payload);

    const response = await firstValueFrom(
      this.operationService.getLedgerForTaxGroup(payload).pipe(
        catchError(error => {
          console.error('Error calling getLedgerForTaxGroup:', error);
          return of(null);
        })
      )
    );

    console.log('Tax Ledger API Response:', response);

    if (response?.status && response.data && response.data.length > 0) {
      const taxGroupData = response.data[0];
      console.log('Tax Group Data:', taxGroupData);
      
      // Return individual tax master records for proper calculation
      if (taxGroupData.taxMaster && Array.isArray(taxGroupData.taxMaster)) {
        console.log('Individual Tax Masters found:', taxGroupData.taxMaster);
        return taxGroupData.taxMaster;
      }
      
      // Fallback to tax group rate if no individual tax masters
      return [taxGroupData];
    } else {
      console.warn('No tax ledger data found for charge:', charge?.ChargeDescription);
      return null;
    }

  } catch (error) {
    console.error('Error fetching tax ledger:', error);
    return null;
  }
}

private getTaxGroupSidFromCharge(charge: any): number | null {
  console.log('DEBUG - getTaxGroupSidFromCharge - charge structure:', charge);
  
  if (!charge) {
    console.log('DEBUG - Charge object is null or undefined');
    return null;
  }

  // Try different possible structures for chargeTaxMaster
  let chargeTaxMaster = charge.ChargeMaster?.chargeTaxMaster;
  
  if (!chargeTaxMaster && charge.chargeTaxMaster) {
    chargeTaxMaster = charge.chargeTaxMaster;
  }
  
  if (!chargeTaxMaster && charge.ChargeTaxMaster) {
    chargeTaxMaster = charge.ChargeTaxMaster;
  }

  console.log('DEBUG - chargeTaxMaster found:', chargeTaxMaster);

  if (!chargeTaxMaster || !Array.isArray(chargeTaxMaster) || chargeTaxMaster.length === 0) {
    console.log('DEBUG - No chargeTaxMaster array found or empty');
    return null;
  }

  const firstTax = chargeTaxMaster[0];
  console.log('DEBUG - First tax record:', firstTax);

  // Try different possible field names for TaxGroupSid
  const taxGroupSid = firstTax.TaxGroupSid || 
                     firstTax.taxGroupSid || 
                     firstTax.TaxGroupMasterSid ||
                     firstTax.taxGroupMasterSid;

  console.log('DEBUG - Extracted taxGroupSid:', taxGroupSid);

  return taxGroupSid ? Number(taxGroupSid) : null;
}

private getCustomerCountryFromCharge(charge: any): string {
  // For Credit Note - get from customer
  const customerMaster = this.vendorList.find(c => c.CustomerMasterSid === this.vendorCreditNoteForm.get('CustomerMasterSid')?.value);
  const customerBranch = this.vendorBranchList.find(b => b.CustomerBranchSid === this.vendorCreditNoteForm.get('CustomerBranchSid')?.value);
  
  const country = customerMaster?.countryMaster?.countryCode || 
                 customerMaster?.Country ||
                 customerBranch?.countryMaster?.countryCode ||
                 customerBranch?.Country ||
                 '';
  
  console.log('Customer Country (Credit Note):', {
    customerName: customerMaster?.CustomerName,
    countryFromMaster: customerMaster?.countryMaster?.countryCode,
    countryFromBranch: customerBranch?.countryMaster?.countryCode,
    finalCountry: country
  });
  
  return country;
}

/**
 * Determine tax category based on company state and place of supply
 */
private determineTaxCategory(companyState: string, billingPartyState: string, customerCountry: string): 'Inter' | 'Intra' {
  if (!companyState || !billingPartyState) {
    console.warn('Missing state information, defaulting to Inter');
    return 'Inter';
  }

  // Normalize country codes for comparison
  const normalizedCustomerCountry = customerCountry?.toLowerCase() || '';
  const isIndianCustomer = normalizedCustomerCountry === 'india' || normalizedCustomerCountry === 'in';
  const isInternationalCustomer = !isIndianCustomer && normalizedCustomerCountry !== '';

  console.log('Tax Category - Customer Country Analysis:', {
    customerCountry,
    normalizedCustomerCountry,
    isIndianCustomer,
    isInternationalCustomer
  });

  // For international customers (like Dubai), use 'Inter' category for VAT
  if (isInternationalCustomer) {
    console.log('International transaction - Using Inter category for customer country:', customerCountry);
    return 'Inter'; // Use 'Inter' for international transactions (VAT)
  }

  // For Indian customers, check if same state or different state
  const normalizedCompanyState = companyState.trim().toLowerCase();
  const normalizedBillingState = billingPartyState.trim().toLowerCase();

  const isSameState = normalizedCompanyState === normalizedBillingState;
  
  console.log('Tax Category Determination for Indian Customer:', {
    companyState: normalizedCompanyState,
    billingPartyState: normalizedBillingState,
    isSameState,
    taxCategory: isSameState ? 'Inter' : 'Intra'
  });

  return isSameState ? 'Inter' : 'Intra';
}

updateBillAmount() {
  const totalLocalAmount = this.calculateTotalLocalAmount();
  this.vendorCreditNoteForm.get('BillAmt')?.setValue(this.round(totalLocalAmount));
}
recalculateAllRows() {
  for (let i = 0; i < this.details.length; i++) {
    const exRateCtrl = this.details.at(i).get('ExchangeRate');
    if (exRateCtrl && (exRateCtrl.value === null || exRateCtrl.value === undefined)) {
      exRateCtrl.setValue(this.vendorCreditNoteForm.get('ExchangeRate')?.value || 1);
    }
    // const currCtrl = this.details.at(i).get('CurrencyCode');
    // if (currCtrl && !currCtrl.value) {
    //   currCtrl.setValue(this.vendorCreditNoteForm.get('CurrencyCode')?.value || null);
    // }
    this.recalcRow(i);
  }
}

getTotalCurrencyAmount(): number {
  let total = 0;
  for (let i = 0; i < this.details.length; i++) {
    const amount = Number(this.details.at(i).get('PartyAmount')?.value || 0);
    total += amount;
  }
  return this.round(total);
}

getTotalTaxAmount() {
  let total = 0;
  for (let i = 0; i < this.details.length; i++) {
    const taxAmt1 = Number(this.details.at(i).get('TaxAmount1')?.value || 0);
    const taxAmt2 = Number(this.details.at(i).get('TaxAmount2')?.value || 0);
    total += taxAmt1 + taxAmt2 ;
  }
  return total.toFixed(2);
}

getGrandTotal(): number {
  return this.round(this.getTotalCurrencyAmount() + toNumber(this.getTotalTaxAmount()));
}

  addDetailRow() {
    const newRow = this.createDetailGroup();
    this.details.push(newRow);

    }


 

  deleteDetailRow(index: number) {
    this.details.removeAt(index);
    this.renumberRows();
    // this.calculateTDS();
  }

  renumberRows() {
    this.details.controls.forEach((row, i) => {
      row.patchValue({ Sno: i + 1 }, { emitEvent: false });
    });
  }

//   calculateTDS() {
//   const totalTaxable = this.details.controls.reduce((sum, row: any) => {
//     return sum + (Number(row.get('TaxableAmount')?.value) || 0);
//   }, 0);

//   const tdsRate = this.tdsConfig?.tdsRate || 0;
//   const tdsAmount = (totalTaxable * tdsRate) / 100;

//   this.tdsGroup.patchValue({
//     TaxableAmt: this.round(totalTaxable),
//     TDSAmt: this.round(tdsAmount)
//   });
// }

  calculateTotalAmount(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('Amount')?.value) || 0);
    }, 0);
  }


  calculateTotalLocalAmount(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('LocalAmount')?.value) || 0);
    }, 0);
  }

 

  
  // Vendor selection
onVendorChange(selected: any) {
  const vendorMasterSid = (typeof selected === 'object' && selected !== null)
    ? (selected.CustomerMasterSid ?? selected)
    : selected;
  
  if (!vendorMasterSid) {
    this.vendorBranchList = [];
    this.vendorCreditNoteForm.get('CustomerBranchSid')?.setValue(null);
    this.vendorCreditNoteForm.get('PartyAddress')?.setValue('');
    this.vendorCreditNoteForm.get('PartyMasterSid')?.setValue(null);
    this.vendorCreditNoteForm.get('COAMasterSid')?.setValue(null); 
    this.vendorCreditNoteForm.get('GSTNo')?.setValue('');
    this.vendorCreditNoteForm.get('PartyName')?.setValue('');
    this.vendorCreditNoteForm.get('PlaceOfSupply')?.setValue('');
    if (this.currentUserCountry === 'india') {
      this.vendorCreditNoteForm.get('InvoiceType')?.setValue('B2B');
    } else {
      this.vendorCreditNoteForm.get('InvoiceType')?.setValue('REG'); // Regular for non-India
    }
    this.vendorCreditNoteForm.get('GSTType')?.setValue('');
    return;
  }

  const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
  if (vendor) {
    // Set PartyName to vendor name
    this.vendorCreditNoteForm.get('PartyName')?.setValue(vendor.CustomerName || '');
    
    // CRITICAL: Set PartyMasterSid from vendor's SubledgerMasterSid
    if (vendor.SubledgerMasterSid) {
      this.vendorCreditNoteForm.get('PartyMasterSid')?.setValue(Number(vendor.SubledgerMasterSid));
      console.log('DEBUG - Set PartyMasterSid from vendor:', vendor.SubledgerMasterSid);
    } else {
      console.warn('DEBUG - Vendor has no SubledgerMasterSid:', vendor);
      this.vendorCreditNoteForm.get('PartyMasterSid')?.setValue(null);
    }

    if(vendor.COAMappedId){
      this.vendorCreditNoteForm.get('COAMasterSid')?.setValue(Number(vendor.COAMappedId));
      console.log("DEBUG - Set COAMasterSid from customer:", vendor.COAMappedId);
    } else {
      this.vendorCreditNoteForm.get('COAMasterSid')?.setValue(null);
      console.log("DEBUG - Customer has no COAMappedId:", vendor);
    }
    // Rest of your existing code for GST, InvoiceType, etc...
    const countryCode = this.getCustomerCountryCode(vendor);
    console.log('Vendor Country Code:', countryCode);
    const customerBranches = this.vendorBranchList.filter(b => b.CustomerMasterSid === vendorMasterSid);
    const hasGSTInBranches = customerBranches.some(branch => branch.GSTNo && branch.GSTNo.trim() !== '');
    
    if (this.currentUserCountry === 'india') {
      if (hasGSTInBranches || vendor.GSTNo) {
        this.vendorCreditNoteForm.get('InvoiceType')?.setValue('B2B');
        console.log('Invoice Type: B2B (Indian customer with GST)');
      } else {
        this.vendorCreditNoteForm.get('InvoiceType')?.setValue('B2C');
        console.log('Invoice Type: B2C (Indian customer without GST)');
      }
    } else {
      // For UAE/Non-India, use REG (Regular) instead of EXWP
      this.vendorCreditNoteForm.get('InvoiceType')?.setValue('REG');
      console.log('Invoice Type: REG (Non-India customer)');
    }

    // Load TDS configuration
    // this.loadVendorTDS(vendorMasterSid);
  }

  // Reset branch selection when vendor changes
  this.vendorCreditNoteForm.get('CustomerBranchSid')?.setValue(null);
  this.vendorCreditNoteForm.get('PartyAddress')?.setValue('');
  this.vendorCreditNoteForm.get('PlaceOfSupply')?.setValue('');
  this.vendorCreditNoteForm.get('GSTType')?.setValue('');
  this.getVendorBranchByVendor(Number(vendorMasterSid));
}

// Enhanced vendor branch selection
onVendorBranchChange(selectedBranch: any) {
  const branchSid = (typeof selectedBranch === 'object' && selectedBranch !== null)
    ? (selectedBranch.CustomerBranchSid ?? selectedBranch)
    : selectedBranch;

  if (!branchSid) {
    this.vendorCreditNoteForm.get('PartyAddress')?.setValue('');
    this.vendorCreditNoteForm.get('GSTNo')?.setValue('');
    this.vendorCreditNoteForm.get('PlaceOfSupply')?.setValue('');
    return;
  }

  const foundBranch = this.vendorBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));
  
  if (foundBranch) {
    // Set address from branch
    const address = foundBranch.Address || foundBranch.CustomerAddress1 || foundBranch.customerAddress || '';
    this.vendorCreditNoteForm.get('PartyAddress')?.setValue(address);

    // Get Place of Supply from state lookup
    let placeOfSupply = '';
    const stateMasterSid = foundBranch.StateMasterSid;
    
    if (stateMasterSid && this.stateList.length > 0) {
      const state = this.stateList.find(s => 
        s.StateMasterSid === stateMasterSid || 
        s.stateMasterSid === stateMasterSid
      );
      if (state) {
        placeOfSupply = state.stateName || state.StateName || '';
      }
    }
    
    // If no state found, try to get city or use empty
    if (!placeOfSupply) {
      placeOfSupply = foundBranch.City || foundBranch.city || '';
    }

    console.log('Setting Place of Supply:', placeOfSupply);
    this.vendorCreditNoteForm.get('PlaceOfSupply')?.setValue(placeOfSupply);

    // Set GST No based on country
    const vendorMasterSid = foundBranch.CustomerMasterSid;
    if (vendorMasterSid) {
      const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
      if (vendor) {
        const countryCode = this.getCustomerCountryCode(vendor);
        if (countryCode === 'IN') {
          this.vendorCreditNoteForm.get('GSTNo')?.setValue(foundBranch.GSTNo || '');
        } else {
          this.vendorCreditNoteForm.get('GSTNo')?.setValue(vendor.PanType || '');
        }
      }
    }

    // Auto-determine GST Type based on Place of Supply
    this.determineGSTType(placeOfSupply);
  } else {
    this.vendorCreditNoteForm.get('PartyAddress')?.setValue('');
    this.vendorCreditNoteForm.get('GSTNo')?.setValue('');
    this.vendorCreditNoteForm.get('PlaceOfSupply')?.setValue('');
  }
}

getStateNameFromVendor(vendorMasterSid: number): string {
  const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
  if (vendor && vendor.stateMaster) {
    return vendor.stateMaster.stateName || vendor.stateMaster.StateName || '';
  }
  return '';
}
determineGSTType(placeOfSupply: string) {
  if (!placeOfSupply) {
    this.vendorCreditNoteForm.get('GSTType')?.setValue('');
    return;
  }

  const companyState = this.getCompanyState();
  const vendorGSTNo = this.vendorCreditNoteForm.get('GSTNo')?.value;
  const invoiceType = this.vendorCreditNoteForm.get('InvoiceType')?.value;
  
  console.log('=== DETERMINING GST TYPE ===');
  console.log('Company State:', companyState);
  console.log('Place of Supply:', placeOfSupply);
  console.log('Vendor GST No:', vendorGSTNo);
  console.log('Invoice Type:', invoiceType);
  console.log('Is India GST:', this.isIndiaGST);
  const normalizedCompanyState = companyState?.trim().toLowerCase();
  const normalizedPlaceOfSupply = placeOfSupply?.trim().toLowerCase();

  // Scenario 3: Export (Vendor outside India)
  if (invoiceType === 'EXWP' || invoiceType === 'EXWOP') {
    this.vendorCreditNoteForm.get('GSTType')?.setValue('EXWP');
    console.log('GST Type set to: EXPORT (Export scenario)');
    return;
  }

  // Scenario 1 & 2: India GST scenarios
  if (this.isIndiaGST && vendorGSTNo) {
    if (placeOfSupply === companyState) {
      // Scenario 1: Same State - CGST + SGST
      this.vendorCreditNoteForm.get('GSTType')?.setValue('CGST+SGST');
      console.log('GST Type set to: CGST+SGST (Intra-state)');
    } else {
      // Scenario 2: Different State - IGST
      this.vendorCreditNoteForm.get('GSTType')?.setValue('IGST');
      console.log('GST Type set to: IGST (Inter-state)');
    }
  } else if (this.isIndiaGST && !vendorGSTNo) {
    // B2C or unregistered dealer in India
    this.vendorCreditNoteForm.get('GSTType')?.setValue('B2C');
    console.log('GST Type set to: B2C (Unregistered dealer)');
  } else {
    // Non-India scenarios
    this.vendorCreditNoteForm.get('GSTType')?.setValue('VAT');
    console.log('GST Type set to: VAT (Non-India)');
  }
}

getCompanyState(): string {
  if (!this.currentCompany) {
    console.warn('No current company data available');
    return '';
  }

  console.log('=== COMPANY STATE DEBUG ===');
  console.log('Current Company:', this.currentCompany);
  console.log('Current Branch:', this.currentBranch);
  console.log('User Data:', this.userData);

  // Method 1: Check if currentCompany has stateMaster directly
  // if (this.currentCompany.stateMaster) {
  //   const state = this.currentCompany.stateMaster.stateName || this.currentCompany.stateMaster.StateName;
  //   if (state) {
  //     console.log('Company State from currentCompany.stateMaster:', state);
  //     return state;
  //   }
  // }

  // Method 2: Check if currentCompany has StateMasterSid and look up in stateList
  // if (this.currentCompany.StateMasterSid && this.stateList.length > 0) {
  //   const state = this.stateList.find(s => 
  //     s.StateMasterSid === this.currentCompany.StateMasterSid || 
  //     s.stateMasterSid === this.currentCompany.StateMasterSid
  //   );
  //   if (state) {
  //     const stateName = state.stateName || state.StateName;
  //     console.log('Company State from currentCompany.StateMasterSid lookup:', stateName);
  //     return stateName;
  //   }
  // }

  // Method 3: Check currentBranch state information
  // if (this.currentBranch && this.currentBranch.stateMaster) {
  //   const state = this.currentBranch.stateMaster.stateName || this.currentBranch.stateMaster.StateName;
  //   if (state) {
  //     console.log('Company State from currentBranch.stateMaster:', state);
  //     return state;
  //   }
  // }

  // // Method 4: Check currentBranch StateMasterSid
  // if (this.currentBranch && this.currentBranch.StateMasterSid && this.stateList.length > 0) {
  //   const state = this.stateList.find(s => 
  //     s.StateMasterSid === this.currentBranch.StateMasterSid || 
  //     s.stateMasterSid === this.currentBranch.StateMasterSid
  //   );
  //   if (state) {
  //     const stateName = state.stateName || state.StateName;
  //     console.log('Company State from currentBranch.StateMasterSid lookup:', stateName);
  //     return stateName;
  //   }
  // }

  // Method 5: Navigate through userData structure to get branch state
  if (this.userData && this.userData.userCompanyMaster) {
    const userCompanies = this.userData.userCompanyMaster;
    
    // Find the current company in user companies
    const currentUserCompany = userCompanies.find((uc: any) => 
      uc.CompanyMasterSid === this.currentCompany.CompanyMasterSid
    );
    
    if (currentUserCompany && currentUserCompany.companyMaster) {
      const companyMaster = currentUserCompany.companyMaster;
      
      // Check company master's userBranchMaster
      if (companyMaster.userBranchMaster && Array.isArray(companyMaster.userBranchMaster)) {
        // Find the current branch
        const currentUserBranch = companyMaster.userBranchMaster.find((ub: any) => 
          ub.BranchMasterSid === this.currentBranch.BranchMasterSid
        );
        
        if (currentUserBranch && currentUserBranch.branchMaster) {
          const branchMaster = currentUserBranch.branchMaster;
          
          // Method 5a: Check branchMaster's stateMaster
          if (branchMaster.stateMaster) {
            const state = branchMaster.stateMaster.stateName || branchMaster.stateMaster.StateName;
            if (state) {
              console.log('Company State from userData->branchMaster->stateMaster:', state);
              return state;
            }
          }
          
          // Method 5b: Check branchMaster's StateMasterSid
          if (branchMaster.StateMasterSid && this.stateList.length > 0) {
            const state = this.stateList.find(s => 
              s.StateMasterSid === branchMaster.StateMasterSid || 
              s.stateMasterSid === branchMaster.StateMasterSid
            );
            if (state) {
              const stateName = state.stateName || state.StateName;
              console.log('Company State from userData->branchMaster->StateMasterSid lookup:', stateName);
              return stateName;
            }
          }
        }
      }
      
      // Method 6: Check company master's StateMasterSid
      if (companyMaster.StateMasterSid && this.stateList.length > 0) {
        const state = this.stateList.find(s => 
          s.StateMasterSid === companyMaster.StateMasterSid || 
          s.stateMasterSid === companyMaster.StateMasterSid
        );
        if (state) {
          const stateName = state.stateName || state.StateName;
          console.log('Company State from userData->companyMaster->StateMasterSid lookup:', stateName);
          return stateName;
        }
      }
    }
  }

  console.log('No company state found after all attempts');
  return '';
}
getStateNameBySid(stateMasterSid: number): string {
  if (!stateMasterSid || this.stateList.length === 0) return '';
  
  const state = this.stateList.find(s => 
    s.StateMasterSid === stateMasterSid || 
    s.stateMasterSid === stateMasterSid
  );
  
  return state?.stateName || state?.StateName || '';
}
// Enhanced getVendorBranchByVendor method with callback
getVendorBranchByVendor(CustomerMasterSid: number, callback?: (branches: any[]) => void) {
  if (!CustomerMasterSid) {
    this.vendorBranchList = [];
    if (callback) callback([]);
    return;
  }
  
  this.operationService.getCustomerBranchByCustomer(CustomerMasterSid).subscribe({
    next: (resp: any) => {
      if (resp?.status && resp.data) {
        this.vendorBranchList = Array.isArray(resp.data) ? resp.data : resp.data;
        
        if (callback) {
          callback(this.vendorBranchList);
        }
        
        // Auto-select the branch if there's a pending selection
        if (this.pendingBranchToSelect) {
          const branchId = this.pendingBranchToSelect;
          this.pendingBranchToSelect = null;
        }
      } else if (Array.isArray(resp)) {
        this.vendorBranchList = resp;
        if (callback) callback(this.vendorBranchList);
      } else if (resp?.data) {
        this.vendorBranchList = resp.data;
        if (callback) callback(this.vendorBranchList);
      } else {
        this.vendorBranchList = [];
        if (callback) callback([]);
      }
    },
    error: (err) => {
      console.error('Error fetching vendor branches', err);
      this.vendorBranchList = [];
      if (callback) callback([]);
    }
  });
}


private getCustomerCountryCode(vendor: any): string {
  if (vendor.CountryMasterSid && typeof vendor.CountryMasterSid === 'object') {
    const code = vendor.CountryMasterSid.countryCode || vendor.CountryMasterSid.CountryCode;
    return code || '';
  }
  
  const countryCode = vendor.CountryCode || 
                     vendor.countryCode || 
                     vendor.countryMaster?.countryCode ||
                     vendor.country?.countryCode ||
                     vendor.CountryMaster?.CountryCode ||
                     '';
  
  if (!countryCode) {
    const vendorBranches = this.vendorBranchList.filter(b => b.CustomerMasterSid === vendor.CustomerMasterSid);
    const hasGSTNo = vendorBranches.some(branch => branch.GSTNo);
    if (hasGSTNo) {
      return 'IN';
    }
  }
  
  return countryCode;
}
  onVendorSelect(vendor: any) {
    const vendors = (typeof vendor === 'object' && vendor !==null)
    ? (vendor.vendors ?? vendor)
    : vendor;
    if (!vendor) {
      this.vendorList = [];
      this.vendorCreditNoteForm.get('PartyAddress')?.setValue('');
      return;
    }
    this.vendorCreditNoteForm.get('PartyAddress')?.setValue(vendor.Address || '');
  }

  // loadVendorTDS(vendorSid: number) {
  //   this.operationService.getVendorTDSMapping(vendorSid).subscribe({
  //     next: (response) => {
  //       if (response.status && response.data) {
  //         this.tdsConfig = response.data;

  //         this.tdsGroup.patchValue({
  //           TDSSet: this.tdsConfig.tdsSetName || '',
  //           TDSCompany: this.currentCompany?.CompanyName || '',
  //           ITSectionType: this.tdsConfig.companyType || '',
  //           ITSectionCode: this.tdsConfig.itSectionCode || '',
  //           TDSSetRateSid: this.tdsConfig.tdsSetRateSid || 0,
  //           CertificateNo: this.tdsConfig.certificateNo || '',
  //           Percentage: this.tdsConfig.tdsRate || 0
  //         });

  //         // Recalculate TDS
  //         this.calculateTDS();
  //       } else {
  //         // No TDS config found
  //         this.tdsConfig = null;
  //         this.tdsGroup.patchValue({
  //           TDSSet: '',
  //           TDSCompany: '',
  //           ITSectionType: '',
  //           ITSectionCode: '',
  //           TDSSetRateSid: 0,
  //           CertificateNo: '',
  //           Percentage: 0,
  //           TDSAmt: 0
  //         });
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error loading TDS config:', error);
  //       this.tdsConfig = null;
  //     }
  //   });
  // }
// Extract unique vendors from costs


private autoPopulateVendorFromSelection(vendor: any) {
  if (!vendor) return;

  // Set vendor information in main form
  this.vendorCreditNoteForm.patchValue({
    PartyName: vendor.VendorName || vendor.CustomerName,
    PartyMasterSid: vendor.VendorSid
  });

  // Load vendor branches
  this.getVendorBranchByVendor(vendor.VendorSid, (branches) => {
    if (branches.length > 0) {
      const matchingBranch = branches.find(branch => 
        branch.Address?.includes(vendor.VendorAddress) || 
        branch.CustomerAddress1?.includes(vendor.VendorAddress)
      );
      
      const branchToSelect = matchingBranch || branches[0];
      
      if (branchToSelect) {
        this.vendorCreditNoteForm.get('CustomerBranchSid')?.setValue(branchToSelect.CustomerBranchSid);
      }
    }
  });

  // Set vendor address
  this.vendorCreditNoteForm.patchValue({
    PartyAddress: vendor.VendorAddress || vendor.Address || ''
  });
}

  toggleCostSelection(costSid: number) {
    if (this.selectedCosts.has(costSid)) {
      this.selectedCosts.delete(costSid);
    } else {
      this.selectedCosts.add(costSid);
    }
  }

// Get selected costs
getSelectedCosts(): any[] {
  return this.allPendingCosts.filter(cost => cost.selected);
}

  // Load lookups
  loadLookups() {
    this.spinner.show();
      const companyRaw = localStorage.getItem('selected-company');
      const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;
      const filterOption = { CompanyMasterSid: company?.CompanyMasterSid, BranchMasterSid: company?.BranchMasterSid };
      const CompanyMasterSid = company?.CompanyMasterSid;

    Promise.all([
      firstValueFrom(this.operationService.getAllCreditorWithCOAMapped(filterOption)),
      firstValueFrom(this.operationService.getAllCurrencies()),
      firstValueFrom(this.operationService.getAllMappedChargeDebtors(filterOption)),
      firstValueFrom(this.operationService.getAllHssac()),
      firstValueFrom(this.operationService.getAllUom()),
      firstValueFrom(this.operationService.getAllState()),
      firstValueFrom(this.operationService.getAllVendorInvoice(CompanyMasterSid)),
    ]).then(([vendors,currencies, charges, hssac, uom, states, vendorInvoice]) => {
      this.vendorList = vendors.data || [];
      this.subledgerList = vendors.data || [];
      this.currencyList = currencies.data || [];
      this.currencyConfigService.initializeConfigurations(this.currencyList);
      this.chargeList = charges.data || [];
      this.hssacList = hssac || [];
      this.uomList = uom.data || [];
      this.vendorInvoiceList = vendorInvoice.data || [];
       this.stateList = states?.data || states || [];
      this.loadDepartments(company?.CompanyMasterSid).catch(e => {
      console.error('Error loading departments', e);
      this.departmentList = [];
    });
    
    this.loadMasterJobs().catch(e => {
      console.error('Error loading master jobs', e);
      this.masterJobList = [];
    });
      this.spinner.hide();
    }).catch(error => {
      console.error('Error loading lookups:', error);
      this.spinner.hide();
      this.appSettingService.showError('Error loading lookup data');
    });
  }
async loadMasterJobs() {
  try {
    const companyRaw = localStorage.getItem('selected-company');
    const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;

    const payload = {
      CompanyMasterSid: company?.CompanyMasterSid,
      BranchMasterSid: company?.BranchMasterSid,
      limit: 200,
      offset: 0
    };

    const resp: any = await firstValueFrom(this.operationService.getAllMasterJobs(payload));
    let items: any[] = [];
    if (resp?.data && Array.isArray(resp.data)) {
      items = resp.data;
    } else if (Array.isArray(resp)) {
      items = resp;
    } else if (resp?.data?.data && Array.isArray(resp.data.data)) {
      items = resp.data.data;
    }

    this.masterJobList = items.map((it: any) => {
      const mj = {
        ...it,
        MasterJobSid: it.MasterJobSid ?? it.masterJobSid ?? it.MasterJobId ?? null,
        MasterJobNumber: it.MasterJobNumber ?? it.masterJobNumber ?? it.JobNumber ?? it.JobNo ?? '',
        MBLNo: it.MBLNo ?? it.mblNo ?? it.MBL ?? '',
        HBLNo: it.HBLNo ?? it.hblNo ?? it.HouseJob ?? '',
      };
      mj.displayLabel = `${mj.MasterJobNumber || ('#' + (mj.MasterJobSid ?? ''))}`;
      return mj;
    });
  } catch (err) {
    console.error('Error loading master jobs', err);
    this.masterJobList = [];
  }
}
getMasterJobNumber(jobSid: number): string {
  const job = this.masterJobList.find(j => j.MasterJobSid === jobSid);
  return job?.MasterJobNumber || job?.displayLabel || '-';
}
  loadVendorCreditNoteById(id: number) {
    this.spinner.show();
    this.operationService.getVendorCreditNoteById(id).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          console.log(response.data,'loadVendorCreditNoteById')
          this.vendorCreditNoteData = response.data;
          this.populateForm(this.vendorCreditNoteData);
          this.setFormReadonly();
        } else {
          this.appSettingService.showError('Vendor CreditNote not found');
          this.router.navigate(['/operation/vendor-credit-note/list']);
        }
      },
      error: (error) => {
        this.spinner.hide();
        this.appSettingService.showError('Error loading Vendor CreditNote');
        console.error('Error:', error);
        this.router.navigate(['/operation/vendor-credit-note/list']);
      }
    });
  }

 setFormReadonly() {
  if (this.isEditMode || this.isPosted) {
    this.vendorCreditNoteForm.disable();
    
    // Also disable details array if posted
    // if (this.isPosted) {
    //   this.details.disable();
    // }
  } else {
    this.vendorCreditNoteForm.enable();
    this.details.enable();
    
    // Keep readonly fields as is
    this.vendorCreditNoteForm.get('VoucherNumber')?.disable();
    this.vendorCreditNoteForm.get('PostedOn')?.disable();
    this.vendorCreditNoteForm.get('PartyAddress')?.disable();
    this.vendorCreditNoteForm.get('GSTNo')?.disable();
    this.vendorCreditNoteForm.get('PlaceOfSupply')?.disable();
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
    const header = data;
    const voucherTypeForControl = header?.VoucherType != null ? [String(header.VoucherType)] : null;
      let reversalVoucherDisplay = header.ReversalVoucher;
     if (reversalVoucherDisplay && typeof reversalVoucherDisplay === 'object') {
    if (!reversalVoucherDisplay.VoucherNumber) {
      // Try to get from related invoice data or other fields
      reversalVoucherDisplay.VoucherNumber = header.InvoiceNumber || 
                                           header.ReversalInvoiceNumber || 
                                           (header.reversalVoucherDetails?.VoucherNumber) || 
                                           '-';
    }
  }
  
  const reversalVoucherId = header.ReversalVoucher || header.reversalVoucher || null;
    const customerMasterSidFromBranch = header?.customerBranch?.CustomerMasterSid
      || header?.CustomerBranch?.CustomerMasterSid
      || null;
    
    console.log(currency,'currency')
    this.vendorCreditNoteForm.patchValue({
      ReversalVoucher: reversalVoucherDisplay,
      VoucherNumber: header.VoucherNumber,
      VoucherDate: this.formatDateForNgb(header.VoucherDate),
      CustomerMasterSid: header.CustomerMasterSid || customerMasterSidFromBranch || null,
      PartyMasterSid: header.PartyMasterSid,
      PartyName: header.PartyName,
      PartyAddress: header.PartyAddress,
      CustomerBranchSid: header.CustomerBranchSid || customerMasterSidFromBranch || null,
      GSTNo: header.GST_VAT,
      PlaceOfSupply: header.PlaceOfSupply,
      PostedOn: header.PostDate ? this.formatDateForDisplay(header.PostDate) : null,
      CurrencyCode: header.CurrencyCode || currency.currencyCode,
      ExchangeRate: header.ExchangeRate || 1,
      BillNo: header.DocumentNumber,
      BillDate: header.DocumentDate ? this.formatDateForNgb(header.DocumentDate) : null,
      BillAmt: header.Amount || 0,
      MBLNo: header.MasterNumber,
      HBLNo: header.HouseNumber,
      CreditNoteReason: header.CreditNoteReason || '',
      PostStatus: header.PostStatus,
      InvoiceType: header.InvoiceType || 'B2B',
      GSTType: header.GSTType,
      Narration: header.Narration || '',
      Remarks: header.Remarks || (header.VoucherOthers && header.VoucherOthers[0]?.Remarks) || '',
      MasterJobSid: header.MasterJobSid,
      HouseJobSid: header.HouseJobSid,
      Status: header.Status,
      COAMasterSid: data.COAMasterSid
    });
    console.log('DEBUG - data.PartyName:', header.PartyName);
    console.log('DEBUG - data.PartyAddress:', header.PartyAddress);
    console.log('DEBUG - data.CustomerBranchSid:', header.CustomerBranchSid);
    const cm = header.CustomerMasterSid || customerMasterSidFromBranch || null;
    console.log('DEBUG - cm:', cm);
    const branchSid = header.CustomerBranchSid || header.PartyName || (header.customerBranch ? header.customerBranch.CustomerBranchSid : null) || null;
    console.log('DEBUG - branchSid:', branchSid);
    this.pendingBranchToSelect = branchSid ? Number(branchSid) : null;
    this.getVendorBranchByVendor(cm);
    console.log('DEBUG - pendingBranchToSelect:', this.pendingBranchToSelect);
    if(branchSid){
      this.vendorCreditNoteForm.get('CustomerBranchSid')?.setValue(Number(branchSid));
      this.pendingBranchToSelect = Number(branchSid);
      console.log('DEBUG - pendingBranchToSelect:', this.pendingBranchToSelect);
      const currentVendor = this.vendorCreditNoteForm.get('CustomerMasterSid')?.value;
      if (currentVendor) {
        this.getVendorBranchByVendor(Number(currentVendor));
      } else {
       const found = this.vendorBranchList.find(b => 
          Number(b.CustomerBranchSid) === Number(branchSid) || 
          Number(b.CustomerName) === Number(branchSid)
        );
        if (found) {
          this.vendorCreditNoteForm.get('PartyName')?.setValue(Number(branchSid));
          this.vendorCreditNoteForm.get('PartyAddress')?.setValue(found.Address);
        }
      }
    }
    const detailsFromResp = data.voucherDetails
    || data.voucherDetail
    || data.VoucherDetail
    || data.VoucherDetails
    || [];

    // Populate details
    this.details.clear();
    for (const det of detailsFromResp) {
    const taxPerc1 = det.TaxPercentage1 != null ? Number(det.TaxPercentage1) : 0;
    const taxAmt1 = det.TaxAmount1 != null ? Number(det.TaxAmount1) : 0;
    const taxPerc2 = det.TaxPercentage2 != null ? Number(det.TaxPercentage2) : 0;
    const taxAmt2 = det.TaxAmount2 != null ? Number(det.TaxAmount2) : 0;
   

    // Get GSTType to determine how to map tax values
    const gstType = header.GSTType || det.GSTType || '';
    console.log('DEBUG - Loading detail row with GSTType:', gstType);

    if (gstType === 'VAT') {
      // VAT mode - map TaxPercentage1 to VAT rate, TaxAmount1 to VAT amount
      console.log('DEBUG - VAT mode detected, preserving TaxPercentage1 and TaxAmount1');
      this.details.push(this.createDetailGroup({
        VoucherDetailSid: det.VoucherDetailSid,
        ChargeMasterSid: det.ChargeMasterSid,
        ChargeDescription: det.ChargeDescription,
        HSSACMasterSid: det.HSSACMasterSid,
        ChargeUOMSid: det.ChargeUOMSid,
        NumberOfUnit: det.NumberOfUnit,
        DepartmentMasterSid: det.DepartmentMasterSid,
        DrCr: det.DrCr,
        CurrencyCode: det.CurrencyCode || this.vendorCreditNoteForm.get('CurrencyCode')?.value,
        Rate: det.Rate,
        ExchangeRate: det.ExchangeRate || this.vendorCreditNoteForm.get('ExchangeRate')?.value,
        Amount: det.Amount,
        TaxableAmount: det.TaxableAmount,
        TaxPercentage1: taxPerc1, // This contains VAT rate
        TaxAmount1: taxAmt1,      // This contains VAT amount
        TaxPercentage2: 0,
        TaxAmount2: 0,
        
        LocalAmount: det.LocalAmount,
        PartyAmount: det.PartyAmount,
        MasterJobSid: det.MasterJobSid,
        HouseJobSid: det.HouseJobSid
      }));
    } else if (gstType === 'CGST+SGST') {
      // CGST+SGST mode - India GST with both taxes
      this.details.push(this.createDetailGroup({
        VoucherDetailSid: det.VoucherDetailSid,
        ChargeMasterSid: det.ChargeMasterSid,
        ChargeDescription: det.ChargeDescription,
        HSSACMasterSid: det.HSSACMasterSid,
        ChargeUOMSid: det.ChargeUOMSid,
        NumberOfUnit: det.NumberOfUnit,
        DepartmentMasterSid: det.DepartmentMasterSid,
        DrCr: det.DrCr,
        CurrencyCode: det.CurrencyCode || this.vendorCreditNoteForm.get('CurrencyCode')?.value,
        Rate: det.Rate,
        ExchangeRate: det.ExchangeRate || this.vendorCreditNoteForm.get('ExchangeRate')?.value,
        Amount: det.Amount,
        TaxableAmount: det.TaxableAmount,
        TaxPercentage1: taxPerc1, // CGST rate
        TaxAmount1: taxAmt1,      // CGST amount
        TaxPercentage2: taxPerc2, // SGST rate
        TaxAmount2: taxAmt2,      // SGST amount
       
        LocalAmount: det.LocalAmount,
        PartyAmount: det.PartyAmount,
        MasterJobSid: det.MasterJobSid,
        HouseJobSid: det.HouseJobSid
      }));
    } else if (gstType === 'IGST') {
      // IGST mode - India GST with single IGST
      this.details.push(this.createDetailGroup({
        VoucherDetailSid: det.VoucherDetailSid,
        ChargeMasterSid: det.ChargeMasterSid,
        ChargeDescription: det.ChargeDescription,
        HSSACMasterSid: det.HSSACMasterSid,
        ChargeUOMSid: det.ChargeUOMSid,
        NumberOfUnit: det.NumberOfUnit,
        DepartmentMasterSid: det.DepartmentMasterSid,
        DrCr: det.DrCr,
        CurrencyCode: det.CurrencyCode || this.vendorCreditNoteForm.get('CurrencyCode')?.value,
        Rate: det.Rate,
        ExchangeRate: det.ExchangeRate || this.vendorCreditNoteForm.get('ExchangeRate')?.value,
        Amount: det.Amount,
        TaxableAmount: det.TaxableAmount,
        TaxPercentage1: taxPerc1,
        TaxAmount1: taxAmt1,
        TaxPercentage2: 0,
        TaxAmount2: 0,
              
        LocalAmount: det.LocalAmount,
        PartyAmount: det.PartyAmount,
        MasterJobSid: det.MasterJobSid,
        HouseJobSid: det.HouseJobSid
      }));
    } else if (gstType === 'B2C') {
      // B2C mode - India B2C with CGST only
      this.details.push(this.createDetailGroup({
        VoucherDetailSid: det.VoucherDetailSid,
        ChargeMasterSid: det.ChargeMasterSid,
        ChargeDescription: det.ChargeDescription,
        HSSACMasterSid: det.HSSACMasterSid,
        ChargeUOMSid: det.ChargeUOMSid,
        NumberOfUnit: det.NumberOfUnit,
        DepartmentMasterSid: det.DepartmentMasterSid,
        DrCr: det.DrCr,
        CurrencyCode: det.CurrencyCode || this.vendorCreditNoteForm.get('CurrencyCode')?.value,
        Rate: det.Rate,
        ExchangeRate: det.ExchangeRate || this.vendorCreditNoteForm.get('ExchangeRate')?.value,
        Amount: det.Amount,
        TaxableAmount: det.TaxableAmount,
        TaxPercentage1: taxPerc1, // CGST rate for B2C
        TaxAmount1: taxAmt1,      // CGST amount for B2C
        TaxPercentage2: 0,
        TaxAmount2: 0,
      
        LocalAmount: det.LocalAmount,
        PartyAmount: det.PartyAmount,
        MasterJobSid: det.MasterJobSid,
        HouseJobSid: det.HouseJobSid
      }));
    } else {
      // Default/unknown GST type - preserve all values as they are
      this.details.push(this.createDetailGroup({
        VoucherDetailSid: det.VoucherDetailSid,
        ChargeMasterSid: det.ChargeMasterSid,
        ChargeDescription: det.ChargeDescription,
        HSSACMasterSid: det.HSSACMasterSid,
        ChargeUOMSid: det.ChargeUOMSid,
        NumberOfUnit: det.NumberOfUnit,
        DepartmentMasterSid: det.DepartmentMasterSid,
        DrCr: det.DrCr,
        CurrencyCode: det.CurrencyCode || this.vendorCreditNoteForm.get('CurrencyCode')?.value,
        Rate: det.Rate,
        ExchangeRate: det.ExchangeRate || this.vendorCreditNoteForm.get('ExchangeRate')?.value,
        Amount: det.Amount,
        TaxableAmount: det.TaxableAmount,
        TaxPercentage1: taxPerc1,
        TaxAmount1: taxAmt1,
        TaxPercentage2: taxPerc2,
        TaxAmount2: taxAmt2,
        LocalAmount: det.LocalAmount,
        PartyAmount: det.PartyAmount,
        MasterJobSid: det.MasterJobSid,
        HouseJobSid: det.HouseJobSid
      }));
    }
  }
    

    // Populate TDS
    // if (data.VoucherTDS && data.VoucherTDS.length > 0) {
    //   const tds = data.VoucherTDS[0];
    //   this.tdsGroup.patchValue({
    //     ITSectionCode: tds.ITSectionCode,
    //     TDSSetRateSid: tds.TDSSetRateSid,
    //     Percentage: tds.TDSRate,
    //     TaxableAmt: tds.TaxableAmount,
    //     TDSAmt: tds.TDSAmount,
    //     Reason: tds.Reason || ''
    //   });
    // }

    // Populate others
    if (data.VoucherOthers && data.VoucherOthers.length > 0) {
      const others = data.VoucherOthers[0];
      this.vendorCreditNoteForm.get('voucherOthers')?.patchValue({
        ContainerNumber: others.ContainerNumber || '',
        VoucherNote: others.VoucherNote || '',
        Footer: others.Footer || ''
      });
    }
  }

  // Save
  onSave() {
    if (this.vendorCreditNoteForm.invalid) {
      this.appSettingService.showWarning('Please fill all required fields');
      this.markFormGroupTouched(this.vendorCreditNoteForm);
      return;
    }

    if (this.details.length === 0) {
      this.appSettingService.showWarning('Please add at least one charge detail');
      return;
    }

    const payload = this.preparePayload();

    this.spinner.show();
    if (this.isEditMode) {
      console.log("UPDATE PAYLOAD:", payload);
      this.operationService.updateVendorCreditNoteById(this.headerId!, payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          if (response.status) {
            this.appSettingService.showSuccess('Vendor CreditNote updated successfully');
            const id = response.data?.newVoucher?.VoucherHeaderSid || response.data?.VoucherHeaderSid || response.data?.voucherHeaderSid || null;
            this.router.navigate(['/operation/vendor-credit-note/entry',id]);
          } else {
            this.appSettingService.showError('Failed to update Vendor CreditNote');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.appSettingService.showError('Error updating Vendor CreditNote');
          console.error('Error:', error);
        }
      });
    } else {
      this.operationService.createVendorCreditNote(payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          if (response.status) {
            this.appSettingService.showSuccess('Vendor CreditNote created successfully');
            const id = response.data?.newVoucher?.VoucherHeaderSid || response.data?.VoucherHeaderSid || response.data?.voucherHeaderSid || null;
            if(id) this.router.navigate(['/operation/vendor-credit-note/entry',id]);
            else this.router.navigate(['/operation/vendor-credit-note/list']);
          } else {
            this.appSettingService.showError(response.message || 'Failed to create Vendor CreditNote');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.appSettingService.showError('Error creating Vendor CreditNote');
          console.error('Error:', error);
        }
      });
    }
  }
  

 preparePayload(): any {
  const formValue = this.vendorCreditNoteForm.getRawValue();
  
  
  const vendor = this.vendorList.find(v => 
    v.CustomerMasterSid === formValue.CustomerMasterSid || 
    v.CustomerName === formValue.PartyName
  );
  
  const partyMasterSid = vendor?.SubledgerMasterSid || null;
  const coaMasterSid = vendor?.COAMappedId || null;

  const payload: any = {
    VoucherHeaderSid: this.headerId, 
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid,
    ReversalVoucher: formValue.ReversalVoucher || null,
    PartyMasterSid: partyMasterSid,
    PartyName: formValue.PartyName,
    PartyAddress: formValue.PartyAddress,
    CustomerBranchSid: formValue.CustomerBranchSid,
    GSTNo: formValue.GSTNo,
    PlaceOfSupply: formValue.PlaceOfSupply,
    CurrencyCode: formValue.CurrencyCode,
    CurrencyMasterSid: this.currencyList.find(c => c.currencyCode === formValue.CurrencyCode)?.CurrencyMasterSid,
    ExchangeRate: formValue.ExchangeRate,
    BillNo: formValue.BillNo,
    BillDate: this.fromNgbDate(formValue.BillDate),
    BillAmt: formValue.BillAmt,
    MBLNo: formValue.MBLNo,
    HBLNo: formValue.HBLNo,
    PostStatus: formValue.PostStatus,
    InvoiceType: formValue.InvoiceType,
    GSTType: formValue.GSTType,
    Narration: formValue.Narration,
    MasterJobSid: formValue.MasterJobSid,
    HouseJobSid: formValue.HouseJobSid,
    VoucherDate: formValue.VoucherDate ? new Date(formValue.VoucherDate) : null,
    PostDate: formValue.PostedOn ? this.fromNgbDate(formValue.PostedOn) : null,
    Status: formValue.Status,
    COAMasterSid: coaMasterSid, 
    CreatedBy: this.currUserEmail || 'System',
    UpdatedBy: this.currUserEmail || 'System'
  };

  // Add details with CostRevenueChargesSid
  payload.VoucherDetail = formValue.voucherDetails.map((detail: any, index: number) => {
    const partyAmount = this.getPartyAmount(detail);
    return {
    Sno: index + 1,
    VoucherDetailSid: detail.VoucherDetailSid ? Number(detail.VoucherDetailSid) : null,
    ChargeMasterSid: detail.ChargeMasterSid,
    ChargeDescription: detail.ChargeDescription,
    HSSACMasterSid: detail.HSSACMasterSid,
    ChargeUOMSid: detail.ChargeUOMSid,
    NumberOfUnit: detail.NumberOfUnit,
    Rate: detail.Rate,
    Amount: detail.Amount,
    TaxableAmount: detail.TaxableAmount,
    TaxPercentage1: detail.TaxPercentage1 || 0,
    TaxAmount1: detail.TaxAmount1 || 0,
    TaxPercentage2: detail.TaxPercentage2 || 0,
    TaxAmount2: detail.TaxAmount2 || 0,
    LocalAmount: detail.LocalAmount,
    CurrencyCode: detail.CurrencyCode,
    CurrencyMasterSid: this.currencyList.find(c => c.currencyCode === detail.CurrencyCode)?.CurrencyMasterSid,
    ExchangeRate: detail.ExchangeRate,
    DrCr: detail.DrCr,
    LedgerMasterSid: detail.LedgerMasterSid,
    COAMasterSid: detail.COAMasterSid || coaMasterSid,
    MasterJobSid: detail.MasterJobSid,
    HouseJobSid: detail.HouseJobSid,
    PartyAmount : partyAmount,
    DepartmentMasterSid: detail.DepartmentMasterSid,
    Remarks: detail.Remarks
    }
  });

  // Add TDS
  // payload.VoucherTDS = this.prepareVoucherTDSPayload(formValue.voucherDetails);

  // Add others
  payload.VoucherOthers = {
    ...formValue.voucherOthers,
    Remarks: formValue.Remarks || ''
  };
  console.log("Header ID:", this.headerId);
console.log("Detail IDs:", formValue.voucherDetails.map(d => d.VoucherDetailSid));

    return payload;
}

  getPartyAmount(detail: any) {
    const voucherHeaderCurrency = this.vendorCreditNoteForm.get('CurrencyCode')?.value;
    const voucherHeaderExRate = this.vendorCreditNoteForm.get('ExchangeRate')?.value;
    const chargeCurrencyCode = detail.CurrencyCode;
    const chargeCurrencyId = this.currencyList.find(cr => detail.CurrencyCode === cr.currencyCode)?.CurrencyMasterSid;

    if(detail.IsAutoGenerated){
      return this.getFormattedAmount(toNumber(detail.PartyAmount), chargeCurrencyId);
    }

    // Same currency → no conversion
    if (chargeCurrencyCode === voucherHeaderCurrency) {
      return this.getFormattedAmount(toNumber(detail.LocalAmount), chargeCurrencyId);
    } else {
      return this.getFormattedAmount(toNumber(detail.LocalAmount) / toNumber(voucherHeaderExRate), chargeCurrencyId);
    }
  }

  public getFormattedAmount(amount: number, CurrencyMasterSid: number) {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    const input = {
      value: amount,
      currencyCode: currency?.currencyCode
    }
    return this.currencyFormatter.formatAmount(input, false);
  }

  patchExchangeRateForDetail(fromCurrencyCode: string, toCurrencyCode: string, index: number) {
    const formGroup = this.details.at(index) as FormGroup;
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode,
      toCurrencyCode,
      EffectiveFrom : this.isEditMode ? new Date(this.vendorCreditNoteData?.VoucherDate) : new Date(),
      segment: 'cost'
    }

    this.operationService.getExchangeRate(payload).subscribe({
      next: (response: any) => {
        if (response?.status && response.data) {
          const formGroup = this.details.at(index) as FormGroup;
          formGroup.get('ExchangeRate')?.enable();
          formGroup.patchValue({ ExchangeRate: Number(response.data), });
          this.recalcRow(index);
        } else {
          console.warn('Exchange rate not found, defaulting to 1');
          formGroup.get('ExchangeRate')?.disable();
          formGroup.patchValue({ ExchangeRate: 1, });
          this.recalcRow(index);
        }
      },
      error: (err) => {
        console.error('Error fetching exchange rate:', err);
        formGroup.get('ExchangeRate')?.disable();
        formGroup.patchValue({ ExchangeRate: 1, });
        this.recalcRow(index);
      }
    });
  }

  getTotalLocalCredits() {
    return (this.details.getRawValue().reduce((sum, dtl: any) => {
      if (dtl.DrCr === 'C') {
        return sum + Number(dtl.LocalAmount);
      }
      return sum;
    }, 0)).toFixed(2);
  }

  getTotalLocalDebits() {
    return (this.details.getRawValue().reduce((sum, dtl: any) => {
      if (dtl.DrCr === 'D') {
        return sum + Number(dtl.LocalAmount);
      }
      return sum;
    }, 0)).toFixed(2);
  }

  getNetCrDr() {
    return toNumber(this.getTotalLocalCredits() - this.getTotalLocalDebits()).toFixed(2);
  }

  getPartyCurrCreditAmt() {
    return (this.details.getRawValue().reduce((sum, dtl: any) => {
      if (dtl.DrCr === 'C') {
        return sum + Number(dtl.PartyAmount);
      }
      return sum;
    }, 0)).toFixed(2);
  }

  getPartyCurrDebitAmt() {
    return (this.details.getRawValue().reduce((sum, dtl: any) => {
      if (dtl.DrCr === 'D') {
        return sum + Number(dtl.PartyAmount);
      }
      return sum;
    }, 0)).toFixed(2);
  }

//   prepareVoucherTDSPayload(details: any[]): any[] {
//   const taxRecords: any[] = [];
  
//   details.forEach((detail: any) => {
//     if (detail.TaxAmount1 > 0 || detail.TaxAmount2 > 0 || detail.TaxAmountIGST > 0) {
//       if (detail.TaxAmountIGST > 0) {
//         taxRecords.push({
//           TaxType: 'IGST',
//           TaxPercentage: detail.TaxPercentageIGST,
//           TaxAmount: detail.TaxAmountIGST,
//           HSSACMasterSid: detail.HSSACMasterSid,
//           TDSSetRateSid: detail.TDSSetRateSid,
//           ITSectionCode: this.tdsGroup.get('ITSectionCode')?.value || ''
//         });
//       } else {
//         if (detail.TaxAmount1 > 0) {
//           taxRecords.push({
//             TaxType: 'CGST',
//             TaxPercentage: detail.TaxPercentage1,
//             TaxAmount: detail.TaxAmount1,
//             TDSSetRateSid: detail.TDSSetRateSid,
//             HSSACMasterSid: detail.HSSACMasterSid,
//             ITSectionCode: this.tdsGroup.get('ITSectionCode')?.value || ''
//           });
//         }
//         if (detail.TaxAmount2 > 0) {
//           taxRecords.push({
//             TaxType: 'SGST',
//             TaxPercentage: detail.TaxPercentage2,
//             TaxAmount: detail.TaxAmount2,
//             TDSSetRateSid: detail.TDSSetRateSid,
//             HSSACMasterSid: detail.HSSACMasterSid,
//             ITSectionCode: this.tdsGroup.get('ITSectionCode')?.value || ''
//           });
//         }
//       }
//     }
//   });
  
//   return taxRecords;
// }

// Check if voucher is posted (for UI controls)
get isPosted(): boolean {
  return this.vendorCreditNoteData?.PostStatus === 'P';
}

// Check if voucher is draft
get isDraft(): boolean {
  return !this.vendorCreditNoteData?.PostStatus || this.vendorCreditNoteData?.PostStatus === 'U';
}


  onReset() {
    if (this.isEditMode) {
      this.loadVendorCreditNoteById(this.headerId!);
    } else {
      this.vendorCreditNoteForm.reset();
      this.details.clear();
      // this.tdsGroup.reset();
      const currencySettings = this.companySettings.getCurrencySettings();
      this.vendorCreditNoteForm.patchValue({
        CurrencyCode: currencySettings.code,
        ExchangeRate: 1,
        InvoiceType: 'B2B',
        Status: 'A'
      });
    }
  }

  onCancel() {
    this.router.navigate(['/operation/vendor-credit-note/list']);
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
    if (this.vendorCreditNoteForm.invalid) {
      this.markFormGroupTouched(this.vendorCreditNoteForm);
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
      this.operationService.updateVendorCreditNoteById(this.headerId, payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          this.isSaving = false;
          if (response.status) {
            this.appSettingService.showSuccess('Vendor CreditNote updated successfully');
            const id = response.data?.newVoucher?.VoucherHeaderSid || response.data?.VoucherHeaderSid || response.data?.voucherHeaderSid || null;
            this.router.navigate(['/operation/vendor-credit-note/entry',id]);
          } else {
            this.appSettingService.showError('Failed to update Vendor CreditNote');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.isSaving = false;
          this.appSettingService.showError('Error updating Vendor CreditNote');
          console.error('Error:', error);
        }
      });
    } else {
      this.operationService.createVendorCreditNote(payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          this.isSaving = false;
          if (response.status) {
            this.appSettingService.showSuccess('Vendor CreditNote created successfully');
            const id = response.data?.newVoucher?.VoucherHeaderSid || response.data?.VoucherHeaderSid || response.data?.voucherHeaderSid || null;
            if(id) this.router.navigate(['/operation/vendor-credit-note/entry',id]);
            else this.router.navigate(['/operation/vendor-credit-note/list']);
          } else {
            this.appSettingService.showError('Failed to create Vendor CreditNote');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.isSaving = false;
          this.appSettingService.showError('Error creating Vendor CreditNote');
          console.error('Error:', error);
        }
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.vendorCreditNoteForm.get(fieldName);
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
    this.vendorCreditNoteForm.get(fieldName)?.setValue(ngbDate);
    datepicker.close();
  }

  onCurrencyChange(event: any): void {
    console.log(event,'onCurrencyChange')
    const currencySid = event?.CurrencyMasterSid || event;
    if (!currencySid) return;

    const currency = this.currencyList.find(c => c.CurrencyMasterSid === currencySid);
    if (currency) {
      this.vendorCreditNoteForm.patchValue({
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

  // parseNgbDateToISO(ngbDate: NgbDateStructLike | null): string | null {
  //   if (!ngbDate) return null;
  //   const d = new Date(ngbDate.year, ngbDate.month - 1, ngbDate.day);
  //   return d.toISOString();
  // }
  private fromNgbDate(s: NgbDateStructLike | null): Date | null {
    if (!s || !s.year) return null;
    return new Date(s.year, (s.month || 1) - 1, s.day || 1);
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
  removeDetailRow(index: number) {
  if (this.details.length > index) this.details.removeAt(index);
  this.recalculateAllRows();
}

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.headerId;

        } else {
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
  }
  openEmail() {
    if (!this.vendorCreditNoteData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    const MenuMasterSid = localStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
   const modalRef = this.modalService.open(AuthorityLogComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.headerId;
  }

openEDoc() {
  if (!this.vendorCreditNoteData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.vendorCreditNoteData;
  modalRef.componentInstance.idLabel = 'HAWB Stock Id';
  modalRef.componentInstance.idValue = this.vendorCreditNoteData?.headerId;
  const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.headerId
  }

      this.commonService.documentData.set(data)
}

 openFollowup() {
    if (!this.vendorCreditNoteData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.vendorCreditNoteData?.QuoteHeaderSid;
    modalRef.componentInstance.parentEmail = this.vendorCreditNoteData.Email;
    modalRef.componentInstance.parentSubject = `Quotation No.${this.vendorCreditNoteData.QuoteNumber} Date:${new Date(this.vendorCreditNoteData.QuoteDate).toLocaleDateString()}`;
    modalRef.componentInstance.parentMailbody = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
      <p>Dear Sir/Madam,</p>
      <p>Please find enclosed the quotation as requested.</p>
      <p>Kindly review the details at your convenience.</p>
      <p>Looking forward to your feedback and the opportunity to work together.</p>
      <p>
        Approval Hyperlink: 
        <a href="https://xxxxxxxxx" target="_blank" style="color: #1a73e8;">Click here to approve</a>
      </p>
      <p>Best Regards,</p>
      <p>${this.userData['userEmail']}</p>
    </div>
  `;

  // Optionally, pass the quotation HTML content ID for PDF generation
  modalRef.componentInstance.pdfContentId = 'quotationContent';
  }

getFirstRateError(): string {
  for (let row of this.details.controls) {
    const rateControl = row.get('Rate');
    if (rateControl?.invalid && rateControl?.touched) {
      if (rateControl.errors?.['rateExceeded']) {
        return 'Credit note rate cannot exceed original vendor invoice rate';
      }
      if (rateControl.errors?.['required']) {
        return 'Rate is required';
      }
      if (rateControl.errors?.['min']) {
        return 'Rate must be greater than or equal to 0';
      }
    }
  }
  return '';
}
  
}
