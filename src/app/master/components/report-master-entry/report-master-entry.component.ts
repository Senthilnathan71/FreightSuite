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

@Component({
  selector: 'app-report-master-entry',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule, MultiSelectComponent, DetailsComponent, NgbDropdownModule],
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

  modeofreportFormat = [
    { id: 1, name: "XL" },
    { id: 2, name: "PDF" },
    { id: 3, name: "XML" }
  ];

  modeofreportType = [
    { id: 1, name: "Ope Report" },
    { id: 2, name: "Fin Report" },
    { id: 3, name: "Ana Report" }
  ];
  reportMenus: any[] = [];

  parameterFieldTypes = [
    { value: 'DATE', label: 'Date' },
    { value: 'DROPDOWN', label: 'Dropdown' },
    { value: 'NUMBER', label: 'Number' },
    { value: 'TEXT', label: 'Text' },
    { value: 'YEAR', label: 'Year' }
  ];

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingsService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private appSettingService: AppSettingsService,
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
    this.initForm();
    this.subscribeToFormChanges();
    this.menuDropdown();

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
      excludedCompanyIds: ['', [Validators.pattern(/^(\d+)(,\s*\d+)*$/)]],
      Status: ['A'],
      parameters: this.fb.array([])
    });
  }

  // FormArray getter for parameters
  get parameters(): FormArray {
    return this.reportForm.get('parameters') as FormArray;
  }

  // Create a new parameter FormGroup
  createParameterGroup(data: any = {}): FormGroup {
    return this.fb.group({
      ReportMasterDetailSid: [data.ReportMasterDetailSid || null],
      ParameterName: [data.ParameterName || '', Validators.required],
      ParameterFieldType: [data.ParameterFieldType || '', Validators.required],
      DropDownValue: [data.DropDownValue || ''],
      ParameterQuery: [data.ParameterQuery || ''],
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
    this.masterService.getAllMenu().subscribe({
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
          excludedCompanyIds: this.formatExcludedCompanies(resp.data.ReportExcludedCompany)
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
      this.appSettingsService.showWarning('Please fill all required fields.');
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
    const reportDetails = (raw.parameters || []).map((detail: any) => ({
      ReportMasterDetailSid: detail.ReportMasterDetailSid || null,
      ParameterName: (detail.ParameterName || '').trim(),
      ParameterFieldType: detail.ParameterFieldType || null,
      DropDownValue: detail.DropDownValue || null,
      ParameterQuery: detail.ParameterQuery || null,
      Status: detail.Status || 'A'
    }));

    const payload = {
      ReportName: raw.reportName,
      ReportDisplayName: raw.displayName,
      ReportMenuSid: raw.reportMenuId,
      ReportFormat: raw.reportFormatId,
      ReportType: raw.reportType,
      ReportExcludedCompany: raw.excludedCompanyIds
        ? raw.excludedCompanyIds.split(',').map((id: string) => parseInt(id.trim()))
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

  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.ReportMasterSid) return;

    this.masterService.getAuditLogs('ReportMaster', this.ReportMasterSid.toString()).subscribe({
      next: (logs: any[]) => {
        const formatFields = (val: any) => {
          if (!val) return ['NA'];
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          delete obj.updatedOn;
          if (Object.keys(obj).length === 0) return ['NA'];
          return Object.entries(obj).map(
            ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
          );
        };

        this.auditLogs = logs.map(log => ({
          ...log,
          oldValDisplay: formatFields(log.oldVal),
          newValDisplay: formatFields(log.newVal)
        }));

        this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
      },
      error: err => console.error('Error fetching audit logs:', err)
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
