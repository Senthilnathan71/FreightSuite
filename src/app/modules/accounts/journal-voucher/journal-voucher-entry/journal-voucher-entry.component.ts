import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbDateStruct, NgbDatepickerModule, NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { forkJoin, firstValueFrom } from 'rxjs';
import { JournalVoucherService } from '../journal-voucher.service';
import { AccountsService } from '../../accounts.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { CommonService } from 'src/app/common/common.service';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { toNumber } from 'src/app/common/helper';

interface NgbDateStructLike { day: number; month: number; year: number; }

@Component({
  selector: 'app-journal-voucher-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    FeatherModule,
    NgSelectModule,
    NgbDropdownModule,
    DecimalPrecisionDirective
  ],
  templateUrl: './journal-voucher-entry.component.html',
  styles: [``],
})
export class JournalVoucherEntryComponent implements OnInit {
  form!: FormGroup;
  editMode = false;
  voucherHeaderSid: number | null = null;
  isPosted = false;
  todayDateInNgbStruct!: NgbDateStruct;
  isSaving = false;
  currentMenuId: number;
  TandCList: any[]=[];
  currentClauseId: any;
  // Add with other properties
defaultCurrencyId: number | null = null;
defaultCurrencyCode: string = '';
  // Add these properties from vendor invoice component
  currentCompany: any;
  filteredChargeList: any[][] = [];
  currentBranch: any;
  currentFinancialYear: number;
  currentCountry: number;
  currentCurrency: number;
  currentUserCurrency: string;
  currentUserCountry: string;
  currentUserState: string;
  userData: any;
  currUserEmail: string | null = null;
  MenuMasterSid: any;
  // Master Data Lists
  coaList: any[] = [];
  subledgerList: any[] = [];
  currencyList: any[] = [];
  departmentList: any[] = [];
  chargeList: any[] = [];
  masterJobList: any[][] = [];
  houseJobList: any[][] = [];
  costCenterList: any[] = [];
  profitCenterList: any[] = [];
  voucherData: any;
  hssacList: any[][] = [];
  uomList: any[] = [];
  companyCurrency: any;
  currentCurrencyCode: string = '';
  HSSACLookupConfig = {
  displayFields: ['HSSACCode', 'HSSACName'],
  displayLabels: ['Code', 'Name'],
  labelFields: ['HSSACCode'],
};

  statusList = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];

  drCrList = [
    { id: 'D', name: 'D' },
    { id: 'C', name: 'C' },
  ];

  // REMOVE THESE PROPERTIES - We'll use getters instead
  // debitTotal = 0;
  // creditTotal = 0;
  // difference = 0;
  
  private showWarningFlags: boolean[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private journalVoucherService: JournalVoucherService,
    private accountsService: AccountsService,
    private maasterService: MasterService,
    private dropdownStore: DropdownStore,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
    public mps: MenuPermissionService,
    private modalService : NgbModal,
    private commonService: CommonService,
    private masterService: MasterService,
    private companySettings: CompanySettingsManagerService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
     this.companyCurrency = this.companySettings.getCurrencySettings();
    this.currentCurrencyCode = this.companyCurrency.code;
    console.log('Company Currency:', this.currentCurrencyCode); 
    console.log('Company Currency:', this.companyCurrency);
    this.loadUserAndCompanyData();
    this.mps.init().subscribe();
    this.initializeForm();
    this.setTodayDate();
    this.loadMasterData();
    this.checkEditMode();
    this.subledgerTypes = [];
  }

   // ========== ADD THESE GETTERS ==========
  
  // Real-time debit total calculation
  get debitTotal(): number {
    if (!this.details || this.details.length === 0) {
      return 0;
    }
    
    return this.details.controls.reduce((total, control) => {
      if(control.get('IsAutoGenerated')?.value === 'Y'){
        return total;
      }
      if (control.get('drCr')?.value === 'D') {
        const localAmount = toNumber(control.get('localAmount')?.value).toFixed(2);
        const taxAmount = toNumber(control.get('taxAmount')?.value).toFixed(2);
        return total + toNumber(localAmount) + toNumber(taxAmount);
      }
      return total;
    }, 0);
  }

  // Real-time credit total calculation
  get creditTotal(): number {
    if (!this.details || this.details.length === 0) {
      return 0;
    }
    
    return this.details.controls.reduce((total, control) => {
      if(control.get('IsAutoGenerated')?.value === 'Y'){
        return total;
      }
      if (control.get('drCr')?.value === 'C') {
        const localAmount = toNumber(control.get('localAmount')?.value).toFixed(2);
        const taxAmount = toNumber(control.get('taxAmount')?.value).toFixed(2);
        return total + toNumber(localAmount) + toNumber(taxAmount);
      }
      return total;
    }, 0);
  }

  // Real-time difference calculation
  get difference(): number {
    return Math.abs(this.debitTotal - this.creditTotal);
  }

  // Optional: Get formatted totals for display
  get formattedDebitTotal() {
    return this.debitTotal

  }
 
  get formattedCreditTotal() {
    return this.creditTotal;
  }

  get formattedDifference() {
    return this.difference
  }
  // ========== END OF GETTERS ==========

  loadUserAndCompanyData(): void {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    try {
      this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
      this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
      this.MenuMasterSid =  localStorage.getItem('currentMenuId');
      this.currentFinancialYear = Number(localStorage.getItem('current-year-id'));
      this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
      this.currentUserCountry = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
      this.currentCountry = Number(this.currentCompany?.CountryMasterSid);
      this.currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
      this.currentUserCurrency = String(this.currentCompany?.currencyMaster?.currencyName).trim().toLowerCase();
      this.currentUserState = String(this.currentBranch?.stateMaster?.stateName).trim().toLowerCase();
      this.companyCurrency = this.companySettings.getCurrencySettings();
      this.currentCurrencyCode = this.companyCurrency.code;
      console.log('=== JOURNAL VOUCHER COMPANY DATA ===');
      console.log('Current Company:', this.currentCompany);
      console.log('Current Branch:', this.currentBranch);
      console.log('Company State:', this.currentUserState);
      console.log('Company Currency:', this.currentUserCurrency);
      console.log('Current Country:', this.currentCountry);
      console.log('Current Currency:', this.currentCurrency);
      console.log('Current Financial Year:', this.currentFinancialYear);

    } catch (e) {
      console.error('Error loading company data:', e);
      this.currentCompany = null;
      this.currentBranch = null;
    }

    // Get user email
    try {
      const decryptedProfileRaw = localStorage.getItem('user-profile');
      const decryptedProfile = decryptedProfileRaw ? this.appSettingService.decrypt(decryptedProfileRaw) : null;
      this.currUserEmail = decryptedProfile?.email || localStorage.getItem('user-email') || null;
    } catch (err) {
      this.currUserEmail = localStorage.getItem('user-email') || null;
    }
  }

  initializeForm(): void {
    this.form = this.fb.group({
      voucherNumber: [{ value: '', disabled: true }],
      voucherDate: [null, Validators.required],
      narration: ['', [Validators.required,Validators.maxLength(200)]],
      remarks: ['', Validators.maxLength(200)],
      Status: ['A', Validators.required],
      PostedOn: [{ value: null, disabled: true }],
      postStatus: [{ value: 'Unposted', disabled: true }],
      details: this.fb.array([]),
    });
      if (!this.editMode) {
    this.initializeDefaultCurrency();
  }

  }

  initializeDefaultCurrency(): void {
  // Get company currency ID (from user company data or company settings)
  const companyCurrencyId = this.currentCompany?.CurrencyMasterSid || this.companyCurrency?.currencyMasterSid;
  
  if (companyCurrencyId) {
    console.log('Initializing default currency with ID:', companyCurrencyId);
    
    // This will be applied when currency list is loaded
    this.defaultCurrencyId = companyCurrencyId;
    this.defaultCurrencyCode = this.currentCurrencyCode;
  }
}

  setTodayDate(): void {
    const today = new Date();
    this.todayDateInNgbStruct = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    };
    this.form.patchValue({ voucherDate: this.todayDateInNgbStruct });
  }

  loadMasterData(): void {
  this.spinner.show();
  
  forkJoin({
    currencies: this.dropdownStore.loadCurrencies(),
    departments: this.dropdownStore.loadDepartments({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid
    }),
    costCenters: this.accountsService.getAllCostCenters(),
    profitCenters: this.accountsService.getAllProfitCenters(),
    uom: this.operationService.getAllUom(),
    coa: this.accountsService.getAllCoaWithLedgerCategory({
      LedgerCategory: 'Ledger',
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid
    }),
    subledger: this.maasterService.getAllSuledgermaster(),
    charges: this.accountsService.getAllCharges(this.currentCompany?.CompanyMasterSid)
  }).subscribe({
    next: (result) => {
      this.currencyList = result.currencies;
      this.departmentList = result.departments;
      this.costCenterList = result.costCenters.data;
      this.profitCenterList = result.profitCenters.data;
      this.uomList = result.uom?.data || [];
      this.coaList = result.coa?.data || [];
      this.subledgerList = result.subledger?.data || [];
      this.chargeList = result.charges || [];

            console.log('Currency List loaded:', this.currencyList);
      
      // Find the company currency in the loaded list
      const companyCurrency = this.currencyList.find(
        currency => currency.CurrencyMasterSid === this.currentCurrency
      );
      
      if (companyCurrency) {
        console.log('Found company currency in list:', companyCurrency);
        this.companyCurrency = companyCurrency;
        this.currentCurrencyCode = companyCurrency.currencyCode;
      }
      
      // Apply default currency to all detail lines (for new entries only)
      if (!this.editMode) {
        this.patchDefaultCurrencyToAllDetails();
      }
      
      // After all data is loaded, load voucher if in edit mode
      if (this.editMode && this.voucherHeaderSid) {
        this.loadVoucherForEdit(this.voucherHeaderSid);
      } else {
        this.spinner.hide();
      }
    },
    error: (err) => {
      this.spinner.hide();
      console.error('Error loading master data:', err);
      this.appSettingService.showError('Failed to load master data', 'Error');
    },
  });
}

patchDefaultCurrencyToAllDetails(): void {
  // Only patch for new entries (not edit mode)
  if (this.editMode || !this.companyCurrency || !this.currencyList.length) return;
  
  console.log('Patching default currency to all detail lines:', {
    currencyId: this.companyCurrency.CurrencyMasterSid,
    currencyCode: this.companyCurrency.currencyCode
  });
  
  // Patch currency to all existing detail lines
  this.details.controls.forEach((control, index) => {
    const detailGroup = control as FormGroup;
    const currentCurrencyId = detailGroup.get('currencyMasterSid')?.value;
    
    // Only patch if no currency is selected
    if (!currentCurrencyId) {
      console.log(`Patching currency to detail line ${index}`);
      
      detailGroup.patchValue({
        currencyMasterSid: this.companyCurrency.CurrencyMasterSid,
        currencyCode: this.companyCurrency.currencyCode
      }, { emitEvent: false });
      
      // Fetch exchange rate for the company currency
      this.fetchExchangeRate(detailGroup, this.companyCurrency.CurrencyMasterSid);
    }
  });
}

  loadCOAList(): void {
    this.accountsService.getAllCoaWithLedgerCategory({
      LedgerCategory: 'Ledger',
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid
    }).subscribe({
      next: (response: any) => {
        this.coaList = response.data || [];
      },
      error: (err) => {
        console.error('Error loading COA list:', err);
      },
    });
  }

  loadSubledgerList(): void {
    this.maasterService.getAllSuledgermaster().subscribe({
      next: (response: any) => {
        this.subledgerList = response.data || [];
      },
      error: (err) => {
        console.error('Error loading subledger list:', err);
      },
    });
  }

  loadChargeList(): void {
    this.accountsService.getAllCharges(this.currentCompany?.CompanyMasterSid).subscribe({
      next: (charges) => {
        this.chargeList = charges;
      },
      error: (err) => {
        console.error('Error loading charge list:', err);
      },
    });
  }

checkEditMode(): void {
  this.route.params.subscribe((params) => {
    if (params['id']) {
      this.editMode = true;
      this.voucherHeaderSid = +params['id'];
      this.initializeForm();
      this.form.get('Status')?.enable(); // Enable for edit mode
    } else {
      this.editMode = false;
      this.initializeForm();
      this.form.get('Status')?.disable(); // Disable for create mode
      this.addDetailLine();
    }
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

 loadVoucherForEdit(id: number): void {
  this.journalVoucherService.getJournalVoucherById(id).subscribe({
    next: (response) => {
      const voucher = response.data;
      this.voucherData = voucher;
      if (!voucher) {
        this.appSettingService.showError('Voucher not found', 'Error');
        this.router.navigate(['/accounts/journal-voucher/list']);
        return;
      }

      this.isPosted = voucher.PostStatus === 'P';

      const voucherDate = new Date(voucher.VoucherDate);
      const voucherDateStruct: NgbDateStruct = {
        year: voucherDate.getFullYear(),
        month: voucherDate.getMonth() + 1,
        day: voucherDate.getDate(),
      };

      // Create form patch object
      const formPatchData: any = {
        voucherNumber: voucher.VoucherNumber,
        voucherDate: voucherDateStruct,
        narration: voucher.Narration,
        remarks: voucher.Remarks,
        Status: voucher.Status,
        postStatus: voucher.PostStatus === 'P' ? 'Posted' : 'Unposted',
      };

      // Only patch PostedOn if the voucher is actually posted
      if (voucher.PostStatus === 'P' && voucher.PostDate) {
        formPatchData.PostedOn = this.formatDateForDisplay(voucher.PostDate);
      }

      this.form.patchValue(formPatchData);

      // IMPORTANT: Don't disable the entire form for posted vouchers
      // Instead, we'll handle field disabling at the individual control level
      if (this.isPosted) {
        // Disable the main form controls but keep subledger selection visible
        this.form.get('voucherDate')?.disable();
        this.form.get('narration')?.disable();
        this.form.get('remarks')?.disable();
        this.form.get('Status')?.disable();
      }

      this.details.clear();

      if (voucher.VoucherDetail && Array.isArray(voucher.VoucherDetail)) {
        this.subledgerTypes = new Array(voucher.VoucherDetail.length).fill('');
        
        // Load all details
        const detailPromises = voucher.VoucherDetail.map(async (detail: any, index: number) => {
          const detailGroup = this.createDetailGroup();
          
          const isAutoGenerated = detail.IsAutoGenerated === 'Y';
          const isPosted = voucher.PostStatus === 'P';
          
          // FOR POSTED VOUCHERS: Initially disable all fields
          if (isPosted) {
            detailGroup.disable({ emitEvent: false });
          }
          
          // Patch basic values first
          detailGroup.patchValue({
            VoucherDetailSid: detail.VoucherDetailSid,
            coaMasterSid: detail.COAMasterSid,
            ledgerMasterSid: detail.LedgerMasterSid,
            currencyMasterSid: detail.CurrencyMasterSid,
            currencyCode: detail.CurrencyCode,
            exchangeRate: parseFloat(detail.ExchangeRate) || 1,
            currencyAmount: parseFloat(detail.Amount) || 0,
            localAmount: parseFloat(detail.LocalAmount) || 0,
            drCr: detail.DrCr,
            narration: detail.Narration,
            departmentMasterSid: detail.DepartmentMasterSid,
            chargeMasterSid: detail.ChargeMasterSid,
            chargeDescription: detail.ChargeDescription || '',
            HSSACCode: detail.hSSACMaster?.HSSACCode || detail.HSSACCode || '',
            hssacMasterSid: detail.HSSACMasterSid || null,
            masterJobSid: detail.MasterJobSid,
            IsAutoGenerated: detail.IsAutoGenerated || 'N',
            houseJobSid: detail.HouseJobSid,
            taxPercentage: parseFloat(detail.TaxPercentage1) || 0,
            taxAmount: parseFloat(detail.TaxAmount1) || 0,
            costCenterMasterSid: detail.CostCenter,
            profitCenterMasterSid: detail.ProfitCenter,
          });

          // For auto-generated rows in posted vouchers
          if (isAutoGenerated) {
            detailGroup.patchValue({
              filteredSubledgers: [detail.subledgerMaster]
            }, { emitEvent: false });
          }
          
          this.details.push(detailGroup);
          
          const rowIndex = this.details.length - 1;
          
          // Handle auto-generated rows
          if (isAutoGenerated) {
            this.subledgerTypes[rowIndex] = detail.subledgerMaster?.SubledgerType || 'Tax';
            this.filteredChargeList[rowIndex] = [];
            this.masterJobList[rowIndex] = [];
            this.houseJobList[rowIndex] = [];
            this.hssacList[rowIndex] = [];
            
            this.setupDetailCalculations(detailGroup);
            this.disableChargeFieldsForRow(detailGroup);
            
            // For posted vouchers, keep disabled
            if (isPosted) {
              detailGroup.disable({ emitEvent: false });
            } else {
              detailGroup.get('coaMasterSid')?.disable();
              detailGroup.get('ledgerMasterSid')?.disable();
            }
            
            return detailGroup;
          }
          
          // NORMAL ROWS HANDLING
          this.setupDetailCalculations(detailGroup);
          
          const dept = this.departmentList.find(dep => dep.DepartmentMasterSid === detail.DepartmentMasterSid);
          
          // Set department first
          if (dept) {
            this.filterDetailsWithDept(dept, rowIndex);
          }

          // Handle charge and HSSAC
          if (detail.ChargeMasterSid) {
            await this.handleChargeForEdit(detailGroup, detail);
          }

          // Handle jobs
          if (detail.MasterJobSid) {
            await this.handleJobsForEdit(detailGroup, detail, rowIndex);
          }

          if (detail.COAMasterSid && this.currentCompany?.CompanyMasterSid) {
            const payload = {
              CompanyMasterSid: this.currentCompany.CompanyMasterSid,
              COAMasterSid: detail.COAMasterSid
            };
            
            try {
              const subledgerResp = await firstValueFrom(
                this.operationService.getSubledgerMasterById(payload)
              );
              
              if (subledgerResp && subledgerResp.data) {
                this.subledgerTypes[rowIndex] = subledgerResp.data.SubledgerType || '';
                this.updateChargeFieldStates(rowIndex);
              }
            } catch (err) {
              console.error('Error fetching subledger type for edit:', err);
            }
          }
          
          await this.handleSubledgerForEdit(detailGroup, detail, rowIndex);
          
          // FOR POSTED VOUCHERS: Re-enable only for viewing (not editing)
          if (isPosted) {
            // Enable form controls but make them readonly for display
            detailGroup.enable({ emitEvent: false });
            // Keep them disabled for editing
            Object.keys(detailGroup.controls).forEach(key => {
              detailGroup.get(key)?.disable({ emitEvent: false });
            });
          }
          
          return detailGroup;
        });

        Promise.all(detailPromises).then(() => {
          console.log('Form details after loading:', this.details.value);
          console.log('subledgerTypes array:', this.subledgerTypes);
          
          // Call refreshSubledgerFiltersForRow for each row to ensure proper filtering
          this.details.controls.forEach((control, index) => {
            this.refreshSubledgerFiltersForRow(index);
          });
          
          this.spinner.hide();
        });
      } else {
        this.spinner.hide();
      }
    },
    error: (err) => {
      console.error('Error loading voucher:', err);
      this.appSettingService.showError('Failed to load voucher details', 'Error');
      this.router.navigate(['/accounts/journal-voucher/list']);
      this.spinner.hide();
    },
  });
}

async handleChargeForEdit(detailGroup: FormGroup, detail: any): Promise<void> {
  const chargeId = detail.ChargeMasterSid;
  const rowIndex = this.getRowIndex(detailGroup);
  
  // First, update the filtered charge list for this department
  if (detail.DepartmentMasterSid) {
    const dept = this.departmentList.find(d => d.DepartmentMasterSid === detail.DepartmentMasterSid);
    if (dept) {
      this.filterChargeByDeptForARow(dept, rowIndex);
    }
  }

  // Fetch HSSAC details for this charge
  if (chargeId) {
    try {
      const res = await firstValueFrom(this.operationService.getChargeTaxForChargeId(chargeId));
      if (res) {
        this.hssacList[rowIndex] = res.data || [];
        
        // Patch HSSAC data
        detailGroup.patchValue({
          hssacMasterSid: detail.HSSACMasterSid || null,
          hssacCode: detail.HSSACCode || ''
        });
      }
    } catch (err) {
      console.error('Error fetching HSSAC for edit:', err);
      detailGroup.patchValue({
        hssacMasterSid: detail.HSSACMasterSid || null,
        hssacCode: detail.HSSACCode || ''
      });
    }
  }
}

async handleJobsForEdit(detailGroup: FormGroup, detail: any, rowIndex: number): Promise<void> {
  // Load master jobs for this department
  if (detail.DepartmentMasterSid) {
    try {
      const masterJobsResp = await firstValueFrom(
        this.accountsService.getMasterJobByDepartment({
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          BranchMasterSid: this.currentBranch?.BranchMasterSid,
          DepartmentMasterSid: detail.DepartmentMasterSid
        })
      );
      
      this.masterJobList[rowIndex] = masterJobsResp || [];
      
      // Now load house jobs for this master job
      if (detail.MasterJobSid) {
        const houseJobsResp = await firstValueFrom(
          this.accountsService.getHouseJobByMasterJob({
            CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
            BranchMasterSid: this.currentBranch?.BranchMasterSid,
            MasterJobSid: detail.MasterJobSid
          })
        );
        
        this.houseJobList[rowIndex] = houseJobsResp || [];
      }
    } catch (err) {
      console.error('Error loading jobs for edit:', err);
      this.masterJobList[rowIndex] = [];
      this.houseJobList[rowIndex] = [];
    }
  }
}

  get details(): FormArray {
    return this.form.get('details') as FormArray;
  }

  filterDetailsWithDept(dept: any, detailIndex: number) {
    if (!dept) {
        const row = this.details.at(detailIndex) as FormGroup;
        row.patchValue({
            ChargeDescription: '',
            HSSACMasterSid: null,
            ChargeUOMSid: null,
            MasterJobSid: null,
            HouseJobSid: null,
            ledgerMasterSid: null,
            filteredSubledgers: [],
            chargeMasterSid: null, // Also clear charge since it's department-dependent
            chargeDescription: '',
            HSSACCode: '',
            taxPercentage: 0,
            taxAmount: 0
        });
        this.filteredChargeList[detailIndex] = [];
        this.masterJobList[detailIndex] = [];
        this.houseJobList[detailIndex] = [];
        return;
    }
    
    this.filterChargeByDeptForARow(dept, detailIndex);
    
    // IMPORTANT: Refresh subledger filters which will trigger auto-patching
    this.refreshSubledgerFiltersForRow(detailIndex);
    
    this.accountsService.getMasterJobByDepartment({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        DepartmentMasterSid: dept?.DepartmentMasterSid
    }).subscribe({
        next: (resp: any) => {
            this.masterJobList[detailIndex] = resp;
        },
        error: (err) => {
            console.error('Failed to load master jobs:', err);
        }
    });
}

  onMasterJobChange(detailIndex: number, masterJob: any) {
    if (!masterJob || !masterJob.MasterJobSid) {
      this.houseJobList[detailIndex] = [];
      return;
    }
    this.accountsService.getHouseJobByMasterJob({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MasterJobSid: masterJob?.MasterJobSid
    }).subscribe({
      next: (resp: any) => {
        this.houseJobList[detailIndex] = resp || [];
      },
      error: (err) => {
        console.error('Failed to load house jobs:', err);
        this.houseJobList[detailIndex] = [];
      }
    });
  }

  filterChargeByDeptForAllRow() {
    this.details.controls.forEach((group: FormGroup, index) => {
      const deptId = group.get('DepartmentMasterSid')?.value;
      const department = this.departmentList.find(dept => dept.DepartmentMasterSid === deptId);
      console.log("FILTER CHARGE BY DEPT FOR ALL ROW", {
        deptId: deptId,
        deptObj: department,
        deptList: this.departmentList
      });
      if (department) {
        this.filterChargeByDeptForARow(department, index);
      }
    })
  }

  filterChargeByDeptForARow(dept, rowIndex) {
    console.log(`Filtering Dept from row ${rowIndex}`, {
      department: dept,
      chargeList: this.chargeList
    });
        if (!this.filteredChargeList[rowIndex]) {
        this.filteredChargeList[rowIndex] = [];
    }
    const departmentName = dept.departmentName;
    this.filteredChargeList[rowIndex] = (this.chargeList || []).filter(charge => {
      const allDepartmentNames = charge.DepartmentMasterSid || [];
      return allDepartmentNames.includes(departmentName);
    })
  }

  createDetailGroup(): FormGroup {
      let defaultCurrencyId = null;
      let defaultCurrencyCode = '';
        if (!this.editMode && this.companyCurrency) {
    // For new entries, use company currency as default
    defaultCurrencyId = this.companyCurrency.CurrencyMasterSid;
    defaultCurrencyCode = this.companyCurrency.currencyCode;
  } else if (this.editMode) {
    // For edit mode, use whatever is already set or header currency
    defaultCurrencyId = this.companyCurrency?.CurrencyMasterSid || null;
    defaultCurrencyCode = this.companyCurrency?.currencyCode || '';
  }
    const detailGroup = this.fb.group({
      VoucherDetailSid: [null],
      coaMasterSid: [null, Validators.required],
      ledgerMasterSid: [{value:null}],
      currencyMasterSid: [defaultCurrencyId, Validators.required],
      currencyCode: [defaultCurrencyCode],
      exchangeRate: [{ value: 1, disabled: true }, Validators.required],
      currencyAmount: [0, [Validators.required, Validators.min(0.01)]],
      localAmount: [0, [Validators.required, Validators.min(0)]],
      drCr: ['D', Validators.required],
      narration: ['',[Validators.required, Validators.maxLength(200)]],
      departmentMasterSid: [null],
      chargeMasterSid: [null],
      chargeDescription: [''],
      hssacMasterSid: [null],
      HSSACCode: [''],
      masterJobSid: [null],
      houseJobSid: [null],
      taxPercentage: [0],
      taxAmount: [0],
      costCenterMasterSid: [null],
      profitCenterMasterSid: [null],
      filteredSubledgers: [[]],
      IsAutoGenerated: ['N'],
    });
    return detailGroup;

  }

  addDetailLine(): void {
    const detailGroup = this.createDetailGroup();
    this.setupDetailCalculations(detailGroup);
    this.details.push(detailGroup);
    
    // Initialize arrays for the new row
    const newIndex = this.details.length - 1;
    this.filteredChargeList[newIndex] = [];
    this.masterJobList[newIndex] = [];
    this.houseJobList[newIndex] = [];
    this.hssacList[newIndex] = [];
    this.subledgerTypes[newIndex] = '';
      const currencyId = detailGroup.get('currencyMasterSid')?.value;
  if (currencyId) {
    this.fetchExchangeRate(detailGroup, currencyId);
  }
}

hasChargeTypeRows(): boolean {
    // Check if any subledgerType is 'Charge'
    // Make sure subledgerTypes is initialized as an array
    if (!this.subledgerTypes || this.subledgerTypes.length === 0) {
        return false;
    }
    return this.subledgerTypes.some(type => type === 'Charge');
}

  setupDetailCalculations(detailGroup: FormGroup): void {
  // Simplified: Only update the local amount, tax will be recalculated automatically
  detailGroup.get('currencyAmount')?.valueChanges.subscribe(() => {
    this.calculateLocalAmount(detailGroup);
  });

  detailGroup.get('coaMasterSid')?.valueChanges.subscribe((coaMasterSid) => {
    console.log('COA value changed:', coaMasterSid, {
      isAutoGenerated: detailGroup.get('IsAutoGenerated')?.value
    });
    
    // Skip for auto-generated rows
    if (detailGroup.get('IsAutoGenerated')?.value !== 'Y') {
      this.onCoaChange(detailGroup, coaMasterSid);
    }
  });

  detailGroup.get('exchangeRate')?.valueChanges.subscribe(() => {
    this.calculateLocalAmount(detailGroup);
  });

  // REMOVED: drCr value change subscription - not needed with getters
  // detailGroup.get('drCr')?.valueChanges.subscribe(() => {
  //   this.calculateTotals();
  // });

  detailGroup.get('currencyMasterSid')?.valueChanges.subscribe((currencyId) => {
    if (currencyId) {
      this.fetchExchangeRate(detailGroup, currencyId);
    }
  });

  detailGroup.get('chargeMasterSid')?.valueChanges.subscribe((chargeId) => {
    console.log('Charge value changed:', chargeId);
    
    // Skip for auto-generated rows
    if (detailGroup.get('IsAutoGenerated')?.value !== 'Y') {
      if (chargeId) {
        this.onChargeChange(detailGroup, chargeId);
      } else {
        // Reset charge-related fields when charge is cleared
        detailGroup.patchValue({
          chargeDescription: '',
          HSSACCode: '',
          taxPercentage: 0,
          taxAmount: 0
        });
        // Refresh subledger filters
        this.refreshSubledgerFiltersForRow(this.getRowIndex(detailGroup));
      }
      if (this.subledgerTypes[this.getRowIndex(detailGroup)] === 'Charge') {
        this.refreshSubledgerFiltersForRow(this.getRowIndex(detailGroup));
      }
    }
  });

  detailGroup.get('departmentMasterSid')?.valueChanges.subscribe((deptId) => {
    console.log('Department value changed:', deptId);
    
    // Skip for auto-generated rows
    if (detailGroup.get('IsAutoGenerated')?.value !== 'Y') {
      // Get department object
      const dept = this.departmentList.find(d => d.DepartmentMasterSid === deptId);
      
      // Call filterDetailsWithDept which will handle all filtering
      this.filterDetailsWithDept(dept, this.getRowIndex(detailGroup));
      if (this.subledgerTypes[this.getRowIndex(detailGroup)] === 'Charge') {
        this.refreshSubledgerFiltersForRow(this.getRowIndex(detailGroup));
      }
    }
  });

  detailGroup.get('taxPercentage')?.valueChanges.subscribe(() => {
    this.calculateTaxAmount(detailGroup);
  });
}


  // NEW METHOD: Check if subledger matches the selected COA
  doesSubledgerMatchCOA(subledger: any, coaMasterSid: number): boolean {
  return this.doesSubledgerMatchCOAStrict(subledger, coaMasterSid);
}

getSubledgerFilterStatus(rowIndex: number): string {
  const row = this.details.at(rowIndex) as FormGroup;
  const deptId = row.get('departmentMasterSid')?.value;
  const chargeId = row.get('chargeMasterSid')?.value;
  const coaId = row.get('coaMasterSid')?.value;
  const filteredCount = row.get('filteredSubledgers')?.value?.length || 0;
  
  return `Dept: ${deptId || 'Any'}, Charge: ${chargeId || 'Any'}, COA: ${coaId || 'Any'}, Matches: ${filteredCount}`;
}
subledgerTypes: string[] = [];

showChargeSection(rowIndex: number): boolean {
    return this.subledgerTypes[rowIndex] === 'Charge';
}

onCoaChange(detailGroup: FormGroup, coaMasterSid: any): void {
    const coaId = coaMasterSid != null && coaMasterSid !== '' ? Number(coaMasterSid) : null;
    const rowIndex = this.getRowIndex(detailGroup);
    
    console.log(`COA changed to: ${coaId} for row ${rowIndex}`, {
        isAutoGenerated: detailGroup.get('IsAutoGenerated')?.value,
        currentLedgerMasterSid: detailGroup.get('ledgerMasterSid')?.value
    });
    
    // SKIP FOR AUTO-GENERATED ROWS - they already have their values set
    const isAutoGenerated = detailGroup.get('IsAutoGenerated')?.value === 'Y';
    if (isAutoGenerated) {
        console.log(`Skipping COA change logic for auto-generated row ${rowIndex}`);
        
        // Just set the subledger type from the existing data
        const voucherDetail = this.voucherData?.VoucherDetail?.[rowIndex];
        if (voucherDetail?.subledgerMaster?.SubledgerType) {
            this.subledgerTypes[rowIndex] = voucherDetail.subledgerMaster.SubledgerType;
        }
        
        // Make sure subledger field stays disabled
        detailGroup.get('ledgerMasterSid')?.disable();
        this.disableChargeFieldsForRow(detailGroup);
        return;
    }
    
    // Clear previous subledger type for non-auto-generated rows
    this.subledgerTypes[rowIndex] = '';
    
    // Fetch subledger details when COA changes
    if (coaId && this.currentCompany?.CompanyMasterSid) {
        const payload = {
            CompanyMasterSid: this.currentCompany.CompanyMasterSid,
            COAMasterSid: coaId
        };
        
        this.operationService.getSubledgerMasterById(payload).subscribe({
            next: (response: any) => {
                if (response && response.data) {
                    const subledger = response.data;
                    // Store the subledger type for this row
                    this.subledgerTypes[rowIndex] = subledger.SubledgerType || '';
                    
                    console.log(`Subledger type for row ${rowIndex}:`, this.subledgerTypes[rowIndex]);
                    this.updateChargeFieldStates(rowIndex);
                    // IMPORTANT: Don't disable or auto-patch here anymore
                    // Let refreshSubledgerFiltersForRow handle it based on all conditions
                    detailGroup.get('ledgerMasterSid')?.enable();
                    
                    // Refresh filters - this will handle auto-patching if conditions are met
                    this.refreshSubledgerFiltersForRow(rowIndex);
                } else {
                    // No subledger found
                    this.subledgerTypes[rowIndex] = '';
                    this.updateChargeFieldStates(rowIndex);
                    detailGroup.get('ledgerMasterSid')?.enable();
                    detailGroup.patchValue({
                        ledgerMasterSid: null
                    }, { emitEvent: false });
                    this.refreshSubledgerFiltersForRow(rowIndex);
                }
            },
            error: (err) => {
                console.error('Error fetching subledger:', err);
                this.subledgerTypes[rowIndex] = '';
                this.updateChargeFieldStates(rowIndex);
                detailGroup.get('ledgerMasterSid')?.enable();
                detailGroup.patchValue({
                    ledgerMasterSid: null
                }, { emitEvent: false });
                this.refreshSubledgerFiltersForRow(rowIndex);
            }
        });
    } else {
        this.subledgerTypes[rowIndex] = '';
        this.updateChargeFieldStates(rowIndex);
        detailGroup.get('ledgerMasterSid')?.enable();
        detailGroup.patchValue({
            ledgerMasterSid: null
        }, { emitEvent: false });
        this.refreshSubledgerFiltersForRow(rowIndex);
    }
}


  calculateTaxAmount(detailGroup: FormGroup): void {
  const localAmount = detailGroup.get('localAmount')?.value || 0;
  const taxPercentage = detailGroup.get('taxPercentage')?.value || 0;
  const taxAmount = (localAmount * taxPercentage) / 100;
  detailGroup.patchValue({ taxAmount }, { emitEvent: false });
}
 calculateLocalAmount(detailGroup: FormGroup): void {
  const currencyAmount = detailGroup.get('currencyAmount')?.value || 0;
  const exchangeRate = detailGroup.get('exchangeRate')?.value || 1;
  const localAmount = currencyAmount * exchangeRate;
  detailGroup.patchValue({ localAmount }, { emitEvent: false });
  
  // Recalculate tax when local amount changes
  this.calculateTaxAmount(detailGroup);
}

  fetchExchangeRate(detailGroup: FormGroup, currencyId: number): void {
  if (!currencyId || !this.currencyList?.length) return;

  const companyCurrencyCode = this.companySettings.getCurrencySettings().code;
  const selectedCurrency = this.currencyList.find(
    c => c.CurrencyMasterSid === currencyId
  );

  if (!selectedCurrency) return;

  const fromCurrencyCode = selectedCurrency.currencyCode;
  const toCurrencyCode = companyCurrencyCode;

  // ✅ SAME CURRENCY → Rate = 1 & DISABLE
  if (fromCurrencyCode === toCurrencyCode) {
    detailGroup.patchValue({
      currencyCode: fromCurrencyCode,
      exchangeRate: 1
    }, { emitEvent: false });

    detailGroup.get('exchangeRate')?.disable({ emitEvent: false });
    this.calculateLocalAmount(detailGroup);
    return;
  }

  // ✅ DIFFERENT CURRENCY → ENABLE & FETCH RATE
  detailGroup.get('exchangeRate')?.enable({ emitEvent: false });

  const payload = {
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid,
    fromCurrencyCode,
    toCurrencyCode,
    EffectiveFrom: this.editMode
      ? new Date(this.voucherData?.VoucherDate)
      : new Date(),
    segment: 'cost'
  };

  this.accountsService.getExchangeRate(payload).subscribe({
    next: (res: any) => {
      if (res?.status) {
        detailGroup.patchValue({
          currencyCode: fromCurrencyCode,
          exchangeRate: Number(res.data) || 1
        }, { emitEvent: false });

        this.calculateLocalAmount(detailGroup);
      }
    },
    error: () => {
      detailGroup.patchValue({ exchangeRate: 1 }, { emitEvent: false });
      this.calculateLocalAmount(detailGroup);
    }
  });
}


  fetchChargeDetails(detailGroup: FormGroup, chargeId: number): void {
  const rowIndex = this.getRowIndex(detailGroup);
  const charge = this.chargeList.find((c) => c.ChargeMasterSid === chargeId);
  
  if (charge) {
    const description = charge.ChargeDescription || charge.chargeName || charge.ChargeName || '';
    
    // Fetch HSSAC details using API
    this.operationService.getChargeTaxForChargeId(chargeId).subscribe({
      next: (res: any) => {
        if (res.status) {
          this.hssacList[rowIndex] = res.data || [];
          
          let hssacId = null;
          let hssacCode = '';
          
          // Auto-select the first HSSAC
          if (res.data && res.data.length > 0) {
            hssacId = res.data[0]?.HSSACMasterSid || null;
            hssacCode = res.data[0]?.HSSACCode || res.data[0]?.HSNCode || '';
          }
          
          const chargeUomId = charge.ChargeUOMSid ?? charge.UOM ?? charge.UOMMasterSid ?? null;
          
          // Auto-set tax percentage from HSSAC
          let taxPercentage = charge.TaxPercentage || 0;
          if (hssacId) {
            const hssac = res.data.find((h: any) => h.HSSACMasterSid === hssacId);
            taxPercentage = hssac?.TaxRate || taxPercentage;
          }

          // Update the detail group
          detailGroup.patchValue({
            chargeDescription: description,
            hssacMasterSid: hssacId,
            hssacCode: hssacCode,
            taxPercentage: taxPercentage,
            ChargeUOMSid: chargeUomId || null
          });
          
          this.calculateTaxAmount(detailGroup);
        }
      },
      error: (err) => {
        console.error('Error fetching HSSAC details:', err);
        // Fallback to basic charge info
        detailGroup.patchValue({
          chargeDescription: description,
          hssacMasterSid: null,
          hssacCode: '',
          taxPercentage: charge.TaxPercentage || 0,
          ChargeUOMSid: charge.ChargeUOMSid || null
        });
      }
    });
  }
}

fetchHSSACForExistingDetail(detailGroup: FormGroup, chargeId: number, rowIndex: number, detail: any): void {
  this.operationService.getChargeTaxForChargeId(chargeId).subscribe({
    next: (res: any) => {
      if (res.status) {
        this.hssacList[rowIndex] = res.data || [];
        
        // Find matching HSSAC
        let hssacId = detail.HSSACMasterSid || null;
        let hssacCode = detail.HSSACCode || '';
        
        // If we have an HSSACMasterSid, use it
        if (hssacId && res.data.length > 0) {
          const matchingHssac = res.data.find((h: any) => h.HSSACMasterSid === hssacId);
          if (matchingHssac) {
            hssacCode = matchingHssac.HSSACCode || matchingHssac.HSNCode || hssacCode;
          }
        }
        // If no HSSACMasterSid but have HSSACCode, find by code
        else if (hssacCode && res.data.length > 0) {
          const matchingHssac = res.data.find((h: any) => 
            h.HSSACCode === hssacCode || h.HSNCode === hssacCode
          );
          if (matchingHssac) {
            hssacId = matchingHssac.HSSACMasterSid;
            hssacCode = matchingHssac.HSSACCode || matchingHssac.HSNCode || '';
          }
        }
        // Otherwise, use the first one
        else if (!hssacId && res.data.length > 0) {
          hssacId = res.data[0]?.HSSACMasterSid || null;
          hssacCode = res.data[0]?.HSSACCode || res.data[0]?.HSNCode || '';
        }
        
        // Update the form group
        detailGroup.patchValue({
          hssacMasterSid: hssacId,
          hssacCode: hssacCode
        });
        
        console.log('HSSAC patched:', { rowIndex, hssacId, hssacCode, hssacList: res.data });
      }
    },
    error: (err) => {
      console.error('Error fetching HSSAC for existing detail:', err);
      detailGroup.patchValue({
        hssacMasterSid: detail.HSSACMasterSid || null,
        hssacCode: detail.HSSACCode || ''
      });
    }
  });
}

onChargeChange(detailGroup: FormGroup, chargeId: number): void {
    console.log('Charge value changed:', chargeId);
    
    if (chargeId) {
        const charge = this.chargeList.find((c) => c.ChargeMasterSid === chargeId);
        
        if (charge) {
            const description = charge.ChargeDescription || charge.chargeName || charge.ChargeName || '';
            
            // Fetch HSSAC details using API (same as invoice component)
            this.fetchHSSACForCharge(detailGroup, chargeId, description);
            
        }
    } else {
        // Reset charge-related fields when charge is cleared
        detailGroup.patchValue({
            chargeDescription: '',
            hssacMasterSid: null,
            hssacCode: '',
            taxPercentage: 0,
            taxAmount: 0,
            ChargeUOMSid: null
        });
        
        // Refresh subledger filters - this will clear auto-patched subledger
        this.refreshSubledgerFiltersForRow(this.getRowIndex(detailGroup));
    }
    
    // Always refresh subledger filters when charge changes (for auto-patching)
    const rowIndex = this.getRowIndex(detailGroup);
    if (this.subledgerTypes[rowIndex] === 'Charge') {
        this.refreshSubledgerFiltersForRow(rowIndex);
    }
}

// New method to fetch HSSAC details using API
fetchHSSACForCharge(detailGroup: FormGroup, chargeId: number, chargeDescription: string): void {
  const rowIndex = this.getRowIndex(detailGroup);
      if (!this.hssacList[rowIndex]) {
        this.hssacList[rowIndex] = [];
    }
  const chargeName = this.chargeList.find((c: any) => c.ChargeMasterSid === chargeId)?.chargeName || '';
  
  // Call API to get HSSAC details for this charge
  this.operationService.getChargeTaxForChargeId(chargeId).subscribe({
    next: (res: any) => {
      if (res.status) {
        // Store the HSSAC list for this row (similar to invoice component)
        this.hssacList[rowIndex] = res.data || [];
        
        let hssacId = null;
        let hssacCode = '';
        
        // Auto-select the first HSSAC if available
        if (res.data && res.data.length > 0) {
          hssacId = res.data[0]?.HSSACMasterSid || null;
          hssacCode = res.data[0]?.HSSACCode || res.data[0]?.HSNCode || '';
          
          console.log('DEBUG - HSSAC details fetched from API:', {
            rowIndex,
            hssacList: res.data,
            selectedHssacId: hssacId,
            selectedHssacCode: hssacCode
          });
        }
        
        const charge = this.chargeList.find((c) => c.ChargeMasterSid === chargeId);
        const chargeUomId = charge?.ChargeUOMSid ?? charge?.UOM ?? charge?.UOMMasterSid ?? null;
        
        // Auto-set tax percentage from HSSAC
        let taxPercentage = charge?.TaxPercentage || 0;
        if (hssacId) {
          const hssac = res.data.find((h: any) => h.HSSACMasterSid === hssacId);
          taxPercentage = hssac?.TaxRate || taxPercentage;
        }
        
        // Update the detail group
        detailGroup.patchValue({
          chargeDescription: chargeDescription,
          hssacMasterSid: hssacId,
          hssacCode: hssacCode,
          taxPercentage: taxPercentage,
          ChargeUOMSid: chargeUomId || null
        });
        
        // Recalculate tax amount
        this.calculateTaxAmount(detailGroup);
        
      } else {
        console.warn('No HSSAC data returned from API for charge:', chargeId);
        this.appSettingService.showError(`Error fetching HSSAC details for ${chargeName}`);
        this.hssacList[rowIndex] = [];
        
        // Update with basic charge info
        detailGroup.patchValue({
          chargeDescription: chargeDescription,
          hssacMasterSid: null,
          hssacCode: '',
        });
      }
      
      // Refresh subledger filters
      this.refreshSubledgerFiltersForRow(rowIndex);
    },
    error: (err: any) => {
      console.error('Error fetching HSSAC details:', err);
      this.appSettingService.showError(`Error fetching HSSAC details for ${chargeName}`);
      this.hssacList[rowIndex] = [];
      
      // Update with basic charge info
      const charge = this.chargeList.find((c) => c.ChargeMasterSid === chargeId);
      detailGroup.patchValue({
        chargeDescription: chargeDescription,
        hssacMasterSid: null,
        hssacCode: '',
        taxPercentage: charge?.TaxPercentage || 0,
        ChargeUOMSid: charge?.ChargeUOMSid || null
      });
      
      this.refreshSubledgerFiltersForRow(rowIndex);
    }
  });
}

  deleteDetailLine(index: number): void {
    if (this.details.length > 1) {
      this.details.removeAt(index);
      // REMOVED: this.calculateTotals(); - Not needed with getters
    } else {
      this.appSettingService.showWarning('At least one detail line is required', 'Warning');
    }
  }

  // REMOVED: calculateTotals() method - Replaced by getters above
  // calculateTotals(): void {
  //   this.debitTotal = 0;
  //   this.creditTotal = 0;
  // 
  //   this.details.controls.forEach((control) => {
  //     const drCr = control.get('drCr')?.value;
  //     const localAmount = control.get('localAmount')?.value || 0;
  //     const taxAmount = control.get('taxAmount')?.value || 0;
  //     
  //     // Calculate total amount including tax
  //     const totalAmount = localAmount + taxAmount;
  // 
  //     if (drCr === 'D') {
  //       this.debitTotal += totalAmount;
  //     } else if (drCr === 'C') {
  //       this.creditTotal += totalAmount;
  //     }
  //   });
  // 
  //   this.difference = Math.abs(this.debitTotal - this.creditTotal);
  // }

  isFormValid(): boolean {
    if (!this.form.valid) {
      this.appSettingService.showError('Please fill all required fields', 'Validation Error');
      return false;
    }

    if (this.details.length === 0) {
      this.appSettingService.showError('Please add at least one detail line', 'Validation Error');
      return false;
    }

    // Use the getter for difference
    if (this.difference > 0.01) {
      this.appSettingService.showError(
        `Debit and Credit totals must be equal. Difference: ${this.difference.toFixed(2)}`,
        'Validation Error'
      );
      return false;
    }

    return true;
  }

  // NEW: Final Save with Posting functionality
  onFinalSave(): void {
    if (!this.isFormValid()) return;
    
    this.saveJournalVoucher(true); // true indicates final save with posting
  }

  // NEW: Save Journal Voucher (similar to vendor invoice)
  private saveJournalVoucher(isFinal: boolean): void {
    const payload = this.preparePayload();

    this.isSaving = true;
    this.spinner.show();

    const saveObservable = this.voucherHeaderSid 
      ? this.journalVoucherService.updateJournalVoucherById(this.voucherHeaderSid, payload)
      : this.journalVoucherService.createJournalVoucher(payload);

    saveObservable.subscribe({
      next: async (response: any) => {
        if (response?.status) {
          const voucherHeaderSid = response.data?.VoucherHeaderSid || this.voucherHeaderSid;
          
          if (isFinal && voucherHeaderSid) {
            // If final save, post the voucher
            await this.postVoucher(voucherHeaderSid);
          } else {
            this.spinner.hide();
            this.isSaving = false;
            const message = isFinal ? 'Journal voucher saved and posted successfully!' : 'Journal voucher saved as draft successfully!';
            this.appSettingService.showSuccess(message);
            
            if (!this.voucherHeaderSid && voucherHeaderSid) {
              this.voucherHeaderSid = voucherHeaderSid;
              this.router.navigate(['/accounts/journal-voucher/entry', voucherHeaderSid]);
            }
          }
        } else {
          this.spinner.hide();
          this.isSaving = false;
          const errorMessage = response?.message || 'Error saving journal voucher';
          this.appSettingService.showError(errorMessage);
        }
      },
      error: (err) => {
        this.spinner.hide();
        this.isSaving = false;
        console.error('Save journal voucher error', err);
        this.appSettingService.showError('Failed to save journal voucher.');
      }
    });
  }

  // NEW: Post Voucher method (similar to vendor invoice)
  private async postVoucher(voucherHeaderSid: number): Promise<void> {
    try {
      this.spinner.show();
      
      const currentCompany = this.currentCompany;
      const currentBranch = this.currentBranch;
      const currentFinancialYear = Number(localStorage.getItem('current-year-id'));
      const currentCountry = Number(this.currentCompany?.CountryMasterSid);
      const currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
      const currentCountryName = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
      const currentUserEmail =  this.userData?.userEmail;

      if (!currentCompany || !currentBranch || !currentFinancialYear || !currentCountry || !currentCurrency) {
        throw new Error('Company, branch, financial year, or currency information is missing');
      }
      const companyCurrency = this.companySettings.getCurrencySettings();
      const postPayload = {
        VoucherHeaderSid: voucherHeaderSid,
        CompanyMasterSid: currentCompany.CompanyMasterSid,
        BranchMasterSid: currentBranch.BranchMasterSid,
        YearMasterSid: currentFinancialYear,
        LocalCurrencyMasterSid: currentCurrency,
        LocalCurrencyCode: companyCurrency.code,
        PostedBy: currentUserEmail,
        TaxDetails: {
          CountryMasterSid: currentCountry,
          countryName: currentCountryName,
          TaxCategory: 'Inter',
          EffectiveFrom: new Date().toISOString(),
          TaxType: 'Output'
        }
      };

      // Use journalVoucherService for posting
      const result = await firstValueFrom(this.operationService.postJournalVoucher(postPayload));
      
      this.spinner.hide();
      this.isSaving = false;
      
      if (result.status) {
        this.appSettingService.showSuccess('Journal voucher saved and posted successfully!');
        this.isPosted = true; // Update local state
        
        // Navigate to list after successful posting
        this.router.navigate(['/accounts/journal-voucher/list']);
      } else {
        this.appSettingService.showError(result.message || 'Failed to post journal voucher.');
      }
    } catch (error) {
      this.spinner.hide();
      this.isSaving = false;
      console.error('Post voucher error:', error);
      this.appSettingService.showError('Failed to post journal voucher. Please try again.');
    }
  }

  // Existing saveDraft method (for draft saving)
  saveDraft(): void {
    if (!this.isFormValid()) return;
    this.saveJournalVoucher(false); // false indicates draft save without posting
  }

  preparePayload(): any {
    const formValue = this.form.getRawValue();
    const voucherDate = formValue.voucherDate;
    const voucherDateString = `${voucherDate.year}-${String(voucherDate.month).padStart(2, '0')}-${String(voucherDate.day).padStart(2, '0')}`;

    const VoucherDetail = formValue.details.map((detail: any) => ({
      VoucherDetailSid: detail.VoucherDetailSid || undefined,
      COAMasterSid: detail.coaMasterSid,
      LedgerMasterSid: detail.ledgerMasterSid || null,
      CurrencyMasterSid: detail.currencyMasterSid,
      CurrencyCode: detail.currencyCode,
      ExchangeRate: detail.exchangeRate,
      Amount: detail.currencyAmount,
      LocalAmount: detail.localAmount,
      DrCr: detail.drCr,
      Narration: detail.narration || null,
      DepartmentMasterSid: detail.departmentMasterSid || null,
      ChargeMasterSid: detail.chargeMasterSid || null,
      ChargeDescription: detail.chargeDescription || null,
      HSSACCode: detail.hssacMasterSid || null,
      MasterJobSid: detail.masterJobSid || null,
      HouseJobSid: detail.houseJobSid || null,
      TaxPercentage1: detail.taxPercentage || null,
      TaxAmount1: detail.taxAmount || null,
      CostCenterMasterSid: detail.costCenterMasterSid || null,
      ProfitCenterMasterSid: detail.profitCenterMasterSid || null,
    }));

    return {
      VoucherDate: voucherDateString,
      Narration: formValue.narration || null,
      Remarks: formValue.remarks || null,
      Status: formValue.Status,
      PostStatus: 'U', // Unposted for draft
      PartyName: 'System Journal Entry',
      DocumentNumber: `JV-${new Date().getTime()}`,
      Amount: this.debitTotal, // Using getter
      LocalAmount: this.debitTotal, // Using getter
      VoucherDetail,
      // Add company context for new vouchers
      ...(!this.voucherHeaderSid && {
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
      })
    };
  }

  navigateToBack(): void {
    this.router.navigate(['/accounts/journal-voucher/list']);
  }

  private fromNgbDate(s: NgbDateStructLike | null): Date | null {
    if (!s || !s.year) return null;
    return new Date(s.year, (s.month || 1) - 1, s.day || 1);
  }
  showInfo() {
      if(!this.voucherData) return;
      const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
      modalRef.componentInstance.item = this.voucherData;
      modalRef.componentInstance.idLabel = 'Journal Voucher Id';
      modalRef.componentInstance.idValue = this.voucherHeaderSid;
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
    if (!this.voucherData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });
    modalRef.componentInstance.item = this.voucherData;
    modalRef.componentInstance.idLabel = 'Journal Voucher Id';
    modalRef.componentInstance.idValue = this.voucherHeaderSid;
  }
  
  openAuthority() {
    if (!this.voucherData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });
    modalRef.componentInstance.item = this.voucherData;
    modalRef.componentInstance.idLabel = 'Journal Voucher Id';
    modalRef.componentInstance.idValue = this.voucherHeaderSid;
  }
  
  openEDoc() {
    if (!this.voucherData) return;
    const modalRef = this.modalService.open(EdocComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });
    modalRef.componentInstance.item = this.voucherData;
    modalRef.componentInstance.idLabel = 'Journal Voucher Id';
    modalRef.componentInstance.idValue = this.voucherHeaderSid;
  const data:any={
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid : this.MenuMasterSid,
      DocumentSid: this.voucherHeaderSid
    }
  
        this.commonService.documentData.set(data)
  }

  openFollowup() {

  }

  refreshSubledgerFiltersForRow(rowIndex: number): void {
    const row = this.details.at(rowIndex) as FormGroup;
    const isAutoGenerated = row.get('IsAutoGenerated')?.value === 'Y';
    const isPosted = this.isPosted; // Use the component-level flag
    
    if (isAutoGenerated) {
        console.log(`Skipping subledger filter for auto-generated row ${rowIndex}`);
        
        // For posted vouchers, ensure data is properly displayed
        if (isPosted) {
            const voucherDetail = this.voucherData?.VoucherDetail?.[rowIndex];
            if (voucherDetail?.LedgerMasterSid) {
                row.patchValue({
                    ledgerMasterSid: voucherDetail.LedgerMasterSid,
                    filteredSubledgers: voucherDetail.subledgerMaster ? [voucherDetail.subledgerMaster] : []
                }, { emitEvent: false });
            }
        }
        
        row.get('ledgerMasterSid')?.disable();
        return;
    }
    
    // FOR POSTED VOUCHERS: Just display the existing data
    if (isPosted) {
        const voucherDetail = this.voucherData?.VoucherDetail?.[rowIndex];
        if (voucherDetail) {
            // Filter subledgers to only show the one used in this voucher
            const matchingSubledger = this.subledgerList.find(
                sl => sl.SubledgerMasterSid === voucherDetail.LedgerMasterSid
            );
            
            row.patchValue({
                filteredSubledgers: matchingSubledger ? [matchingSubledger] : [],
                ledgerMasterSid: voucherDetail.LedgerMasterSid
            }, { emitEvent: false });
        }
        return;
    }
    
    // NORMAL PROCESSING FOR NON-POSTED VOUCHERS
    const deptId = row.get('departmentMasterSid')?.value;
    const chargeId = row.get('chargeMasterSid')?.value;
    const coaId = row.get('coaMasterSid')?.value;
    const subledgerType = this.subledgerTypes[rowIndex];
    
    console.log(`Refreshing subledger filters for row ${rowIndex}:`, {
        deptId,
        chargeId,
        coaId,
        subledgerType
    });
    
    let filteredSubledgers: any[] = [];
    
    // Start with all subledgers
    filteredSubledgers = this.subledgerList.slice();
    
    // Apply filters
    if (deptId) {
        filteredSubledgers = filteredSubledgers.filter(subledger => 
            subledger.DepartmentMasterSid === deptId
        );
    }
    
    if (chargeId) {
        filteredSubledgers = filteredSubledgers.filter(subledger => 
            subledger.SubledgerMappingSid === chargeId
        );
    }
    
    if (coaId) {
        filteredSubledgers = filteredSubledgers.filter(subledger => 
            this.doesSubledgerMatchCOAStrict(subledger, coaId)
        );
    }
    
    // Update the filtered subledgers
    row.patchValue({ filteredSubledgers }, { emitEvent: false });
    
    // Handle Charge type logic
    if (subledgerType === 'Charge') {
        if (filteredSubledgers.length === 1) {
            const singleSubledger = filteredSubledgers[0];
            
            row.patchValue({
                ledgerMasterSid: singleSubledger.SubledgerMasterSid
            }, { emitEvent: false });
            
            row.get('ledgerMasterSid')?.disable();
            this.showWarningFlags[rowIndex] = false;
            
        } else if (filteredSubledgers.length === 0) {
            if (deptId && chargeId && coaId) {
                if (!this.showWarningFlags[rowIndex]) {
                    this.showSubledgerWarning(rowIndex);
                    this.showWarningFlags[rowIndex] = true;
                    
                    setTimeout(() => {
                        this.showWarningFlags[rowIndex] = false;
                    }, 2000);
                }
            }
            row.patchValue({ ledgerMasterSid: null }, { emitEvent: false });
            row.get('ledgerMasterSid')?.enable();
            
        } else if (filteredSubledgers.length > 1) {
            const currentSubledgerSid = row.get('ledgerMasterSid')?.value;
            if (currentSubledgerSid) {
                const currentSubledger = filteredSubledgers.find(
                    sl => sl.SubledgerMasterSid === currentSubledgerSid
                );
                if (!currentSubledger) {
                    row.patchValue({ ledgerMasterSid: null }, { emitEvent: false });
                }
            }
            row.get('ledgerMasterSid')?.enable();
            this.showWarningFlags[rowIndex] = false;
        }
    } else {
        row.get('ledgerMasterSid')?.enable();
        
        const currentSubledgerSid = row.get('ledgerMasterSid')?.value;
        if (currentSubledgerSid) {
            const currentSubledger = filteredSubledgers.find(
                sl => sl.SubledgerMasterSid === currentSubledgerSid
            );
            if (!currentSubledger) {
                row.patchValue({ ledgerMasterSid: null }, { emitEvent: false });
            }
        }
        this.showWarningFlags[rowIndex] = false;
    }
}

// New method to show warning when subledger doesn't exist
showSubledgerWarning(rowIndex: number): void {
    const row = this.details.at(rowIndex) as FormGroup;
    const deptId = row.get('departmentMasterSid')?.value;
    const chargeId = row.get('chargeMasterSid')?.value;
    const coaId = row.get('coaMasterSid')?.value;
    
    const departmentName = this.departmentList.find(d => d.DepartmentMasterSid === deptId)?.departmentName || 'N/A';
    const chargeName = this.chargeList.find(c => c.ChargeMasterSid === chargeId)?.chargeName || 'N/A';
    const coaName = this.coaList.find(c => c.COAMasterSid === coaId)?.LedgerName || 'N/A';
    
    const warningMessage = `No subledger exists for the selected combination:
    -  ${departmentName}
    -  ${chargeName}
    -  ${coaName}`;
    
    this.appSettingService.showWarning(warningMessage, 'Subledger Not Found');
}

async handleSubledgerForEdit(detailGroup: FormGroup, detail: any, rowIndex: number): Promise<void> {
    // Skip for auto-generated rows
    if (detail.IsAutoGenerated === 'Y') {
        console.log(`Skipping handleSubledgerForEdit for auto-generated row ${rowIndex}`);
        return;
    }
    
    // Fetch subledger details for this COA
    if (detail.COAMasterSid && this.currentCompany?.CompanyMasterSid) {
        try {
            const payload = {
                CompanyMasterSid: this.currentCompany.CompanyMasterSid,
                COAMasterSid: detail.COAMasterSid
            };
            
            const subledgerResp = await firstValueFrom(
                this.operationService.getSubledgerMasterById(payload)
            );
            
            if (subledgerResp && subledgerResp.data) {
                const subledger = subledgerResp.data;
                this.subledgerTypes[rowIndex] = subledger.SubledgerType || '';
                
                // For Charge type in edit mode, check if we should auto-patch
                if (this.subledgerTypes[rowIndex] === 'Charge') {
                    // Don't auto-patch yet - wait for all filters to be applied
                    detailGroup.get('ledgerMasterSid')?.enable();
                    
                    // The refreshSubledgerFiltersForRow will be called after department and charge are set
                    // It will handle auto-patching if conditions are met
                } else {
                    // For non-Charge types, just enable the field
                    detailGroup.get('ledgerMasterSid')?.enable();
                }
                
                // If we have an existing value from edit mode, keep it temporarily
                // The refreshSubledgerFiltersForRow will validate it later
                if (detail.LedgerMasterSid) {
                    detailGroup.patchValue({
                        ledgerMasterSid: detail.LedgerMasterSid
                    }, { emitEvent: false });
                }
            }
        } catch (err) {
            console.error('Error fetching subledger for edit:', err);
            this.subledgerTypes[rowIndex] = '';
            detailGroup.get('ledgerMasterSid')?.enable();
        }
    }
}

doesSubledgerMatchCOAStrict(subledger: any, coaMasterSid: number): boolean {
  if (!subledger || !coaMasterSid) return true; // No filter if no COA selected
  
  const coaSid = Number(coaMasterSid);
  
  // Must match EITHER CrCOAMasterSid OR DrCOAMasterSid exactly
  const matchesCrCOA = subledger.CrCOAMasterSid && Number(subledger.CrCOAMasterSid) === coaSid;
  const matchesDrCOA = subledger.DrCOAMasterSid && Number(subledger.DrCOAMasterSid) === coaSid;
  
  return matchesCrCOA || matchesDrCOA;
}

// Add this method to your JournalVoucherEntryComponent class
getRowIndex(detailGroup: FormGroup): number {
  const index = this.details.controls.findIndex(control => control === detailGroup);
  return index;
}

updateChargeFieldStates(rowIndex: number): void {
    const row = this.details.at(rowIndex) as FormGroup;
    const isChargeType = this.subledgerTypes[rowIndex] === 'Charge';
    
    if (this.isPosted) {
        // For posted vouchers, all fields should be disabled
        row.disable({ emitEvent: false });
        return;
    }
    
    if (isChargeType) {
        // Enable charge fields for Charge type rows (only if not posted)
        row.get('departmentMasterSid')?.enable();
        row.get('chargeMasterSid')?.enable();
        row.get('hssacMasterSid')?.enable();
        row.get('masterJobSid')?.enable();
        row.get('houseJobSid')?.enable();
        row.get('taxPercentage')?.enable();
        row.get('costCenterMasterSid')?.enable();
        row.get('profitCenterMasterSid')?.enable();
    } else {
        // Disable charge fields for non-Charge type rows
        this.disableChargeFieldsForRow(row);
    }
}
disableChargeFieldsForRow(row: FormGroup): void {
    row.get('departmentMasterSid')?.disable();
    row.get('chargeMasterSid')?.disable();
    row.get('hssacMasterSid')?.disable();
    row.get('masterJobSid')?.disable();
    row.get('houseJobSid')?.disable();
    row.get('taxPercentage')?.disable();
    row.get('costCenterMasterSid')?.disable();
    row.get('profitCenterMasterSid')?.disable();
}

  
}