import { Component, HostListener, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Currency } from 'src/app/modules/crm-mobile/Interfaces/currency.interface';
import { NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { debounceTime, forkJoin, Subject, takeUntil } from 'rxjs';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';

@Component({
  selector: 'app-currency-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    DatePipe,
    NgSelectModule,
    NgbDropdownModule,
    SearchableDropdown,
    OnlyTextDirective,
    TextWithNumbersDirective
  ],
  templateUrl: './currency-entry.component.html',
  styleUrls: ['./currency-entry.component.scss']
})
export class CurrencyEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  currencyForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  currencyID: number;
  loading = false;
  currencyData: any;
  userData:any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  countryList: any[] = [];
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];
  currentMenuId: any;
  TandCList: any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  isDirty = false;
  isSaving = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();
  private formChangesSubscribed = false;
  // currencylookupCofig ={
  //   displayFields : ['countryCode', 'countryName'],
  //   displayLabels : ['Code', 'Name'],
  //   labelFields :['countryCode', 'countryName'],
  // }
  countryLookupConfig = DROPDOWN_CONFIGS.COUNTRY;


  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private modalService : NgbModal,
    private commonService: CommonService,
    public mps : MenuPermissionService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.mps.init().subscribe();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
	this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.currencyID = +params['id'];
        this.isEditMode = true;
        this.getCurrencyById(this.currencyID);
      }
    });

    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //      
    //     }
    //   }
    // )
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if(userProfile){
			this.userData = userProfile;
     
		}
    this.loadlookup();
    if (!this.isEditMode) {
      this.initialFormValue = this.currencyForm.getRawValue();
      this.subscribeToFormChanges();
    }
  }

  

hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc','Authority', 'Email', 'Document Reference'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }
    
  initForm() {
    this.currencyForm = this.fb.group({
      CountryMasterSid:['',[Validators.required]],
      currencyName: ['', [
        Validators.required, 
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z\s]*$/)
      ]],
      currencyCode: ['', [
        Validators.required,
        Validators.maxLength(3),
        Validators.pattern(/^[A-Z]{3}$/)
      ]],

      CurrencyUnit: ['', [
        Validators.required, 
        Validators.maxLength(50)
      ]],
      CurrencySubUnit: ['', [
        Validators.maxLength(50)
      ]],
      SubUnitIn: ['', [
     
      Validators.maxLength(3) 
    ]],
      ShortCode: ['', [
        Validators.maxLength(3)
      ]],
      Symbol: ['', [
        Validators.required, 
        Validators.maxLength(5)
      ]],
      amountDecimal: [2, [
        Validators.required,
        Validators.min(0),
        Validators.max(8),
        Validators.pattern(/^\d+$/)
      ]],
      exchangeDecimal: [4, [
        Validators.required,
        Validators.min(0),
        Validators.max(8),
        Validators.pattern(/^\d+$/)
      ]],
      RoundOf: ['', [
        Validators.maxLength(100)
      ]],
      status: [{value: 'A', disabled: !this.isEditMode}, Validators.required]
    });

    // Add value change handlers for form controls
    this.setupValueChangeHandlers();
  }

  setupValueChangeHandlers() {
  this.currencyForm.get('SubUnitIn')?.valueChanges.subscribe(val => {
    if (val && !/^[1-9]\d{0,2}$/.test(val)) {
      this.currencyForm.get('SubUnitIn')?.setValue('', { emitEvent: false });
    }
  });


    this.currencyForm.get('ShortCode')?.valueChanges.subscribe(val => {
      if (val) {
        const upperVal = val.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
        if (upperVal !== val) {
          this.currencyForm.get('ShortCode')?.setValue(upperVal, { emitEvent: false });
        }
      }
    });

    this.currencyForm.get('currencyName')?.valueChanges.subscribe(val => {
      if (val) {
        const cleanVal = val.replace(/[^a-zA-Z\s]/g, '');
        if (cleanVal !== val) {
          this.currencyForm.get('currencyName')?.setValue(cleanVal, { emitEvent: false });
        }
      }
    });

    this.currencyForm.get('SubUnitIn')?.valueChanges.subscribe(val => {
      if (val && (isNaN(val) || val < 1 || val > 1000)) {
        this.currencyForm.get('SubUnitIn')?.setValue(null, { emitEvent: false });
      }
    });
  }
loadlookup(){
  forkJoin({
    countries: this.masterService.getAllCountry(),
  }).subscribe(({countries})=>{
    this.countryList =countries.data;
  
  });
}
  getCurrencyById(id: number) {
    this.loading = true;
    this.masterService.getCurrencyById(id).subscribe({
      next: (currency: Currency) => {
        if (this.isEditMode) {
          this.currencyForm.get('status')?.enable();
        }
        this.currencyData = currency;
        this.currencyForm.patchValue({
          CountryMasterSid: currency.CountryMasterSid,
          currencyName: currency.currencyName,
          currencyCode: currency.currencyCode,
          CurrencyUnit: currency.CurrencyUnit, 
          CurrencySubUnit: currency.CurrencySubUnit,
          SubUnitIn: currency.SubUnitIn,
          ShortCode: currency.ShortCode,
          Symbol: currency.Symbol,
          amountDecimal: currency.amountDecimal,
          exchangeDecimal: currency.exchangeDecimal,
          RoundOf: currency.RoundOf,
          status: currency.status
        });
        this.initialFormValue = this.currencyForm.getRawValue();
        this.isDirty = false;
        this.subscribeToFormChanges();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading currency:', err);
        this.loading = false;
        this.appSettingService.showError('Failed to load currency data');
      }
    });
  }
  openAuditLogs() {
    if (!this.currencyData?.CurrencyMasterSid) return;
    const modalRef = this.modalService.open(AuditLogComponent, {
      centered: true,
      scrollable: true,
      size: 'xl',
      windowClass: 'audit-log-modal'
    });
    modalRef.componentInstance.title = 'Currency Logs';
    modalRef.componentInstance.tableName = 'CurrencyMaster';
    modalRef.componentInstance.recordId = this.currencyData?.CurrencyMasterSid.toString();
    modalRef.componentInstance.screenName = 'Currency';
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.onSubmit(resolve);
    });
  }

  onSubmit(resolve?: (value: boolean) => void) {
    if (this.isSaving) {
      if (resolve) resolve(false);
      return;
    }

    const raw = this.currencyForm.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.currencyForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    if (this.currencyForm.invalid) {
      this.markFormGroupTouched(this.currencyForm);
      if (resolve) resolve(false);
      return;
    }
  
    this.isSaving = true;
    this.btnDisable = true;
    this.loading = true;

    const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    
    const payload = {
      CountryMasterSid: this.currencyForm.value.CountryMasterSid,
      currencyName: this.currencyForm.value.currencyName,
      currencyCode: this.currencyForm.value.currencyCode,
      CurrencyUnit: this.currencyForm.value.CurrencyUnit,
      CurrencySubUnit: this.currencyForm.value.CurrencySubUnit,
      SubUnitIn: this.currencyForm.value.SubUnitIn !== null 
      ? String(this.currencyForm.value.SubUnitIn) 
      : null,
      ShortCode: this.currencyForm.value.ShortCode,
      Symbol: this.currencyForm.value.Symbol,
      amountDecimal: Number(this.currencyForm.value.amountDecimal),
      exchangeDecimal: Number(this.currencyForm.value.exchangeDecimal),
      RoundOf: this.currencyForm.value.RoundOf,
      status: this.currencyForm.value.status,
      ...(this.isEditMode ? {updatedBy : currentUserEmail} : {createdBy : currentUserEmail})
    };
  
    const operation = this.isEditMode 
      ? this.masterService.editCurrency(this.currencyID, payload)
      : this.masterService.createCurrency(payload);
  
    operation.subscribe({
      next: (resp) => {
        this.loading = false;
        this.btnDisable = false;
        this.isSaving = false;
      if (resp.status) {
        this.isDirty = false;
        this.initialFormValue = this.currencyForm.getRawValue();
        this.appSettingService.showSuccess(resp.message);
        if (resolve) resolve(true);
      } 
else {
        this.appSettingService.showError(resp.message);
        if (resolve) resolve(false);
      }

        this.router.navigate(['/master/currency/list']);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.btnDisable = false;
        this.isSaving = false;
        if (err.status === 400 && err.error.message.includes('already exists')) {
          this.appSettingService.showError(err.error.message);
        } else {
          this.appSettingService.showError('Failed to process currency. Please try again.');
        }
        if (resolve) resolve(false);
      }
    });
  }
  
  resetForm() {
    if (this.isEditMode) {
      this.getCurrencyById(this.currencyID);
    } else {
      this.currencyForm.reset({
        CountryMasterSid: '',
        currencyName: '',
        currencyCode: '',
        CurrencyUnit: '',
        CurrencySubUnit: '',
        SubUnitIn: null,
        ShortCode: '',
        Symbol: '',
        amountDecimal: 2,
        exchangeDecimal: 4,
        RoundOf: '',
        status: 'A'
      });
    }
  }

  goBack() {
    this.router.navigate(['master/currency/list']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  showInfo() {
    if (!this.currencyData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.currencyData;
    modalRef.componentInstance.idLabel = 'Currency Id';
    modalRef.componentInstance.idValue = this.currencyData?.CurrencyMasterSid;
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
  //         modalRef.componentInstance.DocumentSid = this.currencyID;

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
    if (!this.currencyData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
   const modalRef = this.modalService.open(AuthorityLogComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.currencyID;
  }

openEDoc() {
  if (!this.currencyData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.currencyData;
  modalRef.componentInstance.idLabel = 'Currency Id';
  modalRef.componentInstance.idValue = this.currencyData?.CurrencyMasterSid;
  const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.currencyID
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
    modalRef.componentInstance.DocumentSid = this.currencyID;
  }
 ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.commonService.clearDocumentData()
 }

navigateToCreateCurrency() {
    this.router.navigate(['master/currency/entry']);
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue =
        'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    return this.isDirty;
  }

  private subscribeToFormChanges() {
    if (this.formChangesSubscribed) return;
    this.formChangesSubscribed = true;
    this.currencyForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(
          this.initialFormValue,
          this.currencyForm.getRawValue()
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
      return value.map((v) => this.normalizeValue(v));
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
    return (
      JSON.stringify(this.normalizeValue(obj1)) ===
      JSON.stringify(this.normalizeValue(obj2))
    );
  }
}
