import { CommonModule, DatePipe } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
import { FormBuilder,FormGroup,Validators,ReactiveFormsModule, FormsModule,} from '@angular/forms';
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
export class YearEntryComponent {
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

  auditLogs: any[] = []; // Stores audit logs
    auditLogModalRef!: NgbModalRef;
  
  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private calendar : NgbCalendar
  ) {  }
  ngOnInit(): void {
     this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
       this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
      const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
    }
    this.getAllCompanies();
    this.loadYear();
    this.initForm();
      this.yearForm.valueChanges.subscribe(() => {
    this.btnDisable = !this.yearForm.valid;
  });
    this.route.paramMap.subscribe(params => {
      this.YearMasterSid = +params.get('YearMasterSid');
      if(this.YearMasterSid){
        this.isEditMode = true;
        this.loadYearData(this.YearMasterSid);
      }else {
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

      checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId)
    console.log(userRole)
    if (currentMenuId && userRole) {
     this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
  next: (response) => {
    this.currentMenuPermissions = response.data.MenuPermissions || {};
    this.permissions = Object.keys(this.currentMenuPermissions)
      .filter(key => this.currentMenuPermissions[key] === 'isTrue');
      console.log(this.permissions)
  }
});
    }
  }

  hasPermission(permission: string): boolean {
  return this.permissions.includes(permission);
}

hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

  initForm() {
    this.yearForm = this.fb.group({
      
      YearName: ['', Validators.required],
      YearCode: ['', Validators.required],
      StartDate: [this.todayDate, Validators.required],
      EndDate: [this.todayDate, Validators.required],
      CurrentYear: ['', [Validators.required, Validators.maxLength(1)]],
    YearEndCompleted: ['', [Validators.required, Validators.maxLength(1)]],
      Remarks: [''],
      status: [{value: 'Active', disabled: false}, Validators.required],
      CompanyMasterSid: [null],
    });
  }

  resetForm(): void {
    this.yearForm.get('status')?.disable();
    this.yearForm.reset({
      status: 'Active'
    });
  }

  onSubmit() {
    if (this.yearForm.get('status')?.disabled) {
      this.yearForm.get('status')?.enable();
    }
    if (this.yearForm.invalid) {
      this.yearForm.markAllAsTouched();
      this.yearForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail']};
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail']};
      const formValue = this.yearForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        YearCode: Number(formValue.YearCode),
        CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
        ...updatedBy,
        status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
      } : {
        ...formValue,
        YearCode: Number(formValue.YearCode),
        CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
        ...createdBy,
        status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateYearById(this.YearMasterSid, payload).subscribe(
          (resp: any) => {
            console.log(resp.message);
            if(resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/year/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      } else {
        this.masterService.createNewYear(payload).subscribe(
          (resp: any) => {
            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/year/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      }

    }
  }

  // openAuditLogs(modal: TemplateRef<any>) {
  //   if (!this.YearMasterSid) return;
  
  //   this.masterService.getAuditLogsYear('YearMaster', this.YearMasterSid.toString()).subscribe({
  //     next: (logs: any[]) => {
  //       const formatFields = (val: any) => {
  //         if (!val) return ['NA'];
  //         const obj = typeof val === 'string' ? JSON.parse(val) : val;
  //         delete obj.updatedOn; // Remove updatedOn field
  //         // If no fields exist after deleting updatedOn
  //         if (Object.keys(obj).length === 0) return ['NA'];
  //         return Object.entries(obj).map(
  //           ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
  //         );
  //       };
  
  //       this.auditLogs = logs.map(log => ({
  //         ...log,
  //         oldValDisplay: formatFields(log.oldVal),
  //         newValDisplay: formatFields(log.newVal)
  //       }));
  
  //       this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
  //     },
  //     error: err => console.error('Error fetching audit logs:', err)
  //   });
  // }

  openAuditLogs(modal: TemplateRef<any>) {
  if (!this.YearMasterSid) return;

  this.masterService.getAuditLogsYear(
    'YearMaster',
    this.YearMasterSid.toString()
  ).subscribe({
    next: (logs: any[]) => {
      const ignoredFields = ['updatedOn','updatedBy']; // ✅ add more if needed later

      const formatFields = (val: any) => {
        if (!val) return [];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        if (Object.keys(obj).length === 0) return [];
        return Object.entries(obj)
          .filter(([key]) => !ignoredFields.includes(key)) // 🚫 exclude fields
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

  loadYearData(id: number) {
    this.masterService.getYearById(id).subscribe(
      (data) => {
        const startDate = data.StartDate? new Date(data.StartDate) : this.todayDate;
        const endDate = data.EndDate? new Date(data.EndDate) : this.todayDate;
        this.yearForm.patchValue({
          ...data,
          StartDate:startDate,
          EndDate: endDate,
          status: this.statusMap[data.status] || 'Active' 
        },
      );
      this.yearData = data;
      },
      (error) => {
        this.appSettingService.showError('Error loading year data.');
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

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
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
          modalRef.componentInstance.DocumentSid = this.YearMasterSid;

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
		if (!this.yearData) return;
		const modalRef = this.modalService.open(EmailEntryComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
	}

	  openAuthority() {
      const MenuMasterSid = localStorage.getItem('currentMenuId');
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
	}

  reset() {
  // If editing, reload the original record from server to restore original values
  if (this.isEditMode && this.YearMasterSid) {
    this.loadYearData(this.YearMasterSid);
    return;
  }

  // Create-mode: reset to sensible defaults
  this.yearForm.reset({
    YearName: '',
    YearCode: '',
    StartDate: this.todayDate,
    EndDate: this.todayDate,
    CurrentYear: '',
    YearEndCompleted: '',
    Remarks: '',
    status: 'Active'
  });

  // Ensure status control is disabled (same behaviour as init)
  this.yearForm.get('status')?.disable();

  // Reset local state
  this.yearData = null;
  this.YearMasterSid = null;

  // Disable save button until form becomes valid again
  this.btnDisable = true;
}

}
