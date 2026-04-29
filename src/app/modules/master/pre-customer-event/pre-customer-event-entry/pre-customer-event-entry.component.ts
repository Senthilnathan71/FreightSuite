import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';

import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { ngbDateStructToDate, toNgbDateStruct } from 'src/app/common/helper';

function leadsConsistencyValidator(group: AbstractControl): ValidationErrors | null {
  const recd = Number(group.get('TotalLeadRecd')?.value ?? 0);
  const success = Number(group.get('TotalLeadSuccess')?.value ?? 0);
  return success > recd ? { leadsExceed: true } : null;
}

@Component({
  selector: 'app-pre-customer-event-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgbDatepickerModule,
    FeatherModule,
  ],
  templateUrl: './pre-customer-event-entry.component.html',
  styleUrl: './pre-customer-event-entry.component.scss',
})
export class PreCustomerEventEntryComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  btnDisable = false;
  PreCustomerEventSid: number | null = null;
  eventData: any = null;

  userList: any[] = [];
  cityList: any[] = [];
  statusList = ['Active', 'Suspended'];

  minDate: NgbDateStruct | null = null;
  maxDate: NgbDateStruct | null = null;

  userData: any;
  currentCompany: any;
  currentBranch: any;

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    public mps: MenuPermissionService,
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) this.userData = userProfile;
    this.mps.init().subscribe();

    this.initForm();
    this.loadUsers();
    this.loadCities();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.PreCustomerEventSid = +idParam;
        this.isEditMode = true;
        this.minDate = null;
        this.loadEvent(this.PreCustomerEventSid);
      } else {
        const today = new Date();
        this.minDate = toNgbDateStruct(today);
      }
    });
  }

  initForm(): void {
    this.form = this.fb.group(
      {
        EventName: ['', [Validators.required, Validators.maxLength(100)]],
        CityMasterSid: [null, Validators.required],
        EventDate: [null, Validators.required],
        EventLeader: [null, Validators.required],
        TotalLeadRecd: [0, [Validators.required, Validators.min(0)]],
        TotalLeadSuccess: [0, [Validators.required, Validators.min(0)]],
        Remarks: ['', Validators.maxLength(300)],
        Status: ['Active', Validators.required],
      },
      { validators: leadsConsistencyValidator },
    );
  }

  loadUsers(): void {
    this.masterService.getAllFfUser().subscribe({
      next: (resp: any) => {
        const data = resp?.data || resp;
        this.userList = Array.isArray(data) ? data.filter((u: any) => u?.status === 'A' || !u?.status) : [];
      },
      error: () => {
        this.appSettingService.showError('Failed to load users');
      },
    });
  }

  loadCities(): void {
    this.masterService.getAllCity().subscribe({
      next: (cities: any) => {
        this.cityList = Array.isArray(cities)
          ? cities.filter((c: any) => c?.status === 'A' || !c?.status)
          : [];
      },
      error: () => this.appSettingService.showError('Failed to load cities'),
    });
  }

  loadEvent(id: number): void {
    this.masterService.getPreCustomerEventById(id).subscribe({
      next: (resp: any) => {
        if (!resp?.status) {
          this.appSettingService.showError(resp?.message || 'Failed to load event');
          return;
        }
        const data = resp.data;
        this.eventData = data;
        this.form.patchValue({
          EventName: data.EventName,
          CityMasterSid: data.CityMasterSid,
          EventDate: toNgbDateStruct(data.EventDate),
          EventLeader: data.EventLeader,
          TotalLeadRecd: data.TotalLeadRecd ?? 0,
          TotalLeadSuccess: data.TotalLeadSuccess ?? 0,
          Remarks: data.Remarks ?? '',
          Status: data.status === 'A' ? 'Active' : 'Suspended',
        });
      },
      error: () => this.appSettingService.showError('Failed to load event'),
    });
  }

  get conversionPct(): number {
    const recd = Number(this.form?.get('TotalLeadRecd')?.value ?? 0);
    const success = Number(this.form?.get('TotalLeadSuccess')?.value ?? 0);
    if (recd <= 0) return 0;
    return Math.round((success / recd) * 1000) / 10;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }
    this.btnDisable = true;

    const userEmail = this.appSettingService.userSettingSource.value?.['userEmail'];
    const v = this.form.value;
    const eventDate = ngbDateStructToDate(v.EventDate);

    const payload: any = {
      EventName: v.EventName,
      CityMasterSid: Number(v.CityMasterSid),
      EventDate: eventDate ? eventDate.toISOString() : null,
      EventLeader: v.EventLeader,
      TotalLeadRecd: Number(v.TotalLeadRecd ?? 0),
      TotalLeadSuccess: Number(v.TotalLeadSuccess ?? 0),
      Remarks: v.Remarks || undefined,
      status: v.Status === 'Active' ? 'A' : 'S',
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      ...(this.isEditMode ? { updatedBy: userEmail } : { createdBy: userEmail }),
    };

    const request$ = this.isEditMode && this.PreCustomerEventSid
      ? this.masterService.updatePreCustomerEventById(this.PreCustomerEventSid, payload)
      : this.masterService.createPreCustomerEvent(payload);

    request$.subscribe({
      next: (resp: any) => {
        if (resp?.status) {
          this.appSettingService.showSuccess(resp.message);
          if (!this.isEditMode && resp.data?.PreCustomerEventSid) {
            this.PreCustomerEventSid = resp.data.PreCustomerEventSid;
            this.isEditMode = true;
            this.eventData = resp.data;
            this.minDate = null;
            this.router.navigate(['master/pre-customer-event/entry', this.PreCustomerEventSid]);
          }
        } else {
          this.appSettingService.showError(resp?.message || 'Save failed');
        }
        this.btnDisable = false;
      },
      error: (err) => {
        console.error(err);
        this.appSettingService.showError(err?.error?.message || 'Save failed');
        this.btnDisable = false;
      },
    });
  }

  reset(): void {
    if (this.isEditMode && this.PreCustomerEventSid) {
      this.loadEvent(this.PreCustomerEventSid);
      return;
    }
    this.form.reset({
      EventName: '',
      CityMasterSid: null,
      EventDate: null,
      EventLeader: null,
      TotalLeadRecd: 0,
      TotalLeadSuccess: 0,
      Remarks: '',
      Status: 'Active',
    });
    this.btnDisable = false;
  }

  goBack(): void {
    this.router.navigate(['master/pre-customer-event/list']);
  }
}
