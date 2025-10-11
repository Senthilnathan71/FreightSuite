import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { State } from 'src/app/modules/crm-mobile/Interfaces/state.interface';
import { Country } from 'src/app/modules/crm-mobile/Interfaces/country.interface';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Zone } from 'src/app/modules/crm-mobile/Interfaces/zone.interface';
import { NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-state-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule,
    DatePipe,
    PreventMultiClickDirective,
    NgbDropdownModule
  ],
  templateUrl: './state-entry.component.html',
  styleUrls: ['./state-entry.component.scss']
})
export class StateEntryComponent implements OnInit {
    private destroy$ = new Subject<void>();

  stateForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  stateId: number;
  countries: Country[] = [];
  zones: Zone[] = [];
  stateData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  userData:any;
  statusMap: { [key: string]: string } = {
    A: 'Active',
    I: 'Suspended'
  };

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'I', name: 'Suspended' }
  ];
  currentMenuId: number;
  TandCList: any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;




  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private modalService : NgbModal,
        public dropdownStore:DropdownStore
    
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.dropdownStore.loadCountries();
    this.dropdownStore.loadZones();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.stateId = +params['id'];
        this.isEditMode = true;
        this.getStateById(this.stateId);
        // Enable status control when in edit mode
        this.stateForm.get('status')?.enable();
      }
    });
    //  this.appSettingService.getUser().subscribe((user) => {
    //   if (user) {
    //     this.userData = user;
    //     this.checkPermissions();
    //   }
    // });
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
  }

    checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId);
    console.log(userRole);
    if (currentMenuId && userRole) {
      this.masterService
        .getRoleMenuPermissions(currentMenuId, userRole)
        .subscribe({
          next: (response) => {
            this.currentMenuPermissions = response.data.MenuPermissions || {};
            this.permissions = Object.keys(this.currentMenuPermissions).filter(
              (key) => this.currentMenuPermissions[key] === 'isTrue'
            );
            console.log(this.permissions);
          },
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
    this.stateForm = this.fb.group({
      stateName: ['', [Validators.required, Validators.maxLength(100), this.alphaSpaceValidator()]],
      stateCode: ['', [Validators.required, Validators.maxLength(2), this.alphaValidator()]],
      stateGSTCode: ['', [Validators.required, Validators.maxLength(2), Validators.pattern('^[0-9]*$'), this.trimSpaceValidator()]],
      CountryMasterSid: ['', Validators.required],
      ZoneMasterSid: ['', Validators.required],
      region: [''],
      status: [{value: 'A', disabled: true}, Validators.required],
      Remarks: ['']
    });

    this.stateForm.get('stateCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.stateForm.get('stateCode')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });

    this.stateForm.get('stateGSTCode')?.valueChanges.subscribe(val => {
      if (val) {
        // Remove any spaces from GST code
        const trimmedVal = val.replace(/\s/g, '');
        if (val !== trimmedVal) {
          this.stateForm.get('stateGSTCode')?.setValue(trimmedVal, { emitEvent: false });
        }
      }
    });
  }

  private alphaValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z]+$/.test(control.value);
      return valid ? null : { invalidAlpha: true };
    };
  }

  private alphaSpaceValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z\s]+$/.test(control.value);
      return valid ? null : { invalidAlphaSpace: true };
    };
  }

  private trimSpaceValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const hasSpaces = /\s/.test(control.value);
      return hasSpaces ? { hasSpaces: true } : null;
    };
  }

  onKeyPress(event: KeyboardEvent, field: string) {
    if (field === 'stateCode') {
      const pattern = /[A-Za-z]/;
      if (!pattern.test(event.key)) {
        event.preventDefault();
      }
    } else if (field === 'stateName') {
      const pattern = /[A-Za-z\s]/;
      if (!pattern.test(event.key)) {
        event.preventDefault();
      }
    } else if (field === 'stateGSTCode') {
      const pattern = /[0-9]/;
      if (!pattern.test(event.key)) {
        event.preventDefault();
      }
    }
  }

  // loadCountries() {
  //   this.masterService.getAllCountry().subscribe({
  //     next: (resp: any) => {
  //       this.countries = resp.data || resp;
  //     },
  //     error: (err) => {
  //       console.error('Error loading countries:', err);
  //       this.appSettingService.showError('Failed to load countries');
  //     }
  //   });
  // }

  // loadZones() {
  //   this.masterService.getAllZones().subscribe({
  //     next: (resp: any) => {
  //       this.zones = resp.data || resp;
  //     },
  //     error: (err) => {
  //       console.error('Error loading zones:', err);
  //       this.appSettingService.showError('Failed to load zones');
  //     }
  //   });
  // }

  getStateById(id: number) {
    this.stateForm.reset();
    this.masterService.getStateById(id).subscribe({
      next: (state: State) => {
        this.stateData = state
        this.stateForm.patchValue({
          stateName: state.stateName,
          stateCode: state.stateCode,
          stateGSTCode: state.stateGSTCode,
          CountryMasterSid: state.CountryMasterSid,
          ZoneMasterSid: state.ZoneMasterSid,
          region: state.region || '',
          status: state.status || 'A',
          Remarks: state.Remarks || ''
        });
        // Enable status control when in edit mode
        this.stateForm.get('status')?.enable();
      },
      error: (err) => {
        console.error('Error loading state:', err);
        this.appSettingService.showError('Failed to load state data');
      }
    });
  }



openAuditLogs(modal: TemplateRef<any>) {
  if (!this.stateData?.StateMasterSid) return;

  this.masterService.getAuditLogsState(
    'StateMaster',
    this.stateData?.StateMasterSid.toString()
  ).subscribe({
    next: (logs: any[]) => {
      const ignoredFields = ['UpdatedOn']; // ✅ add more if needed later

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

  onSubmit() {
    if (this.stateForm.invalid) {
      this.markFormGroupTouched(this.stateForm);
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }
  
    this.btnDisable = true;
    
    const formValue = this.stateForm.value;
    const createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    
    const payload = {
      ...formValue,
      CountryMasterSid: Number(formValue.CountryMasterSid),
      ZoneMasterSid: Number(formValue.ZoneMasterSid),
      status: this.isEditMode ? formValue.status : 'A',
      ...(this.isEditMode ? updatedBy : createdBy)
    };
  
    const operation = this.isEditMode 
      ? this.masterService.editState(this.stateId, payload)
      : this.masterService.createState(payload);
  
    operation.subscribe({
      next: (resp: any) => {
        this.btnDisable = false;
        const message = resp.message;        
        if (resp.status) {
          this.appSettingService.showSuccess(message);
          this.router.navigate(['/master/state/list']);
        } else {
          this.appSettingService.showError(message );
        }
      },
      error: (err) => {
        this.btnDisable = false;
        const errorMessage = err.error?.message || 
          `Error ${this.isEditMode ? 'updating' : 'creating'} state`;
        this.appSettingService.showError(errorMessage);
      }
    });
  }

  resetForm() {
    if (this.isEditMode) {
      this.getStateById(this.stateId);
    } else {
      this.stateForm.reset({
        stateName: '',
        stateCode: '',
        stateGSTCode: '',
        CountryMasterSid: '',
        ZoneMasterSid: '',
        region: '',
        status: 'A',
        Remarks: ''
      });
      // Disable status control when not in edit mode
      this.stateForm.get('status')?.disable();
    }
  }

  goBack() {
    this.router.navigate(['master/state/list']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  showInfo() {
    if (!this.stateData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.stateData;
    modalRef.componentInstance.idLabel = 'State Id';
    modalRef.componentInstance.idValue = this.stateData?.StateMasterSid;
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
					modalRef.componentInstance.DocumentSid = this.stateId;

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
    if (!this.stateData) return;
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
    modalRef.componentInstance.documentSid = this.stateId;
  }

openEDoc() {
  if (!this.stateData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.stateData;
  modalRef.componentInstance.idLabel = 'State Id';
  modalRef.componentInstance.idValue = this.stateData?.StateMasterSid;
}

ngOnDestroy(): void {
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
  }

}