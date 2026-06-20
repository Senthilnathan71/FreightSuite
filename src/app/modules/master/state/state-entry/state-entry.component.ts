import { Component, HostListener, OnDestroy, OnInit, TemplateRef } from '@angular/core';
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
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';

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
    SearchableDropdown,
    ElementStateGuardDirective,
    FormStateGuardDirective
  ],
  templateUrl: './state-entry.component.html',
  styleUrls: ['./state-entry.component.scss']
})
export class StateEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
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
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;
  private lastZoneWarningCountryId: number | null = null;


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
	this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    this.dropdownStore.loadCountries().subscribe(() => {
    this.dropdownStore.loadZones().subscribe(() => {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.stateId = +params['id'];
        this.isEditMode = true;
        this.getStateById(this.stateId);
        // Enable status control when in edit mode
        this.stateForm.get('status')?.enable();
      } else {
        this.initialFormValue = this.stateForm.getRawValue();
        this.isDirty = false;
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
    this.subscribeToFormChanges();
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

  private subscribeToFormChanges() {
    this.stateForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(
          this.initialFormValue,
          this.stateForm.getRawValue()
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

  hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

  onCountryChange(selectedCountryId: number | any) {
  const selectedCountryValue = typeof selectedCountryId === 'object'
    ? selectedCountryId?.CountryMasterSid
    : selectedCountryId;
  const countryId = Number(selectedCountryValue);
  
  if (countryId) {
    // Find the selected country
    const selectedCountry = this.dropdownStore.countries().find(
      country => Number(country.CountryMasterSid) === countryId
    );
    
    
    if (selectedCountry) {
      // Check if ZoneMasterSid exists in the country object
      const zoneId = selectedCountry.ZoneMasterSid;
      
      if (zoneId) {
        // Check if this zone exists in available zones
        const zoneExists = this.dropdownStore.zone().some(
          zone => Number(zone.ZoneMasterSid) === Number(zoneId)
        );
        
        
        if (zoneExists) {
          this.stateForm.patchValue({
            ZoneMasterSid: zoneId
          });
          this.lastZoneWarningCountryId = null;
        } else {
          this.stateForm.patchValue({ ZoneMasterSid: '' });
          this.showCountryZoneRequiredWarning(countryId);
        }
      } else {
        this.stateForm.patchValue({ ZoneMasterSid: '' });
        this.showCountryZoneRequiredWarning(countryId);
      }
    }
  } else {
    this.stateForm.patchValue({ ZoneMasterSid: '' });
    this.lastZoneWarningCountryId = null;
  }
}

  private showCountryZoneRequiredWarning(countryId: number): void {
    this.stateForm.get('ZoneMasterSid')?.markAsTouched();

    if (this.lastZoneWarningCountryId === countryId) {
      return;
    }

    this.lastZoneWarningCountryId = countryId;
    this.appSettingService.showWarning('Selected country has no zone, Zone is required.');
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
      Remarks: [''],
      IsUnionTerritory: [false]
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
          Remarks: state.Remarks || '',
          IsUnionTerritory: state.IsUnionTerritory === 'Y' ? true: false,
        });
        setTimeout(() => {
          this.stateForm.patchValue({
            ZoneMasterSid: state.ZoneMasterSid
          });
          this.initialFormValue = this.stateForm.getRawValue();
          this.isDirty = false;
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


openAuditLogs() {
      if (!this.stateData?.StateMasterSid) return;
  const modalRef = this.modalService.open(AuditLogComponent, {
        centered: true,
        scrollable: true,
        size: 'xl',
        windowClass: 'audit-log-modal'
      });
      modalRef.componentInstance.title = 'State Logs';
      modalRef.componentInstance.tableName = 'StateMaster';
      modalRef.componentInstance.recordId = this.stateData?.StateMasterSid.toString();
      modalRef.componentInstance.screenName = 'State';
    }

  onSubmit(resolve?: (value: boolean) => void) {

    const countryId = this.stateForm.get('CountryMasterSid')?.value;
  const zoneId = this.stateForm.get('ZoneMasterSid')?.value;

  if (countryId && !zoneId) {
    this.stateForm.get('ZoneMasterSid')?.markAsTouched();
    this.appSettingService.showWarning(
      'Selected country has no zone, Zone is required.'
    );
    if (resolve) resolve(false);
    return;
  }
    if (this.stateForm.invalid) {
      this.markFormGroupTouched(this.stateForm);
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      if (resolve) resolve(false);
      return;
    }

    const raw = this.stateForm.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.stateForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    this.isSaving = true;
    this.btnDisable = true;
    
    const formValue = raw;
    const createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    
    const payload = {
      ...formValue,
      CountryMasterSid: Number(formValue.CountryMasterSid),
      ZoneMasterSid: Number(formValue.ZoneMasterSid),
      IsUnionTerritory: formValue.IsUnionTerritory === false ? 'N' : 'Y',
      status: this.isEditMode ? formValue.status : 'A',
      ...(this.isEditMode ? updatedBy : createdBy)
    };
  
    const operation = this.isEditMode 
      ? this.masterService.editState(this.stateId, payload)
      : this.masterService.createState(payload);
  
    operation.subscribe({
      next: (resp: any) => {
        this.btnDisable = false;
        this.isSaving = false;
        const message = resp.message;        
        if (resp.status) {
          this.isDirty = false;
          this.initialFormValue = this.stateForm.getRawValue();
          this.appSettingService.showSuccess(message);
          if (resolve) resolve(true);
          this.router.navigate(['/master/state/list']);
        } else {
          if (resolve) resolve(false);
          this.appSettingService.showError(message );
        }
      },
      error: (err) => {
        this.btnDisable = false;
        this.isSaving = false;
        const errorMessage = err.error?.message || 
          `Error ${this.isEditMode ? 'updating' : 'creating'} state`;
        if (resolve) resolve(false);
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
        Remarks: '',
        IsUnionTerritory: false
      });
      // Disable status control when not in edit mode
      this.stateForm.get('status')?.disable();
      this.initialFormValue = this.stateForm.getRawValue();
      this.isDirty = false;
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

  // openTandC() {
	// 	this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
	// 	const payload = { MenuMasterSid: this.currentMenuId };
	// 	this.masterService.getTandCByCondition(payload).subscribe(
	// 		(resp: any) => {
	// 			if (resp.status) {
	// 				this.TandCList = resp.data;
	// 				const modalRef = this.modalService.open(TermsAndConditionsComponent, {
	// 					size: 'lg',
	// 					backdrop: 'static',
	// 					centered: true
	// 				});
	// 				modalRef.componentInstance.terms = this.TandCList;
	// 				modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
	// 				modalRef.componentInstance.DocumentSid = this.stateId;

	// 			} else {
	// 				this.appSettingService.showError('Error loading Terms and Conditions');
	// 			}
	// 		},
	// 		(error) => {
	// 			this.appSettingService.showError('Error loading Terms and Conditions', error);
	// 		}
	// 	);
	// }
  openEmail() {
    if (!this.stateData) return;
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

openDocRef() {
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);  
    modalRef.componentInstance.DocumentSid = this.stateId;
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
