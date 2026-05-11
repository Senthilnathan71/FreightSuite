import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnDestroy, TemplateRef } from '@angular/core';
import { FormBuilder,FormGroup,Validators,ReactiveFormsModule, FormsModule, ValidationErrors, AbstractControl, ValidatorFn,} from '@angular/forms';
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
import { Year } from 'src/app/modules/crm-mobile/Interfaces/year.interfaces';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { getDefaultTodayDate } from 'src/app/common/helper';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';

@Component({
  selector: 'app-year-entry',
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
  templateUrl: './year-entry.component.html',
  styleUrl: './year-entry.component.scss',
  providers: [
      { provide: NgbDateAdapter, useClass: CustomDateAdapter },
      { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    ],
})
export class YearEntryComponent implements HasUnsavedChanges, OnDestroy {
  yearForm!: FormGroup;
  isEditMode = false; // Flag for edit mode
  errorMessage: string = '';  // To store any error messages
  years: Year[] = [];
  btnDisable: boolean = true;
  YearMasterSid: number;
  yearData: any;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  companyList: any;
  MenuMasterSid:any;
  statusList = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  currentMenuId: any;
  TandCList: any[]=[];
  currentCompany: any;
  currentBranch: any;
  isCreatingPeriods = false;
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();

  auditLogs: any[] = []; // Stores audit logs
    auditLogModalRef!: NgbModalRef;

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private calendar : NgbCalendar,
    private commonService: CommonService,
    public mps : MenuPermissionService
  ) {  }
  ngOnInit(): void {
    this.mps.init().subscribe();
     this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
       this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
      const userProfile = this.appSettingService.getDecryptedUserProfile();
      this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
		if(userProfile){
			this.userData = userProfile;
     
    }
    this.getAllCompanies();
    this.loadYear();
    this.initForm();
    this.initialFormValue = this.yearForm.getRawValue();
    this.subscribeToFormChanges();
    this.yearForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.btnDisable = !this.yearForm.valid;
      });
    this.route.paramMap.subscribe(params => {
      this.YearMasterSid = +params.get('YearMasterSid');
      if(this.YearMasterSid){
        this.isEditMode = true;
        this.loadYearData(this.YearMasterSid);
      }else {
        this.yearForm.get('CompanyMasterSid')?.enable();
        this.yearForm.get('status')?.disable();
      }
    });
  }

  loadYear(): void{
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.masterService.getAllYears(CompanyMasterSid).subscribe(
      (resp: Year[])=> {
        console.log(resp,'year');
        this.years = resp['data'];
      },
      (error)=> {
        this.errorMessage = error.message;
        console.error('Error loading years:', error);
      }
    );
  }

     

hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

  initForm() {
    const today = getDefaultTodayDate();
    this.yearForm = this.fb.group({
      
      YearName: ['', Validators.required],
      YearCode: ['', Validators.required],
      StartDate: [today],
      EndDate: [{ value: this.calculateEndDate(today), disabled: true }, Validators.required],
      CurrentYear: [false], 
      YearEndCompleted: [false],
      Remarks: [''],
      status: [{value: 'Active', disabled: false}, Validators.required],
      CompanyMasterSid: [this.currentCompany?.CompanyMasterSid ?? null, Validators.required],
    });
    this.yearForm.get('StartDate')?.valueChanges.subscribe((startDate) => {
    if (startDate) {
      const endDate = this.calculateEndDate(startDate);
      this.yearForm.patchValue({
        EndDate: endDate
      });
    }
  });
}

// Calculate end date as 364 days from start date
calculateEndDate(startDate: any): any {
  if (!startDate) return this.todayDate;
  
  let start: Date;
  
  // Handle both NgbDateStruct and Date objects
  if (startDate instanceof Date) {
    start = startDate;
  } else {
    start = new Date(startDate.year, startDate.month - 1, startDate.day);
  }
  
  const end = new Date(start);
  end.setDate(start.getDate() + 364); // Add exactly 364 days
  
  // Convert back to NgbDateStruct if needed
  if (typeof startDate === 'object' && startDate.year) {
    return {
      year: end.getFullYear(),
      month: end.getMonth() + 1,
      day: end.getDate()
    };
  }
  
  return end;

  }

  resetForm(): void {
    this.yearForm.get('CompanyMasterSid')?.enable();
    this.yearForm.get('status')?.disable();
    this.yearForm.reset({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid ?? null,
      status: 'Active'
    });
    this.initialFormValue = this.yearForm.getRawValue();
    this.isDirty = false;
    this.yearForm.markAsPristine();
  }

  onSubmit(resolve?: (value: boolean) => void) {
    if (this.isSaving) {
      if (resolve) resolve(false);
      return;
    }

    if (this.deepEqual(this.yearForm.getRawValue(), this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.yearForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    if (this.yearForm.get('status')?.disabled) {
      this.yearForm.get('status')?.enable();
    }
    if (this.yearForm.invalid) {
      this.yearForm.markAllAsTouched();
      this.yearForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      if (resolve) resolve(false);
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail']};
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail']};
      const formValue = this.yearForm.getRawValue();
      const selectedCompanySid = formValue.CompanyMasterSid || this.currentCompany?.CompanyMasterSid;

      const payload = (this.isEditMode) ? {
        ...formValue,
        YearCode: Number(formValue.YearCode),
        CompanyMasterSid : selectedCompanySid,
        ...updatedBy,
        CurrentYear: formValue.CurrentYear ? 'Y' : 'N', 
  YearEndCompleted: formValue.YearEndCompleted ? 'Y' : 'N',
        status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
      } : {
        ...formValue,
        YearCode: Number(formValue.YearCode),
        CompanyMasterSid : selectedCompanySid,
        ...createdBy,
        CurrentYear: formValue.CurrentYear ? 'Y' : 'N', 
  YearEndCompleted: formValue.YearEndCompleted ? 'Y' : 'N',
        status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
      };

      console.log('payload', payload);
      this.isSaving = true;

      if (this.isEditMode) {
        this.masterService.updateYearById(this.YearMasterSid, payload).subscribe(
          (resp: any) => {
            this.isSaving = false;
            console.log(resp.message);
            if(resp.status) {
              this.isDirty = false;
              this.initialFormValue = this.yearForm.getRawValue();
              this.yearForm.markAsPristine();
              this.appSettingService.showSuccess(resp.message|| 'Saved Successfully!');
              this.router.navigate(['master/year/list']);
              if (resolve) resolve(true);
            } else {
              this.appSettingService.showError(resp.message);
              if (resolve) resolve(false);
            }
          },
          (error) => {
            this.isSaving = false;
            this.errorMessage = error.message;
            console.error('Error loading:', error);
            if (resolve) resolve(false);
          }
        );
      } else {
        this.masterService.createNewYear(payload).subscribe(
          (resp: any) => {
            this.isSaving = false;
            console.log(resp);
            if (resp.status) {
              this.isDirty = false;
              this.initialFormValue = this.yearForm.getRawValue();
              this.yearForm.markAsPristine();
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/year/list']);
              if (resolve) resolve(true);
            } else {
              this.appSettingService.showError(resp.message);
              if (resolve) resolve(false);
            }
          },
          (error) => {
            this.isSaving = false;
            this.errorMessage = error.message;
            console.error('Error loading:', error);
            if (resolve) resolve(false);
          }
        );
      }

    }
  }

  openAuditLogs() {
           if (!this.YearMasterSid) return;
           const modalRef = this.modalService.open(AuditLogComponent, {
             centered: true,
             scrollable: true,
             size: 'xl',
             windowClass: 'audit-log-modal'
           });
           modalRef.componentInstance.title = 'Year Logs';
           modalRef.componentInstance.tableName = 'YearMaster';
           modalRef.componentInstance.recordId = this.YearMasterSid.toString();
           modalRef.componentInstance.screenName = 'Year';
         }

   statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended'
  };

  loadYearData(id: number) {
    this.masterService.getYearById(id).subscribe(
      (data) => {
        const startDate = data.StartDate? new Date(data.StartDate) : this.todayDate;
        const endDate = data.EndDate? new Date(data.EndDate) : this.todayDate;
        this.yearForm.patchValue({
          ...data,

          StartDate:startDate,
          EndDate: endDate,
          CompanyMasterSid: data.CompanyMasterSid ?? this.currentCompany?.CompanyMasterSid ?? null,
           CurrentYear: data.CurrentYear === 'Y',
        YearEndCompleted: data.YearEndCompleted === 'Y',
          status: this.statusMap[data.status] || 'Active'
        },
      );
      this.yearForm.get('CompanyMasterSid')?.disable();
      this.yearData = data;
      this.initialFormValue = this.yearForm.getRawValue();
      this.isDirty = false;
      this.yearForm.markAsPristine();
      },
      (error) => {
        this.appSettingService.showError('Error loading year data.');
      }
    );
  }

  createPeriods() {
    if (!this.YearMasterSid || !this.yearData) {
      this.appSettingService.showError('Please save the year first');
      return;
    }

    if (this.isCreatingPeriods) return;
    this.isCreatingPeriods = true;

    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;

    // Check if voucher periods already exist for this year
    this.masterService.getAllVoucherPeriods(CompanyMasterSid, BranchMasterSid, this.YearMasterSid).subscribe(
      (resp: any) => {
        const existingPeriods = resp || [];

        if (existingPeriods.length > 0) {
          // Periods already exist — inform user and navigate to view them
          this.isCreatingPeriods = false;
          this.appSettingService.showInfo('Voucher periods already exist for this year');
          this.router.navigate(['master/voucher-period/entry'], {
            state: {
              YearMasterSid: this.YearMasterSid,
              YearCode: this.yearData.YearCode,
              YearName: this.yearData.YearName,
              StartDate: this.yearData.StartDate,
              EndDate: this.yearData.EndDate,
              existingPeriods: existingPeriods
            }
          });
          return;
        }

        // No existing periods — auto-create 12 monthly periods
        this.masterService.createPeriodsForYear({
          YearMasterSid: this.YearMasterSid,
          CompanyMasterSid,
          BranchMasterSid,
          CreatedBy: this.userData?.email || '',
          ARGraceDays: 90,
          APGraceDays: 90,
          GLGraceDays: 90
        }).subscribe(
          (result: any) => {
            this.isCreatingPeriods = false;
            this.appSettingService.showSuccess(result?.message || 'Voucher periods created successfully');
            // Re-fetch the newly created periods and navigate
            this.masterService.getAllVoucherPeriods(CompanyMasterSid, BranchMasterSid, this.YearMasterSid).subscribe(
              (newPeriods: any) => {
                this.router.navigate(['master/voucher-period/entry'], {
                  state: {
                    YearMasterSid: this.YearMasterSid,
                    YearCode: this.yearData.YearCode,
                    YearName: this.yearData.YearName,
                    StartDate: this.yearData.StartDate,
                    EndDate: this.yearData.EndDate,
                    existingPeriods: newPeriods || []
                  }
                });
              }
            );
          },
          (error) => {
            this.isCreatingPeriods = false;
            this.appSettingService.showError(error?.error?.message || 'Error creating voucher periods');
          }
        );
      },
      (error) => {
        this.isCreatingPeriods = false;
        console.error('Error checking existing periods:', error);
        this.appSettingService.showError('Error checking existing periods');
      }
    );
  }

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe((res: any[]) => {
      this.companyList = res;
    })
  }



  goBack() {
    this.router.navigate(['master/year/list']);
  }

  showInfo() {
    if(!this.yearData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.yearData;
    modalRef.componentInstance.idLabel = 'Year Id';
    modalRef.componentInstance.idValue = this.yearData?.YearMasterSid;
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
  //         modalRef.componentInstance.DocumentSid = this.YearMasterSid;

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
		if (!this.yearData) return;
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
      modalRef.componentInstance.documentSid = this.YearMasterSid;
    }

	openEDoc() {
		if (!this.yearData) return;
		const modalRef = this.modalService.open(EdocComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
    const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.YearMasterSid
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
    modalRef.componentInstance.DocumentSid = this.YearMasterSid;
  }
  reset() {
  // If editing, reload the original record from server to restore original values
  if (this.isEditMode && this.YearMasterSid) {
    this.loadYearData(this.YearMasterSid);
    return;
  }

  // Create-mode: reset to sensible defaults
  const startDate = this.todayDate;
  const endDate = this.calculateEndDate(startDate);
  
  this.yearForm.reset({
    YearName: '',
    YearCode: '',
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid ?? null,
    StartDate: startDate,
    EndDate: endDate,
    CurrentYear: false,
    YearEndCompleted: false,
    Remarks: '',
    status: 'Active'
  });

  // Ensure status control is disabled (same behaviour as init)
  this.yearForm.get('CompanyMasterSid')?.enable();
  this.yearForm.get('status')?.disable();

  // Reset local state
  this.yearData = null;
  this.YearMasterSid = null;

  // Disable save button until form becomes valid again
  this.btnDisable = true;
  this.initialFormValue = this.yearForm.getRawValue();
  this.isDirty = false;
  this.yearForm.markAsPristine();
}
dateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const startDate = control.get('StartDate')?.value;
  const endDate = control.get('EndDate')?.value;
  
  if (!startDate || !endDate) {
    return null;
  }

  const start = new Date(startDate.year, startDate.month - 1, startDate.day);
  const end = new Date(endDate.year, endDate.month - 1, endDate.day);
  
  // Calculate difference in days
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays === 364 ? null : { dateRangeInvalid: true };
}
nagivateTocreateYear() {
    this.router.navigate(['master/year/entry'])
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    return !!this.yearForm && this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.onSubmit(resolve);
    });
  }

  private subscribeToFormChanges(): void {
    this.yearForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(this.initialFormValue, this.yearForm.getRawValue());
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

  private deepEqual(obj1: any, obj2: any): boolean {
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.commonService.clearDocumentData();
 }
}
