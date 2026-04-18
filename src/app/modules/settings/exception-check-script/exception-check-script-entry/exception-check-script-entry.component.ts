import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastrService } from 'ngx-toastr';
import { debounceTime } from 'rxjs/operators';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExceptionCheckScriptService } from '../exception-check-script.service';
import { FREQUENCY_OPTIONS, DAY_OF_WEEK_OPTIONS } from '../exception-check-script.model';

@Component({
  selector: 'app-exception-check-script-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgxSpinnerModule, NgSelectModule],
  templateUrl: './exception-check-script-entry.component.html',
})
export class ExceptionCheckScriptEntryComponent implements OnInit {
  form = this.fb.group({
    ScriptName: ['', [Validators.required, Validators.maxLength(200)]],
    ScriptDescription: [''],
    ScriptText: ['', [Validators.required]],
    ExecutionMode: ['MANUAL', Validators.required],

    Frequency: [null as string | null],
    DayOfWeek: [null as number | null],
    DayOfMonth: [null as number | null],
    ScheduleTime: ['' as string | null],
    TimeZone: ['' as string | null],
    ToEmails: ['' as string | null],
    CcEmails: ['' as string | null],

    IsActive: [true],
  });

  id: number | null = null;
  isEdit = false;
  saving = false;
  userData: any;

  validation: { state: 'idle' | 'checking' | 'ok' | 'bad'; message?: string } = { state: 'idle' };

  readonly frequencyOptions = FREQUENCY_OPTIONS;
  readonly dayOfWeekOptions = DAY_OF_WEEK_OPTIONS;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private svc: ExceptionCheckScriptService,
    private spinner: NgxSpinnerService,
    private appSettings: AppSettingsService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.userData = this.appSettings.decrypt(localStorage.getItem('userData')) || {};

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) { this.id = Number(idParam); this.isEdit = true; this.load(); }

    // Conditional validators for scheduler fields
    this.form.get('ExecutionMode')!.valueChanges.subscribe(() => this.applyConditionalValidators());
    this.form.get('Frequency')!.valueChanges.subscribe(() => this.applyConditionalValidators());
    this.applyConditionalValidators();

    // Debounced validate on script text blur
    this.form.get('ScriptText')!.valueChanges.pipe(debounceTime(500)).subscribe((txt) => {
      if (txt && typeof txt === 'string' && txt.trim().length > 0) this.validateScript();
      else this.validation = { state: 'idle' };
    });
  }

  private applyConditionalValidators(): void {
    const mode = this.form.get('ExecutionMode')!.value;
    const freq = this.form.get('Frequency')!.value;

    const scheduleFields = ['Frequency', 'ScheduleTime', 'ToEmails'];
    if (mode === 'SCHEDULED') {
      scheduleFields.forEach((f) => this.form.get(f)!.setValidators([Validators.required]));
      this.form.get('DayOfWeek')!.setValidators(freq === 'WEEKLY' ? [Validators.required] : null);
      this.form.get('DayOfMonth')!.setValidators(freq === 'MONTHLY' ? [Validators.required] : null);
    } else {
      ['Frequency', 'DayOfWeek', 'DayOfMonth', 'ScheduleTime', 'ToEmails', 'CcEmails']
        .forEach((f) => this.form.get(f)!.clearValidators());
    }
    ['Frequency', 'DayOfWeek', 'DayOfMonth', 'ScheduleTime', 'ToEmails', 'CcEmails']
      .forEach((f) => this.form.get(f)!.updateValueAndValidity({ emitEvent: false }));
  }

  private load(): void {
    this.spinner.show();
    this.svc.getOne$(this.id!).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res?.data) this.form.patchValue(res.data);
      },
      error: () => { this.spinner.hide(); this.toastr.error('Failed to load script'); },
    });
  }

  validateScript(): void {
    const txt = this.form.get('ScriptText')!.value ?? '';
    if (!txt.trim()) { this.validation = { state: 'idle' }; return; }
    this.validation = { state: 'checking' };
    this.svc.validate$(txt).subscribe({
      next: (res: any) => {
        const r = res?.data;
        if (r?.valid) this.validation = { state: 'ok', message: 'Looks good — SELECT query validated' };
        else this.validation = { state: 'bad', message: r?.reason ?? 'Validation failed' };
      },
      error: () => this.validation = { state: 'bad', message: 'Validation request failed' },
    });
  }

  save(executeAfter = false): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.validation.state === 'bad') { this.toastr.error(this.validation.message || 'Fix script errors first'); return; }

    this.saving = true;
    const payload = this.form.getRawValue() as any;
    const username = this.userData?.login || 'system';

    const req$ = this.isEdit
      ? this.svc.update$(this.id!, payload, username)
      : this.svc.create$(payload, username);

    req$.subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res?.status === false) { this.toastr.error(res.message || 'Save failed'); return; }
        this.toastr.success(this.isEdit ? 'Script updated' : 'Script created');
        if (executeAfter && res?.data?.ExceptionCheckScriptSid) {
          this.router.navigate(['/settings/exception-check-script/list'], { queryParams: { runAfter: res.data.ExceptionCheckScriptSid } });
        } else {
          this.router.navigate(['/settings/exception-check-script/list']);
        }
      },
      error: (err) => { this.saving = false; this.toastr.error(err?.error?.message || 'Save failed'); },
    });
  }

  cancel(): void { this.router.navigate(['/settings/exception-check-script/list']); }
}
