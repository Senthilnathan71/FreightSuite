import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AccountsService } from '../../accounts.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-currency-exchange-entry',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    DatePipe,
    NgbDropdownModule,
    DecimalPrecisionDirective
  ],
  templateUrl: './currency-exchange-entry.component.html',
  styleUrls: ['./currency-exchange-entry.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class CurrencyExchangeEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  currencyExchangeForm!: FormGroup;
  isEditMode = false;
  filteredToCurrencies: any[] = []; 
  CurrencyExchangeSid: number | null = null;
  statusList = ["Active", "Suspended"];
  companies: any[] = [];
  branches: any[] = [];
  loading = false;
	today = this.calendar.getToday();
  minDate = this.today;
	todayDate = new Date(this.today.year,this.today.month,this.today.day);
  currencyExchangeData : any;
  currentMenuId: number;
  TandCList: any[]=[];
  currentClauseId: any;
  currencies: any[] = []; 
  currentCompany : any;
  currentBranch : any;
  MenuMasterSid: any;
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();
  constructor(
    private fb: FormBuilder,
    private accountService: AccountsService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private masterService: MasterService,
    private calendar : NgbCalendar,
    private modalService : NgbModal,
    private commonService: CommonService,
    public mps: MenuPermissionService
  ) { }

  ngOnInit(): void {
  this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
  this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
  this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
  this.mps.init().subscribe();
    this.initForm();
    this.loadCompaniesAndBranches();
    this.checkEditMode();
    this.loadCurrencies();
    if (!this.isEditMode) {
      this.initialFormValue = this.currencyExchangeForm.getRawValue();
      this.subscribeToFormChanges();
    }
  }

  initForm() {
    this.currencyExchangeForm = this.fb.group({
      EffectiveFrom: ['', [Validators.required]],
      FromCurrency: ['', [Validators.required]],
      ToCurrency: ['', [Validators.required]],
      RateFrom: [''],
      SellRate: ['', [
        Validators.required,
        Validators.pattern(/^\d+\.?\d{0,5}$/)
      ]],
      BuyRate: ['', [
        Validators.required,
        Validators.pattern(/^\d+\.?\d{0,5}$/)
      ]],
      BankName: [''],

      Remarks: [''],
      status: [{ value: 'Active', disabled: true }, [Validators.required]],
      // CompanyMasterSid: ['', [Validators.required]],
      // BranchMasterSid: ['', [Validators.required]]
    });

    // Automatically convert currency inputs to uppercase
     // Automatically convert currency inputs to uppercase
    this.currencyExchangeForm.get('FromCurrency')?.valueChanges.subscribe(val => {
      if (val) {
        this.currencyExchangeForm.get('FromCurrency')?.setValue(val.toUpperCase(), { emitEvent: false });
        this.filterToCurrencies(val); // Filter ToCurrencies when FromCurrency changes
      }
    });

    this.currencyExchangeForm.get('ToCurrency')?.valueChanges.subscribe(val => {
      if (val) {
        this.currencyExchangeForm.get('ToCurrency')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }


  loadCurrencies() {
    this.loading = true;
    this.masterService.getAllCurrencies().subscribe({
      next: (currencies) => {
        this.currencies = currencies;
        this.filteredToCurrencies = [...this.currencies]; 
        this.loading = false;
      },
      error: (err) => {
        this.appSettingService.showError('Failed to load currencies.');
        console.error(err);
        this.loading = false;
      }
    });
  }
  filterToCurrencies(selectedFromCurrency: string) {
    if (!selectedFromCurrency) {
      // If no FromCurrency selected, show all currencies
      this.filteredToCurrencies = [...this.currencies];
    } else {
      // Filter out the selected FromCurrency from ToCurrency options
      this.filteredToCurrencies = this.currencies.filter(
        currency => currency.currencyCode !== selectedFromCurrency
      );
      
      // If current ToCurrency is same as FromCurrency, reset it
      const currentToCurrency = this.currencyExchangeForm.get('ToCurrency')?.value;
      if (currentToCurrency === selectedFromCurrency) {
        this.currencyExchangeForm.get('ToCurrency')?.setValue('');
      }
    }
  }

  loadCompaniesAndBranches() {
    this.loading = true;
    this.masterService.getAllCompanies().subscribe({
      next: (companies) => {
        this.companies = companies;
        if (this.companies.length > 0) {
          this.currencyExchangeForm.patchValue({
            CompanyMasterSid: this.companies[0].CompanyMasterSid
          });
        }
      },
      error: (err) => {
        this.appSettingService.showError('Failed to load companies.');
        console.error(err);
      }
    });

    this.masterService.getAllBranches().subscribe({
      next: (branches) => {
        this.branches = branches;
        if (this.branches.length > 0) {
          this.currencyExchangeForm.patchValue({
            BranchMasterSid: this.branches[0].BranchMasterSid
          });
        }
        this.loading = false;
      },
      error: (err) => {
        this.appSettingService.showError('Failed to load branches.');
        console.error(err);
        this.loading = false;
      }
    });
  }

  checkEditMode() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.CurrencyExchangeSid = +id;
      this.loadCurrencyExchangeData(this.CurrencyExchangeSid);
      // Enable status control in edit mode
      this.currencyExchangeForm.get('status')?.enable();
    }
  }

  loadCurrencyExchangeData(id: number) {
    this.loading = true;
    this.accountService.getCurrencyExchangeById(id).subscribe({
      next: (data) => {
        this.currencyExchangeData = data;
        this.currencyExchangeForm.patchValue({
          ...data,
            CompanyMasterSid :this.currentCompany?.CompanyMasterSid,
            BranchMasterSid :this.currentBranch?.BranchMasterSid,
          EffectiveFrom: new Date(data.EffectiveFrom),
          status: data.status === 'A' ? 'Active' : 'Suspended',
          RateFrom: data.RateFrom || ''
        });
        const fromCurrency = data.FromCurrency;
        if (fromCurrency) {
          this.filterToCurrencies(fromCurrency);
        }
        this.initialFormValue = this.currencyExchangeForm.getRawValue();
        this.subscribeToFormChanges();
        this.loading = false;
      },
      error: (err) => {
        this.appSettingService.showError('Error loading currency exchange data.');
        console.error(err);
        this.loading = false;
      }
    });
  }

  onSubmit(resolve?: (saved: boolean) => void) {
    if (this.isSaving) {
      if (resolve) resolve(false);
      return;
    }

    const raw = this.currencyExchangeForm.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.currencyExchangeForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    if (this.currencyExchangeForm.invalid) {
      this.currencyExchangeForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      if (resolve) resolve(false);
      return;
    }

    this.loading = true;
    this.isSaving = true;
    const formValue = this.currencyExchangeForm.getRawValue(); // Use getRawValue to get disabled control values

    const payload = {
      ...formValue,
      CompanyMasterSid :this.currentCompany?.CompanyMasterSid,
      BranchMasterSid :this.currentBranch?.BranchMasterSid,
      EffectiveFrom: formValue.EffectiveFrom,
      RateFrom: formValue.RateFrom,
      SellRate: parseFloat(formValue.SellRate),
      BuyRate: parseFloat(formValue.BuyRate),
      status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
      createdBy: this.appSettingService.userSettingSource.value['userEmail']
    };

    if (this.isEditMode && this.CurrencyExchangeSid) {
      payload.updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
      this.accountService.updateCurrencyExchangeById(this.CurrencyExchangeSid, payload).subscribe({
        next: (resp) => {
         
          this.handleSuccess(resp, 'Currency Exchange updated successfully!');
          if (resolve) resolve(!!resp?.status);
           this.router.navigate(['accounts/currency-exchange/entry'],resp.data.CurrencyExchangeSid);
        },
        error: (err) => {
          this.handleError(err);
          if (resolve) resolve(false);
        }
      });
    } else {
      this.accountService.createCurrencyExchange(payload).subscribe({
        next: (resp) => {
          this.loadCurrencyExchangeData(resp.data.CurrencyExchangeSid);
          this.handleSuccess(resp, 'Currency Exchange created successfully!');
          if (resolve) resolve(!!resp?.status);
           this.router.navigate(['accounts/currency-exchange/entry'],resp.data.CurrencyExchangeSid);
        },
        error: (err) => {
          this.handleError(err);
          if (resolve) resolve(false);
        }
      });
    }
  }

  handleSuccess(resp: any, successMsg: string) {
    this.loading = false;
    this.isSaving = false;
    if (resp.status) {
      this.isDirty = false;
      this.initialFormValue = this.currencyExchangeForm.getRawValue();
      this.appSettingService.showSuccess(resp.message);
      this.router.navigate(['accounts/currency-exchange/list']);
    } else {
      this.appSettingService.showError(resp.message );
    }
  }

  handleError(err: any) {
    this.loading = false;
    this.isSaving = false;
    console.error('Error:', err);
    this.appSettingService.showError(
      err.message ||
      err.error?.message ||
      'Failed to perform operation'
    );
  }

  reset() {
    this.currencyExchangeForm.reset({
      status: 'Active',
      CompanyMasterSid: this.companies.length > 0 ? this.companies[0].CompanyMasterSid : '',
      BranchMasterSid: this.branches.length > 0 ? this.branches[0].BranchMasterSid : ''
    });
    // Disable status again if not in edit mode
    if (!this.isEditMode) {
      this.currencyExchangeForm.get('status')?.disable();
    }
  }

  goBack() {
    this.router.navigate(['accounts/currency-exchange/list']);
  }

  showInfo() {
    if(!this.currencyExchangeData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.currencyExchangeData;
    modalRef.componentInstance.idLabel = 'Currency Exchange Id';
    modalRef.componentInstance.idValue = this.currencyExchangeData?.CurrencyExchangeSid;
  }
  // openTandC() {
  //   this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  //   const payload = { MenuMasterSid: this.currentMenuId };
  //   this.masterService.getTandCByCondition(payload).subscribe(
  //     (resp: any) => {
  //       if (resp.status) {
  //         this.TandCList = resp.data;
  //         const modalRef = this.modalService.open(TermsAndConditionsComponent, {
  //           size: 'lg',
  //           backdrop: 'static',
  //           centered: true
  //         });
  //         modalRef.componentInstance.terms = this.TandCList;
  //         modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
  //         modalRef.componentInstance.DocumentSid = this.currentClauseId;

  //       } else {
  //         this.appSettingService.showError('Error loading Terms and Conditions');
  //       }
  //     },
  //     (error) => {
  //       this.appSettingService.showError('Error loading Terms and Conditions', error);
  //     }
  //   );
  // }

  openEmail() {
  if (!this.currencyExchangeData) return;
  const modalRef = this.modalService.open(EmailEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.currencyExchangeData;
  modalRef.componentInstance.idLabel = 'Currency Exchange Id';
  modalRef.componentInstance.idValue = this.currencyExchangeData?.CurrencyExchangeSid;
}

openAuthority() {
  if (!this.currencyExchangeData) return;
  const modalRef = this.modalService.open(AuthorityEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.currencyExchangeData;
  modalRef.componentInstance.idLabel = 'Currency Exchange Id';
  modalRef.componentInstance.idValue = this.currencyExchangeData?.CurrencyExchangeSid;
}

openEDoc() {
  if (!this.currencyExchangeData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.currencyExchangeData;
  modalRef.componentInstance.idLabel = 'Currency Exchange Id';
  modalRef.componentInstance.idValue = this.currencyExchangeData?.CurrencyExchangeSid;
const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.CurrencyExchangeSid
  }

      this.commonService.documentData.set(data)
}

openDocRef() {
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);  
    modalRef.componentInstance.DocumentSid = this.CurrencyExchangeSid;
  }

openFollowup() {
  
}
 ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.commonService.clearDocumentData()
 }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.onSubmit(resolve);
    });
  }

  private subscribeToFormChanges() {
    this.currencyExchangeForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(
          this.initialFormValue,
          this.currencyExchangeForm.getRawValue()
        );
      });
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) return null;

    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) {
      return Number(value);
    }

    if (typeof value === 'number') {
      return Number(value.toFixed(6));
    }

    if (Array.isArray(value)) {
      return value.map(v => this.normalizeValue(v));
    }

    if (typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((acc: any, key) => {
          acc[key] = this.normalizeValue(value[key]);
          return acc;
        }, {});
    }

    return value;
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
  }

 nagivateback() {
    this.router.navigate(['accounts/currency-exchange/entry']);
  }
}
