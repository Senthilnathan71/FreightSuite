import { Component, HostListener, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { MasterService } from 'src/app/modules/master/master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { finalize } from 'rxjs/operators';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';

@Component({
  selector: 'app-report-master-entry',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule, MultiSelectComponent, DetailsComponent, NgbDropdownModule,ElementStateGuardDirective,FormStateGuardDirective],
  templateUrl: './report-master-entry.component.html',
  styleUrls: ['./report-master-entry.component.scss']
})
export class ReportMasterEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  reportForm!: FormGroup;
  isEditMode: boolean = false;
  isSaving: boolean = false;
  isDirty: boolean = false;
  private initialFormValue: any = null;
  private isFormInitializing = false;
  private destroy$ = new Subject<void>();
  ReportMasterSid!: number;
  currentCompany: any;
  reportData: any;
  auditLogs: any[] = [];
  auditLogModalRef!: NgbModalRef;
  currentMenuId: number;
  TandCList: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  userData: any;
  eligibleCompanyOptions: any[] = [];
  excludedCompanyIds: number[] = [];

  modeofreportFormat = [
    { id: 1, name: "XL" },
    { id: 2, name: "PDF" },
    { id: 3, name: "BOTH" }
  ];

  modeofreportOrientation = [
    { id: 'P', name: "PORTRAIT" },
    { id: 'L', name: "LANDSCAPE" }
  ];

  modeofreportType = [
    { id: 1, name: "OPERATION" },
    { id: 2, name: "ACCOUNTS" },
    { id: 3, name: "MANAGEMENT" }
  ];
  reportMenus: any[] = [];

  parameterFieldTypes = [
    { value: 'TEXT', label: 'TEXT' },
    { value: 'NUMBER', label: 'NUMBER' },
    { value: 'DATE', label: 'DATE' },
    { value: 'EMAIL', label: 'EMAIL' },
    { value: 'TEXTAREA', label: 'TEXTAREA' },
    { value: 'DROPDOWN', label: 'DROPDOWN' },
    { value: 'DROPDOWN_M', label: 'DROPDOWN M' },
    { value: 'DROPDOWN_D', label: 'DROPDOWN D' },
    { value: 'CHECKBOX', label: 'CHECKBOX' },
    { value: 'RADIO', label: 'RADIO' },
    { value: 'FILE', label: 'FILE' },
    { value: 'URL', label: 'URL' },
    { value: 'PHONE', label: 'PHONE' },
  ];

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingsService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private appSettingService: AppSettingsService,
    public mps: MenuPermissionService,
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
    this.initForm();
    this.subscribeToFormChanges();
    this.menuDropdown();
    this.loadEligibleCompanies();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.ReportMasterSid = +id;
        this.isEditMode = true;
        this.loadReportData();
      } else {
        this.initialFormValue = this.reportForm.getRawValue();
        this.isDirty = false;
      }
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
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.onSubmit(resolve);
    });
  }

  private loadEligibleCompanies(): void {
  this.masterService.getAllCompanies().subscribe({
    next: (resp: any) => {
      const list = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
      const normalized = list
        .filter((c: any) => c?.status === 'A' || c?.Status === 'A' || c?.status === undefined)
        .map((c: any) => ({
          CompanyMasterSid: Number(c.CompanyMasterSid),
          companyName: c.companyName || c.CompanyName || `Company ${c.CompanyMasterSid}`,
          companyCode: c.companyCode || c.CompanyCode || ''
        }))
        .filter((c: any) => !!c.CompanyMasterSid);

      const dedupedMap = new Map<number, any>();
      normalized.forEach((c: any) => {
        if (!dedupedMap.has(c.CompanyMasterSid)) dedupedMap.set(c.CompanyMasterSid, c);
      });
      this.eligibleCompanyOptions = Array.from(dedupedMap.values());
    },
    error: () => { this.eligibleCompanyOptions = []; }
  });
}

  private parseExcludedCompanyIds(raw: any): number[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(Number).filter(Boolean);
  if (typeof raw === 'object' && Array.isArray(raw.company)) return raw.company.map(Number).filter(Boolean);
  if (typeof raw === 'string') return raw.split(',').map(s => Number(s.trim())).filter(Boolean);
  return [];
}

  private normalizeOrientationValue(value: any): 'P' | 'L' | '' {
    const normalized = String(value || '').trim().toUpperCase();
    if (normalized === 'P' || normalized === 'PORTRAIT') {
      return 'P';
    }
    if (normalized === 'L' || normalized === 'LANDSCAPE') {
      return 'L';
    }
    return '';
  }

  private subscribeToFormChanges(): void {
    this.reportForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        if (this.isFormInitializing) {
          return;
        }

        this.isDirty = !this.deepEqual(
          this.initialFormValue,
          this.reportForm.getRawValue()
        );
      });
  }

  get showOrientationField(): boolean {
    const format = String(this.reportForm?.get('reportFormatId')?.value || '').trim().toUpperCase();
    return format === 'PDF' || format === 'BOTH';
  }

  private updateOrientationValidation(): void {
    const orientationControl = this.reportForm.get('Orientation');
    if (!orientationControl) {
      return;
    }

    if (this.showOrientationField) {
      orientationControl.setValidators([Validators.required]);
    } else {
      orientationControl.setValue('', { emitEvent: false });
      orientationControl.clearValidators();
    }

    orientationControl.updateValueAndValidity({ emitEvent: false });
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }

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

  private deepEqual(a: any, b: any): boolean {
    return JSON.stringify(this.normalizeValue(a)) === JSON.stringify(this.normalizeValue(b));
  }

  initForm() {
    this.reportForm = this.fb.group({
      reportName: ['', Validators.required],
      displayName: ['', Validators.required],
      reportMenuId: [null, Validators.required],
      reportFormatId: [null, Validators.required],
      reportType: ["", Validators.required],
      Orientation: ["", Validators.required],
      Notes: [''],
      excludedCompanyIds: [[]],
      Status: ['A'],
      parameters: this.fb.array([])
    });

    this.reportForm.get('reportFormatId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateOrientationValidation());

    this.updateOrientationValidation();
  }

  // FormArray getter for parameters
  get parameters(): FormArray {
    return this.reportForm.get('parameters') as FormArray;
  }

  // Create a new parameter FormGroup
  createParameterGroup(data: any = {}): FormGroup {
    let dropDownValue = data.DropDownValue || '';
    if (dropDownValue && typeof dropDownValue === 'object') {
    dropDownValue = JSON.stringify(dropDownValue);
  }
  let validationRules = data.ValidationRules || '';
    if (validationRules && typeof validationRules === 'object') {
    validationRules = JSON.stringify(validationRules);
  }
    return this.fb.group({
      ReportMasterDetailSid: [data.ReportMasterDetailSid || null],
      ParameterName: [data.ParameterName || '', Validators.required],
      ParameterFieldType: [data.ParameterFieldType || '', Validators.required],
      DropDownValue: [dropDownValue],
      ValidationRules: [validationRules],
      ParameterQuery: [data.ParameterQuery || ''],
      DependsOnParameter: [data.DependsOnParameter || ''],
      Status: [data.Status || 'A']
    });
  }

  // Add a new parameter row
  addParameter(): void {
    this.parameters.push(this.createParameterGroup());
  }

  // Remove a parameter row
  removeParameter(index: number): void {
    this.parameters.removeAt(index);
  }

  menuDropdown() {
    this.masterService.getReportMenu().subscribe({
      next: (resp: any) => {
        this.reportMenus = resp;
      },
      error: () => {
        this.appSettingsService.showError('Failed to load report menus');
      }
    });
  }

  formatExcludedCompanies(data: any): string {
    if (!data) return '';
    if (Array.isArray(data)) return data.join(',');
    if (typeof data === 'object' && data.company && Array.isArray(data.company)) {
      return data.company.join(',');
    }
    return '';
  }

  private getErrorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }

  private getParameterValidationMessage(): string | null {
    const missingNames = this.parameters.controls.some(param => param.get('ParameterName')?.hasError('required'));
    const missingFieldTypes = this.parameters.controls.some(param => param.get('ParameterFieldType')?.hasError('required'));

    if (missingNames && missingFieldTypes) {
      return 'Please enter Parameter Name and Field Type for all report parameters.';
    }

    if (missingNames) {
      return 'Please enter Parameter Name for all report parameters.';
    }

    if (missingFieldTypes) {
      return 'Please select Field Type for all report parameters.';
    }

    return null;
  }

  loadReportData() {
    this.isFormInitializing = true;
    this.masterService.getReportMasterById(this.ReportMasterSid).subscribe({
      next: (resp: any) => {
        this.reportData = resp.data;

        this.reportForm.patchValue({
          reportName: resp.data.ReportName,
          displayName: resp.data.ReportDisplayName,
          reportMenuId: resp.data.ReportMenuSid,
          reportFormatId: resp.data.ReportFormat,
          reportType: resp.data.ReportType,
          Notes: resp.data.Notes,
          Orientation: this.normalizeOrientationValue(
            resp.data.Orientation ?? resp.data.ReportOrientation
          ),
          excludedCompanyIds: this.parseExcludedCompanyIds(resp.data.ReportExcludedCompany)
        });

        // Fetch and populate parameters
        this.masterService.getReportMasterWithParameters(this.ReportMasterSid).subscribe({
          next: (paramsResp: any) => {
            // Clear existing parameters
            this.parameters.clear();

            // Add each parameter to FormArray
            if (paramsResp.data && Array.isArray(paramsResp.data)) {
              paramsResp.data.forEach((param: any) => {
                this.parameters.push(this.createParameterGroup(param));
              });
            }

            this.initialFormValue = this.reportForm.getRawValue();
            this.isDirty = false;
            this.isFormInitializing = false;
          },
          error: (error) => {
            this.isFormInitializing = false;
            this.appSettingsService.showError(this.getErrorMessage(error, 'Failed to load parameters'));
          }
        });
      },
      error: (error) => {
        this.isFormInitializing = false;
        this.appSettingsService.showError(this.getErrorMessage(error, 'Failed to load report data'));
      }
    });
  }

  onSubmit(resolve?: (value: boolean) => void) {
    if (this.isSaving) {
      if (resolve) resolve(false);
      return;
    }

    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      this.appSettingsService.showWarning(this.getParameterValidationMessage() || 'Please fill all required fields.');
      if (resolve) resolve(false);
      return;
    }

    const raw = this.reportForm.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingsService.showWarning('No changes to save');
      this.reportForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    const currentUser = this.appSettingsService.userSettingSource.value?.userEmail;
    const reportDetails = (raw.parameters || []).map((detail: any) => {
  let dropDownValue = detail.DropDownValue || null;

  // Parse JSON string back to object before sending to backend
  if (dropDownValue && typeof dropDownValue === 'string') {
    const trimmed = dropDownValue.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        dropDownValue = JSON.parse(trimmed);
      } catch {
      }
    }
  }

  let validationRules = detail.ValidationRules || null;

  // Parse JSON string back to object before sending to backend
  if (validationRules && typeof validationRules === 'string') {
    const trimmed = validationRules.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        validationRules = JSON.parse(trimmed);
      } catch {
      }
    }
  }

  return {
    ReportMasterDetailSid: detail.ReportMasterDetailSid || null,
    ParameterName: (detail.ParameterName || '').trim(),
    ParameterFieldType: detail.ParameterFieldType || null,
    DropDownValue: dropDownValue,
    ValidationRules: validationRules,
    DependsOnParameter: detail.DependsOnParameter || null,
    Orentation: detail.Orientation || null,
    ParameterQuery: detail.ParameterQuery || null,
    Status: detail.Status || 'A'
  };
});

    const payload = {
      ReportName: raw.reportName,
      ReportDisplayName: raw.displayName,
      ReportMenuSid: raw.reportMenuId,
      ReportFormat: raw.reportFormatId,
      ReportType: raw.reportType,
      Notes: raw.Notes,
      Orientation: raw.Orientation,
      ReportExcludedCompany: Array.isArray(raw.excludedCompanyIds) && raw.excludedCompanyIds.length
  ? raw.excludedCompanyIds          // already number[]
  : null,
      CreatedBy: currentUser,
      UpdatedBy: currentUser,
      CompanySid: this.currentCompany?.CompanyMasterSid,
      Status: "A",
      reportDetails: reportDetails
    };

    this.isSaving = true;

    if (this.isEditMode) {
      this.masterService.updateReportById(this.ReportMasterSid, payload)
        .pipe(finalize(() => this.isSaving = false))
        .subscribe({
          next: (resp: any) => {
            if (resp.status) {
              this.isDirty = false;
              this.initialFormValue = this.reportForm.getRawValue();
              this.appSettingsService.showSuccess(resp.message);
              if (resolve) resolve(true);
              this.router.navigate(['/master/report-master/list']);
            } else {
              if (resolve) resolve(false);
              this.appSettingsService.showError(resp.message);
            }
          },
          error: (error) => {
            if (resolve) resolve(false);
            this.appSettingsService.showError(this.getErrorMessage(error, 'Update failed'));
          }
        });
    } else {
      this.masterService.createReportMaster(payload)
        .pipe(finalize(() => this.isSaving = false))
        .subscribe({
          next: (resp: any) => {
            if (resp.status) {
              this.isDirty = false;
              this.initialFormValue = this.reportForm.getRawValue();
              this.appSettingsService.showSuccess(resp.message);
              if (resolve) resolve(true);
              this.router.navigate(['/master/report-master/list']);
            } else {
              if (resolve) resolve(false);
              this.appSettingsService.showError(resp.message);
            }
          },
          error: (error) => {
            if (resolve) resolve(false);
            this.appSettingsService.showError(this.getErrorMessage(error, 'Creation failed'));
          }
        });
    }
  }

  toggleSelectAllExcluded(): void {
  const ctrl = this.reportForm.get('excludedCompanyIds');
  const allSids = this.eligibleCompanyOptions.map(c => c.CompanyMasterSid);
  const current: number[] = ctrl?.value ?? [];
  ctrl?.setValue(current.length === allSids.length ? [] : allSids);
}

  resetForm() {
    if (this.isEditMode) {
      this.loadReportData();
    } else {
      this.reportForm.reset();
      this.initialFormValue = this.reportForm.getRawValue();
      this.isDirty = false;
    }
  }

  navigateback() {
    this.router.navigate(["/master/report-master/list"])
  }

  showInfo() {
    if (!this.reportData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.reportData;
    modalRef.componentInstance.idLabel = 'Report Master Id';
    modalRef.componentInstance.idValue = this.reportData?.ReportMasterSid;
  }

  openTandC() {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
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
          modalRef.componentInstance.DocumentSid = this.ReportMasterSid;
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
    if (!this.reportData) return;
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
    modalRef.componentInstance.documentSid = this.ReportMasterSid;
  }

  openEDoc() {
    if (!this.reportData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.reportData;
    modalRef.componentInstance.idLabel = 'Report Master Id';
    modalRef.componentInstance.idValue = this.reportData?.ReportMasterSid;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openAuditLogs() {
              if (!this.reportData?.ReportMasterSid) return;
              const modalRef = this.modalService.open(AuditLogComponent, {
                centered: true,
                scrollable: true,
                size: 'xl',
                windowClass: 'audit-log-modal'
              });
              modalRef.componentInstance.title = 'Report Logs';
              modalRef.componentInstance.tableName = 'ReportMaster';
              modalRef.componentInstance.recordId = this.reportData?.ReportMasterSid.toString();
              modalRef.componentInstance.screenName = 'ReportMaster';
            }
}
