import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Currency } from 'src/app/modules/crm-mobile/Interfaces/currency.interface';
import { NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { forkJoin } from 'rxjs';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';

@Component({
  selector: 'app-currency-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    DatePipe,
    NgSelectModule,
    NgbDropdownModule,
    SearchableDropdown,
    OnlyTextDirective,
    TextWithNumbersDirective
  ],
  templateUrl: './currency-entry.component.html',
  styleUrls: ['./currency-entry.component.scss']
})
export class CurrencyEntryComponent implements OnInit {
  currencyForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  currencyID: number;
  loading = false;
  currencyData: any;
  userData:any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  countryList: any[] = [];
  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];
  currentMenuId: any;
  TandCList: any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  currencylookupCofig ={
    displayFields : ['countryCode', 'countryName'],
    displayLabels : ['Code', 'Name'],
    labelFields :['countryCode', 'countryName'],
  }


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
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.currencyID = +params['id'];
        this.isEditMode = true;
        this.getCurrencyById(this.currencyID);
      }
    });

    // this.appSettingService.getUser().subscribe(
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
    this.loadlookup();
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
    this.currencyForm = this.fb.group({
      CountryMasterSid:['',[Validators.required]],
      currencyName: ['', [
        Validators.required, 
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z\s]*$/)
      ]],
      currencyCode: ['', [
        Validators.required,
        Validators.maxLength(3),
        Validators.pattern(/^[A-Z]{3}$/)
      ]],

      CurrencyUnit: ['', [
        Validators.required, 
        Validators.maxLength(50)
      ]],
      CurrencySubUnit: ['', [
        Validators.maxLength(50)
      ]],
      SubUnitIn: ['', [
     
      Validators.maxLength(3) 
    ]],
      ShortCode: ['', [
        Validators.maxLength(3)
      ]],
      Symbol: ['', [
        Validators.required, 
        Validators.maxLength(5)
      ]],
      amountDecimal: [2, [
        Validators.required,
        Validators.min(0),
        Validators.max(8),
        Validators.pattern(/^\d+$/)
      ]],
      exchangeDecimal: [4, [
        Validators.required,
        Validators.min(0),
        Validators.max(8),
        Validators.pattern(/^\d+$/)
      ]],
      RoundOf: ['', [
        Validators.maxLength(100)
      ]],
      status: [{value: 'A', disabled: !this.isEditMode}, Validators.required]
    });

    // Add value change handlers for form controls
    this.setupValueChangeHandlers();
  }

  setupValueChangeHandlers() {
  this.currencyForm.get('SubUnitIn')?.valueChanges.subscribe(val => {
    if (val && !/^[1-9]\d{0,2}$/.test(val)) {
      this.currencyForm.get('SubUnitIn')?.setValue('', { emitEvent: false });
    }
  });


    this.currencyForm.get('ShortCode')?.valueChanges.subscribe(val => {
      if (val) {
        const upperVal = val.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
        if (upperVal !== val) {
          this.currencyForm.get('ShortCode')?.setValue(upperVal, { emitEvent: false });
        }
      }
    });

    this.currencyForm.get('currencyName')?.valueChanges.subscribe(val => {
      if (val) {
        const cleanVal = val.replace(/[^a-zA-Z\s]/g, '');
        if (cleanVal !== val) {
          this.currencyForm.get('currencyName')?.setValue(cleanVal, { emitEvent: false });
        }
      }
    });

    this.currencyForm.get('SubUnitIn')?.valueChanges.subscribe(val => {
      if (val && (isNaN(val) || val < 1 || val > 1000)) {
        this.currencyForm.get('SubUnitIn')?.setValue(null, { emitEvent: false });
      }
    });
  }
loadlookup(){
  forkJoin({
    countries: this.masterService.getAllCountry(),
  }).subscribe(({countries})=>{
    this.countryList =countries.data;
  
  });
}
  getCurrencyById(id: number) {
    this.loading = true;
    this.masterService.getCurrencyById(id).subscribe({
      next: (currency: Currency) => {
        if (this.isEditMode) {
          this.currencyForm.get('status')?.enable();
        }
        this.currencyData = currency;
        this.currencyForm.patchValue({
          CountryMasterSid: currency.CountryMasterSid,
          currencyName: currency.currencyName,
          currencyCode: currency.currencyCode,
          CurrencyUnit: currency.CurrencyUnit, 
          CurrencySubUnit: currency.CurrencySubUnit,
          SubUnitIn: currency.SubUnitIn,
          ShortCode: currency.ShortCode,
          Symbol: currency.Symbol,
          amountDecimal: currency.amountDecimal,
          exchangeDecimal: currency.exchangeDecimal,
          RoundOf: currency.RoundOf,
          status: currency.status
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading currency:', err);
        this.loading = false;
        this.appSettingService.showError('Failed to load currency data');
      }
    });
  }

//   openAuditLogs(modal: TemplateRef<any>) {
//   if (!this.currencyData?.CurrencyMasterSid) return;

//   this.masterService.getAuditLogsCurrency('CurrencyMaster', this.currencyData?.CurrencyMasterSid.toString()).subscribe({
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
  if (!this.currencyData?.CurrencyMasterSid) return;

  this.masterService.getAuditLogsCurrency(
    'CurrencyMaster',
    this.currencyData?.CurrencyMasterSid.toString()
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

  onSubmit() {
    if (this.currencyForm.invalid) {
      this.markFormGroupTouched(this.currencyForm);
      return;
    }
  
    this.btnDisable = true;
    this.loading = true;

    const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    
    const payload = {
      CountryMasterSid: this.currencyForm.value.CountryMasterSid,
      currencyName: this.currencyForm.value.currencyName,
      currencyCode: this.currencyForm.value.currencyCode,
      CurrencyUnit: this.currencyForm.value.CurrencyUnit,
      CurrencySubUnit: this.currencyForm.value.CurrencySubUnit,
      SubUnitIn: this.currencyForm.value.SubUnitIn !== null 
      ? String(this.currencyForm.value.SubUnitIn) 
      : null,
      ShortCode: this.currencyForm.value.ShortCode,
      Symbol: this.currencyForm.value.Symbol,
      amountDecimal: Number(this.currencyForm.value.amountDecimal),
      exchangeDecimal: Number(this.currencyForm.value.exchangeDecimal),
      RoundOf: this.currencyForm.value.RoundOf,
      status: this.currencyForm.value.status,
      ...(this.isEditMode ? {updatedBy : currentUserEmail} : {createdBy : currentUserEmail})
    };
  
    const operation = this.isEditMode 
      ? this.masterService.editCurrency(this.currencyID, payload)
      : this.masterService.createCurrency(payload);
  
    operation.subscribe({
      next: (resp) => {
        this.loading = false;
        this.btnDisable = false;
      if (resp.status) {
        
        this.appSettingService.showSuccess(resp.message);
      } 
else {
        this.appSettingService.showError(resp.message);
      }

        this.router.navigate(['/master/currency/list']);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.btnDisable = false;
        if (err.status === 400 && err.error.message.includes('already exists')) {
          this.appSettingService.showError(err.error.message);
        } else {
          this.appSettingService.showError('Failed to process currency. Please try again.');
        }      
      }
    });
  }
  
  resetForm() {
    if (this.isEditMode) {
      this.getCurrencyById(this.currencyID);
    } else {
      this.currencyForm.reset({
        CountryMasterSid: '',
        currencyName: '',
        currencyCode: '',
        CurrencyUnit: '',
        CurrencySubUnit: '',
        SubUnitIn: null,
        ShortCode: '',
        Symbol: '',
        amountDecimal: 2,
        exchangeDecimal: 4,
        RoundOf: '',
        status: 'A'
      });
    }
  }

  goBack() {
    this.router.navigate(['master/currency/list']);
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
    if (!this.currencyData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.currencyData;
    modalRef.componentInstance.idLabel = 'Currency Id';
    modalRef.componentInstance.idValue = this.currencyData?.CurrencyMasterSid;
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
          modalRef.componentInstance.DocumentSid = this.currencyID;

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
    if (!this.currencyData) return;
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
    modalRef.componentInstance.documentSid = this.currencyID;
  }

openEDoc() {
  if (!this.currencyData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.currencyData;
  modalRef.componentInstance.idLabel = 'Currency Id';
  modalRef.componentInstance.idValue = this.currencyData?.CurrencyMasterSid;
}

}