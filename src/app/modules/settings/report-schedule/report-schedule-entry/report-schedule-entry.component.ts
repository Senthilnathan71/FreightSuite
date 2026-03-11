import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { ReportScheduleService } from '../report-schedule.service';
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
    ReactiveFormsModule,
    RouterModule,
    NgSelectModule,
    NgxSpinnerModule,
  ],
  templateUrl: './report-schedule-entry.component.html',
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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private reportScheduleService: ReportScheduleService,
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

    // Branches
    this.masterService.getBranchesByCompanyId(companyId).subscribe({
      next: (resp: any) => {
        this.branchList = resp.data || [];
      },
    });

    // COA (Ledger)
    this.masterService.getCoaWithSubledger(companyId).subscribe({
      next: (resp: any) => {
        this.coaList = resp.data || [];
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

  get dayOfMonthOptions(): number[] {
    return Array.from({ length: 28 }, (_, i) => i + 1);
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
