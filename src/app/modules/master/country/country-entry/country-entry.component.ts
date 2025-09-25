import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { Zone } from 'src/app/modules/crm-mobile/Interfaces/zone.interface';
import { Currency } from 'src/app/modules/crm-mobile/Interfaces/currency.interface';
import { NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';

@Component({
  selector: 'app-country-entry',
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
  templateUrl: './country-entry.component.html',
  styleUrls: ['./country-entry.component.scss']
})
export class CountryEntryComponent implements OnInit {
  countryForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  countryId: number;
  countryData: any;
  userData:any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  zones: Zone[] = [];
  currencies: Currency[] = [];

  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended'
  };

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];
  currentMenuId: number;
  TandCList: any[];
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private modalService : NgbModal
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadZones();
    this.loadCurrencies();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.countryId = +params['id'];
        this.isEditMode = true;
        this.loadCountry(this.countryId);
        this.countryForm.get('status')?.enable();
      }
    });
    //  this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //       this.checkPermissions();
    //     }
    //   }
    // )
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
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

  initForm() {
    this.countryForm = this.fb.group({
      countryName: ['', [Validators.required, Validators.maxLength(100)]],
      countryCode: ['', [Validators.required, Validators.maxLength(2)]],
      ZoneMasterSid: ['', Validators.required],
      CurrencyMasterSid: ['', Validators.required],
      status: [{value: 'A', disabled: true}, Validators.required]
    });

    this.countryForm.get('countryCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.countryForm.get('countryCode')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  loadZones() {
    this.masterService.getAllZones().subscribe({
      next: (resp: any) => {
        this.zones = resp.data || resp;
      },
      error: (err) => {
        console.error('Error loading zones:', err);
        this.appSettingService.showError('Failed to load zones');
      }
    });
  }

  loadCurrencies() {
  this.masterService.getAllCurrencies().subscribe({
    next: (resp: any) => {
      console.log('Currencies loaded:', resp); // Add this line
      this.currencies = resp.data || resp;
    },
    error: (err) => {
      console.error('Error loading currencies:', err);
      this.appSettingService.showError('Failed to load currencies');
    }
  });
}

  loadCountry(id: number) {
    this.countryForm.reset();
    this.masterService.getCountryById(id).subscribe({
      next: (country: any) => {
        this.countryData = country;
        this.countryForm.patchValue({
          countryName: country.countryName,
          countryCode: country.countryCode,
          ZoneMasterSid: country.ZoneMasterSid,
          CurrencyMasterSid: country.CurrencyMasterSid,
          status: country.status || 'A'
        });
        this.countryForm.get('status')?.enable();
      },
      error: (err) => {
        console.error('Error loading country:', err);
        this.appSettingService.showError('Failed to load country data');
      }
    });
  }

  onSubmit() {
    if (this.countryForm.invalid) {
      this.markFormGroupTouched(this.countryForm);
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }
  
    this.btnDisable = true;
    
    const formValue = this.countryForm.value;
    const createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    
    const payload = {
      ...formValue,
      ZoneMasterSid: Number(formValue.ZoneMasterSid),
      CurrencyMasterSid: Number(formValue.CurrencyMasterSid),
      status: this.isEditMode ? formValue.status : 'A',
      ...(this.isEditMode ? updatedBy : createdBy)
    };
  
    const operation = this.isEditMode 
      ? this.masterService.updateCountryById(this.countryId, payload)
      : this.masterService.createCountry(payload);
  
    operation.subscribe({
    next: (resp: any) => {
      this.btnDisable = false;
      if (resp.status) {
        this.appSettingService.showSuccess(resp.message);
      } else {
        this.appSettingService.showError(resp.message);
      }
    },
      error: (err) => {
        this.btnDisable = false;
        const errorMessage = err.error?.message || 
          `Error ${this.isEditMode ? 'updating' : 'creating'} country`;
        this.appSettingService.showError(errorMessage);
      }
    });
  }

  
// openAuditLogs(modal: TemplateRef<any>) {
//   if (!this.countryData?.CountryMasterSid) return;

//   this.masterService.getAuditLogsCountry('CountryMaster', this.countryData?.CountryMasterSid.toString()).subscribe({
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
  if (!this.countryData?.CountryMasterSid) return;

  this.masterService.getAuditLogsCountry(
    'CountryMaster',
    this.countryData?.CountryMasterSid.toString()
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

  resetForm() {
    if (this.isEditMode) {
      this.loadCountry(this.countryId);
    } else {
      this.countryForm.reset({
        countryName: '',
        countryCode: '',
        ZoneMasterSid: '',
        CurrencyMasterSid: '',
        status: 'A'
      });
      this.countryForm.get('status')?.disable();
    }
  }

  goBack() {
    this.router.navigate(['master/country/list']);
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
    if(!this.countryData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.countryData;
    modalRef.componentInstance.idLabel = 'Country Id';
    modalRef.componentInstance.idValue = this.countryData?.CountryMasterSid;
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
          modalRef.componentInstance.DocumentSid = this.countryId;

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
    if (!this.countryData) return;
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
    modalRef.componentInstance.documentSid = this.countryId;
  }

openEDoc() {
  if (!this.countryData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.countryData;
  modalRef.componentInstance.idLabel = 'Country Id';
  modalRef.componentInstance.idValue = this.countryData?.CountryMasterSid;
}

}