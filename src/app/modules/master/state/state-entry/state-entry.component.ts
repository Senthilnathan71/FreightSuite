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
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';

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
    NgbDropdownModule,
    SearchableDropdown
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
  countryLookupConfig = DROPDOWN_CONFIGS.COUNTRY;
  zoneLookupConfig = DROPDOWN_CONFIGS.ZONE;
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;


  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private modalService : NgbModal,
    public dropdownStore: DropdownStore,
    private commonService: CommonService,
    public mps: MenuPermissionService,
    private ngbModal: NgbModal,
    
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
	this.MenuMasterSid =  localStorage.getItem('currentMenuId');
    this.dropdownStore.loadCountries().subscribe(() => {
    this.dropdownStore.loadZones().subscribe(() => {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.stateId = +params['id'];
        this.isEditMode = true;
        this.getStateById(this.stateId);
        // Enable status control when in edit mode
        this.stateForm.get('status')?.enable();
      }
    });
  });
})
    //  this.appSettingService.getUser().subscribe((user) => {
    //   if (user) {
    //     this.userData = user;
    
    //   }
    // });
    this.mps.init().subscribe();
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
     
		}
  }

  hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

  onCountryChange(selectedCountryId: number) {
  
  if (selectedCountryId) {
    // Find the selected country
    const selectedCountry = this.dropdownStore.countries().find(
      country => country.CountryMasterSid === selectedCountryId
    );
    
    
    if (selectedCountry) {
      // Check if ZoneMasterSid exists in the country object
      const zoneId = selectedCountry.ZoneMasterSid;
      
      if (zoneId) {
        // Check if this zone exists in available zones
        const zoneExists = this.dropdownStore.zone().some(
          zone => zone.ZoneMasterSid === zoneId
        );
        
        
        if (zoneExists) {
          this.stateForm.patchValue({
            ZoneMasterSid: zoneId
          });
        } else {
          this.stateForm.patchValue({ ZoneMasterSid: '' });
        }
      } else {
        this.stateForm.patchValue({ ZoneMasterSid: '' });
      }
    }
  } else {
    this.stateForm.patchValue({ ZoneMasterSid: '' });
  }
}

  initForm() {
    this.stateForm = this.fb.group({
      stateName: ['', [Validators.required, Validators.maxLength(100), this.alphaSpaceValidator()]],
      stateCode: ['', [Validators.required, Validators.maxLength(2), this.alphaValidator()]],
      stateGSTCode: ['', [Validators.required, Validators.maxLength(2), Validators.pattern('^[0-9]*$'), this.trimSpaceValidator()]],
      CountryMasterSid: ['', Validators.required],
      ZoneMasterSid: [{value:'', disabled: true}, Validators.required],
      region: [''],
      status: [{value: 'A', disabled: true}, Validators.required],
      Remarks: ['']
    });

     this.stateForm.get('CountryMasterSid')?.valueChanges.subscribe(selectedCountryId => {
    this.onCountryChange(selectedCountryId);
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
        setTimeout(() => {
        this.stateForm.patchValue({
          ZoneMasterSid: state.ZoneMasterSid
        });
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
const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.stateId
  }

      this.commonService.documentData.set(data)
}
 openFollowup() {
    if (!this.stateData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.stateData?.UserMasterSid;
    modalRef.componentInstance.parentEmail = this.stateData;
  //   modalRef.componentInstance.parentSubject = `Quotation No.${this.userData} Date:${new Date(this.userData).toLocaleDateString()}`;
    modalRef.componentInstance.parentMailbody = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
    <p>Dear Sir/Madam,</p>
    <p>Please find enclosed the quotation as requested.</p>
    <p>Kindly review the details at your convenience.</p>
    <p>Looking forward to your feedback and the opportunity to work together.</p>
    <p>
      Approval Hyperlink: 
      <a href="https://xxxxxxxxx" target="_blank" style="color: #1a73e8;">Click here to approve</a>
    </p>
    <p>Best Regards,</p>
    <p>${this.userData['userEmail']}</p>
    </div>
  `;
  
  // Optionally, pass the quotation HTML content ID for PDF generation
  modalRef.componentInstance.pdfContentId = 'quotationContent';
  }
  
 OnDestroy(): void {
    this.commonService.clearDocumentData()
 }

ngOnDestroy(): void {
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
  }

}