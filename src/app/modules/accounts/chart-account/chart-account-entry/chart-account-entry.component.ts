import { CommonModule } from '@angular/common';
import { Component, HostListener, TemplateRef, OnDestroy, OnInit } from '@angular/core';
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
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { errorLogger } from 'src/app/common/helper';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';

@Component({
  selector: 'app-chart-account-entry',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule, NgbDropdownModule, SearchableDropdown, ElementStateGuardDirective, FormStateGuardDirective],
  templateUrl: './chart-account-entry.component.html',
  styleUrl: './chart-account-entry.component.scss',
})
export class ChartAccountEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  chartForm!: FormGroup;
  chartData: any;
  isSubledgerRequired: boolean = false;
  TandCList: any;
  currentMenuId: number;
  chartMasterSid: number;
  isEditMode: boolean = false;
  currencyList: any[] = [];
  branchList: any[] = [];
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  userData: any;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
  
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
    { id: 2, name: 'Asset' },
    { id: 3, name: 'Bank' },
    { id: 4, name: 'Cash' },
    { id: 5, name: 'Cost' },
    { id: 6, name: 'Depreciation' },
    { id: 7, name: 'Expenses GST' },
    { id: 8, name: 'Imprest' },
    { id: 9, name: 'Income GST' },
    { id: 10, name: 'Income Tax Payable' },
    { id: 11, name: 'Income Tax Receivable' },
    { id: 12, name: 'Input Tax' },
    { id: 13, name: 'Liabilities' },
    { id: 14, name: 'Other Cost'},
    { id: 15, name: 'Other Revenue'},
    { id: 16, name: 'Output Tax' },
    { id: 17, name: 'Revenue' },
    { id: 18, name: 'Sy Cr' },
    { id: 19, name: 'Sy Dr' },
    { id: 20, name: 'TDS Payable' },
    { id: 21, name: 'TDS Receivable' },
    { id: 22, name: 'Inter Branch' },
  ];

  CurrencyLookupConfig = {
    displayFields: ['currencyCode', 'currencyName', 'countryName'],
    displayLabels: ['Code', 'Name', 'Country'],
    labelFields: ['currencyCode'],
  };

  auditLogs: any[] = [];
  auditLogModalRef!: NgbModalRef;
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();

  constructor(
    private masterServ: MasterService,
    private fb: FormBuilder,
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private appSettingService: AppSettingsService,
    private modalService: NgbModal,
    private calendar: NgbCalendar,
    private accountService: AccountsService,
    private commonService: CommonService,
    public mps: MenuPermissionService
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    this.mps.init().subscribe();
    this.initForm();
    this.getCurrencies();
    this.getBranches();
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
    }
    
    if (!this.isEditMode) {
      this.minEffectiveFromDate = this.toNgbDateStruct(this.todayDate);
    }

    setTimeout(() => {
      this.initialFormValue = this.chartForm.getRawValue();
      this.isDirty = false;
      this.subscribeToFormChanges();
    }, 0);
  }

  initForm() {
    this.chartForm = this.fb.group({
      LedgerName: ['', [ Validators.maxLength(100)]],
      LedgerCode: ['', [ Validators.required,Validators.maxLength(10)]],
      SubGroupName: ['', [Validators.maxLength(50)]],
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
      HSNRequire: ['N'],
      InterBranchLocation: [null]
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

    // Inter Branch ledger: show + require InterBranchLocation only when LedgerType = 'Inter Branch'
    this.chartForm.get('LedgerType')!.valueChanges.subscribe((ledgerType: string) => {
      const ctrl = this.chartForm.get('InterBranchLocation');
      if (ledgerType === 'Inter Branch') {
        ctrl?.setValidators([Validators.required]);
      } else {
        ctrl?.clearValidators();
        ctrl?.setValue(null);
      }
      ctrl?.updateValueAndValidity();
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

  shouldShowInterBranch(): boolean {
    return this.chartForm.get('LedgerType')?.value === 'Inter Branch';
  }

  getBranches(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) return;
    this.masterServ.getBranchesByCompanyId(companyId).subscribe(
      (branches: any[]) => { this.branchList = branches || []; },
      () => { this.branchList = []; }
    );
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
    const CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    const payload = {
      COAMasterSid: this.chartMasterSid,
      CompanyMasterSid: CompanyMasterSid,
    }
    this.masterServ.fetchCoaById(payload).subscribe(
      (resp: any) => {
        if (resp.status === false) {
        this.appSettingService.showError('Access Denied');
        return;
      }
        this.chartData = resp.data;
        this.isSubledgerRequired = resp.data.IsSubledgerRequired;

        if (this.isSubledgerRequired) {
          this.chartForm.get('LedgerName')?.setValidators([Validators.required, Validators.maxLength(20)]);
        }

        // First set the category and ledger category to trigger the listeners
        this.chartForm.patchValue({
          Category: resp.data.Category,
          LedgerCategory: resp.data.LedgerCategory
        });

        // Wait for the listeners to process and then patch the remaining values
        setTimeout(() => {
          this.chartForm.patchValue({
            LedgerName: resp.data.LedgerName,
            LedgerCode: resp.data.LedgerCode,
            SubGroupName: resp.data.SubGroupName,
            LedgerCurrency: resp.data.LedgerCurrency,
            GroupName: resp.data.GroupName,
            LedgerType: resp.data.LedgerType,
            ReportType: resp.data.ReportType,
            Remarks: resp.data.Remarks,
            Status: resp.data.Status === 'A' ? 'Active' : 'Suspended',
            SubledgerName: resp.data.SubledgerName === 'Y' ? 'Y' : 'N',
            JobNoRequire: resp.data.JobNoRequire === 'Y' ? 'Y' : 'N',
            HSNRequire: resp.data.HSNRequire === 'Y' ? 'Y' : 'N',
            InterBranchLocation: resp.data.InterBranchLocation ?? null,
          });

          // Load groups and subgroups for existing record after form is patched
          if (resp.data.Category && resp.data.GroupName) {
            this.loadSubgroupsByGroup(resp.data.Category, resp.data.GroupName);
          }

          // Disable fields if needed
          if (this.isEditMode && resp.data.SubledgerName === 'Y') {
            this.chartForm.get('SubledgerName')?.disable({ emitEvent: false });
          }
          if (this.isEditMode && resp.data.JobNoRequire === 'Y') {
            this.chartForm.get('JobNoRequire')?.disable({ emitEvent: false });
          }
          if (this.isEditMode && resp.data.HSNRequire === 'Y') {
            this.chartForm.get('HSNRequire')?.disable({ emitEvent: false });
          }

          this.initialFormValue = this.chartForm.getRawValue();
          this.isDirty = false;
          this.chartForm.markAsUntouched();
        }, 100);
      },
      (error) => {
        this.appSettingService.showError('Accesss denied');
      }
    );
  }

  onSubmit(resolve?: (saved: boolean) => void): void {
    const raw = this.chartForm.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.chartForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    if (this.chartForm.invalid) {
        errorLogger(this.chartForm);
        this.chartForm.markAllAsTouched();
        this.appSettingService.showWarning('Please fill out all required fields correctly.');
        if (resolve) resolve(false);
        return;
    }

    const formValue = raw;
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
        this.isSaving = true;
        this.masterServ.updateCoaById(this.chartMasterSid, payload).subscribe(
            (resp: any) => {
                this.isSaving = false;
                if (resp.status) {
                    this.appSettingService.showSuccess("Chart Account Updated Successfully");
                    this.isDirty = false;
                    this.initialFormValue = this.chartForm.getRawValue();
                    const id = resp.data?.COAMasterSid;
                    if (id) {
                        this.route.navigate(['/accounts/chart-accounts/entry', id]);
                        this.loadChartAccount();
                        
                    }else {
                        this.route.navigate(['/accounts/chart-accounts/entry']);
                    }

                  //  this.route.navigate(['/accounts/chart-accounts/entry']);
                    if (resolve) resolve(true);
                } else {
                    this.appSettingService.showError(resp.message);
                    if (resolve) resolve(false);
                }
            },
            (error) => {
                this.isSaving = false;
                console.error('Error updating Chart Account', error);
                // Show specific error message for linked records
                if (error.error && error.error.message) {
                    this.appSettingService.showError(error.error.message);
                } else {
                    this.appSettingService.showError('Error updating Chart Account');
                }
                if (resolve) resolve(false);
            }
        );
    } else {
        this.isSaving = true;
        this.masterServ.createNewCoa(payload).subscribe(
            (resp: any) => {
                this.isSaving = false;
                if (resp.status) {
                    this.appSettingService.showSuccess(resp.message);
                    this.isDirty = false;
                    this.initialFormValue = this.chartForm.getRawValue();
                    const id = resp.data?.COAMasterSid;
                    if (id) {
                        this.route.navigate(['/accounts/chart-accounts/entry', id]);
                        // this.loadChartAccount();
                        
                    }else {
                        this.route.navigate(['/accounts/chart-accounts/entry']);
                    }

                    
                    this.resetFormForNewEntry();
                    if (resolve) resolve(true);
                } else {
                    this.appSettingService.showError(resp.message);
                    if (resolve) resolve(false);
                }
            },
            (error) => {
                this.isSaving = false;
                console.error('Error creating Chart Account', error);
                this.appSettingService.showError('Error creating Chart Account');
                if (resolve) resolve(false);
            }
        );
    }
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

  subscribeToFormChanges() {
    this.chartForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(
          this.initialFormValue,
          this.chartForm.getRawValue()
        );
      });
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) return Number(value);
    if (typeof value === 'number') return Number(value.toFixed(6));
    if (Array.isArray(value)) return value.map(v => this.normalizeValue(v));
    if (typeof value === 'object') {
      return Object.keys(value).sort().reduce((acc: any, key) => {
        acc[key] = this.normalizeValue(value[key]);
        return acc;
      }, {});
    }
    return value;
  }

  deepEqual(obj1: any, obj2: any): boolean {
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
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

 

  toNgbDateStruct(date: Date | null): NgbDateStruct | null {
    if (!date) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  openAuditLogs() {
        if (!this.chartMasterSid) return;
        const modalRef = this.modalService.open(AuditLogComponent, {
          centered: true,
          scrollable: true,
          size: 'xl',
          windowClass: 'audit-log-modal'
        });
        modalRef.componentInstance.title = 'Chart Of Accounts Logs';
        modalRef.componentInstance.tableName = 'COAMaster';
        modalRef.componentInstance.recordId = this.chartMasterSid.toString();
        modalRef.componentInstance.screenName = 'ChartOfAccounts';
      }

  showInfo() {
    if (!this.chartData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.chartData;
    modalRef.componentInstance.idLabel = 'COA Id';
    modalRef.componentInstance.idValue = this.chartMasterSid;
  }

  // openTandC() {
  //   this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  //   const payload = { MenuMasterSid: this.currentMenuId };
  //   this.masterServ.getTandCByCondition(payload).subscribe(
  //     (resp: any) => {
  //       if (resp.status) {
  //         this.TandCList = resp.data;
  //         const modalRef = this.modalService.open(TermsAndConditionsComponent, {
  //           size: 'lg',
  //           backdrop: 'static',
  //           centered: true,
  //         });
  //         modalRef.componentInstance.terms = this.TandCList;
  //         modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
  //         modalRef.componentInstance.DocumentSid = this.chartMasterSid;
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
    if (!this.chartData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
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

openDocRef() {
    const currentMenuId = this.chartData?.MenuMasterSid;
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);
    modalRef.componentInstance.DocumentSid = this.chartData?.COAMasterSid;
  }
openFollowup() {
  
}
 ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.initialFormValue = this.chartForm.getRawValue();
    this.isDirty = false;
    this.chartForm.markAsUntouched();
  }

  nagivateback() {
     history.back();
  }
}
