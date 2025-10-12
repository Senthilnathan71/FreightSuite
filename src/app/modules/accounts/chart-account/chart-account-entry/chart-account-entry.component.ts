import { CommonModule } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router ,ActivatedRoute } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { NgbModal, NgbModalRef,NgbDateStruct, NgbCalendar, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from 'src/app/modules/master/master.service';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AccountsService } from '../../accounts.service';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
@Component({
  selector: 'app-chart-account-entry',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule, NgbDropdownModule,SearchableDropdown],
  templateUrl: './chart-account-entry.component.html',
  styleUrl: './chart-account-entry.component.scss',
})
export class ChartAccountEntryComponent {
  chartForm!: FormGroup;
  chartData: any;
  isSubledgerRequired: boolean = false;
  TandCList: any;
  currentMenuId: number;
  chartMasterSid: number;
  isEditMode: boolean = false;
  currencyList: any[] = [];
  currentCompany:any;
  userData: any;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
  permissions : string[] = [];
  currentMenuPermissions: any = {};
  modeOfCategory = [
  { id: 1, name: 'Asset' },
  { id: 2, name: 'Liability' },
  { id: 3, name: 'Income' },
  { id: 4, name: 'Expenses' }
];
modeofreporttype = [
  { id: 1, name: 'Balance Sheet' },
  { id: 2, name: 'Profit and Loss' }
];

  modeOfStatus = [
  { id: 'A', name: 'Active' },
  { id: 'S', name: 'Suspended' },
];


  // modeOfledgertype = [
  //   { id: 1, name: 'Expense' },
  //   { id: 2, name: 'Asset' },
  // ];


 modeOfledgertype = [
  { id: 1, name: 'Bank' },
  { id: 2, name: 'Cash' },
  { id: 3, name: 'Depreciation' },
  { id: 4, name: 'Expenses GST' },
  { id: 5, name: 'Imprest' },
  { id: 6, name: 'Income GST' },
  { id: 7, name: 'Income Tax Payable' },
  { id: 8, name: 'Income Tax Receivable' },
  { id: 9, name: 'Input Tax' },
  { id: 10, name: 'Liabilities' },
  { id: 11, name: 'Output Tax' },
  { id: 12, name: 'Sy Cr' },
  { id: 13, name: 'Sy Dr' }
];
CurrencyLookupConfig = {
    displayFields : ['currencyCode', 'currencyName','countryName'],
    displayLabels : ['Code', 'Name','Country'],
    labelFields :['currencyCode', 'currencyName','countryName'],
  };


  
auditLogs: any[] = []; // Stores audit logs
 auditLogModalRef!: NgbModalRef;


  constructor(
    private masterServ: MasterService,
    private fb: FormBuilder,
    private route: Router,
     private activatedRoute: ActivatedRoute,
    private appSettingService: AppSettingsService,
    private modalService: NgbModal,
     private calendar: NgbCalendar,
      private accountService: AccountsService,
  ) {}

   ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.initForm();
    this.getCurrencies();
    this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.chartMasterSid = +id;
        this.isEditMode = true;
        this.loadChartAccount();
      }
    });
      const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
    if (!this.isEditMode) {
      this.minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
    }
  }

 getCurrencies(): void {
  this.masterServ.getAllCurrencies().subscribe({
    next: (data) => {
      console.log('Currency List(raw):', data); 
      const rawlist = data?. data ?? data??[];

      this.currencyList = rawlist.map((item:any)=>({
        ...item,
        countryName: item?.countryMaster?.countryName?? '',
      }));
    },
    error: (err) => {
      console.error('Failed to load currencies', err);
      this.currencyList = [];
    }
  });
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

  hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

 toNgbDateStruct(date: Date | null): NgbDateStruct | null {
    if (!date) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  initForm() {
    this.chartForm = this.fb.group({
      LedgerName: ['', [Validators.required, Validators.maxLength(100)]],
      LedgerCode: ['', [Validators.required, Validators.maxLength(10)]],
      SubGroupName: ['', [Validators.maxLength(20)]],
      LedgerCurrency: [],
      GroupName: ['', [Validators.maxLength(100)]],
      LedgerType:['',[Validators.required]],
      Category: ['', [Validators.required]],
      ReportType: [{ value: '' }, [Validators.required]],
      Remarks: ['', [Validators.maxLength(200)]],
      Status: ['Active'],
      // IsSubledgerRequired: [false],
      SubledgerName: ['N', [Validators.required]],
      JobNoRequire: ['N' ],
      HSNRequire: ['N' ]
    });
    this.chartForm.get('Category')!.valueChanges.subscribe((cat: string) => {
    const report = (cat === 'Asset' || cat === 'Liability') ? 'Balance Sheet' :
                   (cat === 'Income' || cat === 'Expenses') ? 'Profit and Loss' : '';
    this.chartForm.get('ReportType')!.setValue(report, { emitEvent: false });
  });
  }

  loadChartAccount() {
    this.masterServ.fetchCoaById(this.chartMasterSid).subscribe(
      (data: any) => {
        this.chartData = data;
        this.isSubledgerRequired = data.IsSubledgerRequired;

        if (this.isSubledgerRequired) {
          this.chartForm
            .get('LedgerName')
            ?.setValidators([Validators.required, Validators.maxLength(20)]);
        }

          this.chartForm.patchValue({
          LedgerName: data.LedgerName,
          LedgerCode: data.LedgerCode,
          SubGroupName: data.SubGroupName,
          LedgerCurrency: data.LedgerCurrency,
          GroupName: data.GroupName,
          Category: data.Category,
          LedgerType: data.LedgerType,
          ReportType:data.ReportType,
          Remarks: data.Remarks,
          Status: data.Status === 'A' ? 'Active' : 'Suspended',
          SubledgerName: data.SubledgerName === 'Y' ? 'Y' : 'N',
          JobNoRequire: data.JobNoRequire === 'Y' ? 'Y' : 'N',
          HSNRequire: data.HSNRequire === 'Y' ? 'Y' : 'N',
        });
        if (this.isEditMode && data.SubledgerName === 'Y') {
        this.chartForm.get('SubledgerName')?.disable({ emitEvent: false });
      }
 if (this.isEditMode && data.JobNoRequire === 'Y') {
        this.chartForm.get('JobNoRequire')?.disable({ emitEvent: false });
      }
      if (this.isEditMode && data.HSNRequire === 'Y') {
        this.chartForm.get('HSNRequire')?.disable({ emitEvent: false });
      }

        
      },
      (error) => {
        this.appSettingService.showError('Error loading Chart Account', error);
      }
    );
  }

onSubmit(): void {
  if (this.chartForm.invalid) {
    this.chartForm.markAllAsTouched();
    this.appSettingService.showWarning('Please fill out all required fields correctly.');
    return;
  }

  const formValue = this.chartForm.getRawValue();
  const mappedStatus = formValue.Status === 'Active' || formValue.Status === 'A' ? 'A' : 'S';
  const currentuseremail = this.appSettingService.userSettingSource.value['userEmail'];
  
  const payload = this.isEditMode ? {
    ...this.chartForm.value,
    Status: mappedStatus,
    UpdatedBy: currentuseremail,
  } : {
    ...this.chartForm.value,
    Status: mappedStatus,
    CreatedBy: currentuseremail,
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
  };

  if (this.isEditMode) {
    this.masterServ.updateCoaById(this.chartMasterSid, payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess("Chart Account Updated Successfully");
          // Navigate to create new entry after successful update
          if(resp?.data?.COAMasterSid){
             this.route.navigate(['/accounts/chart-accounts/entry', resp?.data?.COAMasterSid]);
          }
          this.resetFormForNewEntry();
        } else {
          this.appSettingService.showError(resp.message);
          console.error(resp.message);
        }
      },
      (error) => {
        console.error('Error updating Chart Account', error);
      }
    );
  } else {
    this.masterServ.createNewCoa(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess(resp.message);
          // const caoId = resp?.data?.COAMasterSid;
          if(resp?.data?.COAMasterSid){
             this.route.navigate(['/accounts/chart-accounts/entry', resp.data.chartMasterSid]);
          }
          // For new entries, stay on the same page but reset form for next entry
          this.resetFormForNewEntry();
          // Optionally navigate to the new entry if you want to show the created record
          
        } else {
          this.appSettingService.showError(resp.message);
          console.error(resp.message);
        }
      },
      (error) => {
        console.error('Error creating Chart Account', error);
      }
    );
  }
}

// Add this method to reset form for new entry after update
resetFormForNewEntry() {
  this.isEditMode = false;
  this.chartMasterSid = null;
  this.chartData = null;
  
  // Reset the form
  this.chartForm.reset({
    LedgerName: '',
    LedgerCode: '',
    SubGroupName: '',
    LedgerCurrency: '',
    GroupName: '',
    Category: '',
    LedgerType: '',
    ReportType:'',
    Remarks: '',
    Status: 'Active',
    SubledgerName: 'N',
    JobNoRequire: 'N',
    HSNRequire: 'N',
  });
  
  // Reset additional state
  this.isSubledgerRequired = false;
  
  // Reset validation for LedgerName
  const ledgerControl = this.chartForm.get('LedgerName');
  ledgerControl?.clearValidators();
  ledgerControl?.setValidators([Validators.required, Validators.maxLength(100)]);
  ledgerControl?.updateValueAndValidity();
  
  // Reset date restrictions
  this.minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
  
  // Reset form state
  this.chartForm.markAsUntouched();
  this.chartForm.updateValueAndValidity();
}

openAuditLogs(modal: TemplateRef<any>) {
  if (!this.chartMasterSid) return;

  this.masterServ.getAuditLogsCOA(
    'COAMaster',
    this.chartMasterSid.toString()
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

  showInfo() {
    if (!this.chartData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.chartData;
    modalRef.componentInstance.idLabel = 'Vessel Id';
    modalRef.componentInstance.idValue = this.chartData?.VesselMasterSid;
  }

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterServ.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true,
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.chartMasterSid;
        } else {
          this.appSettingService.showError(
            'Error loading Terms and Conditions'
          );
        }
      },
      (error) => {
        this.appSettingService.showError(
          'Error loading Terms and Conditions',
          error
        );
      }
    );
  }

  openEmail() {
    if (!this.chartData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
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
    modalRef.componentInstance.documentSid = this.chartMasterSid;
  }

  openEDoc() {
    if (!this.chartData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.chartData;
    modalRef.componentInstance.idLabel = 'Vessel Id';
    modalRef.componentInstance.idValue = this.chartData?.VesselMasterSid;
  }

  // onReset(): void {
  //   this.chartForm.reset({
  //     Name: '',
  //     code: '',
  //     subGroup: '',
  //     CurrencyCode: '',
  //     Group: '',
  //     Category: '',
  //     reportType: '',
  //     PortType: '',
  //     Remarks: '',
  //     AccountType: '',
  //     IsSubledgerRequired: false,
  //   });

  //   this.chartForm.markAsPristine();
  //   this.chartForm.markAsUntouched();
  // }
  onReset() {
  // If editing an existing chart account, reload it (restore original state)
  if (this.isEditMode && this.chartMasterSid) {
    this.loadChartAccount();
    return;
  }

  // Create-mode: reset form to initial state with proper defaults
  this.chartForm.reset({
    LedgerName: '',
    LedgerCode: '',
    SubGroupName: '',
    LedgerCurrency: '',
    GroupName: '',
    Category: '',
    LedgerType: '',
    ReportType:'',
    Remarks: '',
    Status: 'Active',
    SubledgerName: 'N',
    JobNoRequire: 'N',
    HSNRequire: 'N',
  });
  this.chartForm.get('SubledgerName')?.enable({ emitEvent: false });
  this.chartForm.get('JobNoRequire')?.enable({ emitEvent: false });
  this.chartForm.get('HSNRequire')?.enable({ emitEvent: false });
  // Reset additional state variables
  this.chartData = null;
  this.isSubledgerRequired = false;
  
  // Reset validation for LedgerName
  const ledgerControl = this.chartForm.get('LedgerName');
  ledgerControl?.clearValidators();
  ledgerControl?.setValidators([Validators.required, Validators.maxLength(100)]);
  ledgerControl?.updateValueAndValidity();

  // Reset min date to today for new entries
  this.minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
}

  nagivateback() {
    this.route.navigate(['accounts/chart-accounts/list']);
  }
}
