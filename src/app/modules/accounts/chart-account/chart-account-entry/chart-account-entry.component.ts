import { CommonModule } from '@angular/common';
import { Component, TemplateRef, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { NgbModal, NgbModalRef, NgbDateStruct, NgbCalendar, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from 'src/app/modules/master/master.service';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AccountsService } from '../../accounts.service';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonService } from 'src/app/common/common.service';

@Component({
  selector: 'app-chart-account-entry',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule, NgbDropdownModule, SearchableDropdown],
  templateUrl: './chart-account-entry.component.html',
  styleUrl: './chart-account-entry.component.scss',
})
export class ChartAccountEntryComponent implements OnInit {
  chartForm!: FormGroup;
  chartData: any;
  isSubledgerRequired: boolean = false;
  TandCList: any;
  currentMenuId: number;
  chartMasterSid: number;
  isEditMode: boolean = false;
  currencyList: any[] = [];
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  userData: any;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  
  // Dynamic dropdown data
  groupList: any[] = [];
  subgroupList: any[] = [];
  isGroupDropdown: boolean = false;
  isSubgroupDropdown: boolean = false;

  modeOfCategoryRadio = [
  { id: 1, name: 'Asset', value: 'Asset' },
  { id: 2, name: 'Liability', value: 'Liability' },
  { id: 3, name: 'Income', value: 'Income' },
  { id: 4, name: 'Expense', value: 'Expense' }
];

  modeofreporttype = [
    { id: 1, name: 'Balance Sheet' },
    { id: 2, name: 'Profit and Loss' }
  ];

  modeOfStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];

  ledgerCategoryList = [
    { id: 1, name: 'Group' },
    { id: 2, name: 'Subgroup' },
    { id: 3, name: 'Ledger' }
  ];

  modeOfledgertype = [
    { id: 1, name: 'Accrual'},
    { id: 2, name: 'Bank' },
    { id: 3, name: 'Cash' },
    { id: 4, name: 'Cost' },
    { id: 5, name: 'Depreciation' },
    { id: 6, name: 'Expenses GST' },
    { id: 7, name: 'Imprest' },
    { id: 8, name: 'Income GST' },
    { id: 9, name: 'Income Tax Payable' },
    { id: 10, name: 'Income Tax Receivable' },
    { id: 11, name: 'Input Tax' },
    { id: 12, name: 'Liabilities' },
    { id: 13, name: 'Output Tax' },
    { id: 14, name: 'Revenue' },
    { id: 15, name: 'Sy Cr' },
    { id: 16, name: 'Sy Dr' }
  ];

  CurrencyLookupConfig = {
    displayFields: ['currencyCode', 'currencyName', 'countryName'],
    displayLabels: ['Code', 'Name', 'Country'],
    labelFields: ['currencyCode'],
  };

  auditLogs: any[] = [];
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
    private commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  localStorage.getItem('currentMenuId');
    this.initForm();
    this.getCurrencies();
    this.setupFormListeners();
    
    this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.chartMasterSid = +id;
        this.isEditMode = true;
        this.loadChartAccount();
      }
    });
    
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    
    if (!this.isEditMode) {
      this.minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
    }
  }

  initForm() {
    this.chartForm = this.fb.group({
      LedgerName: ['', [ Validators.maxLength(100)]],
      LedgerCode: ['', [ Validators.maxLength(10)]],
      SubGroupName: ['', [Validators.maxLength(20)]],
      LedgerCurrency: [],
      GroupName: ['', [Validators.maxLength(100)]],
      LedgerType: [''],
      Category: ['', Validators.required],
      LedgerCategory: ['', Validators.required],
      ReportType: [{ value: '', disabled: true }],
      Remarks: ['', [Validators.maxLength(200)]],
      Status: ['Active'],
      SubledgerName: ['N'],
      JobNoRequire: ['N'],
      HSNRequire: ['N']
    });
  }

  setupFormListeners() {
    // Category change listener
    this.chartForm.get('Category')!.valueChanges.subscribe((category: string) => {
      this.updateReportType(category);
      this.resetDependentFields();
      if (category) {
        this.loadGroupsByCategory(category);
      }
    });

    // Ledger Category change listener
    this.chartForm.get('LedgerCategory')!.valueChanges.subscribe((ledgerCategory: string) => {
      this.handleLedgerCategoryChange(ledgerCategory);
    });

    // GroupName change listener
    this.chartForm.get('GroupName')!.valueChanges.subscribe((groupName: string) => {
      const category = this.chartForm.get('Category')?.value;
      const ledgerCategory = this.chartForm.get('LedgerCategory')?.value;
      
      if (category && groupName && (ledgerCategory === 'Subgroup' || ledgerCategory === 'Ledger')) {
        this.loadSubgroupsByGroup(category, groupName);
      } else {
        this.subgroupList = [];
        this.chartForm.get('SubGroupName')?.setValue('');
      }
    });
  }

  // Field visibility methods
  shouldShowGroupName(): boolean {
    const ledgerCategory = this.chartForm.get('LedgerCategory')?.value;
    return ledgerCategory === 'Group' || ledgerCategory === 'Subgroup' || ledgerCategory === 'Ledger';
  }

  shouldShowSubGroupName(): boolean {
    const ledgerCategory = this.chartForm.get('LedgerCategory')?.value;
    return ledgerCategory === 'Subgroup' || ledgerCategory === 'Ledger';
  }

  shouldShowLedgerFields(): boolean {
    const ledgerCategory = this.chartForm.get('LedgerCategory')?.value;
    return ledgerCategory === 'Ledger';
  }

  updateReportType(category: string) {
    const reportType = (category === 'Asset' || category === 'Liability') ? 'Balance Sheet' :
                      (category === 'Income' || category === 'Expense') ? 'Profit and Loss' : '';
    this.chartForm.get('ReportType')!.setValue(reportType, { emitEvent: false });
  }

  handleLedgerCategoryChange(ledgerCategory: string) {
    const category = this.chartForm.get('Category')?.value;
    
    // Reset dependent fields
    this.chartForm.get('GroupName')?.setValue('');
    this.chartForm.get('SubGroupName')?.setValue('');
    this.subgroupList = [];

    switch (ledgerCategory) {
      case 'Group':
        this.isGroupDropdown = false; // Free text for new group creation
        this.isSubgroupDropdown = false;
        break;
        
      case 'Subgroup':
        this.isGroupDropdown = true; // Dropdown for existing groups
        this.isSubgroupDropdown = false; // Free text for new subgroup
        if (category) {
          this.loadGroupsByCategory(category);
        }
        break;
        
      case 'Ledger':
        this.isGroupDropdown = true; // Dropdown for existing groups
        this.isSubgroupDropdown = true; // Dropdown for existing subgroups
        if (category) {
          this.loadGroupsByCategory(category);
        }
        break;
        
      default:
        this.isGroupDropdown = false;
        this.isSubgroupDropdown = false;
    }
  }

  resetDependentFields() {
    this.chartForm.get('GroupName')?.setValue('');
    this.chartForm.get('SubGroupName')?.setValue('');
    this.groupList = [];
    this.subgroupList = [];
  }

  loadGroupsByCategory(category: string) {
    if (!category || !this.currentCompany?.CompanyMasterSid) return;

    this.masterServ.getAllGroupsByCategory({
      Category: category,
      CompanyMasterSid: this.currentCompany.CompanyMasterSid
    }).subscribe({
      next: (groups: string[]) => {
        this.groupList = groups.map(group => ({ name: group }));
      },
      error: (err) => {
        console.error('Failed to load groups', err);
        this.groupList = [];
      }
    });
  }

  loadSubgroupsByGroup(category: string, groupName: string) {
    if (!category || !groupName || !this.currentCompany?.CompanyMasterSid) return;

    this.masterServ.getAllSubgroupsByGroup({
      Category: category,
      GroupName: groupName,
      CompanyMasterSid: this.currentCompany.CompanyMasterSid
    }).subscribe({
      next: (subgroups: string[]) => {
        this.subgroupList = subgroups.map(subgroup => ({ name: subgroup }));
      },
      error: (err) => {
        console.error('Failed to load subgroups', err);
        this.subgroupList = [];
      }
    });
  }

  getCurrencies(): void {
    this.masterServ.getAllCurrencies().subscribe({
      next: (data) => {
        const rawlist = data?.data ?? data ?? [];
        this.currencyList = rawlist.map((item: any) => ({
          ...item,
          countryName: item?.countryMaster?.countryName ?? '',
        }));
      },
      error: (err) => {
        console.error('Failed to load currencies', err);
        this.currencyList = [];
      }
    });
  }

  loadChartAccount() {
    this.masterServ.fetchCoaById(this.chartMasterSid).subscribe(
      (data: any) => {
        this.chartData = data;
        this.isSubledgerRequired = data.IsSubledgerRequired;

        if (this.isSubledgerRequired) {
          this.chartForm.get('LedgerName')?.setValidators([Validators.required, Validators.maxLength(20)]);
        }

        // First set the category and ledger category to trigger the listeners
        this.chartForm.patchValue({
          Category: data.Category,
          LedgerCategory: data.LedgerCategory
        });

        // Wait for the listeners to process and then patch the remaining values
        setTimeout(() => {
          this.chartForm.patchValue({
            LedgerName: data.LedgerName,
            LedgerCode: data.LedgerCode,
            SubGroupName: data.SubGroupName,
            LedgerCurrency: data.LedgerCurrency,
            GroupName: data.GroupName,
            LedgerType: data.LedgerType,
            ReportType: data.ReportType,
            Remarks: data.Remarks,
            Status: data.Status === 'A' ? 'Active' : 'Suspended',
            SubledgerName: data.SubledgerName === 'Y' ? 'Y' : 'N',
            JobNoRequire: data.JobNoRequire === 'Y' ? 'Y' : 'N',
            HSNRequire: data.HSNRequire === 'Y' ? 'Y' : 'N',
          });

          // Load groups and subgroups for existing record after form is patched
          if (data.Category && data.GroupName) {
            this.loadSubgroupsByGroup(data.Category, data.GroupName);
          }

          // Disable fields if needed
          if (this.isEditMode && data.SubledgerName === 'Y') {
            this.chartForm.get('SubledgerName')?.disable({ emitEvent: false });
          }
          if (this.isEditMode && data.JobNoRequire === 'Y') {
            this.chartForm.get('JobNoRequire')?.disable({ emitEvent: false });
          }
          if (this.isEditMode && data.HSNRequire === 'Y') {
            this.chartForm.get('HSNRequire')?.disable({ emitEvent: false });
          }
        }, 100);
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
        ...formValue,
        Status: mappedStatus,
        UpdatedBy: currentuseremail,
    } : {
        ...formValue,
        Status: mappedStatus,
        CreatedBy: currentuseremail,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    };

    if (this.isEditMode) {
        this.masterServ.updateCoaById(this.chartMasterSid, payload).subscribe(
            (resp: any) => {
                if (resp.status) {
                    this.appSettingService.showSuccess("Chart Account Updated Successfully");
                   this.route.navigate(['/accounts/chart-accounts/entry']);
                    
                    this.resetFormForNewEntry();
                } else {
                    this.appSettingService.showError(resp.message);
                }
            },
            (error) => {
                console.error('Error updating Chart Account', error);
                // Show specific error message for linked records
                if (error.error && error.error.message) {
                    this.appSettingService.showError(error.error.message);
                } else {
                    this.appSettingService.showError('Error updating Chart Account');
                }
            }
        );
    } else {
        this.masterServ.createNewCoa(payload).subscribe(
            (resp: any) => {
                if (resp.status) {
                    this.appSettingService.showSuccess(resp.message);
                   this.route.navigate(['/accounts/chart-accounts/entry']);
                    
                    this.resetFormForNewEntry();
                } else {
                    this.appSettingService.showError(resp.message);
                }
            },
            (error) => {
                console.error('Error creating Chart Account', error);
                this.appSettingService.showError('Error creating Chart Account');
            }
        );
    }
}

  resetFormForNewEntry() {
    this.isEditMode = false;
    this.chartMasterSid = null;
    this.chartData = null;

    this.chartForm.reset({
      LedgerName: '',
      LedgerCode: '',
      SubGroupName: '',
      LedgerCurrency: '',
      GroupName: '',
      Category: '',
      LedgerType: '',
      LedgerCategory: '',
      ReportType: '',
      Remarks: '',
      Status: 'Active',
      SubledgerName: 'N',
      JobNoRequire: 'N',
      HSNRequire: 'N',
    });

    this.isSubledgerRequired = false;
    this.groupList = [];
    this.subgroupList = [];
    this.isGroupDropdown = false;
    this.isSubgroupDropdown = false;

    const ledgerControl = this.chartForm.get('LedgerName');
    ledgerControl?.clearValidators();
    ledgerControl?.setValidators([Validators.required, Validators.maxLength(100)]);
    ledgerControl?.updateValueAndValidity();

    this.minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
    this.chartForm.markAsUntouched();
    this.chartForm.updateValueAndValidity();
  }

  // Other methods remain the same...
  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    if (currentMenuId && userRole) {
      this.accountService
        .getRoleMenuPermissions(currentMenuId, userRole)
        .subscribe({
          next: (response) => {
            this.currentMenuPermissions = response.data.MenuPermissions || {};
            this.permissions = Object.keys(this.currentMenuPermissions).filter(
              (key) => this.currentMenuPermissions[key] === 'isTrue'
            );
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

  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.chartMasterSid) return;

    this.masterServ.getAuditLogsCOA(
      'COAMaster',
      this.chartMasterSid.toString()
    ).subscribe({
      next: (logs: any[]) => {
        const ignoredFields = ['UpdatedOn', 'UpdatedBy'];

        const formatFields = (val: any) => {
          if (!val) return [];
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          if (Object.keys(obj).length === 0) return [];
          return Object.entries(obj)
            .filter(([key]) => !ignoredFields.includes(key))
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
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
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
    modalRef.componentInstance.idLabel = 'COA Id';
    modalRef.componentInstance.idValue = this.chartData?.chartMasterSid;
 const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.chartMasterSid
  }

      this.commonService.documentData.set(data)
}
 ngOnDestroy(): void {
    this.commonService.clearDocumentData()
 }

  onReset() {
    if (this.isEditMode && this.chartMasterSid) {
      this.loadChartAccount();
      return;
    }

    this.chartForm.reset({
      LedgerName: '',
      LedgerCode: '',
      SubGroupName: '',
      LedgerCurrency: '',
      GroupName: '',
      Category: '',
      LedgerType: '',
      ReportType: '',
      Remarks: '',
      Status: 'Active',
      SubledgerName: 'N',
      JobNoRequire: 'N',
      HSNRequire: 'N',
    });
    
    this.chartForm.get('SubledgerName')?.enable({ emitEvent: false });
    this.chartForm.get('JobNoRequire')?.enable({ emitEvent: false });
    this.chartForm.get('HSNRequire')?.enable({ emitEvent: false });
    
    this.chartData = null;
    this.isSubledgerRequired = false;
    this.groupList = [];
    this.subgroupList = [];
    this.isGroupDropdown = false;
    this.isSubgroupDropdown = false;

    const ledgerControl = this.chartForm.get('LedgerName');
    ledgerControl?.clearValidators();
    ledgerControl?.setValidators([Validators.required, Validators.maxLength(100)]);
    ledgerControl?.updateValueAndValidity();

    this.minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
  }

  nagivateback() {
    this.route.navigate(['accounts/chart-accounts/list']);
  }
}