import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, AbstractControl, FormArray, FormBuilder, Validators, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbDatepickerModule, NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { TaxCalculationService } from '../../services/tax-calculation.service';
import { toNumber } from 'src/app/common/helper';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { LogoService } from 'src/app/core/services/logo.service';

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
    SearchableDropdown,
    NgbDropdownModule
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
  MenuMasterSid: any;
  currentMenuId: number;
  TandCList: any[]=[];
  currentClauseId: any;
  currUserEmail: string | null = null;
  isViewMode: boolean = false;
  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;

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
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  currentUserCountry :string;
  get isIndiaGST(): boolean {
    return this.currentUserCountry === 'india';
  }
  get isVATMode(): boolean {
    return this.currentUserCountry !== 'india'; // VAT for non-India countries
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
        private companySettings: CompanySettingsManagerService,
        public mps: MenuPermissionService,
        private commonService: CommonService,
        private masterService: MasterService,
        private numberToWords: NumberToWordsService,
        private currencyFormatter:CurrencyFormatService,
        public logoService : LogoService
      ) {}
      ngOnInit(): void {
     const userProfile = this.appSettingService.getDecryptedUserProfile();
     if (userProfile) {
      this.userData = userProfile;
    }
    try {
      this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
      this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
      this.MenuMasterSid =  localStorage.getItem('currentMenuId');
      this.mps.init().subscribe();
      this.currentFinancialYear = Number(localStorage.getItem('current-year-id'));
      this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
      this.currentUserCountry = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
      this.currentCountry= Number(this.currentCompany?.CountryMasterSid)
      this.currentCurrency=Number(this.currentCompany?.CurrencyMasterSid)
      this.currentUserCurrency = String(this.currentCompany?.currencyMaster?.currencyName).trim().toLowerCase();
      this.currentUserState = String(this.currentBranch?.stateMaster?.stateName).trim().toLowerCase();
      this.branchDetails = this.appSettingService.getCurrentBranchInfo();
      console.log(this.branchDetails, "BRANCH DETAILS");
      this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
      this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
      this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
      this.loadCityName();
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
    this.creditNoteForm.get('GSTType')?.valueChanges.subscribe((value) => {
    console.log('GSTType changed to:', value);
    this.recalculateAllRows();
  });
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
          PartyMasterSid: null,
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


    loadCityName(): void {
    if (!this.currentBranchCityId) return;

    this.spinner.show();

    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {
        console.log("City API response:", response);

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
          console.log("Final City Name:", this.currentBranchCityName);
        }

        this.spinner.hide();
      },
      error: (error) => {
        console.error("Failed to load city:", error);
        this.spinner.hide();
      }
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
        COAMasterSid : [null],
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
        PostStatus: ['U'],
        InvoiceType: [{value: null, disabled: true}],
        Narration: [''],
        CreditNoteReason: [''],
        Remarks: [{ value: '', disabled: true }],
        IRNStatus: [{ value: '', disabled: true }],
        MBLNo: [{ value: '', disabled: true }],
        State: [{ value: '', disabled: true }],
        DepartmentMasterSid: [{ value: null, disabled: true }],
        HouseNumber: [{ value: '', disabled: true }],
        MasterNumber: [{ value: '', disabled: true }],
        HouseJobSid: [{ value: null, disabled: true }],
        BookingHeaderSid: [{ value: null, disabled: true }],
        CurrencyMasterSid: [{ value: null, disabled: true }],
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
          const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    
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
            const invoice: any = await firstValueFrom(this.operationService.getAllInvoice(CompanyMasterSid));
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

private patchInvoiceData(invoiceData: any) {
  const header = invoiceData;
  const invoiceHeaderSid = header.VoucherHeaderSid || header.voucherHeaderSid || null;
  this.originalInvoiceRates = new Map();
  
  const currentNarration = this.creditNoteForm.get('Narration')?.value;
  const autoNarration = this.autoGenerateNarration(this.creditNoteForm.get('ReversalVoucher')?.value);
  
  // First, patch the main form values including GST Type
  this.creditNoteForm.patchValue({
    ReversalVoucher: invoiceHeaderSid,
    CustomerMasterSid: header.CustomerMasterSid || null,
    PartyMasterSid: header.PartyMasterSid || null,
    COAMasterSid : header.COAMasterSid || null,
    Narration: autoNarration || header.Narration || currentNarration || '',
    PartyName: header.PartyName || '',
    PartyAddress: header.PartyAddress || '',
    DocumentNumber: header.DocumentNumber || '',
    CustomerBranchSid : header.CustomerBranchSid || null,
    IRNNumber : header.IRNNumber || '',
    IRNStatus : header.IRNStatus || '',
    PlaceOfSupply : header.PlaceOfSupply || "",
    State : header.State || "",
    DepartmentMasterSid : header.DepartmentMasterSid || null,
    HouseNumber : header.HouseNumber || "",
    MasterNumber : header.MasterNumber || "",
    HouseJobSid : header.HouseJobSid || null,
    MasterJobSid: header.MasterJobSid || null,
    BookingHeaderSid : header.BookingHeaderSid || null,
    CurrencyMasterSid : header.CurrencyMasterSid || null,
    HBLNo: header.HouseJob || header.HouseNumber || '',
    CurrencyCode: header.currencyMaster?.currencyCode || header.CurrencyCode || null,
    ExchangeRate: header.ExchangeRate || header.ExRate || 1,
    GST_VAT: header.GST_VAT || '',
    GSTType: header.GSTType || '',  // This is critical - must be set BEFORE processing details
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
        
        // Map transaction-level data
        return {
          ...detail,
          Amount: transaction.Amount || detail.Amount,
          LocalAmount: transaction.LocalAmount || detail.LocalAmount,
          TaxAmount1: transaction.TaxAmount1 || detail.TaxAmount1,
          TaxAmount2: transaction.TaxAmount2 || detail.TaxAmount2,
          TaxPercentage1: transaction.TaxPercentage1 || detail.TaxPercentage1,
          TaxPercentage2: transaction.TaxPercentage2 || detail.TaxPercentage2,
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
  console.log('DEBUG - GST Type for mapping:', this.creditNoteForm.get('GSTType')?.value);

  // Clear existing details and add new ones from invoice
  this.details.clear();
  
  detailsFromInvoice.forEach((detail: any) => {
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

    // IMPORTANT: Map tax values based on GST Type from the invoice
    const gstType = this.creditNoteForm.get('GSTType')?.value || header.GSTType;
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
      LedgerMasterSid: detail.LedgerMasterSid,
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
      TaxPercentage1: mappedTaxValues.TaxPercentage1,
      TaxAmount1: mappedTaxValues.TaxAmount1,
      TaxPercentage2: mappedTaxValues.TaxPercentage2,
      TaxAmount2: mappedTaxValues.TaxAmount2,
      COAMasterSid : detail.COAMasterSid || null,
      LocalAmount: localAmount,
      PartyAmount: partyAmount,
      MasterJobSid: detail.MasterJobSid,
      HouseJobSid: detail.HouseJobSid,
      MasterNumber : header.MasterNumber || detail.masterJob?.MasterJobNumber,
      YearMasterSid : detail.YearMasterSid || null,
      HouseNumber : header.HouseNumber || detail.houseJob?.HouseNo,
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
  console.log('DEBUG - First detail row tax values:', this.details.at(0)?.value);
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
          const partyAmount = this.getPartyAmount(d);
          const detail = {
            VoucherDetailSid: d.VoucherDetailSid,
            ChargeMasterSid: d.ChargeMasterSid != null ? Number(d.ChargeMasterSid) : null,
            ChargeDescription: d.ChargeDescription || '',
            LedgerMasterSid: d.LedgerMasterSid != null ? Number(d.LedgerMasterSid) : null,
            COAMasterSid : d.COAMasterSid != null ? Number(d.COAMasterSid) : null,
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
            LocalAmount: d.LocalAmount != null ? Number(d.LocalAmount) : 0,
            PartyAmount: partyAmount,
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
          InvoiceType: raw.InvoiceType || 'REG',
          GSTType: raw.GSTType || '',
          CurrencyMasterSid: currencyMasterId,
          PostStatus: raw.PostStatus || '',
          CurrencyCode: raw.CurrencyCode || undefined,
          ExchangeRate: raw.ExchangeRate != null ? Number(raw.ExchangeRate) : undefined,
          MasterJobSid: masterJobSid,
          HouseJobSid: raw.HouseJobSid ? Number(raw.HouseJobSid) : null,
          State : raw.State || "",
          DepartmentMasterSid : raw.DepartmentMasterSid || null,
          BookingHeaderSid: raw.BookingHeaderSid || null,
          MasterNumber : raw.MasterNumber || "",
          HouseNumber : raw.HouseNumber || "",
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
          const currentCountryName = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
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
              countryName: currentCountryName,
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
  onGSTTypeChange() {
  console.log('GST Type changed to:', this.creditNoteForm.get('GSTType')?.value);
  this.recalculateAllRows();
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
    this.creditNoteForm.get('COAMasterSid')?.setValue(null);
    this.creditNoteForm.get('GST_VAT')?.setValue('');
    this.creditNoteForm.get('PartyName')?.setValue(''); 
     if (this.currentUserCountry === 'india') {
      this.creditNoteForm.get('InvoiceType')?.setValue('B2B');
    } else {
      this.creditNoteForm.get('InvoiceType')?.setValue('REG'); // Regular for non-India
    }
    
    this.creditNoteForm.get('GSTType')?.setValue('');
    return;// Clear PartyName
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

    if(customer.COAMappedId){
      this.creditNoteForm.get('COAMasterSid')?.setValue(Number(customer.COAMappedId));
      console.log("DEBUG - Set COAMasterSid from customer:", customer.COAMappedId);
    } else {
      this.creditNoteForm.get('COAMasterSid')?.setValue(null);
      console.log("DEBUG - Customer has no COAMappedId:", customer);
    }

    // Get country code from customer
    const countryCode = this.getCustomerCountryCode(customer);
    
    console.log('DEBUG - Customer CountryCode:', countryCode);
    const customerBranches = this.customerBranchList.filter(b => b.CustomerMasterSid === customerMasterSid);
    const hasGSTInBranches = customerBranches.some(branch => branch.GSTNo && branch.GSTNo.trim() !== '');

    if (this.currentUserCountry === 'india') {
      if (hasGSTInBranches || customer.GSTNo) {
        this.creditNoteForm.get('InvoiceType')?.setValue('B2B');
        console.log('Invoice Type: B2B (Indian customer with GST)');
      } else {
        this.creditNoteForm.get('InvoiceType')?.setValue('B2C');
        console.log('Invoice Type: B2C (Indian customer without GST)');
      }
    } else {
      // For UAE/Non-India, use REG (Regular) instead of EXWP
      this.creditNoteForm.get('InvoiceType')?.setValue('REG');
      console.log('Invoice Type: REG (Non-India customer)');
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
    COAMasterSid : header.COAMasterSid || null,
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
    Narration: header.Narration || '',
    CreditNoteReason: header.CreditNoteReason || '',
    Remarks: header.Remarks || '',
    IRNStatus: header.IRNStatus || '',
    MBLNo: header.MBLNo || '',
    status: header.status || 'A'
  });

  console.log('DEBUG - header.PartyName:', header.PartyName);
  console.log('DEBUG - GSTType from API:', header.GSTType);
  console.log('DEBUG - InvoiceType from API:', header.InvoiceType);

  const cm = header.CustomerMasterSid || customerMasterSidFromBranch || null;
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
        CurrencyCode: det.CurrencyCode || this.creditNoteForm.get('CurrencyCode')?.value,
        Rate: det.Rate,
        ExchangeRate: det.ExchangeRate || this.creditNoteForm.get('ExchangeRate')?.value,
        Amount: det.Amount,
        TaxableAmount: det.TaxableAmount,
        TaxPercentage1: taxPerc1, // This contains VAT rate
        TaxAmount1: taxAmt1,      // This contains VAT amount
        TaxPercentage2: 0,
        TaxAmount2: 0,
        MasterNumber : det.masterJob?.MasterJobNumber,
        HouseNumber : det.houseJob?.HouseNo,
        COAMasterSid : det.COAMasterSid || null,
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
        CurrencyCode: det.CurrencyCode || this.creditNoteForm.get('CurrencyCode')?.value,
        Rate: det.Rate,
        ExchangeRate: det.ExchangeRate || this.creditNoteForm.get('ExchangeRate')?.value,
        Amount: det.Amount,
        TaxableAmount: det.TaxableAmount,
        TaxPercentage1: taxPerc1, // CGST rate
        TaxAmount1: taxAmt1,      // CGST amount
        TaxPercentage2: taxPerc2, // SGST rate
        TaxAmount2: taxAmt2,      // SGST amount
        MasterNumber : det.masterJob?.MasterJobNumber,
        HouseNumber : det.houseJob?.HouseNo,
        COAMasterSid: det.COAMasterSid,
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
        CurrencyCode: det.CurrencyCode || this.creditNoteForm.get('CurrencyCode')?.value,
        Rate: det.Rate,
        ExchangeRate: det.ExchangeRate || this.creditNoteForm.get('ExchangeRate')?.value,
        Amount: det.Amount,
        TaxableAmount: det.TaxableAmount,
        TaxPercentage1: taxPerc1,
        TaxAmount1: taxAmt1,
        TaxPercentage2: 0,
        TaxAmount2: 0,
        MasterNumber : det.masterJob?.MasterJobNumber,
        HouseNumber : det.houseJob?.HouseNo,
        COAMasterSid: det.COAMasterSid,     
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
        CurrencyCode: det.CurrencyCode || this.creditNoteForm.get('CurrencyCode')?.value,
        Rate: det.Rate,
        ExchangeRate: det.ExchangeRate || this.creditNoteForm.get('ExchangeRate')?.value,
        Amount: det.Amount,
        TaxableAmount: det.TaxableAmount,
        TaxPercentage1: taxPerc1, // CGST rate for B2C
        TaxAmount1: taxAmt1,      // CGST amount for B2C
        TaxPercentage2: 0,
        TaxAmount2: 0,
        MasterNumber : det.masterJob?.MasterJobNumber,
        HouseNumber : det.houseJob?.HouseNo,
        COAMasterSid: det.COAMasterSid,
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
        CurrencyCode: det.CurrencyCode || this.creditNoteForm.get('CurrencyCode')?.value,
        Rate: det.Rate,
        ExchangeRate: det.ExchangeRate || this.creditNoteForm.get('ExchangeRate')?.value,
        Amount: det.Amount,
        TaxableAmount: det.TaxableAmount,
        TaxPercentage1: taxPerc1,
        TaxAmount1: taxAmt1,
        TaxPercentage2: taxPerc2,
        TaxAmount2: taxAmt2,
        MasterNumber : det.masterJob?.MasterJobNumber,
        HouseNumber : det.houseJob?.HouseNo,
        COAMasterSid: det.COAMasterSid,
        LocalAmount: det.LocalAmount,
        PartyAmount: det.PartyAmount,
        MasterJobSid: det.MasterJobSid,
        HouseJobSid: det.HouseJobSid
      }));
    }
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
      LedgerMasterSid : [data?.LedgerMasterSid || null],
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
      COAMasterSid: [data?.COAMasterSid || null],
      LocalAmount: [data?.LocalAmount || 0],
      PartyAmount: [data?.PartyAmount || 0],
      MasterJobSid: [data?.MasterJobSid || null],
      HouseJobSid: [data?.HouseJobSid || null],
      MasterNumber : [data?.masterJob?.MasterJobNumber || data?.MasterNumber || ''],
      HouseNumber : [data?.houseJob?.HouseNo || data?.HouseNumber || ''],
      YearMasterSid : [data?.YearMasterSid || null]
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
    if (['NumberOfUnit', 'Rate', 'ExchangeRate', 'TaxPercentage1', 'TaxPercentage2', 'CurrencyCode'].includes(field || '')) {
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
  
  // const headerCurrency = this.creditNoteForm.get('CurrencyCode')?.value;
  // if (row.get('CurrencyCode')?.value !== headerCurrency) {
  //   row.get('CurrencyCode')?.setValue(headerCurrency);
  // }

  const unit = Number(row.get('NumberOfUnit')?.value || 0);
  const rate = Number(row.get('Rate')?.value || 0);
  const exRate = Number(row.get('ExchangeRate')?.value || this.creditNoteForm.get('ExchangeRate')?.value || 1);

  // Calculate basic amounts
  const amount = unit * rate;
  const taxableAmount = amount * exRate;
  const localAmount = amount * exRate;

  // Get GST Type
  const gstType = this.creditNoteForm.get('GSTType')?.value;
  const placeOfSupply = this.creditNoteForm.get('PlaceOfSupply')?.value;
  
  console.log('=== RATE CHANGE DEBUG - START ===');
  console.log('Row Index:', index);
  console.log('Unit:', unit);
  console.log('Rate:', rate);
  console.log('Exchange Rate:', exRate);
  console.log('Amount:', amount);
  console.log('Taxable Amount:', taxableAmount);
  console.log('GST Type:', gstType);

  // Store current tax rates before clearing
  const currentTaxPercentage1 = Number(row.get('TaxPercentage1')?.value || 0);
  const currentTaxPercentage2 = Number(row.get('TaxPercentage2')?.value || 0);
  
  console.log('Current Tax Rates:', {
    taxPercentage1: currentTaxPercentage1,
    taxPercentage2: currentTaxPercentage2,
  });

  // Only fetch new tax rates if charge changed or not already set
  let cgstRate = currentTaxPercentage1;
  let sgstRate = currentTaxPercentage2;
  let vatRate = currentTaxPercentage1; // VAT uses TaxPercentage1
  
  const chargeSid = row.get('ChargeMasterSid')?.value;
  
  // If we have a charge but no tax rates yet, fetch them
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



/**
 * Get tax ledger for charge using the same method as invoice-entry.component.ts
 */
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
  const customerMaster = this.customerList.find(c => c.CustomerMasterSid === this.creditNoteForm.get('CustomerMasterSid')?.value);
  const customerBranch = this.customerBranchList.find(b => b.CustomerBranchSid === this.creditNoteForm.get('CustomerBranchSid')?.value);
  
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
  if (!this.isIndiaGST) {
    // For non-India countries, always use VAT
    this.creditNoteForm.get('GSTType')?.setValue('VAT');
    console.log('GST Type set to: VAT (Non-India country)');
    return;
  }

  if (this.isIndiaGST) {
    // Scenario 1: Export (Customer outside India)
    if (invoiceType === 'EXWP' || invoiceType === 'EXWOP') {
      this.creditNoteForm.get('GSTType')?.setValue('EXWP');
      console.log('GST Type set to: EXPORT (Export scenario)');
      return;
    }

    // Scenario 2 & 3: Regular India GST scenarios
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
      // const currCtrl = this.details.at(i).get('CurrencyCode');
      // if (currCtrl && !currCtrl.value) {
      //   currCtrl.setValue(this.creditNoteForm.get('CurrencyCode')?.value || null);
      // }
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
  getTotalTaxAmount() {
    let total = 0;
    for (let i = 0; i < this.details.length; i++) {
      const taxAmt1 = Number(this.details.at(i).get('TaxAmount1')?.value || 0);
      const taxAmt2 = Number(this.details.at(i).get('TaxAmount2')?.value || 0);
      total += taxAmt1 + taxAmt2 ;
    }
    return total.toFixed(2);
  }

  // Calculate grand total (Currency Amount + Tax Amount)
  getGrandTotal(): number {
    return this.round(this.getTotalCurrencyAmount() + toNumber(this.getTotalTaxAmount()));
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
      const partyAmount = this.getPartyAmount(d);
      const detail = {
        VoucherDetailSid: d.VoucherDetailSid,
        ChargeMasterSid: d.ChargeMasterSid != null ? Number(d.ChargeMasterSid) : null,
        ChargeDescription: d.ChargeDescription || '',
        HSSACMasterSid: d.HSSACMasterSid != null ? Number(d.HSSACMasterSid) : null,
        LedgerMasterSid : d.LedgerMasterSid ? Number(d.LedgerMasterSid) : null,
        COAMasterSid : d.COAMasterSid ? Number(d.COAMasterSid) : null,
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
        LocalAmount: d.LocalAmount != null ? Number(d.LocalAmount) : 0,
        PartyAmount: partyAmount,
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

  const rupees = Math.floor(total);
  const paise = Math.round((total - rupees) * 100);

  const rupeesInWords = this.numberToWords.convert(rupees);
  const paiseInWords = paise > 0 ? this.numberToWords.convert(paise) : '';

  const selectedCode = this.creditNoteForm.get('CurrencyCode')?.value;

  // Make sure the find works
  const selectedCurrency = this.currencyList.find(
    (c: any) => String(c.CurrencyCode).trim() === String(selectedCode).trim()
  );

  const currencyName = selectedCurrency?.CurrencyUnit || 'Rupees';
  const subCurrencyName = selectedCurrency?.CurrencySubUnit || 'Paise';
  console.log(currencyName,"Currency Unit");
  console.log(subCurrencyName,"SunCurrency Unit");

  if (paise > 0) {
    return ` ${rupeesInWords} ${currencyName} and ${paiseInWords} ${subCurrencyName} Only`;
  }

  return ` ${rupeesInWords} ${currencyName} Only`;
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

    return taxable + cgst + sgst ;
  }

  getPartyAmount(detail: any) {
    const voucherHeaderCurrency = this.creditNoteForm.get('CurrencyCode')?.value;
    const voucherHeaderExRate = this.creditNoteForm.get('ExchangeRate')?.value;
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
      EffectiveFrom : this.isEditMode ? new Date(this.creditNoteData?.VoucherDate) : new Date(),
      segment: 'revenue'
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

  showInfo() {
        if(!this.creditNoteData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.creditNoteData;
        modalRef.componentInstance.idLabel = 'Credit Note Id';
        modalRef.componentInstance.idValue = this.creditNoteData?.VoucherHeaderSid;
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
              modalRef.componentInstance.DocumentSid = this.currentClauseId;
    
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
      if (!this.creditNoteData) return;
      const modalRef = this.modalService.open(EmailEntryComponent, { 
        size: 'lg', 
        centered: true, 
        backdrop: 'static' 
      });
      modalRef.componentInstance.item = this.creditNoteData;
      modalRef.componentInstance.idLabel = 'Credit Note Id';
      modalRef.componentInstance.idValue = this.creditNoteData?.VoucherHeaderSid;
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
      // modalRef.componentInstance.documentSid = this.VoucherHeaderSid;
    }
    
    openEDoc() {
      if (!this.creditNoteData) return;
      const modalRef = this.modalService.open(EdocComponent, { 
        size: 'lg', 
        centered: true, 
        backdrop: 'static' 
      });
      modalRef.componentInstance.item = this.creditNoteData;
      modalRef.componentInstance.idLabel = 'Credit Note Id';
      modalRef.componentInstance.idValue = this.creditNoteData.VoucherHeaderSid;
    const data:any={
        CompanyMasterSid: this.currentCompany.CompanyMasterSid,
        BranchMasterSid: this.currentBranch.BranchMasterSid,
        MenuMasterSid : this.MenuMasterSid,
        DocumentSid: this.creditNoteData?.VoucherHeaderSid
      }
    
          this.commonService.documentData.set(data)
    }
  
    openFollowup() {
  
    }

    // Helper methods for tax display logic
shouldShowCGSTSGST(): boolean {
  if (this.currentUserCountry !== 'india') return false;
  
  const companyState = this.getCompanyState();
  const placeOfSupply = this.creditNoteForm.get('PlaceOfSupply')?.value;
  
  if (!companyState || !placeOfSupply) return false;
  
  return companyState.trim().toLowerCase() === placeOfSupply.trim().toLowerCase();
}

shouldShowIGST(): boolean {
  if (this.currentUserCountry !== 'india') return false;
  
  const companyState = this.getCompanyState();
  const placeOfSupply = this.creditNoteForm.get('PlaceOfSupply')?.value;
  
  if (!companyState || !placeOfSupply) return false;
  
  return companyState.trim().toLowerCase() !== placeOfSupply.trim().toLowerCase();
}

shouldShowVAT(): boolean {
  return this.currentUserCountry !== 'india';
}

getTaxDisplayConfig(): {
  showCGST: boolean;
  showSGST: boolean;
  showIGST: boolean;
  showVAT: boolean;
} {
  const gstType = this.creditNoteForm.get('GSTType')?.value;
  const isIndia = this.currentUserCountry === 'india';
  
  if (!isIndia) {
    // Non-India countries (like UAE) - show VAT only
    return {
      showCGST: false,
      showSGST: false,
      showIGST: false,
      showVAT: true
    };
  }
  
  // India GST logic
  if (gstType === 'CGST+SGST') {
    // Same state - show CGST and SGST
    return {
      showCGST: true,
      showSGST: true,
      showIGST: false,
      showVAT: false
    };
  } else if (gstType === 'IGST') {
    // Different state - show IGST only
    return {
      showCGST: false,
      showSGST: false,
      showIGST: true,
      showVAT: false
    };
  } else if (gstType === 'B2C') {
    // B2C - show CGST only (for B2C in India)
    return {
      showCGST: true,
      showSGST: false,
      showIGST: false,
      showVAT: false
    };
  } else if (gstType === 'VAT') {
    // VAT (shouldn't happen for India, but just in case)
    return {
      showCGST: false,
      showSGST: false,
      showIGST: false,
      showVAT: true
    };
  }
  
  // Default: Show all GST columns for India
  return {
    showCGST: true,
    showSGST: true,
    showIGST: true,
    showVAT: false
  };
}

getTaxPercentageForDisplay(detail: any): {
  cgstRate: number;
  sgstRate: number;
  vatRate: number;
} {
  const gstType = this.creditNoteForm.get('GSTType')?.value;
  
  if (gstType === 'CGST+SGST') {
    return {
      cgstRate: detail.TaxPercentage1 || 0,
      sgstRate: detail.TaxPercentage2 || 0,
      vatRate: 0
    };
  } else if (gstType === 'IGST') {
    return {
      cgstRate: detail.TaxPercentage1 || 0,
      sgstRate: 0,
      vatRate: 0
    };
  } else if (gstType === 'B2C') {
    return {
      cgstRate: detail.TaxPercentage1 || 0,
      sgstRate: 0,
      vatRate: 0
    };
  } else if (gstType === 'VAT') {
    return {
      cgstRate: 0,
      sgstRate: 0,
      vatRate: detail.TaxPercentage1 || 0
    };
  }
  
  return {
    cgstRate: detail.TaxPercentage1 || 0,
    sgstRate: detail.TaxPercentage2 || 0,
    vatRate: detail.TaxPercentage1 || 0
  };
}

getTaxAmountForDisplay(detail: any): {
  cgstAmt: number;
  sgstAmt: number;
  vatAmt: number;
} {
  const gstType = this.creditNoteForm.get('GSTType')?.value;
  
  if (gstType === 'CGST+SGST') {
    return {
      cgstAmt: detail.TaxAmount1 || 0,
      sgstAmt: detail.TaxAmount2 || 0,
      vatAmt: 0
    };
  } else if (gstType === 'IGST') {
    return {
      cgstAmt: detail.TaxAmount1 || 0,
      sgstAmt: 0,
      vatAmt: 0
    };
  } else if (gstType === 'B2C') {
    return {
      cgstAmt: detail.TaxAmount1 || 0,
      sgstAmt: 0,
      vatAmt: 0
    };
  } else if (gstType === 'VAT') {
    return {
      cgstAmt: 0,
      sgstAmt: 0,
      vatAmt: detail.TaxAmount1 || 0
    };
  }
  
  return {
    cgstAmt: detail.TaxAmount1 || 0,
    sgstAmt: detail.TaxAmount2 || 0,
    vatAmt: detail.TaxAmount1 || 0
  };
}

shouldShowGSTTypeField(): boolean {
  return this.currentUserCountry === 'india';
}

calculateTotalColspan(): number {
  const config = this.getTaxDisplayConfig();
  let baseColumns = 8; // S.No, Particulars, HSN/SAC, Curr, No of Unit, Rate, ROE, Taxable Value
  
  // Add tax columns based on what's visible
  if (config.showCGST) baseColumns += 2; // CGST % + CGST Amt
  if (config.showSGST) baseColumns += 2; // SGST % + SGST Amt
  if (config.showIGST) baseColumns += 2; // IGST % + IGST Amt
  if (config.showVAT) baseColumns += 2;  // VAT % + VAT Amt
  
  return baseColumns;
}

  getPkgWtVol() {
    const data = this.creditNoteData?.masterJob;
    if (!data) return '';
    const values = [
      data.NoOfPkg,
      data.GrossWeight,
      data.Volume
    ].filter(x => x != null && x !== '');
    return values.join(' / ');
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

}
