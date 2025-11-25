import { CommonModule } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AccountsService } from '../../accounts.service';
import { forkJoin, Subject } from 'rxjs';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';

@Component({
  selector: 'app-vendor-tds-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    FeatherModule,
    ReactiveFormsModule,
    CommonModule,
    NgbDatepickerModule,
    DecimalPrecisionDirective,
    OnlyNumbersDirective,
    TextWithNumbersDirective,
    NgbDropdownModule,
    SearchableDropdown
  ],
  templateUrl: './vendor-tds-entry.component.html',
  styleUrl: './vendor-tds-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class VendorTdsEntryComponent {
    private destroy$ = new Subject<void>();
  

  SupplierTdsMappingSid: number;
  isEditMode: boolean;
  userData: any;
  supplierTDSdata: any;
  deleteToggler = false;
  CustomerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  supplierTDSForm!: FormGroup;
  supplierList: any[] = [];
  tdsList: any[] = [];
  cusBranchList: any[] = [];

  // Datepicker related variable
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
  currentMenuId: number;
  TandCList: any;
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;


  constructor(
    private fb: FormBuilder,
    private currRoute: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private calendar: NgbCalendar,
    private accountService: AccountsService,
    private modalService : NgbModal,
    public dropdownStore: DropdownStore,
    public mps: MenuPermissionService
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  localStorage.getItem('currentMenuId');
    this.mps.init().subscribe();
    this.initTdsForm();
    this.loadLookUps();
    this.currRoute.paramMap.subscribe(
      (param) => {
        this.SupplierTdsMappingSid = +param.get('id');
        if (this.SupplierTdsMappingSid) {
          this.isEditMode = true;
          this.minEffectiveFromDate = undefined;
          this.loadSupplierTDS();
        } else {
          this.addTDSDetail();
        }
      }
    );
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
		}
    if (!this.isEditMode) {
      this.minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
    }
  }


  initTdsForm() {
    this.supplierTDSForm = this.fb.group({
      CustomerMasterSid: [null, [Validators.required]],
      TDSDetail: this.fb.array([]),
      Status: ['Active'],
      CompanyType: [{ value: '', disabled: true }],
      VendorName: [{ value: '', disabled: true }],
      PanNO: [{ value: '', disabled: true }],
      CountryName: [{ value: '', disabled: true }],
    });
  }

  get tdsDetailArray(): FormArray {
    return this.supplierTDSForm.get('TDSDetail') as FormArray;
  }

  removeTDSDetail(index: number) {
    this.tdsDetailArray.removeAt(index);
  }

  addTDSDetail() {
    const tdsDetailGroup = this.fb.group({
      CustomerBranchSid: [this.cusBranchList[0]?.CustomerBranchSid || null, [Validators.required]],
      TDSSetHeaderSid: [null, [Validators.required]],
      ITSecCode: [''],
      TaxExempt: [false],
      TransactionLimit: ['',[
        Validators.required,
        Validators.max(10000000), 
      ]],
      CertificateNo: [''],
      CertificatePercentage: [''],
      CertificateAmt: [''],
      EffectiveFrom: [null],
      EffectiveTo: [null],
    });
    this.tdsDetailArray.push(tdsDetailGroup);
  }

  // loadLookUps() {    
  //   const payload={
  //     CompanyMasterSid:this.currentCompany?.CompanyMasterSid,
  //     types: ['vendor', 'transporter', 'agent']
  //   }
  //   this.dropdownStore.loadCustomerTypeData(payload).subscribe();
  //   this.dropdownStore.loadtdsSet(Number(this.currentCompany?.CompanyMasterSid)).subscribe();
  // }

  loadLookUps() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin({
      suppliers: this.accountService.getAllSuppliers(CompanyMasterSid),
      tdsSet: this.accountService.getAllTDSSet(CompanyMasterSid),
    }).subscribe(({ suppliers, tdsSet }) => {
      this.supplierList = suppliers.data;
      this.tdsList = tdsSet.data;
    });
  }

  loadSupplierTDS() {
    this.accountService.getSupplierTDSById(this.SupplierTdsMappingSid).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          const response = resp.data;
          this.supplierTDSdata = response;
          this.supplierTDSForm.patchValue({
            CustomerMasterSid: response.CustomerMasterSid,
            Status: response.Status === 'A' ? 'Active' : 'Suspended',
          });
          this.tdsDetailArray.clear();
          // response.TDSDetails.forEach((detail: any) => {
          //   this.tdsDetailArray.push(this.fb.group({
          //     TDSSetHeaderSid: [detail.TDSSetHeaderSid, [Validators.required]],
          //     ITSecCode: [detail.ITSecCode],
          //     TaxExempt: [detail.TaxExempt === 'Y' ? true : false],
          //     TransactionLimit: [detail.TransactionLimit],
          //     CertificateNo: [detail.CertificateNo],
          //     CertificatePercentage: [detail.CertificatePercentage],
          //     CertificateAmt: [detail.CertificateAmt],
          //     EffectiveFrom: [new Date(detail.EffectiveFrom)],
          //     EffectiveTo: [new Date(detail.EffectiveTo)],
          //   }));
          // });
          this.tdsDetailArray.push(this.fb.group({
            CustomerBranchSid: [response.CustomerBranchSid, [Validators.required]],
            TDSSetHeaderSid: [response.TDSSetHeaderSid, [Validators.required]],
            ITSecCode: [response.ITSecCode],
            TaxExempt: [response.TaxExempt === 'Y' ? true : false],
            TransactionLimit: [response.TransactionLimit,[Validators.max(10000000)]],
            CertificateNo: [response.CertificateNo],
            CertificatePercentage: [response.CertificatePercentage],
            CertificateAmt: [response.CertificateAmt],
            EffectiveFrom: [new Date(response.EffectiveFrom)],
            EffectiveTo: [new Date(response.EffectiveTo)],
          }));
          this.handleLedgerChange(response.customerMaster);
        } else {
          this.appSettingService.showError('Error loading supplier TDS');
          console.error('Error loading supplier TDS', resp.message);
        }
      },
      error: (error: any) => {
        console.error(error);
      },
    });
  }

  onSubmit() {
    console.log("Submit triggered")
    if (this.supplierTDSForm.invalid) {
      this.supplierTDSForm.markAllAsTouched();
      this.supplierTDSForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all the required fields correctly.');
      return;
    }
    this.supplierTDSForm.get('CompanyType').enable();
    const formValue = this.supplierTDSForm.value;
    const currUserEmail = this.appSettingService.userSettingSource.value['userEmail'];

    const detailFormValue = this.tdsDetailArray.at(0).value;
    console.log(formValue);
    console.log(detailFormValue);

    const payload = {
      CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
      CustomerMasterSid: formValue.CustomerMasterSid,
      CustomerBranchSid: detailFormValue.CustomerBranchSid,
      TDSSetHeaderSid: detailFormValue.TDSSetHeaderSid,
      CompanyType : formValue.CompanyType,
      ITSecCode: detailFormValue.ITSecCode,
      TaxExempt: detailFormValue.TaxExempt ? 'Y' : 'N',
      TransactionLimit: parseFloat(detailFormValue.TransactionLimit) || 0,
      CertificateNo: detailFormValue.CertificateNo,
      CertificatePercentage: parseFloat(detailFormValue.CertificatePercentage) || 0,
      CertificateAmt: detailFormValue.CertificateAmt,
      EffectiveFrom: detailFormValue.EffectiveFrom,
      EffectiveTo: detailFormValue.EffectiveTo,
      Status: formValue.Status === 'Active' ? 'A' : 'S',
      ...(this.isEditMode ? { UpdatedBy: currUserEmail } : { CreatedBy: currUserEmail }),
    };

    console.log('Submitted:', payload);

    if (this.isEditMode) {
      this.accountService.updateSupplierTDSById(this.SupplierTdsMappingSid, payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message)
            this.router.navigate(['/accounts/supplier-tds/entry'],resp.data.SupplierTdsMappingSid);
          } else {
           this.appSettingService.showError(resp.message);
            console.error(resp.message);
          }
        },
      });
    } else {
      this.accountService.createSupplierTDS(payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.loadSupplierTDS[(resp.data.SupplierTdsMappingSid)];
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['/accounts/supplier-tds/entry'],resp.data.SupplierTdsMappingSid);
          } else {
            this.appSettingService.showError(resp.message);
            console.error(resp.message);
          }
        },
      });
    }
  }


openAuditLogs(modal: TemplateRef<any>) {
  if (!this.SupplierTdsMappingSid) return;

  this.accountService.getAuditLogsSupplierTDSMapping(
    'SupplierTdsMapping',
    this.SupplierTdsMappingSid.toString()
  ).subscribe({
    next: (logs: any[]) => {
      const ignoredFields = ['UpdatedOn', 'UpdatedBy']; // ✅ add more if needed later

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


  handleLedgerChange(ledger: any) {
    this.supplierTDSForm.get('VendorName')?.setValue(ledger?.CustomerName || '');
    this.supplierTDSForm.get('PanNO')?.setValue(ledger?.PanType || ledger?.PanName || '');
    this.supplierTDSForm.get('CompanyType')?.setValue(ledger?.CompanyType || '');
    this.supplierTDSForm.get('CountryName')?.setValue(ledger.countryMaster?.countryName || ledger?.CountryName || '');
    if (ledger && ledger.CustomerMasterSid !== undefined) {
      this.accountService.getCustomerBranchByCusId(ledger.CustomerMasterSid).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.cusBranchList = resp.data || [];
            const firstBranchSid = this.cusBranchList.length > 0 ? this.cusBranchList[0].CustomerBranchSid : null;
            // Set CustomerBranchSid for each FormGroup in TDSDetail FormArray
            this.tdsDetailArray.controls.forEach((group: FormGroup) => {
              group.get('CustomerBranchSid')?.setValue(firstBranchSid);
            });
          } else {
            this.appSettingService.showError('Error loading Customer Branch');
            console.error('Error loading Customer Branch', resp.message);
            this.cusBranchList = [];
          }
        },
        error: (error) => {
          console.error(error);
          this.cusBranchList = [];
        },
      });
    } else {
      this.supplierTDSForm.get('CustomerBranchSid')?.setValue(null);
      this.cusBranchList = [];
      this.tdsDetailArray.controls.forEach((group: FormGroup) => {
        group.get('CustomerBranchSid')?.setValue(null);
      });
    }
    this.tdsDetailArray.controls.forEach((group: FormGroup) => {
      group.get('CustomerBranchSid')?.updateValueAndValidity();
    });
  }

  handleTDSChange(tds: any, detailIndex: number) {
    if(tds === undefined || tds.TDSSetHeaderSid === undefined){
      this.tdsDetailArray.at(detailIndex).get('ITSecCode').setValue('');
      return;
    }
    this.accountService.getTDSDetailByHeader(tds.TDSSetHeaderSid).subscribe({
      next :(resp: any) => {
        if (resp.status) {
          if (resp.data.length > 0) {
            const ITSecCode = resp.data[0].ITSectionCode
            this.tdsDetailArray.at(detailIndex).get('ITSecCode').setValue(ITSecCode);
          } else {
            this.tdsDetailArray.at(detailIndex).get('ITSecCode').setValue('');
          }
        } else {
          this.tdsDetailArray.at(detailIndex).get('ITSecCode').setValue('');
          this.appSettingService.showError('Error loading ITSecCode');
        }
      },
      error : (error:any) => {
        this.tdsDetailArray.at(detailIndex).get('ITSecCode').setValue('');
        console.error(error);
      }
    })
  }

  preventTableTouch(event: Event): void {
    const target = event.target as HTMLElement;
    // Only stop propagation if the click is not on a form control
    if (!target.closest('input, select, ng-select')) {
      event.stopPropagation();
    }
  }

  toggleCheckBox(event: Event, tdsDetailIndex: number) {
    const element = event.target as HTMLInputElement;
    element.checked = !element.checked;
    const tdsDetail = this.tdsDetailArray.at(tdsDetailIndex) as FormGroup;
    tdsDetail.get('TaxExempt')?.setValue(!tdsDetail.get('TaxExempt')?.value);
    tdsDetail.get('TaxExempt')?.updateValueAndValidity();
  }

  toNgbDateStruct(date: Date | null): NgbDateStruct | null {
    if (!date) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  toggleDelete() {
    this.deleteToggler = !this.deleteToggler;
  }

  navigateBack() {
    history.back();
  }

  showInfo() {
    if (!this.supplierTDSdata) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.supplierTDSdata;
    modalRef.componentInstance.idLabel = 'Supplier TDS Mapping Id';
    modalRef.componentInstance.idValue = this.supplierTDSdata?.SupplierTdsMappingSid;
  }

  openTandC() {
      this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
      const payload = { MenuMasterSid: this.currentMenuId };
      this.accountService.getTandCByCondition(payload).subscribe(
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
            modalRef.componentInstance.DocumentSid = this.SupplierTdsMappingSid;
  
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
      if (!this.supplierTDSdata) return;
      const modalRef = this.modalService.open(EmailEntryComponent, {
        size: 'lg',
        centered: true,
        backdrop: 'static'
      });
      modalRef.componentInstance.item = this.supplierTDSdata;
    modalRef.componentInstance.idLabel = 'Supplier TDS Mapping Id';
    modalRef.componentInstance.idValue = this.supplierTDSdata?.SupplierTdsMappingSid;
    }
  
  
      openAuthority() {
      if (!this.supplierTDSdata) return;
      const modalRef = this.modalService.open(AuthorityLogComponent, {
        size: 'lg',
        centered: true,
        backdrop: 'static'
      });
      modalRef.componentInstance.item = this.supplierTDSdata;
      modalRef.componentInstance.idLabel = 'Supplier TDS Mapping Id';
      modalRef.componentInstance.idValue = this.supplierTDSdata?.SupplierTdsMappingSid;
    }
  
    openEDoc() {
      if (!this.supplierTDSdata) return;
      const modalRef = this.modalService.open(EdocComponent, {
        size: 'lg',
        centered: true,
        backdrop: 'static'
      });
      modalRef.componentInstance.item = this.supplierTDSdata;
      modalRef.componentInstance.idLabel = 'Supplier TDS Mapping Id';
      modalRef.componentInstance.idValue = this.supplierTDSdata?.SupplierTdsMappingSid;
      const data:any={
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid : this.MenuMasterSid,
      DocumentSid: this.supplierTDSdata?.SupplierTdsMappingSid

      }
    }

    openFollowup(){

    }

  // onReset() {
  //   this.supplierTDSForm.reset({
  //     Status: 'Active',
  //   });
  //   this.tdsDetailArray.clear();
  //   this.addTDSDetail();
  // }
  onReset() {
  // If editing an existing supplier TDS, reload it (restore original state)
  if (this.isEditMode && this.SupplierTdsMappingSid) {
    this.loadSupplierTDS();
    return;
  }

  // Create-mode: reset main form to sensible defaults
  this.supplierTDSForm.reset({
    CustomerMasterSid: null,
    Status: 'Active',
    CompanyType: '',
    VendorName: '',
    PanNO: '',
    CountryName: ''
  });

  // Clear and reset TDS detail array
  this.tdsDetailArray.clear();
  this.addTDSDetail();

  // Reset supplier and branch data
  this.cusBranchList = [];
  
  // Reset min date to today for new entries
  this.minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);

  // Clear form validation states
  this.supplierTDSForm.markAsUntouched();
  this.supplierTDSForm.updateValueAndValidity();

  // Reset delete toggler if active
  this.deleteToggler = false;
}


ngOnDestroy(): void {
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
  }
  
}