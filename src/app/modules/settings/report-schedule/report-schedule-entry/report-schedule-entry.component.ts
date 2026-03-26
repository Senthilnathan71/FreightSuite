import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { ReportScheduleService } from '../report-schedule.service';
import { ReportService } from 'src/app/shared/services/report.service';
import {
  AvailableReport,
  FREQUENCY_OPTIONS,
  DAY_OF_WEEK_OPTIONS,
  REPORT_FORMAT_OPTIONS,
} from '../report-schedule.model';

@Component({
  selector: 'app-report-schedule-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgSelectModule,
    NgxSpinnerModule,
  ],
  templateUrl: './report-schedule-entry.component.html',
  styleUrl: './report-schedule-entry.component.scss',
})
export class ReportScheduleEntryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  isEditMode = false;
  scheduleId: number | null = null;

  currentCompany: any;
  userData: any;

  // Dropdown data
  availableReports: AvailableReport[] = [];
  subledgerList: any[] = [];
  coaList: any[] = [];
  branchList: any[] = [];
  frequencyOptions = FREQUENCY_OPTIONS;
  dayOfWeekOptions = DAY_OF_WEEK_OPTIONS;
  reportFormatOptions = REPORT_FORMAT_OPTIONS;

  // Dynamic report parameters
  selectedReportDetails: any[] = [];
  paramDropdownData: Map<string, any[]> = new Map();
  paramDependencies: Map<string, string[]> = new Map(); // parent -> children[]
  disabledParams: Map<string, boolean> = new Map();     // paramName -> disabled
  private currentReportModule: 'accounts' | 'operation' = 'accounts';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private reportScheduleService: ReportScheduleService,
    private reportService: ReportService,
    private masterService: MasterService,
    private spinner: NgxSpinnerService,
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.initForm();
    this.loadLookups();

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.scheduleId = +id;
        this.loadSchedule(this.scheduleId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      ScheduleName: ['', [Validators.required, Validators.maxLength(200)]],
      ReportMasterSid: [null, Validators.required],
      SubledgerMasterSid: [null],
      COAMasterSid: [null],
      BranchFilter: [null],
      Frequency: ['DAILY', Validators.required],
      DayOfWeek: [null],
      DayOfMonth: [null],
      ScheduleTime: ['09:00', Validators.required],
      TimeZone: [null],
      ToEmails: ['', [Validators.required, Validators.maxLength(1000)]],
      CcEmails: [''],
      ReportFormat: ['EXCEL', Validators.required],
      IsActive: [true],
      ReportParams: [null],
    });

    // Watch frequency changes for conditional validation
    this.form.get('Frequency')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((freq) => {
      this.updateConditionalValidators(freq);
    });

    // Watch report selection to load dynamic parameters
    this.form.get('ReportMasterSid')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((sid) => {
      this.onReportSelected(sid);
    });
  }

  private updateConditionalValidators(frequency: string): void {
    const dayOfWeek = this.form.get('DayOfWeek')!;
    const dayOfMonth = this.form.get('DayOfMonth')!;

    dayOfWeek.clearValidators();
    dayOfMonth.clearValidators();

    if (frequency === 'WEEKLY') {
      dayOfWeek.setValidators([Validators.required, Validators.min(0), Validators.max(6)]);
    } else if (frequency === 'MONTHLY') {
      dayOfMonth.setValidators([Validators.required, Validators.min(1), Validators.max(28)]);
    }

    dayOfWeek.updateValueAndValidity();
    dayOfMonth.updateValueAndValidity();
  }

  private onReportSelected(reportMasterSid: number): void {
    const report = this.availableReports.find((r) => r.ReportMasterSid === reportMasterSid);
    this.selectedReportDetails = report?.ReportMasterDetail || [];

    // Clear previous state
    this.paramDropdownData.clear();
    this.paramDependencies.clear();
    this.disabledParams.clear();

    // Determine module from ReportType for dynamic query execution
    this.currentReportModule = (report?.ReportType || 'ACCOUNTS').toLowerCase() as 'accounts' | 'operation';
    const companyId = this.currentCompany?.CompanyMasterSid;

    // Build dependency map (parent -> children[])
    for (const param of this.selectedReportDetails) {
      if (param.DependsOnParameter) {
        const children = this.paramDependencies.get(param.DependsOnParameter) || [];
        children.push(param.ParameterName);
        this.paramDependencies.set(param.DependsOnParameter, children);
      }
    }

    // Load dropdown data for each parameter
    for (const param of this.selectedReportDetails) {
    if (param.ParameterFieldType === 'DROPDOWN' || param.ParameterFieldType === 'DROPDOWN M') {
        if (param.DependsOnParameter) {
          // Dependent dropdown — start disabled until parent is selected
          this.disabledParams.set(param.ParameterName, true);
          this.paramDropdownData.set(param.ParameterName, []);
        } else if (param.DropDownValue && Array.isArray(param.DropDownValue)) {
          // Static dropdown values
          this.paramDropdownData.set(param.ParameterName, param.DropDownValue);
        } else if (param.ParameterQuery) {
          // Dynamic query (no parent dependency) — load immediately
          this.reportService.executeParameterQuery(this.currentReportModule, param.ReportMasterDetailSid, { companyId })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (options) => {
                this.paramDropdownData.set(param.ParameterName, options || []);
              },
            });
        }
      }
    }
  }

  // ─── Load lookups ─────────────────────────────────────────

  private loadLookups(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) return;

    // Available reports
    this.reportScheduleService.getAvailableReports(companyId).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.availableReports = resp.data || [];
        }
      },
    });

    // Subledgers (Customer type)
    this.masterService.getSubledgerMasterByType('Customer', companyId).subscribe({
      next: (resp: any) => {
        this.subledgerList = resp.data || [];
      },
    });

    // Branches (service already unwraps resp.data)
    this.masterService.getBranchesByCompanyId(companyId).subscribe({
      next: (resp: any) => {
        this.branchList = resp || [];
      },
    });

    // COA (Ledger) (service already unwraps resp.data)
    this.masterService.getCoaWithSubledger(companyId).subscribe({
      next: (resp: any) => {
        this.coaList = resp || [];
      },
    });
  }

  // ─── Load existing schedule for edit ──────────────────────

  private loadSchedule(id: number): void {
    this.spinner.show();
    const companyId = this.currentCompany?.CompanyMasterSid;
    this.reportScheduleService.getById(id, companyId).subscribe({
      next: (resp: any) => {
        this.spinner.hide();
        if (resp.status && resp.data) {
          const s = resp.data;
          this.form.patchValue({
            ScheduleName: s.ScheduleName,
            ReportMasterSid: s.ReportMasterSid,
            SubledgerMasterSid: s.SubledgerMasterSid,
            COAMasterSid: s.COAMasterSid,
            BranchFilter: s.BranchFilter,
            Frequency: s.Frequency,
            DayOfWeek: s.DayOfWeek,
            DayOfMonth: s.DayOfMonth,
            ScheduleTime: s.ScheduleTime,
            TimeZone: s.TimeZone,
            ToEmails: s.ToEmails,
            CcEmails: s.CcEmails,
            ReportFormat: s.ReportFormat,
            IsActive: s.IsActive,
            ReportParams: s.ReportParams,
          });
        } else {
          this.appSettingService.showError('Schedule not found');
          this.router.navigate(['/settings/report-schedule/list']);
        }
      },
      error: () => {
        this.spinner.hide();
        this.appSettingService.showError('Error loading schedule');
      },
    });
  }

  // ─── Form helpers ─────────────────────────────────────────

  get f() {
    return this.form.controls;
  }

  get isWeekly(): boolean {
    return this.form.get('Frequency')?.value === 'WEEKLY';
  }

  get isMonthly(): boolean {
    return this.form.get('Frequency')?.value === 'MONTHLY';
  }

  // get dayOfMonthOptions(): number[] {
  //   return Array.from({ length: 28 }, (_, i) => i + 1);
  // }
  dayOfMonthOptions: number[] = Array.from({ length: 28 }, (_, i) => i + 1);


  // Filter out DATE parameters — they are auto-computed based on frequency
  get visibleReportDetails(): any[] {
    return this.selectedReportDetails.filter(
      (param) => param.ParameterFieldType !== 'DATE',
    );
  }

  getParamDropdownOptions(paramName: string): any[] {
    return this.paramDropdownData.get(paramName) || [];
  }

  onParamDropdownChange(paramName: string, value: any): void {
    const current = this.form.value.ReportParams || {};
    this.form.patchValue({ ReportParams: { ...current, [paramName]: value } });

    // Check if this param is a parent — trigger cascading reload for children
    const children = this.paramDependencies.get(paramName);
    if (children && children.length > 0) {
      this.onParamParentChange(paramName, value, children);
    }
  }

  isParamDisabled(paramName: string): boolean {
    return this.disabledParams.get(paramName) || false;
  }

  getParamPlaceholder(param: any): string {
    if (param.DependsOnParameter && this.disabledParams.get(param.ParameterName)) {
      return `Select ${param.DependsOnParameter} first`;
    }
    return '-- Select --';
  }

  private onParamParentChange(parentName: string, parentValue: any, childrenNames: string[]): void {
    const companyId = this.currentCompany?.CompanyMasterSid;

    for (const childName of childrenNames) {
      const childParam = this.selectedReportDetails.find((p) => p.ParameterName === childName);
      if (!childParam) continue;

      // Clear child value
      const current = this.form.value.ReportParams || {};
      this.form.patchValue({ ReportParams: { ...current, [childName]: null } });
      this.paramDropdownData.set(childName, []);

      if (parentValue === null || parentValue === undefined || parentValue === '') {
        // Parent cleared — disable child
        this.disabledParams.set(childName, true);
      } else {
        // Parent has value — enable child and reload with context
        this.disabledParams.set(childName, false);

        if (childParam.ParameterQuery) {
          const context: any = { companyId };
          context[parentName] = parentValue;

          // Add ancestor values for multi-level cascading
          this.addParentValuesToContext(childParam, context);

          this.reportService.executeParameterQuery(this.currentReportModule, childParam.ReportMasterDetailSid, context)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (options) => {
                this.paramDropdownData.set(childName, options || []);
              },
            });
        }
      }

      // Recursively handle grandchildren
      const grandchildren = this.paramDependencies.get(childName);
      if (grandchildren && grandchildren.length > 0) {
        this.onParamParentChange(childName, null, grandchildren);
      }
    }
  }

  private addParentValuesToContext(param: any, context: any): void {
    if (param.DependsOnParameter) {
      const parentParam = this.selectedReportDetails.find((p) => p.ParameterName === param.DependsOnParameter);
      if (parentParam) {
        const parentValue = this.form.value.ReportParams?.[param.DependsOnParameter];
        if (parentValue !== null && parentValue !== undefined) {
          context[param.DependsOnParameter] = parentValue;
        }
        this.addParentValuesToContext(parentParam, context);
      }
    }
  }

  // ─── Submit ───────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    const formValue = this.form.value;
    const username = this.userData?.userEmail || 'system';

    const payload = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      ScheduleName: formValue.ScheduleName,
      ReportMasterSid: formValue.ReportMasterSid,
      SubledgerMasterSid: formValue.SubledgerMasterSid || null,
      COAMasterSid: formValue.COAMasterSid || null,
      BranchFilter: formValue.BranchFilter && formValue.BranchFilter.length > 0 ? formValue.BranchFilter : null,
      Frequency: formValue.Frequency,
      DayOfWeek: formValue.Frequency === 'WEEKLY' ? formValue.DayOfWeek : null,
      DayOfMonth: formValue.Frequency === 'MONTHLY' ? formValue.DayOfMonth : null,
      ScheduleTime: formValue.ScheduleTime,
      TimeZone: formValue.TimeZone || null,
      ToEmails: formValue.ToEmails,
      CcEmails: formValue.CcEmails || null,
      ReportFormat: formValue.ReportFormat,
      ReportParams: formValue.ReportParams || null,
      IsActive: formValue.IsActive,
    };

    this.spinner.show();

    if (this.isEditMode && this.scheduleId) {
      this.reportScheduleService.update(this.scheduleId, payload, username).subscribe({
        next: (resp: any) => {
          this.spinner.hide();
          if (resp.status) {
            this.appSettingService.showSuccess('Schedule updated successfully');
            this.router.navigate(['/settings/report-schedule/list']);
          } else {
            this.appSettingService.showError(resp.message || 'Update failed');
          }
        },
        error: () => {
          this.spinner.hide();
          this.appSettingService.showError('Update failed');
        },
      });
    } else {
      this.reportScheduleService.create(payload, username).subscribe({
        next: (resp: any) => {
          this.spinner.hide();
          if (resp.status) {
            this.appSettingService.showSuccess('Schedule created successfully');
            this.router.navigate(['/settings/report-schedule/list']);
          } else {
            this.appSettingService.showError(resp.message || 'Create failed');
          }
        },
        error: () => {
          this.spinner.hide();
          this.appSettingService.showError('Create failed');
        },
      });
    }
  }

  onTestSend(): void {
    if (!this.scheduleId) return;
    this.spinner.show();
    this.reportScheduleService
      .testSend(this.scheduleId, this.currentCompany.CompanyMasterSid)
      .subscribe({
        next: (resp: any) => {
          this.spinner.hide();
          if (resp.status) {
            this.appSettingService.showSuccess('Test report sent successfully');
          } else {
            this.appSettingService.showError(resp.message || 'Test send failed');
          }
        },
        error: () => {
          this.spinner.hide();
          this.appSettingService.showError('Test send failed');
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/settings/report-schedule/list']);
  }

  // ─── Dynamic report parameter handlers ────────────────────

  onParamChange(paramName: string, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    const current = this.form.value.ReportParams || {};
    this.form.patchValue({ ReportParams: { ...current, [paramName]: value } });
  }

  onParamCheckboxChange(paramName: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.form.value.ReportParams || {};
    this.form.patchValue({ ReportParams: { ...current, [paramName]: checked } });
  }
}
