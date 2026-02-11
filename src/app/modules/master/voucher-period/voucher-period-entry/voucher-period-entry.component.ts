import { CommonModule, DatePipe } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';

@Component({
  selector: 'app-voucher-period-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    ReactiveFormsModule,
    CommonModule,
    FeatherModule,
    FormsModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective,
    DatePipe,
    NgbDatepickerModule,
    PreventMultiClickDirective,
    NgbDropdownModule
  ],
  templateUrl: './voucher-period-entry.component.html',
  styleUrl: './voucher-period-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class VoucherPeriodEntryComponent {
  voucherPeriodForm!: FormGroup;
  isEditMode = false;
  errorMessage: string = '';
  yearList: any[] = [];
  btnDisable: boolean = true;
  VoucherPeriodSid: number;
  voucherPeriodData: any;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  MenuMasterSid: any;

  statusList = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];

  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  currentMenuId: any;
  TandCList: any[] = [];
  currentCompany: any;
  currentBranch: any;

  auditLogs: any[] = [];
  auditLogModalRef!: NgbModalRef;

  // Properties for navigation from Year Entry
  fromYearEntry: boolean = false;
  sourceYearMasterSid: number = null;
  private pendingYearParams: any = null;
  existingPeriods: any[] = [];
  selectedPeriodIndex: number = 0;

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private calendar: NgbCalendar,
    private commonService: CommonService,
    public mps: MenuPermissionService
  ) { }

  ngOnInit(): void {
    this.mps.init().subscribe();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    this.MenuMasterSid = sessionStorage.getItem('currentMenuId');
    if (userProfile) {
      this.userData = userProfile;
    }
    this.loadYears();
    this.initForm();
    this.disableHeaderFields(); // Disable header fields for create mode
    this.voucherPeriodForm.valueChanges.subscribe(() => {
      this.btnDisable = !this.voucherPeriodForm.valid;
    });
    this.route.paramMap.subscribe(params => {
      this.VoucherPeriodSid = +params.get('VoucherPeriodSid');
      if (this.VoucherPeriodSid) {
        this.isEditMode = true;
        this.loadVoucherPeriodData(this.VoucherPeriodSid);
      } else {
        this.voucherPeriodForm.get('status')?.disable();
      }
    });

    // Handle navigation state from Year Entry (data not visible in URL)
    const navState = this.router.getCurrentNavigation()?.extras?.state || history.state;
    if (navState?.YearMasterSid && !this.isEditMode) {
      // If yearList is already loaded, apply immediately
      // Otherwise, store for later application
      if (this.yearList && this.yearList.length > 0) {
        this.applyYearEntryParams(navState);
      } else {
        this.pendingYearParams = navState;
      }
    }
  }

  private applyYearEntryParams(state: any): void {
    console.log(state,'applyYearEntryParams')
    // Store flag for navigation back
    this.fromYearEntry = true;
    this.sourceYearMasterSid = +state.YearMasterSid;

    // Check if existing periods were passed
    this.existingPeriods = state.existingPeriods || [];

    if (this.existingPeriods.length > 0) {
      // Load the first existing period for display
      this.loadExistingPeriod(this.existingPeriods[0]);
    } else {
      // No existing periods - set up for creating new one
      const startDate = state.StartDate ? new Date(state.StartDate) : this.todayDate;
      const endDate = state.EndDate ? new Date(state.EndDate) : this.todayDate;

      this.voucherPeriodForm.patchValue({
        PeriodName: state.YearName,
        PeriodCode: state.YearCode,
        YearMasterSid: +state.YearMasterSid,
        StartDate: startDate,
        EndDate: endDate,
        status: 'Active'
      });

      // Disable pre-filled fields for new period creation

      this.voucherPeriodForm.get('YearMasterSid')?.disable();
      this.voucherPeriodForm.get('StartDate')?.disable();
      this.voucherPeriodForm.get('EndDate')?.disable();
      this.voucherPeriodForm.get('status')?.disable();
    }
  }

  private loadExistingPeriod(period: any): void {
    const startDate = period.StartDate ? new Date(period.StartDate) : this.todayDate;
    const endDate = period.EndDate ? new Date(period.EndDate) : this.todayDate;

    this.VoucherPeriodSid = period.VoucherPeriodSid;
    this.isEditMode = true;
    this.voucherPeriodData = period;

    this.voucherPeriodForm.patchValue({
      PeriodCode: period.PeriodCode,
      PeriodName: period.PeriodName,
      YearMasterSid: period.YearMasterSid,
      StartDate: startDate,
      EndDate: endDate,
      Remarks: period.Remarks || '',
      APClosed: period.APClosed || 'N',
      APGraceDays: period.APGraceDays || 0,
      ARClosed: period.ARClosed || 'N',
      ARGraceDays: period.ARGraceDays || 0,
      GLClosed: period.GLClosed || 'N',
      GLGraceDays: period.GLGraceDays || 0,
      status: this.statusMap[period.Status] || 'Active'
    });

    // Enable status field for editing
    this.voucherPeriodForm.get('status')?.enable();
    this.disableHeaderFields(); // Disable header fields for edit mode
  }

  selectPeriod(index: number): void {
    if (index >= 0 && index < this.existingPeriods.length) {
      this.selectedPeriodIndex = index;
      this.loadExistingPeriod(this.existingPeriods[index]);
    }
  }

  loadYears(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.masterService.getAllYears(CompanyMasterSid).subscribe(
      (resp: any) => {
        this.yearList = resp || [];
        // Apply pending year params after list loads
        if (this.pendingYearParams) {
          this.applyYearEntryParams(this.pendingYearParams);
          this.pendingYearParams = null;
        }
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading years:', error);
      }
    );
  }

  initForm() {
    this.voucherPeriodForm = this.fb.group({
      PeriodCode: ['', Validators.required],
      PeriodName: ['', [Validators.required, Validators.maxLength(20)]],
      YearMasterSid: [null, Validators.required],
      StartDate: [this.todayDate, Validators.required],
      EndDate: [this.todayDate, Validators.required],
      Remarks: ['', Validators.maxLength(200)],
      APClosed: ['N'],
      APGraceDays: [0],
      ARClosed: ['N'],
      ARGraceDays: [0],
      GLClosed: ['N'],
      GLGraceDays: [0],
      status: [{ value: 'Active', disabled: false }, Validators.required],
    });
  }

  private disableHeaderFields(): void {
    // Disable header fields in BOTH create and edit modes
    this.voucherPeriodForm.get('PeriodCode')?.disable();
    this.voucherPeriodForm.get('PeriodName')?.disable();
    this.voucherPeriodForm.get('YearMasterSid')?.disable();
    this.voucherPeriodForm.get('StartDate')?.disable();
    this.voucherPeriodForm.get('EndDate')?.disable();
  }

  resetForm(): void {
    this.voucherPeriodForm.get('status')?.disable();
    this.voucherPeriodForm.reset({
      status: 'Active',
      APClosed: 'N',
      ARClosed: 'N',
      GLClosed: 'N',
      APGraceDays: 0,
      ARGraceDays: 0,
      GLGraceDays: 0
    });
  }

  onSubmit() {
    if (this.voucherPeriodForm.get('status')?.disabled) {
      this.voucherPeriodForm.get('status')?.enable();
    }
    if (this.voucherPeriodForm.get('YearMasterSid')?.disabled) {
      this.voucherPeriodForm.get('YearMasterSid')?.enable();
    }
    if (this.voucherPeriodForm.get('StartDate')?.disabled) {
      this.voucherPeriodForm.get('StartDate')?.enable();
    }
    if (this.voucherPeriodForm.get('EndDate')?.disabled) {
      this.voucherPeriodForm.get('EndDate')?.enable();
    }
    if (this.voucherPeriodForm.invalid) {
      this.voucherPeriodForm.markAllAsTouched();
      this.voucherPeriodForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
      const formValue = this.voucherPeriodForm.getRawValue();

      const payload = (this.isEditMode) ? {
        ...formValue,
        PeriodCode: Number(formValue.PeriodCode),
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        updatedBy: userEmail,
        APGraceDays: Number(formValue.APGraceDays) || 0,
        ARGraceDays: Number(formValue.ARGraceDays) || 0,
        GLGraceDays: Number(formValue.GLGraceDays) || 0,
        status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
      } : {
        ...formValue,
        PeriodCode: Number(formValue.PeriodCode),
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        createdBy: userEmail,
        APGraceDays: Number(formValue.APGraceDays) || 0,
        ARGraceDays: Number(formValue.ARGraceDays) || 0,
        GLGraceDays: Number(formValue.GLGraceDays) || 0,
        status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
      };

      if (this.isEditMode) {
        this.masterService.updateVoucherPeriodById(this.VoucherPeriodSid, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/year/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error updating:', error);
          }
        );
      } else {
        this.masterService.createVoucherPeriod(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              // Navigate back to Year Entry if we came from there
              if (this.fromYearEntry && this.sourceYearMasterSid) {
                this.router.navigate(['master/year/entry', this.sourceYearMasterSid]);
              } else {
                this.router.navigate(['master/year/list']);
              }
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error creating:', error);
          }
        );
      }
    }
  }

  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.VoucherPeriodSid) return;

    this.masterService.getAuditLogsVoucherPeriod(
      'VoucherPeriod',
      this.VoucherPeriodSid.toString()
    ).subscribe({
      next: (logs: any[]) => {
        const ignoredFields = ['updatedOn', 'updatedBy'];

        const formatFields = (val: any) => {
          if (!val) return [];
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          if (Object.keys(obj).length === 0) return [];
          return Object.entries(obj)
            .filter(([key]) => !ignoredFields.includes(key))
            .map(([key, value]) => `${key}: ${value ?? 'NA'}`);
        };

        this.auditLogs = logs
          .map(log => ({
            ...log,
            oldValDisplay: formatFields(log.oldVal),
            newValDisplay: formatFields(log.newVal),
          }))
          .filter(log => log.oldValDisplay.length > 0 || log.newValDisplay.length > 0);

        this.auditLogModalRef = this.modalService.open(modal, {
          centered: true,
          scrollable: true,
          windowClass: 'audit-log-modal'
        });
      },
      error: err => console.error('Error fetching audit logs:', err)
    });
  }

  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended'
  };

  loadVoucherPeriodData(id: number) {
    this.masterService.getVoucherPeriodById(id).subscribe(
      (data) => {
        const startDate = data.StartDate ? new Date(data.StartDate) : this.todayDate;
        const endDate = data.EndDate ? new Date(data.EndDate) : this.todayDate;
        this.voucherPeriodForm.patchValue({
          ...data,
          YearMasterSid: data.YearMasterSid,
          StartDate: startDate,
          EndDate: endDate,
          status: this.statusMap[data.status] || 'Active'
        });
        this.voucherPeriodData = data;
        this.disableHeaderFields(); // Disable header fields for edit mode
      },
      (error) => {
        this.appSettingService.showError('Error loading voucher period data.');
      }
    );
  }

  goBack() {
    if (this.fromYearEntry && this.sourceYearMasterSid) {
      this.router.navigate(['master/year/entry', this.sourceYearMasterSid]);
    } else {
      this.router.navigate(['master/year/list']);
    }
  }

  showInfo() {
    if (!this.voucherPeriodData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.voucherPeriodData;
    modalRef.componentInstance.idLabel = 'Voucher Period Id';
    modalRef.componentInstance.idValue = this.voucherPeriodData?.VoucherPeriodSid;
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
          modalRef.componentInstance.DocumentSid = this.VoucherPeriodSid;
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
    if (!this.voucherPeriodData) return;
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
    modalRef.componentInstance.documentSid = this.VoucherPeriodSid;
  }

  openEDoc() {
    if (!this.voucherPeriodData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    const data: any = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      DocumentSid: this.VoucherPeriodSid
    };
    this.commonService.documentData.set(data);
  }

  ngOnDestroy(): void {
    this.commonService.clearDocumentData();
  }

  reset() {
    if (this.isEditMode && this.VoucherPeriodSid) {
      this.loadVoucherPeriodData(this.VoucherPeriodSid);
      return;
    }

    this.voucherPeriodForm.reset({
      PeriodCode: '',
      PeriodName: '',
      YearMasterSid: null,
      StartDate: this.todayDate,
      EndDate: this.todayDate,
      Remarks: '',
      APClosed: 'N',
      APGraceDays: 0,
      ARClosed: 'N',
      ARGraceDays: 0,
      GLClosed: 'N',
      GLGraceDays: 0,
      status: 'Active'
    });

    this.voucherPeriodForm.get('status')?.disable();
    this.voucherPeriodData = null;
    this.VoucherPeriodSid = null;
    this.btnDisable = true;
  }

  navigateToCreateVoucherPeriod() {
    this.router.navigate(['master/voucher-period/entry']);
  }

  createNewPeriod(): void {
    // Reset to create mode
    this.isEditMode = false;
    this.VoucherPeriodSid = null;
    this.voucherPeriodData = null;
    this.selectedPeriodIndex = -1;

    // Reset form with year data preserved
    this.voucherPeriodForm.reset({
      PeriodCode: '',
      PeriodName: '',
      YearMasterSid: this.sourceYearMasterSid,
      StartDate: this.todayDate,
      EndDate: this.todayDate,
      Remarks: '',
      APClosed: 'N',
      APGraceDays: 0,
      ARClosed: 'N',
      ARGraceDays: 0,
      GLClosed: 'N',
      GLGraceDays: 0,
      status: 'Active'
    });

    // Disable fields for new period
    this.voucherPeriodForm.get('YearMasterSid')?.disable();
    this.voucherPeriodForm.get('status')?.disable();
    this.btnDisable = true;
  }

  compareWithYear = (item: any, selected: any): boolean => {
    if (item === null || item === undefined || selected === null || selected === undefined) {
      return false;
    }
    // Handle both object and primitive comparisons using YearMasterSid
    const itemId = typeof item === 'object' ? item.YearMasterSid : item;
    const selectedId = typeof selected === 'object' ? selected.YearMasterSid : selected;
    // Compare as numbers to handle string/number type mismatch
    return Number(itemId) === Number(selectedId);
  };
}
