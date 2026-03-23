import { Component, effect, OnInit, TemplateRef } from '@angular/core';
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
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';

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
    NgbDropdownModule,
    SearchableDropdown
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
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  zones: Zone[] = [];
  currencies: Currency[] = [];
  currentCompany: any;
  currentBranch: any; 
  MenuMasterSid: any;

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
  CurrencyLookupConfig = {
    displayFields: ['currencyCode', 'currencyName', 'countryName'],
    displayLabels: ['Code', 'Name', 'Country'],
    labelFields: ['currencyCode'],
  };  
  zoneLookupConfig = DROPDOWN_CONFIGS.ZONE;

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private modalService: NgbModal,
    public dropdownStore: DropdownStore,
    private commonService: CommonService,
     public mps : MenuPermissionService,
      private ngbModal: NgbModal,
  ) {
    this.initForm();
    effect(() => {
      const currencyData = this.dropdownStore.currencies();
      this.currencies = (currencyData || []).map(c => ({
        ...c,
        countryName: c?.countryMaster?.countryName || ''
      }));
    })
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch')); 
    this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    this.dropdownStore.loadZones().subscribe();
    this.dropdownStore.loadCurrencies().subscribe();
    // this.loadZones();
    // this.loadCurrencies();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.countryId = +params['id'];
        this.isEditMode = true;
        this.loadCountry(this.countryId);
        this.countryForm.get('status')?.enable();
      }
    });
    this.mps.init().subscribe();
    //  this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //      
    //     }
    //   }
    // )
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    
    }
  }

 

  hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

  initForm() {
    this.countryForm = this.fb.group({
      countryName: ['', [Validators.required, Validators.maxLength(100)]],
      countryCode: ['', [Validators.required, Validators.maxLength(2)]],
      ZoneMasterSid: ['', Validators.required],
      CurrencyMasterSid: ['', Validators.required],
      status: [{ value: 'A', disabled: true }, Validators.required]
    });

    this.countryForm.get('countryCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.countryForm.get('countryCode')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

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

  // loadCurrencies() {
  //   this.masterService.getAllCurrencies().subscribe({
  //     next: (resp: any) => {
  //       console.log('Currencies loaded:', resp); // Add this line
  //       this.currencies = resp.data || resp;
  //     },
  //     error: (err) => {
  //       console.error('Error loading currencies:', err);
  //       this.appSettingService.showError('Failed to load currencies');
  //     }
  //   });
  // }

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
        const ignoredFields = ['updatedOn', 'updatedBy']; // ✅ add more if needed later

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
    if (!this.countryData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.countryData;
    modalRef.componentInstance.idLabel = 'Country Id';
    modalRef.componentInstance.idValue = this.countryData?.CountryMasterSid;
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
  //         modalRef.componentInstance.DocumentSid = this.countryId;

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
    if (!this.countryData) return;
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
  const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.countryId
  }

      this.commonService.documentData.set(data)
}
 ngOnDestroy(): void {
    this.commonService.clearDocumentData()
}

  openFollowup() {
    if (!this.countryData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.countryData?.QuoteHeaderSid;
    modalRef.componentInstance.parentEmail = this.countryData.Email;
    modalRef.componentInstance.parentSubject = `Quotation No.${this.countryData.QuoteNumber} Date:${new Date(this.countryData.QuoteDate).toLocaleDateString()}`;
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
}