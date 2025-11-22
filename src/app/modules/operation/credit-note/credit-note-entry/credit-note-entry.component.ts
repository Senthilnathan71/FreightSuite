import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, AbstractControl, FormArray, FormBuilder, Validators, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
import { firstValueFrom } from 'rxjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface NgbDateStructLike { day: number; month: number; year: number; }

@Component({
  selector: 'app-credit-note-entry',
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
  templateUrl: './credit-note-entry.component.html',
  styleUrl: './credit-note-entry.component.scss'
})
export class CreditNoteEntryComponent {
  creditNoteForm!: FormGroup;
  emailForm!: FormGroup;
  headerId: number | null = null;
  currentCompany: any;
  currentBranch: any;
  creditNoteData : any;

  currUserEmail: string | null = null;
  isViewMode: boolean = false;
  get isEditMode() { return !!this.headerId && !this.isViewMode; }

  @ViewChild('printModal') printModalRef: any;
  private originalInvoiceRates: Map<number, number> = new Map();
  customerList: any[] = [];
  customerBranchList: any[] = [];
  bankDetails : any;
  currencyList: any[] = [];
  chargeList: any[] = [];
  stateList: any[] =[];
  hssacList: any[] = [];
  invoiceList:any[] =[];
  subledgerList: any[] = [];
  invoiceOutstandingAmount: number = 0;
  selectedOutstandingInvoice: any = null;
  showOutstandingInfo: boolean = false;
  uomList: any[] = [];
  userData: any;
  currentDate = new Date()
  masterJobList: any[] = [];
    houseJobListByMasterJob: { [key: number]: any[] } = {};
    customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
    chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;
    invoiceLookupConfig = DROPDOWN_CONFIGS.INVOICE;
     CurrencyLookupConfig = {
    displayFields: ['currencyCode', 'currencyName','countryName'],
    displayLabels: ['Code', 'Name','Country'],
    labelFields: ['currencyCode'],
  };
   HSSACLookupConfig = {
    displayFields : ['HSSACCode', 'HSSACName'],
    displayLabels : ['Code', 'Name'],
    labelFields :['HSSACCode'],
  };
  gstTypes = [
    { id: 'B2B', name: 'B2B - Business to Business' },
    { id: 'B2C', name: 'B2C - Business to Customer' },
    { id: 'EXWP', name: 'Export With Payment' },
    { id: 'EXWOP', name: 'Export Without Payment' }
  ];
  departmentList: any[] = [];
  departmentLookupConfig = {
    displayFields: ['departmentCode', 'departmentName'],
    displayLabels: ['Code', 'Name'],
    labelFields: ['departmentName'],
  };
  selectedTab = 'Credit Note';
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }
  tabs = [
    { name: 'Credit Note', icon: 'fas fa-file-invoice' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' }
  ];
  ModeofStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];
  invoiceTypes = [
    { id: 'REG', name: 'Regular' },
    { id: 'REIMB', name: 'Reimbursement' },
    { id: 'BOS', name: 'Bill of Supply' },
    { id: 'NONGST', name: 'Non GST/Zero' },
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
  bookingModeCountry: string = '';
  private pendingBranchToSelect: number | null = null;
  currentUserState: string;
  currentFinancialYear : number;
  currentCountry : number;
  currentCurrency: number;
  currentUserCurrency : string;
  
  currentUserCountry :string;
  get isIndiaGST(): boolean {
    return this.bookingModeCountry === 'india';
  }
  get isVATMode(): boolean {
    return !this.isIndiaGST; // VAT for non-India countries
  }
  get f(): { [key: string]: AbstractControl } {
      return this.creditNoteForm.controls;
    }
    get details(): FormArray {
      return this.creditNoteForm.get('voucherDetails') as FormArray;
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
      this.currentFinancialYear = Number(localStorage.getItem('current-year-id'));
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

    try {
      const profile = (this.appSettingService as any).getProfile ? (this.appSettingService as any).getProfile() : null;
      const decryptedProfileRaw = localStorage.getItem('user-profile');
      const decryptedProfile = decryptedProfileRaw ? this.appSettingService.decrypt(decryptedProfileRaw) : null;
      this.currUserEmail = decryptedProfile?.email || localStorage.getItem('user-email') || null;
    } catch (err) {
      this.currUserEmail = localStorage.getItem('user-email') || null;
      this.route.data.subscribe(data => {
        this.isViewMode = data['viewMode'] === true;
      });
    }

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.headerId = Number(id);
        this.loadCreditNoteById(this.headerId);
      } else {
        // New invoice - set default currency from company config
        const currencySettings = this.companySettings.getCurrencySettings();
        this.creditNoteForm.patchValue({
          PartyMasterSid: 3,
          CurrencyCode: currencySettings.code,
          ExchangeRate: 1 // Home currency always has exchange rate of 1
        });
      }
    });

    this.creditNoteForm.get('CurrencyCode')?.valueChanges.subscribe(() => {
      this.recalculateAllRows();
      this.getBankDetails();
    });

    this.creditNoteForm.get('ExchangeRate')?.valueChanges.subscribe(() => {
      this.recalculateAllRows();
    });
  }

  initForm() {
      this.creditNoteForm = this.fb.group({
        VoucherNumber: [{ value: '', disabled: true }],
        ReversalVoucher:[null],
        VoucherDate: [null, Validators.required],
        CustomerMasterSid: [{value: null, disabled: true}],
        PartyMasterSid: [{value: null, disabled: true}],
        PartyName: [{value: null, disabled: true}],
        PartyAddress: [{ value: '', disabled: true }, Validators.required],
        CustomerBranchSid: [{value: null, disabled: true}],
        DocumentNumber: [{ value: '', disabled: true }],
        IRNNumber: [{ value: '', disabled: true }],
        MasterJobSid: [{ value: '', disabled: true }],
        HBLNo: [{ value: '', disabled: true }],
        CurrencyCode: [{ value: '', disabled: true }],
        ExchangeRate: [{ value: 1, disabled: true }],
        GST_VAT: [{ value: '', disabled: true }],
        GSTType: [{ value: '', disabled: true }],
        PostStatus: [''],
        InvoiceType: [{value: null, disabled: true}],
        VoucherType: [''],
        Narration: ['hi'],
        CreditNoteReason: [''],
        Remarks: [{ value: '', disabled: true }],
        IRNStatus: [{ value: '', disabled: true }],
        MBLNo: [{ value: '', disabled: true }],
        status: [{ value: 'A', disabled: true }],
        voucherDetails: this.fb.array([]),
        voucherOthers: this.fb.group({
          ContainerNumber: [''],
          VoucherNote: [''],
          Footer: [''],
          ReverseCreditNote: [''],
          DueDate: [null],
          IRNNumber: [''],
          IRNStatus: [''],
          IRNQRCode: [''],
          VoucherReverseSid: [null]
        })
      });
    }

    async loadLookups() {
        try {
          this.spinner.show();
    
          const companyRaw = localStorage.getItem('selected-company');
          const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;
          const filterOption = { CompanyMasterSid: company?.CompanyMasterSid, BranchMasterSid: company?.BranchMasterSid };
    
          // Try to get country from multiple sources
          // Priority: 1. Branch country, 2. Company country, 3. Fetch from backend
          let CountryName = null;
            try {
            await this.loadDepartments(company?.CompanyMasterSid);
          } catch (e) {
            console.error('Error loading departments', e);
            this.departmentList = [];
          }
          // Check currentBranch (set in ngOnInit)
          if (this.currentBranch) {
            CountryName = this.currentBranch.countryName
              || this.currentBranch.country?.countryName
              || this.currentBranch.countryMaster?.CountryName;
          }
    
          // Fallback to company
          if (!CountryName && company) {
            CountryName = company.CountryName
              || company.country?.countryName
              || company.countryMaster?.countryName;
          }
    
          // Set bookingModeCountry - default to empty string if not found
          this.bookingModeCountry = CountryName ? String(CountryName).trim().toLowerCase() : '';
    
          // If still no country, try to fetch it from backend based on CountryMasterSid
          if (!this.bookingModeCountry) {
            const countryMasterSid = this.currentBranch?.CountryMasterSid || company?.CountryMasterSid;
            if (countryMasterSid) {
              try {
                await this.fetchCountryName(countryMasterSid);
              } catch (e) {
                console.warn('Could not fetch country information', e);
              }
            }
          }
    
          console.log('DEBUG - bookingModeCountry:', this.bookingModeCountry);
          console.log('DEBUG - isIndiaGST:', this.isIndiaGST);
          console.log('DEBUG - isVATMode:', this.isVATMode);
    
          // If country is still not determined, log a warning
          if (!this.bookingModeCountry) {
            console.warn('WARNING: Country could not be determined. Defaulting to VAT mode.');
            console.warn('Company data:', company);
            console.warn('Branch data:', this.currentBranch);
          }
    
          try {
      const custResp: any = await firstValueFrom(this.operationService.getAllDebtorWithCOAMapped(filterOption));
      this.customerList = custResp?.data || custResp || [];
    } catch (e) {
      this.customerList = [];
    }
    
          try {
            const currencies: any = await firstValueFrom(this.operationService.getAllCurrencies().pipe());
            this.currencyList = (currencies && currencies.data) ? currencies.data : [];
            const rawCurrencies = currencies.data || currencies || [];
         
          this.currencyList = rawCurrencies.map((c: any) => ({
            ...c,
            countryName: c?.countryMaster?.countryName || ''  
          }));
            this.getBankDetails();
          } catch (e) {
            this.currencyList = [];
          }
    
          try {
            this.chargeList = await firstValueFrom(this.operationService.getAllCharges(company?.CompanyMasterSid));
          } catch (e) {
            this.chargeList = [];
          }
    
          try {
            const hs: any = await firstValueFrom(this.operationService.getAllHssac());
            if (hs && Array.isArray(hs)) {
              this.hssacList = hs;
            } else if (hs && hs.data && Array.isArray(hs.data)) {
              this.hssacList = hs.data;
            } else if (hs && hs.status && Array.isArray(hs.data)) {
              this.hssacList = hs.data;
            } else {
              this.hssacList = hs || [];
            }
            console.log('DEBUG - hssacList loaded:', this.hssacList.length, 'items');
            if (this.hssacList.length > 0) {
              console.log('DEBUG - First HSSAC item structure:', this.hssacList[0]);
            }
          } catch (e) {
            console.error('Error loading HSSAC list:', e);
            this.hssacList = [];
          }
    
          try {
            const subledgers: any = await firstValueFrom(this.operationService.getAllSuledgermaster());
            this.subledgerList = subledgers || [];
          } catch (e) {
            this.subledgerList = [];
          }
    
          // NEW: load UOM list
          try {
            const uoms: any = await firstValueFrom(this.operationService.getAllUom());
            if (uoms && Array.isArray(uoms)) this.uomList = uoms;
            else if (uoms && Array.isArray((uoms as any).data)) this.uomList = (uoms as any).data;
            else this.uomList = uoms || [];
          } catch (e) {
            this.uomList = [];
          }

          try {
            const invoice: any = await firstValueFrom(this.operationService.getAllInvoice());
            if (invoice && Array.isArray(invoice)) this.invoiceList = invoice;
            else if (invoice && Array.isArray((invoice as any).data)) this.invoiceList = (invoice as any).data;
            else this.invoiceList = invoice || [];
          } catch (e) {
            this.invoiceList = [];
          }
    
          // load master jobs for dropdown
          try {
            await this.loadMasterJobs();
          } catch (e) {
            // handled in loadMasterJobs
          }
    
          this.spinner.hide();
        } catch (error) {
          this.spinner.hide();
          console.error('Error loading lookups', error);
          this.appSettingService.showError('Error loading lookups.');
        }
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
    const foundVoucher = this.invoiceList.find(inv => 
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

      getInvoiceData(invoice?: any) {
  const invoiceId = invoice || this.creditNoteForm.get('ReversalVoucher')?.value;
  if (!invoiceId) {
    this.appSettingService.showWarning('Please select an invoice first.');
    return;
  }

  let reversalVoucherId = invoiceId;
  let invoiceNumber = '';

  // Extract invoice number and ID
  if (typeof reversalVoucherId === 'object' && reversalVoucherId !== null) {
    invoiceNumber = reversalVoucherId.VoucherNumber || reversalVoucherId.voucherNumber || '';
    reversalVoucherId = reversalVoucherId.VoucherHeaderSid || reversalVoucherId.voucherHeaderSid;
     const autoNarration = this.autoGenerateNarration(reversalVoucherId);
    this.creditNoteForm.get('Narration')?.setValue(autoNarration);
  } else {
    // If it's just an ID, try to find the invoice in the list to get the number
    const foundInvoice = this.invoiceList.find(inv => 
      inv.VoucherHeaderSid === reversalVoucherId || inv.voucherHeaderSid === reversalVoucherId
    );
    invoiceNumber = foundInvoice?.VoucherNumber || foundInvoice?.voucherNumber || '';
     const autoNarration = this.autoGenerateNarration(reversalVoucherId);
    this.creditNoteForm.get('Narration')?.setValue(autoNarration);
  }

  this.spinner.show();
  
  // First, get the invoice data
  this.operationService.getInvoicesById(invoiceId).subscribe({
    next: (resp: any) => {
      if (resp?.status && resp.data) {
        this.creditNoteForm.patchValue({
          ReversalVoucher: reversalVoucherId
        });
        this.patchInvoiceData(resp.data);
        
        // Now search for outstanding amount for this invoice
        this.searchOutstandingForInvoice(invoiceNumber, resp.data);
        
        this.appSettingService.showSuccess('Invoice data loaded successfully.');
      } else {
        this.spinner.hide();
        this.appSettingService.showError('Error loading invoice data.');
      }
    },
    error: (err) => {
      this.spinner.hide();
      console.error('Error fetching invoice:', err);
      this.appSettingService.showError('Failed to load invoice data.');
    }
  });
}

// New method to search outstanding amount for the invoice
private searchOutstandingForInvoice(invoiceNumber: string, invoiceData: any) {
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
        const outstandingAmount = Math.abs(matchingOutstanding.OutstandingAmount);
        
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

private patchInvoiceData(invoiceData: any) {
  const header = invoiceData;
  const invoiceHeaderSid = header.VoucherHeaderSid || header.voucherHeaderSid || null;
  this.originalInvoiceRates = new Map();
  const currentNarration = this.creditNoteForm.get('Narration')?.value;
  const autoNarration = this.autoGenerateNarration(this.creditNoteForm.get('ReversalVoucher')?.value);
  this.creditNoteForm.patchValue({
    ReversalVoucher: invoiceHeaderSid,
    CustomerMasterSid: header.CustomerMasterSid || null,
    PartyMasterSid: header.PartyMasterSid || null,
    Narration: autoNarration || header.Narration || currentNarration || '',
    PartyName: header.PartyName || '',
    PartyAddress: header.PartyAddress || '',
    DocumentNumber: header.DocumentNumber || '',
    MasterJobSid: header.MasterJobSid || null,
    HBLNo: header.HouseJob || header.HouseNumber || '',
    CurrencyCode: header.currencyMaster?.currencyCode || header.CurrencyCode || null,
    ExchangeRate: header.ExchangeRate || header.ExRate || 1,
    GST_VAT: header.GST_VAT || '',
    GSTType: header.GSTType || '',
    InvoiceType: header.InvoiceType || null,
    Remarks: header.Remarks || '',
    MBLNo: header.MasterNumber || '',
  });

  const customerMasterSid = header.CustomerMasterSid;
  if (customerMasterSid) {
    // Set customer and load branches
    this.creditNoteForm.get('CustomerMasterSid')?.setValue(customerMasterSid);
    
    // Find customer in customerList to set PartyName
    const customer = this.customerList.find(c => c.CustomerMasterSid === customerMasterSid);
    if (customer) {
      this.creditNoteForm.get('PartyName')?.setValue(customer.CustomerName || '');
      
      // Set PartyMasterSid from customer's SubledgerMasterSid
      if (customer.SubledgerMasterSid) {
        this.creditNoteForm.get('PartyMasterSid')?.setValue(Number(customer.SubledgerMasterSid));
      }
    }

    // Load branches for the customer
    this.getCustomerBranchByCustomer(Number(customerMasterSid));

    // Set branch if available in invoice data
    const branchSid = header.CustomerBranchSid;
    if (branchSid) {
      // Use setTimeout to ensure branches are loaded first
      setTimeout(() => {
        this.creditNoteForm.get('CustomerBranchSid')?.setValue(Number(branchSid));
        
        // Find branch and set address
        const foundBranch = this.customerBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));
        if (foundBranch) {
          this.creditNoteForm.get('PartyAddress')?.setValue(foundBranch.Address || foundBranch.CustomerAddress1 || '');
        }
      }, 500);
    }
  }

  // Extract voucher details from the complex structure
  let detailsFromInvoice: any[] = [];

  // Method 1: Check if voucherDetail exists in VoucherTransaction array
  if (header.VoucherTransaction && Array.isArray(header.VoucherTransaction)) {
    detailsFromInvoice = header.VoucherTransaction
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
          // Map other fields as needed
        };
      });
  }
  
  // Method 2: Fallback to direct voucherDetails array if available
  if (detailsFromInvoice.length === 0) {
    detailsFromInvoice = invoiceData.voucherDetails 
      || invoiceData.voucherDetail 
      || invoiceData.VoucherDetail 
      || invoiceData.VoucherDetails 
      || [];
  }

  console.log('DEBUG - Extracted voucher details:', detailsFromInvoice);

  // Clear existing details and add new ones from invoice
  this.details.clear();
  
  detailsFromInvoice.forEach((detail: any) => {
    const amount = detail.Amount ? (Number(detail.Amount)) : 0;
    const taxableAmount = detail.TaxableAmount ? (Number(detail.TaxableAmount)) : 0;
    const taxAmount1 = detail.TaxAmount1 ? (Number(detail.TaxAmount1)) : 0;
    const taxAmount2 = detail.TaxAmount2 ? (Number(detail.TaxAmount2)) : 0;
    const taxAmountIGST = detail.TaxAmountIGST ?(Number(detail.TaxAmountIGST)) : 0;
    const localAmount = detail.LocalAmount ? (Number(detail.LocalAmount)) : 0;
    const partyAmount = detail.PartyAmount ? (Number(detail.PartyAmount)) : 0;

    const taxPercentage1 = detail.TaxPercentage1 !== undefined ? Number(detail.TaxPercentage1) : 
                        detail.taxPercentage1 !== undefined ? Number(detail.taxPercentage1) : 0;
  
    const taxPercentage2 = detail.TaxPercentage2 !== undefined ? Number(detail.TaxPercentage2) : 
                        detail.taxPercentage2 !== undefined ? Number(detail.taxPercentage2) : 0;
  
    const taxPercentageIGST = detail.TaxPercentageIGST !== undefined ? Number(detail.TaxPercentageIGST) : 
                           detail.taxPercentageIGST !== undefined ? Number(detail.taxPercentageIGST) : 0;

    console.log('DEBUG - Tax percentages for detail:', {
      taxPercentage1,
      taxPercentage2,
      taxPercentageIGST,
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

    this.details.push(this.createDetailGroup({
      VoucherDetailSid: detail.VoucherDetailSid,
      ChargeMasterSid: detail.ChargeMasterSid,
      ChargeDescription: detail.ChargeDescription,
      HSSACMasterSid: detail.HSSACMasterSid,
      ChargeUOMSid: detail.ChargeUOMSid,
      DepartmentMasterSid: detail.DepartmentMasterSid,
      NumberOfUnit: detail.NumberOfUnit,
      DrCr: swappedDrCr,
      CurrencyCode: detail.CurrencyCode,
      Rate: detail.Rate != null ? Number(detail.Rate) : 0,
      ExchangeRate: detail.ExchangeRate,
      Amount: amount,
      TaxableAmount: taxableAmount,
      TaxPercentage1: taxPercentage1,
      TaxAmount1: taxAmount1,
      TaxPercentage2: taxPercentage2,
      TaxAmount2: taxAmount2,
      TaxPercentageIGST: taxPercentageIGST,
      TaxAmountIGST: taxAmountIGST,
      LocalAmount: localAmount,
      PartyAmount: partyAmount,
      MasterJobSid: detail.MasterJobSid,
      HouseJobSid: detail.HouseJobSid
    }));
  });

  // Patch voucher others data if available
  const voucherOthersSource = invoiceData.VoucherOthers 
    || invoiceData.voucherOthers 
    || (Array.isArray(invoiceData.voucherOthers) ? invoiceData.voucherOthers[0] : undefined);

  if (voucherOthersSource) {
    const vg = this.creditNoteForm.get('voucherOthers') as FormGroup;
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

onFinalSave() {
  console.log('DEBUG - onFinalSave called');
  
  if (this.creditNoteForm.invalid) {
    this.creditNoteForm.markAllAsTouched();
    this.appSettingService.showWarning('Please fill required credit note fields.');
    return;
  }

  if (this.details.length === 0) {
    this.appSettingService.showWarning('Please add at least one charge line.');
    return;
  }

  this.recalculateAllRows();

  console.log('DEBUG - Calling saveCreditNote with isFinal: true');
  
  // First save the invoice, then post it
  this.saveCreditNote(true); // true indicates final save
}

      private saveCreditNote(isFinal: boolean) {
        const raw = this.creditNoteForm.getRawValue();
      
        const userEmailFromSettings = (this.appSettingService as any).userSettingSource?.value?.['userEmail'] || null;
        const createdByValue = userEmailFromSettings || this.currUserEmail || null;
        const updatedByValue = this.isEditMode ? (userEmailFromSettings || this.currUserEmail || null) : null;
      
        // Add PostStatus to payload
        const postStatus = isFinal ? 'P' : 'D'; // 'P' for Posted, 'D' for Draft
      
        let normalizedVoucherType: number | null = null;
        const vt = raw.VoucherType;
        if (Array.isArray(vt) && vt.length > 0) {
          normalizedVoucherType = Number(vt[0]);
        } else if (vt !== null && vt !== undefined && vt !== '') {
          normalizedVoucherType = Number(vt);
        }
        if (isNaN(normalizedVoucherType)) normalizedVoucherType = null;
      
        let voucherDate: Date;
        if (!raw.VoucherDate) {
          voucherDate = new Date();
        } else if ((raw.VoucherDate as NgbDateStructLike).year) {
          const converted = this.fromNgbDate(raw.VoucherDate as NgbDateStructLike);
          voucherDate = converted ?? new Date();
        } else {
          const parsed = new Date(raw.VoucherDate);
          voucherDate = isNaN(parsed.getTime()) ? new Date() : parsed;
        }
      
        const normalizedParty = this.normalizeParty(raw);
        const currencyMasterId = this.getCurrencyId(raw.CurrencyCode);
        const masterJobSid = raw.MasterJobSid ? Number(raw.MasterJobSid) : null;
      
        const rawPartyControl = this.creditNoteForm.get('PartyMasterSid')?.value;
        const partyMasterSid = rawPartyControl != null && rawPartyControl !== ''
          ? Number(rawPartyControl)
          : (normalizedParty.PartyMasterSid != null ? Number(normalizedParty.PartyMasterSid) : null);
      
        const voucherDetailArray = (raw.voucherDetails || []).map((d: any, index: number) => {
          const detail = {
            VoucherDetailSid: d.VoucherDetailSid,
            ChargeMasterSid: d.ChargeMasterSid != null ? Number(d.ChargeMasterSid) : null,
            ChargeDescription: d.ChargeDescription || '',
            HSSACMasterSid: d.HSSACMasterSid != null ? Number(d.HSSACMasterSid) : null,
            ChargeUOMSid: d.ChargeUOMSid != null ? Number(d.ChargeUOMSid) : null,
            DepartmentMasterSid: d.DepartmentMasterSid != null ? Number(d.DepartmentMasterSid) : null,
            NumberOfUnit: d.NumberOfUnit != null ? Number(d.NumberOfUnit) : 0,
            DrCr: d.DrCr || 'D',
            CurrencyCode: d.CurrencyCode || raw.CurrencyCode,
            CurrencyMasterSid: this.getCurrencyId(d.CurrencyCode || raw.CurrencyCode),
            Rate: d.Rate != null ? Number(d.Rate) : 0,
            ExchangeRate: d.ExchangeRate != null ? Number(d.ExchangeRate) : (raw.ExchangeRate != null ? Number(raw.ExchangeRate) : 1),
            Amount: d.Amount != null ? Number(d.Amount) : 0,
            TaxableAmount: d.TaxableAmount != null ? Number(d.TaxableAmount) : (d.Amount != null ? Number(d.Amount) : 0),
            TaxPercentage1: d.TaxPercentage1 != null ? Number(d.TaxPercentage1) : 0,
            TaxAmount1: d.TaxAmount1 != null ? Number(d.TaxAmount1) : 0,
            TaxPercentage2: d.TaxPercentage2 != null ? Number(d.TaxPercentage2) : 0,
            TaxAmount2: d.TaxAmount2 != null ? Number(d.TaxAmount2) : 0,
            TaxPercentageIGST: d.TaxPercentageIGST != null ? Number(d.TaxPercentageIGST) : 0,
            TaxAmountIGST: d.TaxAmountIGST != null ? Number(d.TaxAmountIGST) : 0,
            LocalAmount: d.LocalAmount != null ? Number(d.LocalAmount) : 0,
            PartyAmount: d.PartyAmount != null ? Number(d.PartyAmount) : 0,
            MasterJobSid: d.MasterJobSid ? Number(d.MasterJobSid) : masterJobSid,
            HouseJobSid: d.HouseJobSid ? Number(d.HouseJobSid) : null
          };
          return detail;
        });
      
        const rawVoucherOthers = raw.voucherOthers ? { ...raw.voucherOthers } : null;
        if (rawVoucherOthers && rawVoucherOthers.DueDate && (rawVoucherOthers.DueDate as NgbDateStructLike).year) {
          rawVoucherOthers.DueDate = this.fromNgbDate(rawVoucherOthers.DueDate as NgbDateStructLike);
        }
      
        const voucherOthersCandidate = this.buildVoucherOthersPayload(rawVoucherOthers);
      
        const payload: any = {
          ...(this.isEditMode ? { UpdatedBy: updatedByValue } : { CreatedBy: createdByValue }),
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          BranchMasterSid: this.currentBranch?.BranchMasterSid,
          VoucherNumber: raw.VoucherNumber || null,
          VoucherDate: voucherDate,
          PostDate: voucherDate,
          GST_VAT: raw.GST_VAT || undefined,
          PartyMasterSid: partyMasterSid,
          PartyName: normalizedParty.PartyName || String(raw.PartyName || ''),
          PartyAddress: normalizedParty.PartyAddress || raw.PartyAddress || '',
          CustomerBranchSid: normalizedParty.CustomerBranchSid ?? null,
          PlaceOfSupply: raw.PlaceOfSupply || '',
          COAMasterSid: raw.COAMasterSid ?? 1,
          VoucherType: normalizedVoucherType,
          VoucherTypeMasterSid: raw.VoucherTypeMasterSid ? Number(raw.VoucherTypeMasterSid) : (normalizedVoucherType ?? undefined),
          InvoiceType: raw.InvoiceType || 'REG',
          GSTType: raw.GSTType || '',
          CurrencyMasterSid: currencyMasterId,
          PostStatus: raw.PostStatus || '',
          CurrencyCode: raw.CurrencyCode || undefined,
          ExchangeRate: raw.ExchangeRate != null ? Number(raw.ExchangeRate) : undefined,
          MasterJobSid: masterJobSid,
          HouseJobSid: raw.HouseJobSid ? Number(raw.HouseJobSid) : null,
          DocumentNumber: raw.DocumentNumber || undefined,
          Remarks: raw.Remarks || undefined,
          Narration: (raw.Narration !== undefined ? raw.Narration : undefined),
          status: (raw.status != null ? raw.status : 'A'),
          VoucherDetail: voucherDetailArray.length > 0 ? voucherDetailArray : undefined,
        };
      
        if (voucherOthersCandidate) {
          payload.VoucherOthers = voucherOthersCandidate;
        }
      
        Object.keys(payload).forEach(k => {
          if (payload[k] === undefined) delete payload[k];
        });
      
        const saveObservable = this.headerId 
          ? this.operationService.updateCreditNoteById(this.headerId, payload)
          : this.operationService.createCreditNote(payload);
      
        this.spinner.show();
        saveObservable.subscribe({
          next: async (resp: any) => {
            if (resp?.status) {
              const voucherHeaderSid = resp.data?.newVoucher?.VoucherHeaderSid || resp.data?.VoucherHeaderSid || this.headerId;
              
              if (isFinal && voucherHeaderSid) {
                // If final save, post the voucher
                await this.postVoucher(voucherHeaderSid);
              } else {
                this.spinner.hide();
                const message = isFinal ? 'CreditNote saved and posted successfully!' : 'CreditNote saved as draft successfully!';
                this.appSettingService.showSuccess(message);
                
                if (!this.headerId && voucherHeaderSid) {
                  this.headerId = voucherHeaderSid;
                  this.router.navigate(['operation/credit-note/entry', voucherHeaderSid]);
                }
              }
            } else {
              this.spinner.hide();
              this.appSettingService.showError('Error saving CreditNote.');
            }
          },
          error: (err) => {
            this.spinner.hide();
            console.error('Save CreditNote error', err);
            this.appSettingService.showError('Failed to save CreditNote.');
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
            LocalCurrencyCode: currentCompany.CurrencyCode , 
            PostedBy: currentUserEmail ,
            TaxDetails: {
              CountryMasterSid: currentCountry || this.currentUserCountry,
              countryName: currentCompany.CountryName,
              TaxCategory: 'Inter', 
              EffectiveFrom: new Date().toISOString(),
              TaxType: 'Output' 
            }
          };
      
          const result = await firstValueFrom(this.operationService.postVoucherByVoucherSid(postPayload));
          
          this.spinner.hide();
          if (result.status) {
            this.appSettingService.showSuccess('Credted Note posted successfully!');
            this.creditNoteData.PostStatus = 'P'; // Update local state
            
            // Navigate to list or stay on page but disable edits
            this.router.navigate(['operation/credit-note/list']);
          } else {
            this.appSettingService.showError(result.message || 'Failed to post Credit Note.');
          }
        } catch (error) {
          this.spinner.hide();
          console.error('Post voucher error:', error);
          this.appSettingService.showError('Failed to post Credit Note. Please try again.');
        }
      }
      async loadDepartments(companyMasterSid: number) {
          if (!companyMasterSid) {
            this.departmentList = [];
            return;
          }
      
          try {
            const departments: any = await firstValueFrom(this.operationService.getAllDepartments(companyMasterSid));
            
            // Handle different response formats
            if (departments && Array.isArray(departments)) {
              this.departmentList = departments;
            } else if (departments?.data && Array.isArray(departments.data)) {
              this.departmentList = departments.data;
            } else if (departments?.status && Array.isArray(departments.data)) {
              this.departmentList = departments.data;
            } else {
              this.departmentList = departments || [];
            }
      
            console.log('DEBUG - Departments loaded:', this.departmentList.length, 'items');
            if (this.departmentList.length > 0) {
              console.log('DEBUG - First department item:', this.departmentList[0]);
            }
          } catch (error) {
            console.error('Error loading departments:', error);
            this.departmentList = [];
            throw error;
          }
        }
        async fetchCountryName(countryMasterSid: number) {
    try {
      const resp: any = await firstValueFrom(this.operationService.getCountryById(countryMasterSid));
      if (resp?.status && resp.data) {
        const country = resp.data;
        const countryName = country.countryName || country.CountryName;
        if (countryName) {
          this.bookingModeCountry = String(countryName).trim().toLowerCase();
          console.log('DEBUG - Fetched country from backend:', this.bookingModeCountry);
        }
      }
    } catch (error) {
      console.error('Error fetching country:', error);
      throw error;
    }
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

 
onBranchChange(selectedBranch: any) {
  const branchSid = (typeof selectedBranch === 'object' && selectedBranch !== null)
    ? (selectedBranch.CustomerBranchSid ?? selectedBranch)
    : selectedBranch;

  if (!branchSid) {
    // Clear all related fields if no branch selected
    this.creditNoteForm.get('PartyAddress')?.setValue('');
    this.creditNoteForm.get('CustomerBranchSid')?.setValue(null);
    this.creditNoteForm.get('GST_VAT')?.setValue('');
    return;
  }

  // Find the selected branch from customerBranchList
  const foundBranch = this.customerBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));
  
  if (foundBranch) {
    console.log('DEBUG - Found Branch:', foundBranch);
    
    // Set CustomerBranchSid
    this.creditNoteForm.get('CustomerBranchSid')?.setValue(Number(branchSid));

    // Set PartyAddress - this will go to Address in payload
    const address = foundBranch.Address || foundBranch.CustomerAddress1 || foundBranch.customerAddress || '';
    this.creditNoteForm.get('PartyAddress')?.setValue(address);

    // IMPORTANT: DO NOT set PartyMasterSid from branch - it should come from customer
    // Only set address and GST/VAT information

    // Get customer data to get country code and PanType
    const customerMasterSid = foundBranch.CustomerMasterSid;
    if (customerMasterSid) {
      const customer = this.customerList.find(c => c.CustomerMasterSid === customerMasterSid);
      if (customer) {
        console.log('DEBUG - Found Customer for branch:', customer);
        
        // Get country code from CUSTOMER
        const countryCode = this.getCustomerCountryCode(customer);
        
        console.log('DEBUG - Customer CountryCode:', countryCode);
        console.log('DEBUG - Branch GSTNo:', foundBranch.GSTNo);

        // Use branch GSTNo for India, customer PanType for other countries
        if (countryCode === 'IN') {
          // For India - populate GST No from BRANCH table
          this.creditNoteForm.get('GST_VAT')?.setValue(foundBranch.GSTNo || '');
        } else {
          // For non-India countries - populate PAN Type from CUSTOMER table
          this.creditNoteForm.get('GST_VAT')?.setValue(customer.PanType || '');
        }
      }
    }
  } else {
    // If branch not found in current list, clear dependent fields
    this.creditNoteForm.get('PartyAddress')?.setValue('');
    this.creditNoteForm.get('GST_VAT')?.setValue('');
  }
}
// Improved helper method to get country code from branch
private getBranchCountryCode(branch: any): string {
  console.log('DEBUG - Branch structure for country detection:', branch);
  
  // Check if CountryMasterSid exists and has countryCode
  if (branch.CountryMasterSid && typeof branch.CountryMasterSid === 'object') {
    const countryCode = branch.CountryMasterSid.countryCode || branch.CountryMasterSid.CountryCode;
    if (countryCode) {
      console.log('DEBUG - Extracted countryCode from CountryMasterSid object:', countryCode);
      return countryCode.toUpperCase();
    }
  }
  
  // Check if countryCode exists directly on branch
  if (branch.countryCode) {
    console.log('DEBUG - Found countryCode directly on branch:', branch.countryCode);
    return branch.countryCode.toUpperCase();
  }
  
  // Check if CountryCode exists directly on branch
  if (branch.CountryCode) {
    console.log('DEBUG - Found CountryCode directly on branch:', branch.CountryCode);
    return branch.CountryCode.toUpperCase();
  }
  
  // Final fallback: if branch has GSTNo with value, assume it's India
  if (branch.GSTNo && branch.GSTNo.trim() !== '') {
    console.log('DEBUG - Fallback: Using GSTNo to determine country as India');
    return 'IN';
  }
  
  console.log('DEBUG - No country code detected, defaulting to empty string');
  return '';
}

onCustomerMasterChange(selected: any) {
  const customerMasterSid = (typeof selected === 'object' && selected !== null)
    ? (selected.CustomerMasterSid ?? selected)
    : selected;
  
  if (!customerMasterSid) {
    this.customerBranchList = [];
    this.creditNoteForm.get('CustomerBranchSid')?.setValue(null);
    this.creditNoteForm.get('PartyAddress')?.setValue('');
    this.creditNoteForm.get('PartyMasterSid')?.setValue(null);
    this.creditNoteForm.get('GST_VAT')?.setValue('');
    this.creditNoteForm.get('PartyName')?.setValue(''); // Clear PartyName
    return;
  }

  // Find the customer
  const customer = this.customerList.find(c => c.CustomerMasterSid === customerMasterSid);
  if (customer) {
    console.log('DEBUG - Customer selected:', customer);
    
    // Set PartyName to the actual customer name string
    this.creditNoteForm.get('PartyName')?.setValue(customer.CustomerName || '');
    
    // CRITICAL FIX: Set PartyMasterSid from customer's SubledgerMasterSid
    if (customer.SubledgerMasterSid) {
      this.creditNoteForm.get('PartyMasterSid')?.setValue(Number(customer.SubledgerMasterSid));
      console.log('DEBUG - Set PartyMasterSid from customer:', customer.SubledgerMasterSid);
    } else {
      console.warn('DEBUG - Customer has no SubledgerMasterSid:', customer);
      this.creditNoteForm.get('PartyMasterSid')?.setValue(null);
    }

    // Get country code from customer
    const countryCode = this.getCustomerCountryCode(customer);
    
    console.log('DEBUG - Customer CountryCode:', countryCode);
    console.log('DEBUG - Customer PanType:', customer.PanType);

    if (countryCode !== 'IN') {
      // For non-India countries - populate PAN Type from CUSTOMER table
      this.creditNoteForm.get('GST_VAT')?.setValue(customer.PanType || '');
    } else {
      // For India - clear GST until branch is selected
      this.creditNoteForm.get('GST_VAT')?.setValue('');
    }
  }

  // Reset branch selection when customer changes
  this.creditNoteForm.get('CustomerBranchSid')?.setValue(null);
  this.creditNoteForm.get('PartyAddress')?.setValue('');

  // Load branches for the selected customer
  this.getCustomerBranchByCustomer(Number(customerMasterSid));
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
    const customerBranches = this.customerBranchList.filter(b => b.CustomerMasterSid === customer.CustomerMasterSid);
    const hasGSTNo = customerBranches.some(branch => branch.GSTNo);
    if (hasGSTNo) {
      return 'IN';
    }
  }
  
  return countryCode;
}

  getCustomerBranchByCustomer(CustomerMasterSid: number) {
    if (!CustomerMasterSid) {
      this.customerBranchList = [];
      return;
    }
    this.operationService.getCustomerBranchByCustomer(CustomerMasterSid).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          this.customerBranchList = Array.isArray(resp.data) ? resp.data : resp.data;
        } else if (Array.isArray(resp)) {
          this.customerBranchList = resp;
        } else if (resp?.data) {
          this.customerBranchList = resp.data;
        } else {
          this.customerBranchList = [];
        }

        if (this.pendingBranchToSelect) {
          const branchId = this.pendingBranchToSelect;
          this.pendingBranchToSelect = null;
          const found = this.customerBranchList.find((b: any) => Number(b.CustomerBranchSid) === Number(branchId));
          // this.invoiceForm.get('PartyName')?.setValue(branchId);
          if (found) {
            this.creditNoteForm.get('PartyAddress')?.setValue(found.Address || found.CustomerAddress1 || '');
            if (found.SubledgerMasterSid) this.creditNoteForm.get('PartyMasterSid')?.setValue(Number(found.SubledgerMasterSid));
          }
        }
      },
      error: (err) => {
        console.error('Error fetching customer branches', err);
        this.customerBranchList = [];
      }
    });
  }

  loadCreditNoteById(id: number) {
    this.operationService.getCreditNoteById(id).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          this.creditNoteData = resp.data;
          this.creditNoteData['MBLNo'] = resp.data?.MasterNumber;
          this.creditNoteData['HBLNo'] = resp.data?.HouseNumber;
          console.log(this.creditNoteData,"creditNoteData")
          this.patchValues(this.creditNoteData);
        } else {
          this.appSettingService.showError('Error loading creditNoteData');
        }
      },
      error: (err) => {
        console.error(err);
        this.appSettingService.showError('Error loading creditNoteData');
      },
    });
  }

  private toNgbDate(d: any): NgbDateStructLike | null {
    if (!d) return null;
    const dt = (typeof d === 'string' || typeof d === 'number') ? new Date(d) : d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return null;
    return { year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() };
  }

  private fromNgbDate(s: NgbDateStructLike | null): Date | null {
    if (!s || !s.year) return null;
    return new Date(s.year, (s.month || 1) - 1, s.day || 1);
  }

  patchValues(data: any) {
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

    this.creditNoteForm.patchValue({
      ReversalVoucher: reversalVoucherDisplay,
      VoucherNumber: header.VoucherNumber,
      VoucherDate: this.toNgbDate(header.VoucherDate),
      CustomerMasterSid: header.CustomerMasterSid || customerMasterSidFromBranch || null,
      PartyMasterSid: header.PartyMasterSid || null,
      PartyName: header.PartyName || '',
      PartyAddress: header.PartyAddress || '',
      DocumentNumber: header.DocumentNumber || '',
      IRNNumber: header.IRNNumber || '',
      MasterJobSid: header.MasterJobSid || null,
      HBLNo: header.HouseJob || header.HBLNo || '',
      CurrencyCode: header.currencyMaster?.currencyCode || header.CurrencyCode || null,
      ExchangeRate: header.ExchangeRate || header.ExRate || 1,
      GST_VAT: header.GST_VAT || '',
      InvoiceType: header.InvoiceType || null,
      GSTType: header.GSTType || null,
      VoucherType: voucherTypeForControl,
      Narration: header.Narration || '',
      CreditNoteReason: header.CreditNoteReason || '',
      Remarks: header.Remarks || '',
      IRNStatus: header.IRNStatus || '',
      MBLNo: header.MBLNo || '',
      status: header.status || 'A'
    });
   console.log('DEBUG - header.PartyName:',header.PartyName);
   console.log(this.creditNoteData,'creditNoteData');
    const cm = header.CustomerMasterSid || customerMasterSidFromBranch || null;
    console.log('DEBUG - cm:',cm);
    const branchSid = header.CustomerBranchSid || header.PartyName || (header.customerBranch ? header.customerBranch.CustomerBranchSid : null) || null;

    
      this.pendingBranchToSelect = branchSid ? Number(branchSid) : null;
      this.getCustomerBranchByCustomer(cm);
     if (branchSid) {
       this.creditNoteForm.get('CustomerBranchSid')?.setValue(Number(branchSid));
      this.pendingBranchToSelect = Number(branchSid);
      const currentCustomer = this.creditNoteForm.get('CustomerMasterSid')?.value;
      if (currentCustomer) {
        this.getCustomerBranchByCustomer(Number(currentCustomer));
      } else {
        const found = this.customerBranchList.find((b: any) => Number(b.CustomerBranchSid) === Number(branchSid));
        if (found) {
          this.creditNoteForm.get('PartyName')?.setValue(Number(branchSid));
          this.creditNoteForm.get('PartyAddress')?.setValue(found.Address || found.CustomerAddress1 || '');
        }
      }
    }

    const detailsFromResp = data.voucherDetails
      || data.voucherDetail
      || data.VoucherDetail
      || data.VoucherDetails
      || [];

    // this.details.clear();
    for (const det of detailsFromResp) {
      // Tax logic: If TaxPercentage2 is 0/null, then TaxPercentage1 is IGST
      // Otherwise TaxPercentage1 is CGST and TaxPercentage2 is SGST
      const taxPerc2 = det.TaxPercentage2 != null ? Number(det.TaxPercentage2) : 0;
      const taxAmt2 = det.TaxAmount2 != null ? Number(det.TaxAmount2) : 0;
      const taxPerc1 = det.TaxPercentage1 != null ? Number(det.TaxPercentage1) : 0;
      const taxAmt1 = det.TaxAmount1 != null ? Number(det.TaxAmount1) : 0;

      const isIGST = taxPerc2 === 0 && taxAmt2 === 0 && (taxPerc1 > 0 || taxAmt1 > 0);

      console.log('DEBUG - Loading detail row:', {
        ChargeDescription: det.ChargeDescription,
        HSSACMasterSid: det.HSSACMasterSid,
        availableKeys: Object.keys(det)
      });

      this.details.push(this.createDetailGroup({
        VoucherDetailSid: det.VoucherDetailSid,
        ChargeMasterSid: det.ChargeMasterSid,
        ChargeDescription: det.ChargeDescription,
        HSSACMasterSid: det.HSSACMasterSid,
        ChargeUOMSid: det.ChargeUOMSid,
        NumberOfUnit: det.NumberOfUnit,
        DepartmentMasterSid: det.DepartmentMasterSid,
        DrCr: det.DrCr,
        CurrencyCode: det.CurrencyCode || this.creditNoteForm.get('CurrencyCode')?.value,
        Rate: det.Rate,
        ExchangeRate: det.ExchangeRate || this.creditNoteForm.get('ExchangeRate')?.value,
        Amount: det.Amount,
        TaxableAmount: det.TaxableAmount,
        // If IGST (Tax2 is 0), clear CGST/SGST and populate IGST
        TaxPercentage1: isIGST ? 0 : taxPerc1,
        TaxAmount1: isIGST ? 0 : taxAmt1,
        TaxPercentage2: isIGST ? 0 : taxPerc2,
        TaxAmount2: isIGST ? 0 : taxAmt2,
        TaxPercentageIGST: isIGST ? taxPerc1 : 0,
        TaxAmountIGST: isIGST ? taxAmt1 : 0,
        LocalAmount: det.LocalAmount,
        PartyAmount: det.PartyAmount,
        MasterJobSid: det.MasterJobSid,
        HouseJobSid: det.HouseJobSid
      }));
    }

    // Don't recalculate when loading existing invoice - preserve the stored tax amounts

    const voucherOthersSource = (data.VoucherOthers && Array.isArray(data.VoucherOthers)) ? data.VoucherOthers[0]
      : data.VoucherOthers || data.voucherOthers || (Array.isArray(data.voucherOthers) ? data.voucherOthers[0] : undefined);

    const vg = this.creditNoteForm.get('voucherOthers') as FormGroup;
    if (voucherOthersSource) {
      vg.patchValue({
        ContainerNumber: voucherOthersSource.ContainerNumber || '',
        VoucherNote: voucherOthersSource.VoucherNote || '',
        Footer: voucherOthersSource.Footer || '',
        ReverseCreditNote: voucherOthersSource.ReverseCreditNote || '',
        DueDate: this.toNgbDate(voucherOthersSource.DueDate),
        IRNNumber: voucherOthersSource.IRNNumber || voucherOthersSource.IRNNo || '',
        IRNStatus: voucherOthersSource.IRNStatus || '',
        IRNQRCode: voucherOthersSource.IRNQRCode || ''
      });
    } else {
      vg.reset({
        ContainerNumber: '',
        VoucherNote: '',
        Footer: '',
        ReverseCreditNote: '',
        DueDate: null,
        IRNNumber: '',
        IRNStatus: '',
        IRNQRCode: '',
        VoucherReverseSid: null
      });
    }
  }

  addDetailRow() {
    this.details.push(this.createDetailGroup());
  }

  createDetailGroup(data?: any): FormGroup {
    return this.fb.group({
      VoucherDetailSid: [data?.VoucherDetailSid || null],
      ChargeMasterSid: [{value: data?.ChargeMasterSid || null, disabled: true}],
      ChargeDescription: [{value:data?.ChargeDescription || '', disabled: true}],
      HSSACMasterSid: [{value:data?.HSSACMasterSid || null, disabled: true}],
      DepartmentMasterSid: [{value:data?.DepartmentMasterSid || null, disabled: true}],
      ChargeUOMSid: [{value:data?.ChargeUOMSid || null, disabled: true}], // will hold the UOM id (UOMMasterSid)
      NumberOfUnit: [{value:data?.NumberOfUnit || 1, disabled: true}],
      DrCr: [{value: data?.DrCr || 'C', disabled: true}], // Default to Cr for Invoice (revenue)
      CurrencyCode: [{value: data?.CurrencyCode || this.creditNoteForm.get('CurrencyCode')?.value || null, disabled: true}],
      Rate: [ data?.Rate != null ? Number(data.Rate) : 0, 
      [Validators.required, Validators.min(0), this.rateValidator.bind(this)]],
      ExchangeRate: [{value:data?.ExchangeRate || this.creditNoteForm.get('ExchangeRate')?.value || 1, disabled: true}],
      Amount: [{value:data?.Amount || 0 , disabled: true}],
      TaxableAmount: [{value: data?.TaxableAmount || 0, disabled: true}],
      TaxPercentage1: [{value: data?.TaxPercentage1 || 0, disabled: true}],
      TaxAmount1: [{value:data?.TaxAmount1 || 0, disabled: true}],
      TaxPercentage2: [{value:data?.TaxPercentage2 || 0, disabled: true}],
      TaxAmount2: [{value:data?.TaxAmount2 || 0, disabled: true}],
      TaxPercentageIGST: [{value: data?.TaxPercentageIGST || 0, disabled: true}],
      TaxAmountIGST: [{value:data?.TaxAmountIGST || 0, disabled: true}],
      LocalAmount: [data?.LocalAmount || 0],
      PartyAmount: [data?.PartyAmount || 0],
      MasterJobSid: [data?.MasterJobSid || null],
      HouseJobSid: [data?.HouseJobSid || null]
    });
    
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
  removeDetailRow(index: number) {
    if (this.details.length > index) this.details.removeAt(index);
    this.recalculateAllRows();
  }

  onDetailChange(index: number, field?: string) {
    if (['NumberOfUnit', 'Rate', 'ExchangeRate', 'TaxPercentage1', 'TaxPercentage2', 'TaxPercentageIGST', 'CurrencyCode'].includes(field || '')) {
      this.recalcRow(index);
    } else if (field === 'ChargeMasterSid') {
      const chargeSid = this.details.at(index).get('ChargeMasterSid')?.value;
      const selectedCharge = this.chargeList?.find((c: any) => c.ChargeMasterSid === chargeSid);
      if (selectedCharge) {
        const description = selectedCharge.ChargeDescription || selectedCharge.chargeName || selectedCharge.ChargeName || '';

        let hssacId = selectedCharge.HSSACMasterSid ?? selectedCharge.HSSACMasterSid ?? null;
        if (!hssacId && Array.isArray(selectedCharge.chargeTaxMaster) && selectedCharge.chargeTaxMaster.length > 0) {
          const firstTax = selectedCharge.chargeTaxMaster[0];
          hssacId = firstTax?.ChargeTaxMasterSid ?? firstTax?.chargeTaxMasterSid ?? null;
        }

        const chargeUomId = selectedCharge.ChargeUOMSid ?? selectedCharge.UOM ?? selectedCharge.UOMMasterSid ?? null;

        this.details.at(index).patchValue({
          ChargeDescription: description,
          HSSACMasterSid: hssacId || null,
          ChargeUOMSid: chargeUomId || null,
          Rate: selectedCharge.DefaultRate || selectedCharge.Rate || this.details.at(index).get('Rate')?.value || 0
        });

        this.recalcRow(index);
      }
    }
  }

  recalcRow(index: number) {
  const row = this.details.at(index);
  if (!row) return;
  const val = row.value;

  const unit = Number(row.get('NumberOfUnit')?.value || 0);
  const rate = Number(row.get('Rate')?.value || 0);
  const exRate = Number(row.get('ExchangeRate')?.value || this.creditNoteForm.get('ExchangeRate')?.value || 1);

  const amount = unit * rate;
  const taxableAmount = amount * exRate;
  const localAmount = amount * (exRate || 1);

  const gstType = this.creditNoteForm.get('GSTType')?.value;
  const placeOfSupply = this.creditNoteForm.get('PlaceOfSupply')?.value;
  const companyState = this.getCompanyState();
  const customerGSTNo = this.creditNoteForm.get('GST_VAT')?.value;

  let taxPerc1 = 0, taxAmt1 = 0, taxPerc2 = 0, taxAmt2 = 0, igstPerc = 0, igstAmt = 0;

  console.log('=== TAX CALCULATION DEBUG ===');
  console.log('GST Type:', gstType);
  console.log('Place of Supply:', placeOfSupply);
  console.log('Company State:', companyState);
  console.log('Customer GST No (GST_VAT):', customerGSTNo);


if (this.isIndiaGST && customerGSTNo) { // Now checking GST_VAT field
    // Get HSN/SAC tax rate
    const hssacSid = row.get('HSSACMasterSid')?.value;
    const hssac = this.hssacList.find(h => h.HSSACMasterSid === hssacSid);
    const taxRate = hssac?.TaxRate || 18;

    // Determine tax type based on GST Type
    switch(gstType) {
      case 'CGST+SGST':
        taxPerc1 = taxRate / 2;
        taxAmt1 = (taxableAmount * taxPerc1) / 100;
        taxPerc2 = taxRate / 2;
        taxAmt2 = (taxableAmount * taxPerc2) / 100;
        break;
      case 'IGST':
        igstPerc = taxRate;
        igstAmt = (taxableAmount * igstPerc) / 100;
        break;
      case 'EXWP':
        break;
      case 'B2C':
        taxPerc1 = taxRate;
        taxAmt1 = (taxableAmount * taxPerc1) / 100;
        break;
      default:
        igstPerc = taxRate;
        igstAmt = (taxableAmount * igstPerc) / 100;
        break;
    }
  } else if (this.isVATMode && customerGSTNo) { // Now checking GST_VAT field
    const hssacSid = row.get('HSSACMasterSid')?.value;
    const hssac = this.hssacList.find(h => h.HSSACMasterSid === hssacSid);
    taxPerc1 = hssac?.TaxRate || 5;
    taxAmt1 = (taxableAmount * taxPerc1) / 100;
  }

  row.get('Amount')?.setValue(this.round(amount));
  row.get('TaxableAmount')?.setValue(this.round(taxableAmount));
  row.get('TaxPercentage1')?.setValue(this.round(taxPerc1));
  row.get('TaxAmount1')?.setValue(this.round(taxAmt1));
  row.get('TaxPercentage2')?.setValue(this.round(taxPerc2));
  row.get('TaxAmount2')?.setValue(this.round(taxAmt2));
  row.get('TaxPercentageIGST')?.setValue(this.round(igstPerc));
  row.get('TaxAmountIGST')?.setValue(this.round(igstAmt));
  row.get('LocalAmount')?.setValue(this.round(localAmount));
  row.get('PartyAmount')?.setValue(this.round(amount));

  this.updateBillAmount();
}

onInvoiceTypeChange() {
  const placeOfSupply = this.creditNoteForm.get('PlaceOfSupply')?.value;
  this.determineGSTType(placeOfSupply);
  this.recalculateAllRows();
}

determineGSTType(placeOfSupply: string) {
  if (!placeOfSupply) {
    this.creditNoteForm.get('GSTType')?.setValue('');
    console.log('GST Type: No place of supply available');
    return;
  }

  const companyState = this.getCompanyState();
  const customerGSTNo = this.creditNoteForm.get('GST_VAT')?.value;
  const invoiceType = this.creditNoteForm.get('InvoiceType')?.value;
  
  console.log('=== DETERMINING GST TYPE ===');
  console.log('Company State:', companyState);
  console.log('Place of Supply:', placeOfSupply);
  console.log('Customer GST No (GST_VAT):', customerGSTNo);
  console.log('Invoice Type:', invoiceType);
  console.log('Is India GST:', this.isIndiaGST);

  const normalizedCompanyState = companyState?.trim().toLowerCase();
  const normalizedPlaceOfSupply = placeOfSupply?.trim().toLowerCase();

  // Check if GST number is valid (not empty or undefined)
  const hasValidGST = customerGSTNo && customerGSTNo.trim() !== '' && customerGSTNo !== 'undefined';

  console.log('DEBUG - Has valid GST:', hasValidGST);

  // Scenario 1: Export (Customer outside India)
  if (invoiceType === 'EXWP' || invoiceType === 'EXWOP') {
    this.creditNoteForm.get('GSTType')?.setValue('EXWP');
    console.log('GST Type set to: EXPORT (Export scenario)');
    return;
  }

  // Scenario 2 & 3: India GST scenarios
  if (this.isIndiaGST) {
    if (hasValidGST) {
      // Customer has GST number
      if (normalizedPlaceOfSupply === normalizedCompanyState) {
        // Same State - CGST + SGST
        this.creditNoteForm.get('GSTType')?.setValue('CGST+SGST');
        console.log('GST Type set to: CGST+SGST (Intra-state with GST)');
      } else {
        // Different State - IGST
        this.creditNoteForm.get('GSTType')?.setValue('IGST');
        console.log('GST Type set to: IGST (Inter-state with GST)');
      }
    } else {
      // Customer doesn't have GST number - B2C
      this.creditNoteForm.get('GSTType')?.setValue('B2C');
      console.log('GST Type set to: B2C (No GST number)');
    }
  } else {
    // Non-India scenarios
    this.creditNoteForm.get('GSTType')?.setValue('VAT');
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
  if (this.currentCompany.stateMaster) {
    const state = this.currentCompany.stateMaster.stateName || this.currentCompany.stateMaster.StateName;
    if (state) {
      console.log('Company State from currentCompany.stateMaster:', state);
      return state;
    }
  }

  // Method 2: Check if currentCompany has StateMasterSid and look up in stateList
  if (this.currentCompany.StateMasterSid && this.stateList.length > 0) {
    const state = this.stateList.find(s => 
      s.StateMasterSid === this.currentCompany.StateMasterSid || 
      s.stateMasterSid === this.currentCompany.StateMasterSid
    );
    if (state) {
      const stateName = state.stateName || state.StateName;
      console.log('Company State from currentCompany.StateMasterSid lookup:', stateName);
      return stateName;
    }
  }

  // Method 3: Check currentBranch state information
  if (this.currentBranch && this.currentBranch.stateMaster) {
    const state = this.currentBranch.stateMaster.stateName || this.currentBranch.stateMaster.StateName;
    if (state) {
      console.log('Company State from currentBranch.stateMaster:', state);
      return state;
    }
  }

  // Method 4: Check currentBranch StateMasterSid
  if (this.currentBranch && this.currentBranch.StateMasterSid && this.stateList.length > 0) {
    const state = this.stateList.find(s => 
      s.StateMasterSid === this.currentBranch.StateMasterSid || 
      s.stateMasterSid === this.currentBranch.StateMasterSid
    );
    if (state) {
      const stateName = state.stateName || state.StateName;
      console.log('Company State from currentBranch.StateMasterSid lookup:', stateName);
      return stateName;
    }
  }

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

updateBillAmount() {
  const totalLocalAmount = this.calculateTotalLocalAmount();
  this.creditNoteForm.get('BillAmt')?.setValue(this.round(totalLocalAmount));
}

calculateTotalLocalAmount(): number {
  return this.details.controls.reduce((sum, row: any) => {
    return sum + (Number(row.get('LocalAmount')?.value) || 0);
  }, 0);
}

  recalculateAllRows() {
    for (let i = 0; i < this.details.length; i++) {
      const exRateCtrl = this.details.at(i).get('ExchangeRate');
      if (exRateCtrl && (exRateCtrl.value === null || exRateCtrl.value === undefined)) {
        exRateCtrl.setValue(this.creditNoteForm.get('ExchangeRate')?.value || 1);
      }
      const currCtrl = this.details.at(i).get('CurrencyCode');
      if (currCtrl && !currCtrl.value) {
        currCtrl.setValue(this.creditNoteForm.get('CurrencyCode')?.value || null);
      }
      this.recalcRow(i);
    }
  }

  // Calculate total currency amount (sum of all amounts)
  getTotalCurrencyAmount(): number {
    let total = 0;
    for (let i = 0; i < this.details.length; i++) {
      const amount = Number(this.details.at(i).get('PartyAmount')?.value || 0);
      total += amount;
    }
    return this.round(total);
  }

  // Calculate total tax amount (CGST + SGST + IGST)
  getTotalTaxAmount(): number {
    let total = 0;
    for (let i = 0; i < this.details.length; i++) {
      const taxAmt1 = Number(this.details.at(i).get('TaxAmount1')?.value || 0);
      const taxAmt2 = Number(this.details.at(i).get('TaxAmount2')?.value || 0);
      const igstAmt = Number(this.details.at(i).get('TaxAmountIGST')?.value || 0);
      total += taxAmt1 + taxAmt2 + igstAmt;
    }
    return this.round(total);
  }

  // Calculate grand total (Currency Amount + Tax Amount)
  getGrandTotal(): number {
    return this.round(this.getTotalCurrencyAmount() + this.getTotalTaxAmount());
  }

  round(val: number) {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

private normalizeParty(raw: any) {
  const customerMasterSid = raw.CustomerMasterSid != null ? Number(raw.CustomerMasterSid) : null;
  const partyControl = raw.PartyName; // This now contains the CustomerName string
  
  let customerBranchSid: number | null = raw.CustomerBranchSid != null ? Number(raw.CustomerBranchSid) : null;
  
  let partyNameStr = partyControl || '';
  let partyAddressStr = raw.PartyAddress || '';

  // Get address from branch if available
  if (customerBranchSid) {
    const foundBranch = this.customerBranchList.find(b => Number(b.CustomerBranchSid) === customerBranchSid);
    if (foundBranch) {
      partyAddressStr = foundBranch.Address || foundBranch.CustomerAddress1 || partyAddressStr;
    }
  }

  // CRITICAL: PartyMasterSid should come from the form control, not from branch
  let partyMasterSid = raw.PartyMasterSid != null ? Number(raw.PartyMasterSid) : null;
  
  // Fallback: if PartyMasterSid is not set, try to get from customer
  if (!partyMasterSid && customerMasterSid) {
    const customer = this.customerList.find(c => c.CustomerMasterSid === customerMasterSid);
    if (customer && customer.SubledgerMasterSid) {
      partyMasterSid = Number(customer.SubledgerMasterSid);
    }
  }

  console.log('DEBUG - normalizeParty result:', {
    PartyMasterSid: partyMasterSid,
    CustomerBranchSid: customerBranchSid,
    PartyName: partyNameStr,
    PartyAddress: partyAddressStr
  });

  return {
    PartyMasterSid: partyMasterSid,
    CustomerBranchSid: customerBranchSid,
    PartyName: partyNameStr,
    PartyAddress: partyAddressStr,
    CustomerName: partyNameStr
  };
}

  getCurrencyId(CurrencyCode: string): number | null {
    if(!CurrencyCode || !this.currencyList){
      return null;
    } else {
      const currency = this.currencyList.find(c => c.currencyCode === CurrencyCode);
      return currency ? currency.CurrencyMasterSid : null
    }
  }

  private buildVoucherOthersPayload(rawVoucherOthers: any): any | undefined {
    if (!rawVoucherOthers || typeof rawVoucherOthers !== 'object') return undefined;

    const allowedKeys = [
      'ContainerNumber',
      'VoucherNote',
      'Footer',
      'ReverseCreditNote',
      'DueDate',
      'IRNNumber',
      'IRNStatus',
      'IRNQRCode',
      'VoucherReverseSid'
    ];

    const cleaned: any = {};

    for (const k of allowedKeys) {
      const val = rawVoucherOthers[k];
      if (val === null || val === undefined) continue;
      if (typeof val === 'string') {
        if (val.trim() === '') continue;
        cleaned[k] = val;
      } else if (val instanceof Date) {
        cleaned[k] = val;
      } else {
        cleaned[k] = val;
      }
    }

    if (Object.keys(cleaned).length === 0) return undefined;

    if (!('Footer' in cleaned)) {
      cleaned['Footer'] = '';
    }

    if (cleaned.DueDate && !(cleaned.DueDate instanceof Date)) {
      const parsed = new Date(cleaned.DueDate);
      if (!isNaN(parsed.getTime())) cleaned.DueDate = parsed;
      else delete cleaned.DueDate;
    }

    if ('VoucherReverseSid' in cleaned) {
      const v = Number(cleaned.VoucherReverseSid);
      cleaned.VoucherReverseSid = isNaN(v) ? null : v;
    }

    return cleaned;
  }

  // Called when user selects master job in main Job No control
  onMasterJobSelected(selected: any) {
    if (!selected) {
      this.creditNoteForm.get('MBLNo')?.setValue('');
      this.creditNoteForm.get('HBLNo')?.setValue('');
      return;
    }
    const masterJob = typeof selected === 'object' ? selected : this.masterJobList.find(m => m.MasterJobSid === selected);
    if (masterJob) {
      if (masterJob.MBLNo !== undefined) this.creditNoteForm.get('MBLNo')?.setValue(masterJob.MBLNo || '');
      if (masterJob.HBLNo !== undefined) this.creditNoteForm.get('HBLNo')?.setValue(masterJob.HBLNo || masterJob.HouseJob || '');
      this.creditNoteForm.get('MasterJobSid')?.setValue(Number(masterJob.MasterJobSid));
      // optional: apply to all detail rows
      // this.applyMasterJobToAllDetails(Number(masterJob.MasterJobSid));
    }
  }

  applyMasterJobToAllDetails(masterJobSid: number | null) {
    if (!masterJobSid) return;
    for (let i = 0; i < this.details.length; i++) {
      const grp = this.details.at(i);
      if (grp) grp.get('MasterJobSid')?.setValue(masterJobSid);
    }
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

  async onSave() {
    if (this.creditNoteForm.invalid) {
      this.creditNoteForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill required creditNote fields.');
      return;
    }
    this.recalculateAllRows();

    const raw = this.creditNoteForm.getRawValue();

    const userEmailFromSettings = (this.appSettingService as any).userSettingSource?.value?.['userEmail'] || null;
    const createdByValue = userEmailFromSettings || this.currUserEmail || null;
    const updatedByValue = this.isEditMode ? (userEmailFromSettings || this.currUserEmail || null) : null;

    let normalizedVoucherType: number | null = null;
    const vt = raw.VoucherType;
    if (Array.isArray(vt) && vt.length > 0) {
      normalizedVoucherType = Number(vt[0]);
    } else if (vt !== null && vt !== undefined && vt !== '') {
      normalizedVoucherType = Number(vt);
    }
    if (isNaN(normalizedVoucherType)) normalizedVoucherType = null;

    let voucherDate: Date;
    if (!raw.VoucherDate) {
      voucherDate = new Date();
    } else if ((raw.VoucherDate as NgbDateStructLike).year) {
      const converted = this.fromNgbDate(raw.VoucherDate as NgbDateStructLike);
      voucherDate = converted ?? new Date();
    } else {
      const parsed = new Date(raw.VoucherDate);
      voucherDate = isNaN(parsed.getTime()) ? new Date() : parsed;
    }

    const normalizedParty = this.normalizeParty(raw);

    const currencyMasterId = this.getCurrencyId(raw.CurrencyCode);

    const masterJobSid = raw.MasterJobSid ? Number(raw.MasterJobSid) : null;

    const rawPartyControl = this.creditNoteForm.get('PartyMasterSid')?.value;
    const partyMasterSid = rawPartyControl != null && rawPartyControl !== ''
      ? Number(rawPartyControl)
      : (normalizedParty.PartyMasterSid != null ? Number(normalizedParty.PartyMasterSid) : null);

    const voucherDetailArray = (raw.voucherDetails || []).map((d: any, index: number) => {
      const detail = {
        VoucherDetailSid: d.VoucherDetailSid,
        ChargeMasterSid: d.ChargeMasterSid != null ? Number(d.ChargeMasterSid) : null,
        ChargeDescription: d.ChargeDescription || '',
        HSSACMasterSid: d.HSSACMasterSid != null ? Number(d.HSSACMasterSid) : null,
        ChargeUOMSid: d.ChargeUOMSid != null ? Number(d.ChargeUOMSid) : null,
        DepartmentMasterSid: d.DepartmentMasterSid != null ? Number(d.DepartmentMasterSid) : null,
        NumberOfUnit: d.NumberOfUnit != null ? Number(d.NumberOfUnit) : 0,
        DrCr: d.DrCr || 'D',
        CurrencyCode: d.CurrencyCode || raw.CurrencyCode,
        CurrencyMasterSid: this.getCurrencyId(d.CurrencyCode || raw.CurrencyCode),
        Rate: d.Rate != null ? Number(d.Rate) : 0,
        ExchangeRate: d.ExchangeRate != null ? Number(d.ExchangeRate) : (raw.ExchangeRate != null ? Number(raw.ExchangeRate) : 1),
        Amount: d.Amount != null ? Number(d.Amount) : 0,
        TaxableAmount: d.TaxableAmount != null ? Number(d.TaxableAmount) : (d.Amount != null ? Number(d.Amount) : 0),
        TaxPercentage1: d.TaxPercentage1 != null ? Number(d.TaxPercentage1) : 0,
        TaxAmount1: d.TaxAmount1 != null ? Number(d.TaxAmount1) : 0,
        TaxPercentage2: d.TaxPercentage2 != null ? Number(d.TaxPercentage2) : 0,
        TaxAmount2: d.TaxAmount2 != null ? Number(d.TaxAmount2) : 0,
        TaxPercentageIGST: d.TaxPercentageIGST != null ? Number(d.TaxPercentageIGST) : 0,
        TaxAmountIGST: d.TaxAmountIGST != null ? Number(d.TaxAmountIGST) : 0,
        LocalAmount: d.LocalAmount != null ? Number(d.LocalAmount) : 0,
        PartyAmount: d.PartyAmount != null ? Number(d.PartyAmount) : 0,
        MasterJobSid: d.MasterJobSid ? Number(d.MasterJobSid) : masterJobSid,
        HouseJobSid: d.HouseJobSid ? Number(d.HouseJobSid) : null
      };
      console.log(`DEBUG - Saving detail row ${index + 1}: HSSACMasterSid =`, detail.HSSACMasterSid, ', Charge =', detail.ChargeDescription);
      return detail;
    });

    const rawVoucherOthers = raw.voucherOthers ? { ...raw.voucherOthers } : null;
    if (rawVoucherOthers && rawVoucherOthers.DueDate && (rawVoucherOthers.DueDate as NgbDateStructLike).year) {
      rawVoucherOthers.DueDate = this.fromNgbDate(rawVoucherOthers.DueDate as NgbDateStructLike);
    }

    const voucherOthersCandidate = this.buildVoucherOthersPayload(rawVoucherOthers);

    const payload: any = {
      ...(this.isEditMode ? { UpdatedBy: updatedByValue } : { CreatedBy: createdByValue }),
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherNumber: raw.VoucherNumber || null,
      ReversalVoucher: raw.ReversalVoucher || null,
      VoucherDate: voucherDate,
      PostDate: voucherDate,
      GST_VAT: raw.GST_VAT || undefined,
      PartyMasterSid: partyMasterSid,
      PartyName: normalizedParty.PartyName || String(raw.PartyName || ''),
      PartyAddress: normalizedParty.PartyAddress || raw.PartyAddress || '',
      CustomerBranchSid: normalizedParty.CustomerBranchSid ?? null,
      COAMasterSid: raw.COAMasterSid ?? 1,
      VoucherType: normalizedVoucherType,
      VoucherTypeMasterSid: raw.VoucherTypeMasterSid ? Number(raw.VoucherTypeMasterSid) : (normalizedVoucherType ?? undefined),
      InvoiceType: raw.InvoiceType || 'REG',
      GSTType: raw.GSTType || '',
      CurrencyMasterSid: currencyMasterId,
      CurrencyCode: raw.CurrencyCode || undefined,
      ExchangeRate: raw.ExchangeRate != null ? Number(raw.ExchangeRate) : undefined,
      MasterJobSid: masterJobSid,
      HouseJobSid: raw.HouseJobSid ? Number(raw.HouseJobSid) : null,
      DocumentNumber: raw.DocumentNumber || undefined,
      CreditNoteReason: raw.CreditNoteReason || undefined,
      Remarks: raw.Remarks || undefined,
      Narration: (raw.Narration !== undefined ? raw.Narration : undefined),
      status: (raw.status != null ? raw.status : 'A'),
      VoucherDetail: voucherDetailArray.length > 0 ? voucherDetailArray : undefined,
    };

    if (voucherOthersCandidate) {
      payload.VoucherOthers = voucherOthersCandidate;
    }

    Object.keys(payload).forEach(k => {
      if (payload[k] === undefined) delete payload[k];
    });

    console.debug('DEBUG - payload PartyMasterSid (will send):', payload.PartyMasterSid);
    console.debug('DEBUG - full payload', payload);

    if (this.headerId) {
      payload.UpdatedBy = updatedByValue;
      this.operationService.updateCreditNoteById(this.headerId, payload).subscribe({
        next: (resp: any) => {
          if (resp?.status) {
            this.appSettingService.showSuccess('CreditNote updated successfully.');
            const id = resp.data?.newVoucher?.VoucherHeaderSid || resp.data?.VoucherHeaderSid || resp.data?.voucherHeaderSid || null;
            this.router.navigate(['operation/credit-note/entry', id]);
          } else {
            this.appSettingService.showError('Error updating CreditNote.');
            console.error('updateCreditNote resp', resp);
          }
        },
        error: (err) => {
          console.error('updateCreditNote error', err);
          this.appSettingService.showError('Failed to update CreditNote.');
        }
      });
    } else {
      payload.CreatedBy = createdByValue;
      this.operationService.createCreditNote(payload).subscribe({
        next: (resp: any) => {
          if (resp?.status) {
            this.appSettingService.showSuccess('CreditNote created successfully.');
            const id = resp.data?.newVoucher?.VoucherHeaderSid || resp.data?.VoucherHeaderSid || resp.data?.voucherHeaderSid || null;
            if (id) this.router.navigate(['operation/credit-note/entry', id]);
            else this.router.navigate(['operation/credit-note/list']);
          } else {
            this.appSettingService.showError('Error creating creditNote.');
            console.error('createCreditNote resp', resp);
          }
        },
        error: (err) => {
          console.error('createCreditNote error', err);
          this.appSettingService.showError('Failed to create CreditNote.');
        }
      });
    }
  }

  onReset() {
      this.creditNoteForm.reset({ status: 'A', ExchangeRate: 1 });
  }

  goBack() {
    this.router.navigate(['operation/credit-note/list']);
  }

  // Helper methods to get display values
  getChargeCode(chargeSid: number): string {
    const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeSid);
    return charge?.chargeCode || charge?.ChargeCode || '-';
  }

  getHSSACCode(hssacSid: number, rowIndex?: number): string {
    // First, try to get from hssacList using the HSSACMasterSid
    if (hssacSid && this.hssacList && this.hssacList.length > 0) {
      const hssac = this.hssacList.find(h =>
        h.HSSACMasterSid === hssacSid ||
        h.hssacMasterSid === hssacSid ||
        h.HSSACMasterId === hssacSid ||
        h.ChargeTaxMasterSid === hssacSid ||
        h.chargeTaxMasterSid === hssacSid
      );
      if (hssac) {
        const result = hssac?.HSSACCode || hssac?.hssacCode || hssac?.HSNCode || hssac?.hsnCode || hssac?.SACCode || hssac?.sacCode || '-';
        // console.log('DEBUG - getHSSACCode: hssacSid =', hssacSid, ', found in hssacList =', true, ', result =', result);
        return result;
      }
    }

    // Fallback: If rowIndex is provided and HSSACMasterSid is null, try to get HSN from chargeMaster
    if (rowIndex !== undefined && !hssacSid && this.details && this.details.length > rowIndex) {
      const row = this.details.at(rowIndex);
      const chargeSid = row?.get('ChargeMasterSid')?.value;
      if (chargeSid) {
        const charge = this.chargeList?.find((c: any) => c.ChargeMasterSid === chargeSid);
        if (charge?.chargeTaxMaster && Array.isArray(charge.chargeTaxMaster) && charge.chargeTaxMaster.length > 0) {
          const hsnCode = charge.chargeTaxMaster[0]?.HSNCode || charge.chargeTaxMaster[0]?.hsnCode || charge.chargeTaxMaster[0]?.HSSACCode;
          if (hsnCode) {
            // console.log('DEBUG - getHSSACCode: Got HSN from chargeTaxMaster =', hsnCode);
            return hsnCode;
          }
        }
      }
    }

    console.log('DEBUG - getHSSACCode: hssacSid =', hssacSid, ', hssacList length =', this.hssacList?.length || 0, ', not found');
    return '-';
  }

  getUOMCode(uomSid: number): string {
    const uom = this.uomList.find(u => u.UOMMasterSid === uomSid);
    return uom?.UOMCode || uom?.UOMName || '-';
  }

  getMasterJobNumber(jobSid: number): string {
    const job = this.masterJobList.find(j => j.MasterJobSid === jobSid);
    return job?.MasterJobNumber || job?.displayLabel || '-';
  }

  getHouseJobNumber(jobSid: number, masterJobSid: number): string {
    const houseJobs = this.houseJobListByMasterJob[masterJobSid] || [];
    const job = houseJobs.find(j => j.HouseJobSid === jobSid);
    return job?.HouseJobNumber || job?.displayLabel || '-';
  }

  // Print Modal Methods
  openPrintModal() {
    if (!this.headerId) {
      this.appSettingService.showWarning('Please save the creditNote first.');
      return;
    }
    this.modalService.open(this.printModalRef, { size: 'xl', scrollable: true });
  }

  async downloadPDF() {
    const printContent = document.getElementById('printContent');
    if (!printContent) {
      this.appSettingService.showError('Print content not found.');
      return;
    }

    try {
      this.spinner.show();

      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content exceeds one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with invoice number
      const voucherNumber = this.creditNoteForm.get('VoucherNumber')?.value || 'CreditNote';
      const filename = `CreditNote_${voucherNumber}.pdf`;

      // Download the PDF
      pdf.save(filename);

      this.spinner.hide();
      this.appSettingService.showSuccess('PDF downloaded successfully!');
    } catch (error) {
      this.spinner.hide();
      console.error('Error generating PDF:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    }
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

  initializeEmailForm() {
    const customerBranchSid = this.creditNoteForm.get('PartyName')?.value;
    const customerBranch = this.customerBranchList.find(b => b.CustomerBranchSid === customerBranchSid);
    const customerEmail = customerBranch?.Email || customerBranch?.email || '';

    // Get company email from company config if available
    let fromEmail = this.currUserEmail || '';
    if (this.currentCompany?.config?.systemSettings?.emailConfig?.fromEmail) {
      fromEmail = this.currentCompany.config.systemSettings.emailConfig.fromEmail;
    }

    this.emailForm = this.fb.group({
      from: [fromEmail, [Validators.required, Validators.email]],
      to: [customerEmail, [Validators.required, Validators.email]],
      cc: ['', Validators.email],
      subject: [`CreditNote ${this.creditNoteForm.get('VoucherNumber')?.value}`, Validators.required],
      message: ['Please find attached CreditNote for your reference.\n\nThank you for your business.']
    });
  }

  async sendcreditNoteEmail() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all required email fields correctly.');
      return;
    }

    try {
      this.spinner.show();

      // Generate PDF blob
      const pdfBlob = await this.generatePDFBlob();
      if (!pdfBlob) {
        this.appSettingService.showError('Failed to generate PDF. Please try again.');
        this.spinner.hide();
        return;
      }

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const pdfBase64 = base64data.split(',')[1]; // Remove data:application/pdf;base64, prefix

        const emailData = this.emailForm.value;
        const voucherNumber = this.creditNoteForm.get('VoucherNumber')?.value || 'CreditNote';
        const filename = `CreditNote_${voucherNumber}.pdf`;

        // Prepare payload for API
        const payload = {
          companyId: this.currentCompany?.CompanyMasterSid || null,
          from: emailData.from,
          to: emailData.to,
          cc: emailData.cc || '',
          subject: emailData.subject,
          message: emailData.message,
          pdfBase64: pdfBase64,
          filename: filename,
          creditNoteDetails: {
            companyName: this.currentCompany?.CompanyName || 'Company Name',
            creditNoteNumber: voucherNumber,
            creditNoteDate: this.formatDate(this.creditNoteForm.get('VoucherDate')?.value),
            totalAmount: this.getGrandTotal().toFixed(2),
            currency: this.creditNoteForm.get('CurrencyCode')?.value || ''
          }
        };

        // Call API to send email
        // this.operationService.sendCreditNoteEmail(payload).subscribe({
        //   next: (resp: any) => {
        //     this.spinner.hide();
        //     if (resp?.status) {
        //       this.appSettingService.showSuccess('creditNote email sent successfully!');
        //       this.modalService.dismissAll();
        //     } else {
        //       this.appSettingService.showError(resp?.message || 'Failed to send email.');
        //     }
        //   },
        //   error: (err) => {
        //     this.spinner.hide();
        //     console.error('Error sending email:', err);
        //     this.appSettingService.showError('Failed to send creditNote email. Please try again.');
        //   }
        // });
      };

      reader.onerror = () => {
        this.spinner.hide();
        this.appSettingService.showError('Failed to process PDF. Please try again.');
      };
    } catch (error) {
      this.spinner.hide();
      console.error('Error in sendCreditNoteEmail:', error);
      this.appSettingService.showError('An error occurred while sending email.');
    }
  }

  getCustomerBranchName(): string {
    const branchSid = this.creditNoteForm.get('PartyName')?.value;
    if (!branchSid) return '-';
    const branch = this.customerBranchList.find(b => b.CustomerBranchSid === branchSid);
    return branch?.CustomerBranchName || branch?.CustomerName || '-';
  }

  formatDate(date: any): string {
    if (!date) return '-';
    // Handle NgbDateStruct
    if (date.year && date.month && date.day) {
      return `${date.day.toString().padStart(2, '0')}/${date.month.toString().padStart(2, '0')}/${date.year}`;
    }
    // Handle Date object or string
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  }

  getAmountInWords(): string {
    const total = this.getGrandTotal();
    const currency = this.creditNoteForm.get('CurrencyCode')?.value || '';

    // Use Indian numbering system for India, international for others
    const isIndian = this.bookingModeCountry === 'india';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const convertLessThanThousand = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanThousand(n % 100) : '');
    };

    const convertLessThanHundred = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    };

    // Indian numbering system (Lakhs and Crores)
    const convertIndianNumber = (num: number): string => {
      if (num === 0) return 'Zero';

      const crore = Math.floor(num / 10000000);
      const lakh = Math.floor((num % 10000000) / 100000);
      const thousand = Math.floor((num % 100000) / 1000);
      const remainder = Math.floor(num % 1000);

      let result = '';

      if (crore > 0) result += convertLessThanHundred(crore) + ' Crore ';
      if (lakh > 0) result += convertLessThanHundred(lakh) + ' Lakh ';
      if (thousand > 0) result += convertLessThanHundred(thousand) + ' Thousand ';
      if (remainder > 0) result += convertLessThanThousand(remainder);

      return result.trim();
    };

    // International numbering system (Billions and Millions)
    const convertInternationalNumber = (num: number): string => {
      if (num === 0) return 'Zero';

      const billion = Math.floor(num / 1000000000);
      const million = Math.floor((num % 1000000000) / 1000000);
      const thousand = Math.floor((num % 1000000) / 1000);
      const remainder = Math.floor(num % 1000);

      let result = '';

      if (billion > 0) result += convertLessThanThousand(billion) + ' Billion ';
      if (million > 0) result += convertLessThanThousand(million) + ' Million ';
      if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
      if (remainder > 0) result += convertLessThanThousand(remainder);

      return result.trim();
    };

    const integerPart = Math.floor(total);
    const decimalPart = Math.round((total - integerPart) * 100);

    let words = isIndian ? convertIndianNumber(integerPart) : convertInternationalNumber(integerPart);

    if (decimalPart > 0) {
      const decimalWords = isIndian
        ? convertLessThanHundred(decimalPart) + ' Paise'
        : convertLessThanHundred(decimalPart) + ' Cents';
      words += ' and ' + decimalWords;
    }

    return `${currency} ${words} Only`;
  }

  getCustomerName(CustomerMasterSid:number){
    if(!CustomerMasterSid || this.customerList.length === 0){
      return 'N/A'
    }
    return (this.customerList.find(cus => cus.CustomerMasterSid === CustomerMasterSid)?.CustomerName);
  }

  getBankDetails(){
    console.log('DEBUG - getBankDetails');
    const currCode = this.creditNoteForm.get('CurrencyCode')?.value;
    const currentBranchId = this.currentBranch?.BranchMasterSid;
    const currency = this.currencyList.find(c => c.currencyCode === currCode)?.CurrencyMasterSid;
    console.log('DEBUG - getBankDetails - branch:', currentBranchId);
    console.log('DEBUG - getBankDetails - currencyCode:', currCode);
    console.log('DEBUG - getBankDetails - currency:', currency);
    console.log('DEBUG - getBankDetails - currencyid:', currency);
    if(!currency || !currentBranchId){
      this.bankDetails = null;
      return;
    }
    const payload = {
      BranchMasterSid: currentBranchId,
      CurrencyMasterSid: currency
    }
    this.operationService.getBankDetails(payload).subscribe({
      next: (resp: any) => {
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

  getRowTotal(detail: any): number {
    const taxable = Number(detail.get('TaxableAmount')?.value || 0);
    const cgst = Number(detail.get('TaxAmount1')?.value || 0);
    const sgst = Number(detail.get('TaxAmount2')?.value || 0);
    const igst = Number(detail.get('TaxAmountIGST')?.value || 0);

    return taxable + cgst + sgst + igst;
  }


}
