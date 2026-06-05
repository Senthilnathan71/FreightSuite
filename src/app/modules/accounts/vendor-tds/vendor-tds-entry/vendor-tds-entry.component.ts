import { CommonModule } from '@angular/common';
import { Component, HostListener, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AccountsService } from '../../accounts.service';
import { debounceTime, firstValueFrom, forkJoin, Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { errorLoggerWithToastr, ValidationMessageConfig } from 'src/app/common/error-handling/form-error-handler';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { TdsHelperService } from 'src/app/modules/accounts/services/tds-helper.service';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';

@Component({
  selector: 'app-vendor-tds-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    FeatherModule,
    ReactiveFormsModule,
    CommonModule,
    NgbDatepickerModule,
    DecimalPrecisionDirective,
    OnlyNumbersDirective,
    TextWithNumbersDirective,
    NgbDropdownModule,
    SearchableDropdown,
    ElementStateGuardDirective,
    FormStateGuardDirective
  ],
  templateUrl: './vendor-tds-entry.component.html',
  styleUrl: './vendor-tds-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    TdsHelperService,
  ],
})
export class VendorTdsEntryComponent implements HasUnsavedChanges {
    private destroy$ = new Subject<void>();
  

  SupplierTdsMappingSid: number;
  isEditMode: boolean;
  userData: any;
  supplierTDSdata: any;
  deleteToggler = false;
  CustomerLookupConfig = DROPDOWN_CONFIGS.VENDOR_SUPPLIER;
  supplierTDSForm!: FormGroup;
  supplierList: any[] = [];
  tdsList: any[] = [];
  cusBranchList: any[] = [];

  // Customer classification — drives the TDS Matrix on the Applicable Rate column.
  customerCountrySid: number | null = null;
  customerCountryName = '';
  customerCompanyType = '';
  customerRegistrationNo = '';
  customerPanName = '';
  private tdsRatesCache = new Map<number, any[]>();

  // Datepicker related variable
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
  currentMenuId: number;
  TandCList: any;
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;

  tdsValidationConfig: ValidationMessageConfig = {
    labels: {
      CustomerMasterSid: 'Ledger Name',
      TDSSetHeaderSid: 'TDS Set Name',
      CustomerBranchSid: 'Branch',
      TransactionLimit: 'Transaction Limit',
      CertificatePercentage: 'Certificate %',
      CertificateAmt: 'Certificate Amount',
      EffectiveFrom: 'Effective From',
      EffectiveTo: 'Effective To',
    },
    messages: {
      min: (label) => `${label} must be greater than zero`,
    },
  };


  constructor(
    private fb: FormBuilder,
    private currRoute: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private calendar: NgbCalendar,
    private accountService: AccountsService,
    private modalService : NgbModal,
    public dropdownStore: DropdownStore,
    public mps: MenuPermissionService,
    private toastr: ToastrService,
    private tdsHelper: TdsHelperService,
  ) { }

  getBranchName(sid: number): string {
    return this.cusBranchList.find(b => b.CustomerBranchSid === sid)?.BranchName ?? '';
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    this.mps.init().subscribe();
    this.initTdsForm();
    this.loadLookUps();
    this.currRoute.paramMap.subscribe(
      (param) => {
        this.SupplierTdsMappingSid = +param.get('id');
        if (this.SupplierTdsMappingSid) {
          this.isEditMode = true;
          this.supplierTDSForm.get('CustomerMasterSid')?.disable();
          this.minEffectiveFromDate = undefined;
          this.loadSupplierTDS();
        } else {
          this.supplierTDSForm.get('CustomerMasterSid')?.enable();
          this.addTDSDetail();
        }
      }
    );
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
		}
    if (!this.isEditMode) {
      this.minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
    }

    setTimeout(() => {
      this.initialFormValue = this.supplierTDSForm.getRawValue();
      this.supplierTDSForm.markAsPristine();
      this.subscribeToFormChanges();
    }, 0);
  }


  initTdsForm() {
    this.supplierTDSForm = this.fb.group({
      CustomerMasterSid: [null, [Validators.required]],
      TDSDetail: this.fb.array([]),
      Status: ['Active'],
      CompanyType: [{ value: '', disabled: true }],
      VendorName: [{ value: '', disabled: true }],
      PanNO: [{ value: '', disabled: true }],
      CountryName: [{ value: '', disabled: true }],
    });
  }

  get tdsDetailArray(): FormArray {
    return this.supplierTDSForm.get('TDSDetail') as FormArray;
  }

  removeTDSDetail(index: number) {
    this.tdsDetailArray.removeAt(index);
  }

  addTDSDetail(branchSid?: number, savedData?: any, _branchRegistered?: string) {
    // New rows always start with TaxExempt unchecked. Saved rows preserve their value.
    const isExempt = savedData ? savedData.TaxExempt === 'Y' : false;
    const tdsDetailGroup = this.fb.group({
      SupplierTdsMappingSid: [savedData?.SupplierTdsMappingSid ?? null],
      CustomerBranchSid: [branchSid ?? this.cusBranchList[0]?.CustomerBranchSid ?? null, [Validators.required]],
      TDSSetHeaderSid: [savedData?.TDSSetHeaderSid ?? null, [Validators.required]],
      ITSecCode: [savedData?.ITSecCode ?? ''],
      TaxExempt: [isExempt],
      TransactionLimit: [savedData?.TransactionLimit ?? '', [Validators.required, Validators.max(10000000)]],
      CertificateNo: [savedData?.CertificateNo ?? ''],
      CertificatePercentage: [savedData?.CertificatePercentage ?? ''],
      CertificateAmt: [savedData?.CertificateAmt ?? ''],
      EffectiveFrom: [savedData?.EffectiveFrom ? new Date(savedData.EffectiveFrom) : null],
      EffectiveTo: [savedData?.EffectiveTo ? new Date(savedData.EffectiveTo) : null],
    });
    this.bindTaxExemptValidation(tdsDetailGroup);
    this.tdsDetailArray.push(tdsDetailGroup);
  }

  private bindTaxExemptValidation(group: FormGroup): void {
    const requiredWhenExempt = [
      'CertificateNo',
      'CertificatePercentage',
      'CertificateAmt',
      'EffectiveFrom',
      'EffectiveTo',
    ];
    const positiveWhenExempt = ['CertificatePercentage', 'CertificateAmt'];
    // minValidator must be a stable reference — Validators.min() creates a new function each
    // call so addValidators/removeValidators can never find and remove it after toggling.
    const minValidator = Validators.min(0.01);

    const updateValidators = (isExempt: boolean) => {
      requiredWhenExempt.forEach(field => {
        const ctrl = group.get(field)!;
        if (isExempt) ctrl.addValidators(Validators.required);
        else ctrl.removeValidators(Validators.required);
        ctrl.updateValueAndValidity({ emitEvent: false });
      });
      positiveWhenExempt.forEach(field => {
        const ctrl = group.get(field)!;
        if (isExempt) ctrl.addValidators(minValidator);
        else ctrl.removeValidators(minValidator);
        ctrl.updateValueAndValidity({ emitEvent: false });
      });
    };

    updateValidators(group.get('TaxExempt')!.value);
    group.get('TaxExempt')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(updateValidators);
  }

  // loadLookUps() {    
  //   const payload={
  //     CompanyMasterSid:this.currentCompany?.CompanyMasterSid,
  //     types: ['vendor', 'transporter', 'agent']
  //   }
  //   this.dropdownStore.loadCustomerTypeData(payload).subscribe();
  //   this.dropdownStore.loadtdsSet(Number(this.currentCompany?.CompanyMasterSid)).subscribe();
  // }

  loadLookUps() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin({
      suppliers: this.accountService.getAllSuppliers(CompanyMasterSid),
      tdsSet: this.accountService.getAllTDSSet(),
    }).subscribe(({ suppliers, tdsSet }) => {
      this.supplierList = suppliers.data;
      this.tdsList = tdsSet.data;
    });
  }

  loadSupplierTDS() {
    this.accountService.getSupplierTDSById(this.SupplierTdsMappingSid).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          const response = resp.data;
          this.supplierTDSdata = response;
          this.supplierTDSForm.patchValue({
            CustomerMasterSid: response.CustomerMasterSid,
            Status: response.Status === 'A' ? 'Active' : 'Suspended',
            VendorName: response.customerMaster?.CustomerName || '',
            PanNO: response.customerMaster?.PanType || response.customerMaster?.PanName || '',
            CompanyType: response.customerMaster?.CompanyType || '',
            CountryName: response.customerMaster?.countryMaster?.countryName || '',
          });
          const cm = response.customerMaster;
          this.customerCountrySid = cm?.CountryMasterSid ?? null;
          this.customerCountryName = cm?.countryMaster?.countryName ?? '';
          this.customerCompanyType = cm?.CompanyType ?? '';
          this.customerRegistrationNo = cm?.RegistrationNo ?? '';
          this.customerPanName = cm?.PanName ?? cm?.PanType ?? '';
          this.tdsRatesCache.clear();
          this.reloadTdsByCompanyType(cm?.CompanyType, this.customerCountrySid ?? undefined);
          this.loadAllBranchMappingsForEdit(response.CustomerMasterSid);
        } else {
          this.appSettingService.showError('Error loading supplier TDS');
        }
      },
      error: (error: any) => console.error(error),
    });
  }

  private reloadTdsByCompanyType(companyType?: string, countryMasterSid?: number): void {
    this.accountService.getAllTDSSet(companyType, countryMasterSid).subscribe({
      next: (resp: any) => { if (resp.status) this.tdsList = resp.data; },
      error: (err) => console.error(err),
    });
  }

  private loadAllBranchMappingsForEdit(CustomerMasterSid: number): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin({
      branches: this.accountService.getCustomerBranchByCusId(CustomerMasterSid),
      mappings: this.accountService.getSupplierTDSByCustomer({ CustomerMasterSid, CompanyMasterSid }),
    }).subscribe(({ branches, mappings }: any) => {
      this.cusBranchList = branches.data || [];
      const existingMappings: any[] = mappings.data || [];
      this.tdsDetailArray.clear();
      this.cusBranchList.forEach(branch => {
        const saved = existingMappings.find(m => m.CustomerBranchSid === branch.CustomerBranchSid) ?? null;
        this.addTDSDetail(branch.CustomerBranchSid, saved, branch.Registered);
      });
      // Prime rate cache for any TDSSetHeaderSid that arrived with saved data so
      // the Applicable Rate column renders without the user reopening each dropdown.
      const uniqueHeaderSids = Array.from(new Set(
        existingMappings
          .map(m => Number(m.TDSSetHeaderSid))
          .filter(sid => Number.isFinite(sid) && sid > 0),
      ));
      uniqueHeaderSids.forEach(sid => {
        if (this.tdsRatesCache.has(sid)) return;
        this.accountService.getTDSDetailByHeader(sid).subscribe({
          next: (resp: any) => {
            if (resp?.status) this.tdsRatesCache.set(sid, resp.data || []);
          },
        });
      });
      setTimeout(() => {
        this.initialFormValue = this.supplierTDSForm.getRawValue();
        this.isDirty = false;
        this.supplierTDSForm.markAsPristine();
      }, 0);
    });
  }


  async onSubmit(resolve?: (value: boolean) => void) {
    if (this.isSaving) { if (resolve) resolve(false); return; }

    const raw = this.supplierTDSForm.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.supplierTDSForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }
    if (this.supplierTDSForm.invalid) {
      this.supplierTDSForm.markAllAsTouched();
      this.supplierTDSForm.updateValueAndValidity();
      errorLoggerWithToastr(this.supplierTDSForm, this.toastr, this.tdsValidationConfig);
      if (resolve) resolve(false);
      return;
    }

    this.isSaving = true;
    this.supplierTDSForm.get('CompanyType')?.enable();
    const formValue = this.supplierTDSForm.getRawValue();
    const currUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const Status = formValue.Status === 'Active' ? 'A' : 'S';

    if (!this.isEditMode) {
      const dupCheck: any = await firstValueFrom(
        this.accountService.getSupplierTDSByCustomer({
          CustomerMasterSid: formValue.CustomerMasterSid,
          CompanyMasterSid,
        }),
      );
      if (dupCheck?.data?.length > 0) {
        this.appSettingService.showError('A TDS mapping already exists for this supplier.');
        this.isSaving = false;
        if (resolve) resolve(false);
        return;
      }
    }

    const rows: any[] = this.tdsDetailArray.getRawValue();

    const buildPayload = (row: any) => ({
      CompanyMasterSid,
      CustomerMasterSid: formValue.CustomerMasterSid,
      CustomerBranchSid: row.CustomerBranchSid,
      TDSSetHeaderSid: row.TDSSetHeaderSid,
      CompanyType: formValue.CompanyType,
      ITSecCode: row.ITSecCode,
      TaxExempt: row.TaxExempt ? 'Y' : 'N',
      TransactionLimit: parseFloat(row.TransactionLimit) || 0,
      CertificateNo: row.CertificateNo,
      CertificatePercentage: parseFloat(row.CertificatePercentage) || 0,
      CertificateAmt: row.CertificateAmt,
      EffectiveFrom: row.EffectiveFrom,
      EffectiveTo: row.EffectiveTo,
      Status,
    });

    const newRows = rows.filter(r => !(this.isEditMode && r.SupplierTdsMappingSid));
    const updateRows = rows.filter(r => this.isEditMode && !!r.SupplierTdsMappingSid);

    const saveOps: any[] = [];

    if (newRows.length > 0) {
      // All new rows created in one atomic transaction.
      saveOps.push(
        this.accountService.createSupplierTDSBatch(
          newRows.map(r => ({ ...buildPayload(r), CreatedBy: currUserEmail }))
        )
      );
    }

    if (updateRows.length > 0) {
      // All updates sent as a single atomic transaction.
      saveOps.push(
        this.accountService.updateSupplierTDSBatch(
          updateRows.map(r => ({
            SupplierTdsMappingSid: r.SupplierTdsMappingSid,
            payload: { ...buildPayload(r), UpdatedBy: currUserEmail },
          }))
        )
      );
    }

    forkJoin(saveOps).subscribe({
      next: (results: any[]) => {
        this.isSaving = false;
        const failed = results.find(r => !r.status);
        if (!failed) {
          this.appSettingService.showSuccess('Saved successfully');
          this.isDirty = false;
          this.initialFormValue = this.supplierTDSForm.getRawValue();
          this.supplierTDSForm.markAsPristine();
          // Batch result is an array; first individual update result has .data.SupplierTdsMappingSid
          const batchData = Array.isArray(results[0]?.data) ? results[0].data : null;
          const firstSid = batchData?.[0]?.SupplierTdsMappingSid
            ?? results[0]?.data?.SupplierTdsMappingSid
            ?? this.SupplierTdsMappingSid;
          this.router.navigate(['/accounts/supplier-tds/entry', firstSid]);
          if (resolve) resolve(true);
        } else {
          this.appSettingService.showError(failed.message || 'Save failed');
          if (resolve) resolve(false);
        }
      },
      error: () => { this.isSaving = false; if (resolve) resolve(false); },
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    return !!this.supplierTDSForm && (this.isDirty || this.supplierTDSForm.dirty);
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.onSubmit(resolve);
    });
  }

  subscribeToFormChanges() {
    this.supplierTDSForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(this.initialFormValue, this.supplierTDSForm.getRawValue());
      });
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) return Number(value);
    if (typeof value === 'number') return Number(value.toFixed(6));
    if (Array.isArray(value)) return value.map(v => this.normalizeValue(v));
    if (typeof value === 'object') {
      return Object.keys(value).sort().reduce((acc: any, key) => {
        acc[key] = this.normalizeValue(value[key]);
        return acc;
      }, {});
    }
    return value;
  }

  deepEqual(obj1: any, obj2: any): boolean {
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
  }


openAuditLogs() {
        if (!this.SupplierTdsMappingSid) return;
        const modalRef = this.modalService.open(AuditLogComponent, {
          centered: true,
          scrollable: true,
          size: 'xl',
          windowClass: 'audit-log-modal'
        });
        modalRef.componentInstance.title = 'Supplier Tds Mapping Logs';
        modalRef.componentInstance.tableName = 'SupplierTdsMapping';
        modalRef.componentInstance.recordId = this.SupplierTdsMappingSid.toString();
        modalRef.componentInstance.screenName = 'SupplierTdsMapping';
      }


  handleLedgerChange(ledger: any) {
    this.supplierTDSForm.get('VendorName')?.setValue(ledger?.CustomerName || '');
    this.supplierTDSForm.get('PanNO')?.setValue(ledger?.PanType || ledger?.PanName || '');
    this.supplierTDSForm.get('CompanyType')?.setValue(ledger?.CompanyType || '');
    this.supplierTDSForm.get('CountryName')?.setValue(ledger?.countryMaster?.countryName || ledger?.CountryName || '');

    if (!ledger || ledger.CustomerMasterSid === undefined) {
      this.cusBranchList = [];
      this.tdsDetailArray.clear();
      this.tdsList = [];
      this.resetCustomerClassification();
      return;
    }

    this.customerCountrySid = ledger?.CountryMasterSid ?? null;
    this.customerCountryName = ledger?.CountryName ?? ledger?.countryMaster?.countryName ?? '';
    this.customerCompanyType = ledger?.CompanyType ?? '';
    this.customerRegistrationNo = ledger?.RegistrationNo ?? '';
    this.customerPanName = ledger?.PanName ?? ledger?.PanType ?? '';
    this.tdsRatesCache.clear();

    this.reloadTdsByCompanyType(ledger?.CompanyType, this.customerCountrySid ?? undefined);

    this.accountService.getCustomerBranchByCusId(ledger.CustomerMasterSid).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.cusBranchList = resp.data || [];
          if (!this.isEditMode) {
            this.tdsDetailArray.clear();
            this.cusBranchList.forEach(branch =>
              this.addTDSDetail(branch.CustomerBranchSid, null, branch.Registered),
            );
          }
        } else {
          this.appSettingService.showError('Error loading Customer Branch');
          this.cusBranchList = [];
        }
      },
      error: (err) => {
        console.error(err);
        this.cusBranchList = [];
      },
    });
  }

  private resetCustomerClassification(): void {
    this.customerCountrySid = null;
    this.customerCountryName = '';
    this.customerCompanyType = '';
    this.customerRegistrationNo = '';
    this.customerPanName = '';
    this.tdsRatesCache.clear();
  }

  handleTDSChange(tds: any, detailIndex: number) {
    if(tds === undefined || tds.TDSSetHeaderSid === undefined){
      this.tdsDetailArray.at(detailIndex).get('ITSecCode').setValue('');
      return;
    }
    this.accountService.getTDSDetailByHeader(tds.TDSSetHeaderSid).subscribe({
      next :(resp: any) => {
        if (resp.status) {
          this.tdsRatesCache.set(tds.TDSSetHeaderSid, resp.data || []);
          if (resp.data.length > 0) {
            const ITSecCode = resp.data[0].ITSectionCode
            this.tdsDetailArray.at(detailIndex).get('ITSecCode').setValue(ITSecCode);
          } else {
            this.tdsDetailArray.at(detailIndex).get('ITSecCode').setValue('');
          }
        } else {
          this.tdsDetailArray.at(detailIndex).get('ITSecCode').setValue('');
          this.appSettingService.showError('Error loading ITSecCode');
        }
      },
      error : (error:any) => {
        this.tdsDetailArray.at(detailIndex).get('ITSecCode').setValue('');
        console.error(error);
      }
    })
  }

  // Resolves the base rate for a row from the cache, using TdsHelperService.
  private getBaseRateForRow(headerSid: any): number | null {
    if (!headerSid) return null;
    const rates = this.tdsRatesCache.get(Number(headerSid)) || [];
    return this.tdsHelper.lookupBaseRate(rates, this.customerCompanyType, this.customerCountrySid);
  }

  // Extracts the shared matrix inputs for a given row index.
  private rateParamsForRow(index: number) {
    const row = this.tdsDetailArray.at(index);
    return {
      row,
      isExempt: !!row?.get('TaxExempt')?.value,
      certPct: Number(row?.get('CertificatePercentage')?.value),
      isLocal: (this.customerCountryName || '').trim().toLowerCase() === 'india',
      isSpecified: !!this.customerCompanyType || !!this.customerRegistrationNo,
      hasPAN: !!this.customerPanName,
      baseRate: this.getBaseRateForRow(row?.get('TDSSetHeaderSid')?.value),
    };
  }

  // Cell value — delegates matrix computation to TdsHelperService.
  computeApplicableRate(index: number): string {
    const { row, isExempt, certPct, isLocal, isSpecified, hasPAN, baseRate } = this.rateParamsForRow(index);
    if (!row) return '-';

    if (isExempt && !(certPct > 0)) return 'Cert %';

    const rate = this.tdsHelper.computeApplicableRate({ isLocal, isSpecified, hasPAN, isExempt, certPct, baseRate });
    if (rate === null) return '-';

    const isCertRate = isExempt && certPct > 0 && (!isSpecified || hasPAN) && (isLocal ? !isSpecified || hasPAN : true);
    return isCertRate && !isSpecified && hasPAN ? `Cert ${rate}%` : `${rate}%`;
  }

  // Tooltip — structured derivation: classification · master rate context · formula breakdown.
  getApplicableRateExplanation(index: number): string {
    const { row, isExempt, certPct, isLocal, isSpecified, hasPAN, baseRate } = this.rateParamsForRow(index);
    if (!row) return '';

    if (isExempt && !(certPct > 0)) return 'Enter Certificate % to compute the reduced rate.';

    const cap = (r: number) => this.tdsHelper.capRate(r);

    // Line 1 — vendor classification
    const origin = isLocal ? 'Local' : 'Foreign';
    const classificationParts: string[] = [origin];
    if (isLocal) {
      classificationParts.push(isSpecified ? 'Specified' : 'Non-Specified');
      classificationParts.push(hasPAN ? 'PAN available' : 'No PAN');
    }
    classificationParts.push(isExempt ? 'Certificate available' : 'No Certificate');
    const line1 = classificationParts.join(' - ');

    // Line 2 — master rate source
    const headerSid = row?.get('TDSSetHeaderSid')?.value;
    const tdsSet = this.tdsList.find((t: any) => Number(t.TDSSetHeaderSid) === Number(headerSid));
    const tdsSetName = tdsSet?.TDSSetName ?? 'Unknown TDS Set';
    const companyTypePart = this.customerCompanyType ? ` = ${this.customerCompanyType}` : '';
    const masterRateDisplay = baseRate != null ? `${baseRate}%` : 'N/A';
    const line2 = `Master Rate = ${tdsSetName}${companyTypePart} = ${masterRateDisplay}`;

    // Lines 3-5 — formula template · substituted values · result
    let formulaTemplate = '';
    let formulaValues = '';
    let resultLine = '';

    if (!isLocal) {
      if (isExempt) {
        const r = cap(certPct);
        formulaTemplate = '= Certificate Rate';
        resultLine = `= ${r}%`;
      } else {
        formulaTemplate = '= Master Rate';
        resultLine = baseRate != null ? `= ${baseRate}%` : '= N/A';
      }
    } else if (isSpecified) {
      if (hasPAN) {
        if (isExempt) {
          const d = cap(certPct * 2);
          const final = Math.max(5, d);
          formulaTemplate = '= max(Certificate × 2, 5%)';
          formulaValues   = `= max(${d}%, 5%)`;
          resultLine      = `= ${final}%`;
        } else {
          if (baseRate == null) return `${line1}\n${line2}\nNo matching master rate in TDS Set.`;
          const d = cap(baseRate * 2);
          const final = Math.max(5, d);
          formulaTemplate = '= max(Master Rate × 2, 5%)';
          formulaValues   = `= max(${d}%, 5%)`;
          resultLine      = `= ${final}%`;
        }
      } else {
        if (isExempt) {
          const d = cap(certPct * 2);
          const final = Math.max(d, 20);
          formulaTemplate = '= max(Certificate × 2, 20%)';
          formulaValues   = `= max(${d}%, 20%)`;
          resultLine      = `= ${final}%`;
        } else {
          if (baseRate == null) return `${line1}\n${line2}\nNo matching master rate in TDS Set.`;
          const d = cap(baseRate * 2);
          const final = Math.max(d, 20);
          formulaTemplate = '= max(Master Rate × 2, 20%)';
          formulaValues   = `= max(${d}%, 20%)`;
          resultLine      = `= ${final}%`;
        }
      }
    } else {
      // Non-Specified
      if (hasPAN) {
        if (isExempt) {
          const r = cap(certPct);
          formulaTemplate = '= Certificate Rate';
          resultLine = `= ${r}%`;
        } else {
          formulaTemplate = '= Master Rate';
          resultLine = baseRate != null ? `= ${baseRate}%` : '= N/A';
        }
      } else {
        if (isExempt) {
          const c = cap(certPct);
          const final = Math.max(c, 20);
          formulaTemplate = '= max(Certificate Rate, 20%)';
          formulaValues   = `= max(${c}%, 20%)`;
          resultLine      = `= ${final}%`;
        } else if (baseRate == null) {
          formulaTemplate = '= 20% (Sec 206AA floor — no PAN)';
          resultLine      = '= 20%';
        } else {
          const final = Math.max(baseRate, 20);
          formulaTemplate = '= max(Master Rate, 20%)';
          formulaValues   = `= max(${baseRate}%, 20%)`;
          resultLine      = `= ${final}%`;
        }
      }
    }

    const lines = [line1, line2, formulaTemplate];
    if (formulaValues) lines.push(formulaValues);
    lines.push(resultLine);
    return lines.join('\n');
  }

  preventTableTouch(event: Event): void {
    const target = event.target as HTMLElement;
    // Only stop propagation if the click is not on a form control
    if (!target.closest('input, select, ng-select')) {
      event.stopPropagation();
    }
  }

  toggleCheckBox(event: Event, tdsDetailIndex: number) {
    const element = event.target as HTMLInputElement;
    element.checked = !element.checked;
    const tdsDetail = this.tdsDetailArray.at(tdsDetailIndex) as FormGroup;
    tdsDetail.get('TaxExempt')?.setValue(!tdsDetail.get('TaxExempt')?.value);
    tdsDetail.get('TaxExempt')?.updateValueAndValidity();
  }

  toNgbDateStruct(date: Date | null): NgbDateStruct | null {
    if (!date) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  toggleDelete() {
    this.deleteToggler = !this.deleteToggler;
  }

  navigateBack() {
    this.router.navigate(['/accounts/supplier-tds/list']);
  }

  showInfo() {
    if (!this.supplierTDSdata) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.supplierTDSdata;
    modalRef.componentInstance.idLabel = 'Supplier TDS Mapping Id';
    modalRef.componentInstance.idValue = this.supplierTDSdata?.SupplierTdsMappingSid;
  }

  // openTandC() {
  //     this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  //     const payload = { MenuMasterSid: this.currentMenuId };
  //     this.accountService.getTandCByCondition(payload).subscribe(
  //       (resp: any) => {
  //         if (resp.status) {
  //           this.TandCList = resp.data;
  //           const modalRef = this.modalService.open(TermsAndConditionsComponent, {
  //             size: 'lg',
  //             backdrop: 'static',
  //             centered: true
  //           });
  //           modalRef.componentInstance.terms = this.TandCList;
  //           modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
  //           modalRef.componentInstance.DocumentSid = this.SupplierTdsMappingSid;
  
  //         } else {
  //           this.appSettingService.showError('Error loading Terms and Conditions');
  //         }
  //       },
  //       (error) => {
  //         this.appSettingService.showError('Error loading Terms and Conditions', error);
  //       }
  //     );
  //   }
  
    openEmail() {
      if (!this.supplierTDSdata) return;
      const modalRef = this.modalService.open(EmailEntryComponent, {
        size: 'lg',
        centered: true,
        backdrop: 'static'
      });
      modalRef.componentInstance.item = this.supplierTDSdata;
    modalRef.componentInstance.idLabel = 'Supplier TDS Mapping Id';
    modalRef.componentInstance.idValue = this.supplierTDSdata?.SupplierTdsMappingSid;
    }
  
  
      openAuthority() {
      if (!this.supplierTDSdata) return;
      const modalRef = this.modalService.open(AuthorityLogComponent, {
        size: 'lg',
        centered: true,
        backdrop: 'static'
      });
      modalRef.componentInstance.item = this.supplierTDSdata;
      modalRef.componentInstance.idLabel = 'Supplier TDS Mapping Id';
      modalRef.componentInstance.idValue = this.supplierTDSdata?.SupplierTdsMappingSid;
    }
  
    openEDoc() {
      if (!this.supplierTDSdata) return;
      const modalRef = this.modalService.open(EdocComponent, {
        size: 'lg',
        centered: true,
        backdrop: 'static'
      });
      modalRef.componentInstance.item = this.supplierTDSdata;
      modalRef.componentInstance.idLabel = 'Supplier TDS Mapping Id';
      modalRef.componentInstance.idValue = this.supplierTDSdata?.SupplierTdsMappingSid;
      const data:any={
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid : this.MenuMasterSid,
      DocumentSid: this.supplierTDSdata?.SupplierTdsMappingSid

      }
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
    modalRef.componentInstance.DocumentSid = this.supplierTDSdata?.SupplierTdsMappingSid;
  }

    openFollowup(){

    }

  // onReset() {
  //   this.supplierTDSForm.reset({
  //     Status: 'Active',
  //   });
  //   this.tdsDetailArray.clear();
  //   this.addTDSDetail();
  // }
  onReset() {
  // If editing an existing supplier TDS, reload it (restore original state)
  if (this.isEditMode && this.SupplierTdsMappingSid) {
    this.loadSupplierTDS();
    return;
  }

  // Create-mode: reset main form to sensible defaults
  this.supplierTDSForm.reset({
    CustomerMasterSid: null,
    Status: 'Active',
    CompanyType: '',
    VendorName: '',
    PanNO: '',
    CountryName: ''
  });

  // Clear and reset TDS detail array
  this.tdsDetailArray.clear();
  this.addTDSDetail();

  // Reset supplier and branch data
  this.cusBranchList = [];
  this.resetCustomerClassification();

  // Reset min date to today for new entries
  this.minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);

  // Clear form validation states
  this.supplierTDSForm.markAsUntouched();
  this.supplierTDSForm.markAsPristine();
  this.initialFormValue = this.supplierTDSForm.getRawValue();
  this.isDirty = false;
  this.supplierTDSForm.updateValueAndValidity();

  // Reset delete toggler if active
  this.deleteToggler = false;
}


ngOnDestroy(): void {
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
  }
  
}
