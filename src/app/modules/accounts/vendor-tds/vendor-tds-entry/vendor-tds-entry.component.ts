import { CommonModule } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AccountsService } from '../../accounts.service';
import { forkJoin } from 'rxjs';
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
    TextWithNumbersDirective
  ],
  templateUrl: './vendor-tds-entry.component.html',
  styleUrl: './vendor-tds-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class VendorTdsEntryComponent {

  SupplierTdsMappingSid: number;
  isEditMode: boolean;
  userData: any;
  supplierTDSdata: any;
  deleteToggler = false;
  permissions : string[] = [];
  currentMenuPermissions: any = {};

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

  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;


  constructor(
    private fb: FormBuilder,
    private currRoute: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private calendar: NgbCalendar,
    private accountService: AccountsService,
    private modalService : NgbModal
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
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
    // this.appSettingService.getUser().subscribe(
    //   (resp) => {
    //     this.userData = resp;
    //     this.checkPermissions();
    //   }
    // );
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
    if (!this.isEditMode) {
      this.minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
    }
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId);
    console.log(userRole);
    if (currentMenuId && userRole) {
      this.accountService
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
            this.router.navigate(['/accounts/supplier-tds/list']);
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
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['/accounts/supplier-tds/list']);
            
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

  this.accountService.getAuditLogsSupplierTDSMapping('SupplierTdsMapping', this.SupplierTdsMappingSid.toString()).subscribe({
    next: (logs: any[]) => {
      const formatFields = (val: any) => {
        if (!val) return ['NA'];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        delete obj.updatedOn; // Remove updatedOn field
        // If no fields exist after deleting updatedOn
        if (Object.keys(obj).length === 0) return ['NA'];
        return Object.entries(obj).map(
          ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
        );
      };

      this.auditLogs = logs.map(log => ({
        ...log,
        oldValDisplay: formatFields(log.oldVal),
        newValDisplay: formatFields(log.newVal)
      }));

      this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
    },
    error: err => console.error('Error fetching audit logs:', err)
  });
}



  handleLedgerChange(ledger: any) {
    this.supplierTDSForm.get('VendorName')?.setValue(ledger?.CustomerName || '');
    this.supplierTDSForm.get('PanNO')?.setValue(ledger?.PanName || '');
    this.supplierTDSForm.get('CompanyType')?.setValue(ledger?.CompanyType || '');
    this.supplierTDSForm.get('CountryName')?.setValue(ledger?.countryMaster?.countryName || '');
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
      modalRef.componentInstance.documentSid = this.SupplierTdsMappingSid;
    }
  
    openEDoc() {
      if (!this.supplierTDSdata) return;
      const modalRef = this.modalService.open(EdocComponent, {
        size: 'lg',
        centered: true,
        backdrop: 'static'
      });
    }

  onReset() {
    this.supplierTDSForm.reset({
      Status: 'Active',
    });
    this.tdsDetailArray.clear();
    this.addTDSDetail();
  }
}