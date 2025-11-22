
import { Component, OnInit, ViewChild } from '@angular/core';
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
import { NgbModal, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { OperationService } from 'src/app/modules/operation/operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { MasterService } from 'src/app/modules/master/master.service';

interface NgbDateStructLike { day: number; month: number; year: number; }

@Component({
  selector: 'app-invoice-entry',
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
  templateUrl: './invoice-entry.component.html',
  styleUrls: ['./invoice-entry.component.scss'],
})
export class InvoiceEntryComponent implements OnInit {
  invoiceForm!: FormGroup;
  emailForm!: FormGroup;
  headerId: number | null = null;
  currentCompany: any;
  currentBranch: any;
  invoiceData: any;
  isDataModified: boolean = false;
  // current user email to send CreatedBy / UpdatedBy
  currUserEmail: string | null = null;
  isViewMode: boolean = false;
  get isEditMode() { return !!this.headerId && !this.isViewMode; }

  // ViewChild references for modals
  @ViewChild('printModal') printModalRef: any;
  @ViewChild('emailModal') emailModalRef: any;

  // lookups
  customerList: any[] = [];
  customerBranchList: any[] = [];
  bankDetails: any;
  currencyList: any[] = [];
  chargeList: any[] = [];
  hssacList: any[] = [];
  subledgerList: any[] = [];
  uomList: any[] = []; // <-- NEW: UOM lookup
  stateList: any[] = [];
  voucherTypesList: any[] = [
    { id: '1', name: 'Type 1' },
    { id: '2', name: 'Type 2' },
    { id: '3', name: 'Type 3' },
  ];
  userData: any;
  currentDate = new Date()
  // master jobs
  masterJobList: any[] = [];
  salesmanList : any[] = [];
  houseJobListByMasterJob: { [key: number]: any[] } = {};
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;

  CurrencyLookupConfig = {
    displayFields: ['currencyCode', 'currencyName', 'countryName'],
    displayLabels: ['Code', 'Name', 'Country'],
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
    labelFields: ['departmentCode'],
  };
  // UI state
  selectedTab = 'Invoice';
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }
  tabs = [
    { name: 'Invoice', icon: 'fas fa-file-invoice' },
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

  gstTypes = [
    { id: 'B2B', name: 'B2B - Business to Business' },
    { id: 'B2C', name: 'B2C - Business to Customer' },
    { id: 'EXWP', name: 'Export With Payment' },
    { id: 'EXWOP', name: 'Export Without Payment' }
  ];
  currentUserState: string;
  currentFinancialYear: number;
  currentCountry: number;
  currentCurrency: number;
  currentUserCurrency: string;
  currentUserCountry: string;
  currentBranchCityId : number; 
  currentBranchCityName : string | null; 
  filteredDetailItems : any[] = [];

  bookingModeCountry: string = 'india';

  private pendingBranchToSelect: number | null = null;

  // Tax display mode based on country
  get isIndiaGST(): boolean {
    return this.bookingModeCountry === 'india';
  }
  get isVATMode(): boolean {
    return !this.isIndiaGST; // VAT for non-India countries
  }

  get f(): { [key: string]: AbstractControl } {
    return this.invoiceForm.controls;
  }
  get details(): FormArray {
    return this.invoiceForm.get('voucherDetails') as FormArray;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private operationService: OperationService,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private companySettings: CompanySettingsManagerService
  ) { }

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
      this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
      this.currentUserCountry = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
      this.currentCountry = Number(this.currentCompany?.CountryMasterSid)
      this.currentCurrency = Number(this.currentCompany?.CurrencyMasterSid)
      this.currentUserCurrency = String(this.currentCompany?.currencyMaster?.currencyName).trim().toLowerCase();
      this.currentUserState = String(this.currentBranch?.stateMaster?.stateName).trim().toLowerCase();
      this.currentBranchCityId = this.currentBranch.CityMasterSid;

      console.log('=== INITIAL COMPANY DATA ===');
      console.log('Current Company:', this.currentCompany);
      console.log('Current Branch:', this.currentBranch);
      console.log('Company State:', this.currentUserState);
      console.log('Company Currency:', this.currentUserCurrency);
      console.log('Current Country:', this.currentCountry);
      console.log('Current Currency:', this.currentCurrency);
      console.log('Current Financial Year:', this.currentFinancialYear);
      console.log('Current Branch CityId:', this.currentBranchCityId);

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
    }
    this.route.data.subscribe(data => {
      this.isViewMode = data['viewMode'] === true;
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.headerId = Number(id);
        this.loadInvoiceById(this.headerId);
      } else {
        // New invoice - set default currency from company config
        const currencySettings = this.companySettings.getCurrencySettings();
        this.invoiceForm.patchValue({
          PartyMasterSid: 3,
          CurrencyCode: currencySettings.code,
          ExchangeRate: 1 // Home currency always has exchange rate of 1
        });
      }
    });

    this.invoiceForm.get('CurrencyCode')?.valueChanges.subscribe(() => {
      this.recalculateAllRows();
      this.getBankDetails();
    });

    this.invoiceForm.get('ExchangeRate')?.valueChanges.subscribe(() => {
      this.recalculateAllRows();
    });
  }

  initForm() {
    this.invoiceForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }],
      VoucherDate: [null, Validators.required],
      CustomerMasterSid: [null],
      PartyMasterSid: [null],
      PartyName: [null, Validators.required],
      PartyAddress: [{ value: '', disabled: true }, Validators.required],
      CustomerBranchSid: [null],
      DocumentNumber: [''],
      IRNNumber: [''],
      MasterJobSid: [''],
      HBLNo: [''],
      CurrencyCode: ['', Validators.required],
      ExchangeRate: [1, [Validators.required, Validators.min(0)]],
      GST_VAT: [''],
      PlaceOfSupply: [''],
      PostStatus: [''],
      GSTType: [''],
      InvoiceType: [null],
      VoucherType: [1],
      Narration: ['hi'],
      Remarks: [''],
      IRNStatus: [''],
      MBLNo: [{ value: '', disabled: true }],
      status: ['A', Validators.required],
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
    this.spinner.show();
    const companyRaw = localStorage.getItem('selected-company');
    const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;
    const filterOption = { CompanyMasterSid: company?.CompanyMasterSid, BranchMasterSid: company?.BranchMasterSid };

    Promise.all([
      firstValueFrom(this.operationService.getAllDebtorWithCOAMapped(filterOption)),
      firstValueFrom(this.operationService.getAllCurrencies()),
      firstValueFrom(this.operationService.getAllMappedChargeDebtors(filterOption)),
      firstValueFrom(this.operationService.getAllHssac()),
      firstValueFrom(this.operationService.getAllUom()),
      firstValueFrom(this.operationService.getAllState()),
      firstValueFrom(this.operationService.getAllSalesman()),
      firstValueFrom(this.masterService.getCityById(this.currentBranchCityId)),
    ]).then(([customers, currencies, charges, hssac, uom, states,salesman,userCity]) => {
      this.customerList = customers.data || [];
      this.subledgerList = customers.data || [];
      this.currencyList = currencies.data || [];
      this.chargeList = charges.data || [];
      this.hssacList = hssac || [];
      this.uomList = uom.data || [];
      this.stateList = states?.data || states || [];
      this.salesmanList = salesman  || [];
      this.currentBranchCityName = userCity ? userCity.cityName : null;
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


  onCustomerBranchChange(selectedBranch: any) {
    const branchSid = (typeof selectedBranch === 'object' && selectedBranch !== null)
      ? (selectedBranch.CustomerBranchSid ?? selectedBranch)
      : selectedBranch;

    if (!branchSid) {
      this.invoiceForm.get('PartyAddress')?.setValue('');
      this.invoiceForm.get('GST_VAT')?.setValue('');
      this.invoiceForm.get('PlaceOfSupply')?.setValue('');
      return;
    }

    const foundBranch = this.customerBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));

    if (foundBranch) {
      console.log('DEBUG - Found Branch for Place of Supply:', foundBranch);

      // Set address from branch
      const address = foundBranch.Address || foundBranch.CustomerAddress1 || foundBranch.customerAddress || '';
      this.invoiceForm.get('PartyAddress')?.setValue(address);

      // Get Place of Supply from state lookup - IMPORTANT: Use the same logic as vendor invoice
      let placeOfSupply = '';
      const stateMasterSid = foundBranch.StateMasterSid;

      if (stateMasterSid && this.stateList.length > 0) {
        const state = this.stateList.find(s =>
          s.StateMasterSid === stateMasterSid ||
          s.stateMasterSid === stateMasterSid
        );
        if (state) {
          placeOfSupply = state.stateName || state.StateName || '';
          console.log('DEBUG - Found state from StateMasterSid:', placeOfSupply);
        }
      }

      // If no state found, try to get city or use empty
      if (!placeOfSupply) {
        placeOfSupply = foundBranch.City || foundBranch.city || '';
        console.log('DEBUG - Using city as fallback:', placeOfSupply);
      }

      console.log('DEBUG - Final Place of Supply:', placeOfSupply);
      this.invoiceForm.get('PlaceOfSupply')?.setValue(placeOfSupply);

      // Set GST/VAT based on country
      const customerMasterSid = foundBranch.CustomerMasterSid;
      if (customerMasterSid) {
        const customer = this.customerList.find(c => c.CustomerMasterSid === customerMasterSid);
        if (customer) {
          const countryCode = this.getCustomerCountryCode(customer);
          console.log('DEBUG - Country Code:', countryCode);

          if (countryCode === 'IN') {
            // For India - use branch GST number
            const gstNo = foundBranch.GSTNo || customer.GSTNo || '';
            console.log('DEBUG - Setting GST_VAT for India:', gstNo);
            this.invoiceForm.get('GST_VAT')?.setValue(gstNo);
          } else {
            // For non-India countries - use customer PanType
            const panType = customer.PanType || '';
            console.log('DEBUG - Setting GST_VAT for non-India (PanType):', panType);
            this.invoiceForm.get('GST_VAT')?.setValue(panType);
          }
        }
      }

      // Auto-determine GST Type based on Place of Supply
      this.determineGSTType(placeOfSupply);
    } else {
      console.log('DEBUG - Branch not found for SID:', branchSid);
      this.invoiceForm.get('PartyAddress')?.setValue('');
      this.invoiceForm.get('GST_VAT')?.setValue('');
      this.invoiceForm.get('PlaceOfSupply')?.setValue('');
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

  onCustomerChange(selected: any) {
    const customerMasterSid = (typeof selected === 'object' && selected !== null)
      ? (selected.CustomerMasterSid ?? selected)
      : selected;

    if (!customerMasterSid) {
      this.customerBranchList = [];
      this.invoiceForm.get('CustomerBranchSid')?.setValue(null);
      this.invoiceForm.get('PartyAddress')?.setValue('');
      this.invoiceForm.get('PartyMasterSid')?.setValue(null);
      this.invoiceForm.get('GSTNo')?.setValue('');
      this.invoiceForm.get('PartyName')?.setValue('');
      this.invoiceForm.get('PlaceOfSupply')?.setValue('');
      this.invoiceForm.get('InvoiceType')?.setValue('B2B');
      this.invoiceForm.get('GSTType')?.setValue('');
      return;
    }

    const customer = this.customerList.find(c => c.CustomerMasterSid === customerMasterSid);
    if (customer) {
      console.log('DEBUG - Customer selected:', customer);

      // Set PartyName to customer name
      this.invoiceForm.get('PartyName')?.setValue(customer.CustomerName || '');

      // Set PartyMasterSid from customer's SubledgerMasterSid
      if (customer.SubledgerMasterSid) {
        this.invoiceForm.get('PartyMasterSid')?.setValue(Number(customer.SubledgerMasterSid));
        console.log('DEBUG - Set PartyMasterSid from customer:', customer.SubledgerMasterSid);
      } else {
        console.warn('DEBUG - Customer has no SubledgerMasterSid:', customer);
        this.invoiceForm.get('PartyMasterSid')?.setValue(null);
      }

      // Determine invoice type based on country
      const countryCode = this.getCustomerCountryCode(customer);
      console.log('Customer Country Code:', countryCode);

      // Check if customer has GST in any branch to determine B2B vs B2C
      const customerBranches = this.customerBranchList.filter(b => b.CustomerMasterSid === customerMasterSid);
      const hasGSTInBranches = customerBranches.some(branch => branch.GSTNo && branch.GSTNo.trim() !== '');

      if (countryCode === 'IN') {
        if (hasGSTInBranches || customer.GSTNo) {
          this.invoiceForm.get('InvoiceType')?.setValue('B2B');
          console.log('Invoice Type: B2B (Indian customer with GST)');
        } else {
          this.invoiceForm.get('InvoiceType')?.setValue('B2C');
          console.log('Invoice Type: B2C (Indian customer without GST)');
        }
      } else {
        this.invoiceForm.get('InvoiceType')?.setValue('EXWP');
        console.log('Invoice Type: EXWP (Export customer)');
      }
    }

    // Reset branch selection when customer changes
    this.invoiceForm.get('CustomerBranchSid')?.setValue(null);
    this.invoiceForm.get('PartyAddress')?.setValue('');
    this.invoiceForm.get('PlaceOfSupply')?.setValue('');
    this.invoiceForm.get('GSTType')?.setValue('');
    this.getCustomerBranchByCustomer(Number(customerMasterSid));
  }


  determineGSTType(placeOfSupply: string) {
    if (!placeOfSupply) {
      this.invoiceForm.get('GSTType')?.setValue('');
      console.log('GST Type: No place of supply available');
      return;
    }

    const companyState = this.getCompanyState();
    const customerGSTNo = this.invoiceForm.get('GST_VAT')?.value;
    const invoiceType = this.invoiceForm.get('InvoiceType')?.value;

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
      this.invoiceForm.get('GSTType')?.setValue('EXWP');
      console.log('GST Type set to: EXPORT (Export scenario)');
      return;
    }

    // Scenario 2 & 3: India GST scenarios
    if (this.isIndiaGST) {
      if (hasValidGST) {
        // Customer has GST number
        if (normalizedPlaceOfSupply === normalizedCompanyState) {
          // Same State - CGST + SGST
          this.invoiceForm.get('GSTType')?.setValue('CGST+SGST');
          console.log('GST Type set to: CGST+SGST (Intra-state with GST)');
        } else {
          // Different State - IGST
          this.invoiceForm.get('GSTType')?.setValue('IGST');
          console.log('GST Type set to: IGST (Inter-state with GST)');
        }
      } else {
        // Customer doesn't have GST number - B2C
        this.invoiceForm.get('GSTType')?.setValue('B2C');
        console.log('GST Type set to: B2C (No GST number)');
      }
    } else {
      // Non-India scenarios
      this.invoiceForm.get('GSTType')?.setValue('VAT');
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

    // Method 4: Check currentBranch StateMasterSid
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

  private getCustomerCountryCode(customer: any): string {
    console.log('DEBUG - Customer structure:', customer);

    // Check the CountryMasterSid object structure
    if (customer.CountryMasterSid && typeof customer.CountryMasterSid === 'object') {
      const code = customer.CountryMasterSid.countryCode || customer.CountryMasterSid.CountryCode;
      console.log('DEBUG - Extracted countryCode from CountryMasterSid:', code);
      return code ? code.toUpperCase() : '';
    }

    // Check direct country code fields
    const countryCode = customer.CountryCode ||
      customer.countryCode ||
      customer.countryMaster?.countryCode ||
      customer.country?.countryCode ||
      customer.CountryMaster?.CountryCode ||
      '';

    console.log('DEBUG - Country code from direct fields:', countryCode);

    // Final fallback: if customer has any branches with GSTNo, assume it's India
    if (!countryCode) {
      const customerBranches = this.customerBranchList.filter(b => b.CustomerMasterSid === customer.CustomerMasterSid);
      const hasGSTNo = customerBranches.some(branch => branch.GSTNo && branch.GSTNo.trim() !== '');
      console.log('DEBUG - Fallback check - has GST branches:', hasGSTNo);
      if (hasGSTNo) {
        return 'IN';
      }
    }

    return countryCode ? countryCode.toUpperCase() : '';
  }


  getCustomerBranchByCustomer(CustomerMasterSid: number, callback?: (branches: any[]) => void) {
    if (!CustomerMasterSid) {
      this.customerBranchList = [];
      if (callback) callback([]);
      return;
    }

    this.operationService.getCustomerBranchByCustomer(CustomerMasterSid).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          this.customerBranchList = Array.isArray(resp.data) ? resp.data : resp.data;

          if (callback) {
            callback(this.customerBranchList);
          }

          // Auto-select the branch if there's a pending selection
          if (this.pendingBranchToSelect) {
            const branchId = this.pendingBranchToSelect;
            this.pendingBranchToSelect = null;
            this.triggerCustomerBranchChange(branchId);
          }
        } else if (Array.isArray(resp)) {
          this.customerBranchList = resp;
          if (callback) callback(this.customerBranchList);
        } else if (resp?.data) {
          this.customerBranchList = resp.data;
          if (callback) callback(this.customerBranchList);
        } else {
          this.customerBranchList = [];
          if (callback) callback([]);
        }
      },
      error: (err) => {
        console.error('Error fetching customer branches', err);
        this.customerBranchList = [];
        if (callback) callback([]);
      }
    });
  }
  private triggerCustomerBranchChange(customerBranchSid: number) {
    const foundBranch = this.customerBranchList.find(b =>
      Number(b.CustomerBranchSid) === Number(customerBranchSid)
    );

    if (foundBranch) {
      // Set address from branch
      const address = foundBranch.Address || foundBranch.CustomerAddress1 || foundBranch.customerAddress || '';
      this.invoiceForm.get('PartyAddress')?.setValue(address);

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
      this.invoiceForm.get('PlaceOfSupply')?.setValue(placeOfSupply);

      // Set GST No based on country
      const customerMasterSid = foundBranch.CustomerMasterSid;
      if (customerMasterSid) {
        const customer = this.customerList.find(c => c.CustomerMasterSid === customerMasterSid);
        if (customer) {
          const countryCode = this.getCustomerCountryCode(customer);
          if (countryCode === 'IN') {
            this.invoiceForm.get('GSTNo')?.setValue(foundBranch.GSTNo || '');
          } else {
            this.invoiceForm.get('GSTNo')?.setValue(customer.PanType || '');
          }
        }
      }

      // Auto-determine GST Type based on Place of Supply
      this.determineGSTType(placeOfSupply);
    }
  }

  loadInvoiceById(id: number) {
    this.operationService.getInvoiceById(id).subscribe({
      next: (resp: any) => {
        this.spinner.hide();
        if (resp?.status && resp.data) {
          this.invoiceData = resp.data;
          this.invoiceData['MBLNo'] = resp.data?.MasterNumber;
          this.invoiceData['HBLNo'] = resp.data?.HouseNumber;
          console.log(this.invoiceData, "InvoiceData")
          this.patchValues(this.invoiceData);
        } else {
          this.appSettingService.showError('Error loading invoice');
          this.router.navigate(['operation/invoice/list']);
        }
      },
      error: (err) => {
        console.error(err);
        this.appSettingService.showError('Error loading invoice');
        console.error('error:', err);
      },
    });
  }
  formatDateForDisplay(date: string | Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
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
    console.log('populateForm called with data:', data);
    const header = data;
    const voucherTypeForControl = header?.VoucherType != null ? [String(header.VoucherType)] : null;
    const currency = this.currencyList.find(c => c.CurrencyMasterSid === data.CurrencyMasterSid)
    const customerMasterSidFromBranch = header?.customerBranch?.CustomerMasterSid
      || header?.CustomerBranch?.CustomerMasterSid
      || null;
    console.log(currency, 'currency')
    this.invoiceForm.patchValue({
      VoucherNumber: header.VoucherNumber,
      VoucherDate: this.toNgbDate(header.VoucherDate),
      CustomerMasterSid: header.CustomerMasterSid || customerMasterSidFromBranch || null,
      PartyMasterSid: header.PartyMasterSid || null,
      PartyName: header.PartyName || '',
      PartyAddress: header.PartyAddress || '',
      DocumentNumber: header.DocumentNumber || '',
      IRNNumber: header.IRNNumber || '',
      PlaceOfSupply: header.PlaceOfSupply || '',
      PostStatus: header.PostStatus || '',
      MasterJobSid: header.MasterJobSid || null,
      HBLNo: header.HouseJob || header.HBLNo || '',
      CurrencyCode: header.currencyMaster?.currencyCode || header.CurrencyCode || null,
      ExchangeRate: header.ExchangeRate || header.ExRate || 1,
      GST_VAT: header.GST_VAT || '',
      InvoiceType: header.InvoiceType || null,
      GSTType: header.GSTType || null,
      VoucherType: voucherTypeForControl,
      Narration: header.Narration || '',
      Remarks: header.Remarks || '',
      IRNStatus: header.IRNStatus || '',
      MBLNo: header.MBLNo || '',
      status: header.status || 'A'
    });
    console.log('DEBUG - header.PartyName:', header.PartyName);
    console.log('DEBUG - header.PartyAddress:', header.PartyAddress);
    console.log('DEBUG -header,CustomerBranchSid:', header.CustomerBranchSid);
    console.log('DEBUG -header.PlaceOfSupply:', header.PlaceOfSupply);
    console.log(this.invoiceData, 'invoiceData');
    const cm = header.CustomerMasterSid || customerMasterSidFromBranch || null;
    console.log('DEBUG - cm:', cm);
    const branchSid = header.CustomerBranchSid || header.PartyName || (header.customerBranch ? header.customerBranch.CustomerBranchSid : null) || null;


    this.pendingBranchToSelect = branchSid ? Number(branchSid) : null;
    this.getCustomerBranchByCustomer(cm);
    if (branchSid) {
      this.invoiceForm.get('CustomerBranchSid')?.setValue(Number(branchSid));
      this.pendingBranchToSelect = Number(branchSid);
      const currentCustomer = this.invoiceForm.get('CustomerMasterSid')?.value;
      if (currentCustomer) {
        this.getCustomerBranchByCustomer(Number(currentCustomer));
      } else {
        const found = this.customerBranchList.find((b: any) => Number(b.CustomerBranchSid) === Number(branchSid));
        if (found) {
          this.invoiceForm.get('PartyName')?.setValue(Number(branchSid));
          this.invoiceForm.get('PartyAddress')?.setValue(found.Address || found.CustomerAddress1 || '');
        }
      }
    }

    const detailsFromResp = data.voucherDetails
      || data.voucherDetail
      || data.VoucherDetail
      || data.VoucherDetails
      || [];

    this.filteredDetailItems = detailsFromResp.filter(dtl => dtl.IsAutoGenerated !== "Y");
    console.log("Filtered Detail Items",this.filteredDetailItems);

    this.details.clear();
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
        CurrencyCode: det.CurrencyCode || this.invoiceForm.get('CurrencyCode')?.value,
        Rate: det.Rate,
        ExchangeRate: det.ExchangeRate || this.invoiceForm.get('ExchangeRate')?.value,
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

    const vg = this.invoiceForm.get('voucherOthers') as FormGroup;
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
      ChargeMasterSid: [data?.ChargeMasterSid || null, Validators.required],
      ChargeDescription: [data?.ChargeDescription || ''],
      HSSACMasterSid: [data?.HSSACMasterSid || null],
      ChargeUOMSid: [data?.ChargeUOMSid || null],
      NumberOfUnit: [data?.NumberOfUnit || 1, [Validators.required, Validators.min(0)]],
      DrCr: [data?.DrCr || 'C', Validators.required],
      CurrencyCode: [data?.CurrencyCode || this.invoiceForm.get('CurrencyCode')?.value || null],
      Rate: [data?.Rate || 0, [Validators.required, Validators.min(0)]],
      ExchangeRate: [data?.ExchangeRate || this.invoiceForm.get('ExchangeRate')?.value || 1],
      Amount: [data?.Amount || 0],
      TaxableAmount: [data?.TaxableAmount || 0],
      TaxPercentage1: [data?.TaxPercentage1 || 0],
      TaxAmount1: [data?.TaxAmount1 || 0],
      TaxPercentage2: [data?.TaxPercentage2 || 0],
      TaxAmount2: [data?.TaxAmount2 || 0],
      TaxPercentageIGST: [data?.TaxPercentageIGST || 0],
      TaxAmountIGST: [data?.TaxAmountIGST || 0],
      LocalAmount: [data?.LocalAmount || 0],
      PartyAmount: [data?.PartyAmount || 0],
      MasterJobSid: [data?.MasterJobSid || null],
      HouseJobSid: [data?.HouseJobSid || null],
      DepartmentMasterSid: [data?.DepartmentMasterSid || null],
      LedgerMasterSid: [data?.LedgerMasterSid || null],
      COAMasterSid: [data?.COAMasterSid || null]
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
  recalcRow(index: number) {
    const row = this.details.at(index);
    if (!row) return;

    const unit = Number(row.get('NumberOfUnit')?.value || 0);
    const rate = Number(row.get('Rate')?.value || 0);
    const exRate = Number(row.get('ExchangeRate')?.value || this.invoiceForm.get('ExchangeRate')?.value || 1);

    // Calculate basic amounts
    const amount = unit * rate;
    const taxableAmount = amount * exRate;
    const localAmount = amount * exRate;

    // Get GST Type and determine tax applicability
    const gstType = this.invoiceForm.get('GSTType')?.value;
    const placeOfSupply = this.invoiceForm.get('PlaceOfSupply')?.value;
    const companyState = this.getCompanyState();
    const customerGSTNo = this.invoiceForm.get('GST_VAT')?.value; // Changed from GSTNo to GST_VAT

    let taxPerc1 = 0, taxAmt1 = 0, taxPerc2 = 0, taxAmt2 = 0, igstPerc = 0, igstAmt = 0;

    console.log('=== TAX CALCULATION DEBUG ===');
    console.log('GST Type:', gstType);
    console.log('Place of Supply:', placeOfSupply);
    console.log('Company State:', companyState);
    console.log('Customer GST No (GST_VAT):', customerGSTNo); // Updated log

    if (this.isIndiaGST && customerGSTNo) { // Now checking GST_VAT field
      // Get HSN/SAC tax rate
      const hssacSid = row.get('HSSACMasterSid')?.value;
      const hssac = this.hssacList.find(h => h.HSSACMasterSid === hssacSid);
      const taxRate = hssac?.TaxRate || 18;

      // Determine tax type based on GST Type
      switch (gstType) {
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

    // Update row values
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
    const placeOfSupply = this.invoiceForm.get('PlaceOfSupply')?.value;
    this.determineGSTType(placeOfSupply);
    this.recalculateAllRows();
  }
  updateBillAmount() {
    const totalLocalAmount = this.calculateTotalLocalAmount();
    this.invoiceForm.get('BillAmt')?.setValue(this.round(totalLocalAmount));
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
        exRateCtrl.setValue(this.invoiceForm.get('ExchangeRate')?.value || 1);
      }
      const currCtrl = this.details.at(i).get('CurrencyCode');
      if (currCtrl && !currCtrl.value) {
        currCtrl.setValue(this.invoiceForm.get('CurrencyCode')?.value || null);
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
    if (!CurrencyCode || !this.currencyList) {
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
      this.invoiceForm.get('MBLNo')?.setValue('');
      this.invoiceForm.get('HBLNo')?.setValue('');
      return;
    }
    const masterJob = typeof selected === 'object' ? selected : this.masterJobList.find(m => m.MasterJobSid === selected);
    if (masterJob) {
      if (masterJob.MBLNo !== undefined) this.invoiceForm.get('MBLNo')?.setValue(masterJob.MBLNo || '');
      if (masterJob.HBLNo !== undefined) this.invoiceForm.get('HBLNo')?.setValue(masterJob.HBLNo || masterJob.HouseJob || '');
      this.invoiceForm.get('MasterJobSid')?.setValue(Number(masterJob.MasterJobSid));
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

  onFinalSave() {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill required invoice fields.');
      return;
    }

    if (this.details.length === 0) {
      this.appSettingService.showWarning('Please add at least one charge line.');
      return;
    }

    this.recalculateAllRows();

    // First save the invoice, then post it
    this.saveInvoice(true); // true indicates final save
  }

  // Draft Save
  onDraftSave() {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill required invoice fields.');
      return;
    }

    this.recalculateAllRows();
    this.saveInvoice(false); // false indicates draft save
  }

  async onSave() {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill required invoice fields.');
      return;
    }
    this.recalculateAllRows();

    const raw = this.invoiceForm.getRawValue();

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

    const rawPartyControl = this.invoiceForm.get('PartyMasterSid')?.value;
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
        PlaceOfSupply: d.PlaceOfSupply || '',
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

    console.debug('DEBUG - payload PartyMasterSid (will send):', payload.PartyMasterSid);
    console.debug('DEBUG - full payload', payload);

    if (this.headerId) {
      payload.UpdatedBy = updatedByValue;
      this.operationService.updateInvoiceById(this.headerId, payload).subscribe({
        next: (resp: any) => {
          if (resp?.status) {
            this.appSettingService.showSuccess('Invoice updated successfully.');
            const id = resp.data?.newVoucher?.VoucherHeaderSid || resp.data?.VoucherHeaderSid || resp.data?.voucherHeaderSid || null;
            this.router.navigate(['operation/invoice/entry', id]);
          } else {
            this.appSettingService.showError('Error updating invoice.');
            console.error('updateInvoice resp', resp);
          }
        },
        error: (err) => {
          console.error('updateInvoice error', err);
          this.appSettingService.showError('Failed to update invoice.');
        }
      });
    } else {
      payload.CreatedBy = createdByValue;
      this.operationService.createInvoice(payload).subscribe({
        next: (resp: any) => {
          if (resp?.status) {
            this.appSettingService.showSuccess('Invoice created successfully.');
            const id = resp.data?.newVoucher?.VoucherHeaderSid || resp.data?.VoucherHeaderSid || resp.data?.voucherHeaderSid || null;
            if (id) this.router.navigate(['operation/invoice/entry', id]);
            else this.router.navigate(['operation/invoice/list']);
          } else {
            this.appSettingService.showError('Error creating invoice.');
            console.error('createInvoice resp', resp);
          }
        },
        error: (err) => {
          console.error('createInvoice error', err);
          this.appSettingService.showError('Failed to create invoice.');
        }
      });
    }
  }
  private saveInvoice(isFinal: boolean) {
    const raw = this.invoiceForm.getRawValue();

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

    const rawPartyControl = this.invoiceForm.get('PartyMasterSid')?.value;
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
      ? this.operationService.updateInvoiceById(this.headerId, payload)
      : this.operationService.createInvoice(payload);

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
            const message = isFinal ? 'Invoice saved and posted successfully!' : 'Invoice saved as draft successfully!';
            this.appSettingService.showSuccess(message);

            if (!this.headerId && voucherHeaderSid) {
              this.headerId = voucherHeaderSid;
              this.router.navigate(['operation/invoice/entry', voucherHeaderSid]);
            }
          }
        } else {
          this.spinner.hide();
          this.appSettingService.showError('Error saving invoice.');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Save invoice error', err);
        this.appSettingService.showError('Failed to save invoice.');
      }
    });
  }

  private async postVoucher(voucherHeaderSid: number) {
    try {
      const currentCompany = this.currentCompany;
      const currentBranch = this.currentBranch;
      const currentFinancialYear = Number(localStorage.getItem('current-year-id'));
      const currentCountry = Number(this.currentCompany?.CountryMasterSid);
      const currentCountryName = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
      const currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
      const currentUserEmail = this.userData?.userEmail;



      if (!currentCompany || !currentBranch || !currentFinancialYear || !currentCountry || !currentCurrency) {
        throw new Error('Company, branch, or financial year or country information is missing');

      }

      const postPayload = {
        VoucherHeaderSid: voucherHeaderSid,
        CompanyMasterSid: currentCompany.CompanyMasterSid,
        BranchMasterSid: currentBranch.BranchMasterSid,
        YearMasterSid: currentFinancialYear,
        LocalCurrencyMasterSid: currentCurrency,
        LocalCurrencyCode: currentCompany.CurrencyCode,
        PostedBy: currentUserEmail,
        TaxDetails: {
          CountryMasterSid: currentCountry,
          countryName: currentCountryName,
          TaxCategory: 'Inter',
          EffectiveFrom: new Date().toISOString(),
          TaxType: 'Output'
        }
      };

      const result = await firstValueFrom(this.operationService.postVoucherByVoucherSid(postPayload));

      this.spinner.hide();
      if (result.status) {
        this.appSettingService.showSuccess('Invoice posted successfully!');
        this.invoiceData.PostStatus = 'P'; // Update local state

        // Navigate to list or stay on page but disable edits
        this.router.navigate(['operation/invoice/list']);
      } else {
        this.appSettingService.showError(result.message || 'Failed to post invoice.');
      }
    } catch (error) {
      this.spinner.hide();
      console.error('Post voucher error:', error);
      this.appSettingService.showError('Failed to post invoice. Please try again.');
    }
  }


  get isPosted(): boolean {
    return this.invoiceData?.PostStatus === 'P';
  }

  // Check if voucher is draft
  get isDraft(): boolean {
    return !this.invoiceData?.PostStatus || this.invoiceData?.PostStatus === 'U';
  }
  onReset() {
    this.invoiceForm.reset({ status: 'A', ExchangeRate: 1 });
  }

  goBack() {
    this.router.navigate(['operation/invoice/list']);
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
      this.appSettingService.showWarning('Please save the invoice first.');
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
      const voucherNumber = this.invoiceForm.get('VoucherNumber')?.value || 'Invoice';
      const filename = `Invoice_${voucherNumber}.pdf`;

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

  openEmailModal() {
    this.initializeEmailForm();
    this.modalService.open(this.emailModalRef, { size: 'lg' });
  }

  initializeEmailForm() {
    const customerBranchSid = this.invoiceForm.get('PartyName')?.value;
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
      subject: [`Invoice ${this.invoiceForm.get('VoucherNumber')?.value}`, Validators.required],
      message: ['Please find attached invoice for your reference.\n\nThank you for your business.']
    });
  }

  async sendInvoiceEmail() {
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
        const voucherNumber = this.invoiceForm.get('VoucherNumber')?.value || 'Invoice';
        const filename = `Invoice_${voucherNumber}.pdf`;

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
          invoiceDetails: {
            companyName: this.currentCompany?.CompanyName || 'Company Name',
            invoiceNumber: voucherNumber,
            invoiceDate: this.formatDate(this.invoiceForm.get('VoucherDate')?.value),
            totalAmount: this.getGrandTotal().toFixed(2),
            currency: this.invoiceForm.get('CurrencyCode')?.value || ''
          }
        };

        // Call API to send email
        this.operationService.sendInvoiceEmail(payload).subscribe({
          next: (resp: any) => {
            this.spinner.hide();
            if (resp?.status) {
              this.appSettingService.showSuccess('Invoice email sent successfully!');
              this.modalService.dismissAll();
            } else {
              this.appSettingService.showError(resp?.message || 'Failed to send email.');
            }
          },
          error: (err) => {
            this.spinner.hide();
            console.error('Error sending email:', err);
            this.appSettingService.showError('Failed to send invoice email. Please try again.');
          }
        });
      };

      reader.onerror = () => {
        this.spinner.hide();
        this.appSettingService.showError('Failed to process PDF. Please try again.');
      };
    } catch (error) {
      this.spinner.hide();
      console.error('Error in sendInvoiceEmail:', error);
      this.appSettingService.showError('An error occurred while sending email.');
    }
  }

  getCustomerBranchName(): string {
    const branchSid = this.invoiceForm.get('PartyName')?.value;
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
    const total = this.getGrandRowTotal();
    const currency = this.invoiceForm.get('CurrencyCode')?.value || '';

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
  getGrandTotal(): number {
    return this.round(this.getTotalCurrencyAmount() + this.getTotalTaxAmount());
  }
  getCustomerName(CustomerMasterSid: number) {
    if (!CustomerMasterSid || this.customerList.length === 0) {
      return 'N/A'
    }
    return (this.customerList.find(cus => cus.CustomerMasterSid === CustomerMasterSid)?.CustomerName);
  }

  getBankDetails() {
    console.log('DEBUG - getBankDetails');
    const currCode = this.invoiceForm.get('CurrencyCode')?.value;
    const currentBranchId = this.currentBranch?.BranchMasterSid;
    const currency = this.currencyList.find(c => c.currencyCode === currCode)?.CurrencyMasterSid;
    console.log('DEBUG - getBankDetails - branch:', currentBranchId);
    console.log('DEBUG - getBankDetails - currencyCode:', currCode);
    console.log('DEBUG - getBankDetails - currency:', currency);
    console.log('DEBUG - getBankDetails - currencyid:', currency);
    if (!currency || !currentBranchId) {
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


  getSalesmanName(sid: number): string {
    const salesman = this.salesmanList.find(x => x.UserMasterSid === sid);
    return salesman ? salesman.userName : '';
  }

  getRowTotal(detail: any): number {
  const taxable = Number(detail.TaxableAmount || 0);
  const cgst = Number(detail.TaxAmount1 || 0);
  const sgst = Number(detail.TaxAmount2 || 0);
  const igst = Number(detail.TaxAmountIGST || 0);

  return taxable + cgst + sgst + igst;
}

getGrandRowTotal(): number {
  return this.filteredDetailItems.reduce((sum, detail) => {
    return sum + this.getRowTotal(detail);
  }, 0);
}
getInvoiceTitle(): string {
  const postStatus = this.invoiceData?.PostStatus || 'U';
  return postStatus === 'P' ? 'TAX INVOICE' : 'PROFORMA INVOICE';
}

getDisplayValue(cargoValue: any, bookingValue: any): string {
  return cargoValue || bookingValue || '';
}


}
