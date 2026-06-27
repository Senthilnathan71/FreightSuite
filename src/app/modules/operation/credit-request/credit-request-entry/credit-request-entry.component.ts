import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnDestroy } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbAccordionModule, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbModalRef, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { OperationService } from '../../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { forkJoin, Subscription } from 'rxjs';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { PreventMultiClickDirective } from "src/app/core/Directives/prevent-multi-click.directive";
import { AuditLogComponent } from '../../audit-log/audit-log.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { DocReferenceComponent } from '../../doc-reference/doc-reference.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';

@Component({
  selector: 'app-credit-request-entry',
  standalone: true,
  imports: [
    SearchableDropdown,
    NgSelectModule,
    CommonModule,
    ReactiveFormsModule,
    NgbTooltip,
    FeatherModule,
    NgbDatepickerModule,
    FormsModule,
    MultiSelectComponent,
    NgbDropdownModule,
    TextWithNumbersDirective,
    DecimalPrecisionDirective,
    NgbAccordionModule,
    NgbDropdownModule,
    PreventMultiClickDirective,
    ElementStateGuardDirective,
    FormStateGuardDirective
],
  templateUrl: './credit-request-entry.component.html',
  styleUrl: './credit-request-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter},
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter},
    DatePipe
  ]
})
export class CreditRequestEntryComponent implements HasUnsavedChanges, OnDestroy {
  MenuMasterSid: any;
  cusForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  loading = false;
  isSaving: boolean = false;
  customerId: number;
  customerData: any;
  userData: any;
  approvalStatusChanged: boolean = false;
  departmentListPerRow: any[][] = [];
  salesmanListPerRow: any[][] = [];

  currentMenuId: any;

  branchList: any[] = [];
  departmentList: any[] = [];
  salesmanList: any[] = [];
  today = this.calendar.getToday();
    // Approval Status Variables
  approvalDropdownValue = "";
  authStateCache: string = "Pending";
  disableAllModification: boolean = false;
  isAuthorizedUser: boolean = false;
  creditRequestAuthorized: boolean = false;
  creditRequestApproved: boolean = false;
  isTermsAndConditionsEnabled: boolean = true;
  isDirty: boolean = false;
  private initialFormValue: any = null;
  private formChangesSub?: Subscription;
  
  authorizerDetails = {
    isAuthorizer: false,
    isAlreadyApproved: false,
    canAuthorize: false,
    AuthorityLevel: null,
    AuthorityDetailSid: null,
    ApprovedBy: '',
    totalNumberOfAuthorizers: 0,
    FinalAuthority: false
  };
  creditAuthorizationDetails: { [creditIndex: number]: any } = {};
  creditAuthorizationRequired: { [creditIndex: number]: boolean } = {};
  creditAuthorizationChecked: { [creditIndex: number]: boolean } = {};
  creditAuthorizationMessages: { [creditIndex: number]: { message: string; type: 'info' | 'warning' | 'success' } } = {};
  private approvalStatusOptionsCache: { [creditIndex: number]: { key: string; options: any[] } } = {};
  auditLogs: any[] = []; // Stores audit logs
    auditLogModalRef!: NgbModalRef;
  allApprovalStatus = [
    { value : "Pending" , name :"Waiting for Approval"},
    { value : "WaitingForFinalApproval" , name :"Waiting for Final Approval"},
    { value : "WaitingForCustomerApproval" , name :"Waiting for Customer Approval"},
    { value : "Approved" , name :"Approved"},
    { value : "Counter" , name :"Counter"},
    { value : "Rejected" , name : "Rejected"}
  ]

  private readonly nonFinalApprovalStatusValues = [
    'WaitingForFinalApproval',
    'Counter',
    'Rejected'
  ];

  private readonly finalApprovalStatusValues = [
    'Approved',
    'Counter',
    'Rejected'
  ];

  readonly nonFinalApprovalStatusOptions = this.allApprovalStatus.filter(status =>
    this.nonFinalApprovalStatusValues.includes(status.value)
  );

  readonly finalApprovalStatusOptions = this.allApprovalStatus.filter(status =>
    this.finalApprovalStatusValues.includes(status.value)
  );

  approvalStatus = [
    { value : "Pending" , name :"Waiting for Approval"},
    { value : "Approved" , name :"Approved"},
    { value : "Rejected" , name : "Rejected"},
    {value : "Counter", name : "Counter"}
  ]
  typeofStatus = [
    { id: 'A', name: "Active" },
    { id: 'S', name: "Suspended" }
  ]
  docName = [
    { id: 'Passport', name: "Passport" },
    { id: 'Trade License', name: "Trade License" },
    { id: 'VAT Certificate', name: "VAT Certificate" },
    { id: 'GST Certificate ', name: "GST Certificate " },
    { id: 'Aadhar', name: "Aadhar" },
    { id: 'Bank Report', name: "Bank Report" },
    { id: 'Pan Card', name: "Pan Card" },
  ]
  currentCompany: any;
  currentBranch: any;
  TandCList: any[]=[];
  currentClauseId: any;

  expandedIndex: number | null = 0;
  private kycFileNameMap = new Map<string, string>();

  constructor(
    private fb: FormBuilder,
    private operationService: OperationService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private calendar: NgbCalendar,
    private modalService: NgbModal,
    private datePipe: DatePipe,
    private commonService: CommonService,
    private masterService: MasterService,
    public mps : MenuPermissionService,
    private emailTriggerService: EmailTriggerService,
    private leadService: LeadService,
  ) {
    this.initForm();
  }

  async sendManualMail(): Promise<void> {
    const menuMasterSid = this.currentMenuId || Number(this.MenuMasterSid || sessionStorage.getItem('currentMenuId'));
    const selectedCreditRequest = this.expandedIndex !== null && this.creditRequest.at(this.expandedIndex)
      ? this.creditRequest.at(this.expandedIndex)
      : this.creditRequest.at(0);
    const customerBranchSid =
      selectedCreditRequest?.get('CustomerBranchSid')?.getRawValue() ||
      this.customerData?.CustomerBranchSid ||
      this.customerData?.CustomerBranch?.[0]?.CustomerBranchSid ||
      null;
    const customerMasterSid =
      this.customerId ||
      this.customerData?.CustomerMasterSid ||
      null;
    const recipients = await this.emailTriggerService.resolveCustomerBranchEmailRecipientsByMenu({
      customerBranchSid,
      customerMasterSid,
      menuMasterSid
    });
    const organizationEmail = recipients.toEmail.join(', ');
    const ccEmail = Array.from(
      new Set(
        (recipients.ccEmail || [])
          .filter((email): email is string => !!email)
          .map(email => email.trim())
      )
    ).join(', ');

    this.emailTriggerService.triggerManualEmails({
      companyId: this.currentCompany?.CompanyMasterSid,
      branchId: this.currentBranch?.BranchMasterSid,
      menuMasterSid,
      action: 'UPDATE',
      context: {
        allowManualEmailEntry: true,
        requireToEmail: false,
        menuMasterSid,
        resourceSid: this.customerData?.CustomerMasterSid || this.customerId,
        toEmail: organizationEmail,
        ccEmail,
        organizationEmail,
        customerEmail: organizationEmail,
        customerBranchSid,
        customerMasterSid,
        userName: this.userData?.userName
      }
    });
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid = sessionStorage.getItem('currentMenuId');
    this.loadTermsAndConditionsConfig();
    this.mps.init().subscribe();
    this.loadAllSalesmen();
    this.route.params.subscribe(params => {
      if (params['CustomerMasterSid']) {
        this.customerId = +params['CustomerMasterSid'];
        this.isEditMode = true;
        this.getCustomerById(this.customerId);
      }
    });

    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if(userProfile){
      this.userData = userProfile;
    }

    this.subscribeToFormChanges();
    this.scheduleDirtyTrackingSnapshot();
  }

  initForm() {
    this.cusForm = this.fb.group({
      CustomerName: [''],
      CountryMasterSid: [''],
      status: [''],
      creditRequest: this.fb.array([]),
    });
  }

  get creditRequest(): FormArray {
    return this.cusForm.get('creditRequest') as FormArray;
  }

  private loadTermsAndConditionsConfig(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) {
      this.isTermsAndConditionsEnabled = true;
      return;
    }

    this.masterService.getConfigurationValue(companyId, 'TermsandConditions').subscribe({
      next: (resp: any) => {
        const rawValue = resp?.ConfigurationValue ?? resp?.value ?? resp;
        this.isTermsAndConditionsEnabled = this.parseConfigBoolean(rawValue, true);
      },
      error: () => {
        // Default to enabled if config fetch fails
        this.isTermsAndConditionsEnabled = true;
      }
    });
  }

  private parseConfigBoolean(value: any, defaultValue: boolean): boolean {
    if (value === true || value === false) return value;
    if (value === null || value === undefined) return defaultValue;
    const normalized = String(value).trim().toUpperCase();
    if (['Y', 'YES', 'TRUE', '1'].includes(normalized)) return true;
    if (['N', 'NO', 'FALSE', '0'].includes(normalized)) return false;
    return defaultValue;
  }

  createCreditRequest(data?: any): FormGroup {
    const creditForm = this.fb.group({
      CustomerCreditRequestSid: [data?.CustomerCreditRequestSid || null],
      CustomerBranchSid: [data?.CustomerBranchSid || ''],
      DepartmentMasterSid: [data?.DepartmentMasterSid || ''],
      SalesmanSid: [data?.SalesmanSid || ''],
      CreditDays: [data?.CreditDays || 0, [Validators.required, Validators.min(0)]],
      CreditLimit: [data?.CreditLimit || 0, [Validators.required, Validators.min(0)]],
      PublishedDays: [data?.PublishedDays || 0],
      PublishedLimit: [data?.PublishedLimit || 0],
      EffectiveFrom: [data?.EffectiveFrom ? new Date(data.EffectiveFrom) : null, Validators.required],
      ApprovalStatus: [data?.ApprovalStatus || 'Pending'],
      ApprovedBy: [data?.ApprovedBy || ''],
      Status: [data?.Status || 'A'],
      customerKyc: this.fb.array([])
    });
    // Add KYC records if available
    if (data?.customerKyc && data.customerKyc.length > 0) {
      const kycArray = creditForm.get('customerKyc') as FormArray;
      data.customerKyc.forEach((kycData: any) => {
        kycArray.push(this.createKycRow(kycData));
      });
    }

    this.applyApprovalLock(creditForm);

    creditForm.get('ApprovalStatus')?.disable({ emitEvent: false });

    let previousApprovalStatus = creditForm.get('ApprovalStatus')?.value;
    creditForm.get('ApprovalStatus')?.valueChanges.subscribe((status) => {
      if (this.normalizeApprovalStatus(status) === 'approved') {
        const approvalError = this.getApprovalKycError(creditForm);
        if (approvalError) {
          this.appSettingService.showWarning(approvalError);
          creditForm.get('ApprovalStatus')?.setValue(previousApprovalStatus, { emitEvent: false });
          this.applyApprovalLock(creditForm);
          return;
        }
      }

      previousApprovalStatus = status;
      this.applyApprovalLock(creditForm);
      this.approvalStatusChanged = true;
    });

    return creditForm;
  }

  getKycArray(creditIndex: number): FormArray {
    return this.creditRequest.at(creditIndex).get('customerKyc') as FormArray;
  }

  // Earliest date a request may start: the day AFTER the latest active request on the
  // same branch (so the new one supersedes it). null = no lower bound (first request
  // for the branch). With [maxDate]="today", if a request already starts today the min
  // becomes tomorrow > today and no date is selectable.
  getEffectiveFromMinDate(index: number): any {
    const branchSid = this.creditRequest.at(index)?.get('CustomerBranchSid')?.value;
    const latest = this.getLatestMatchingActiveRequest(branchSid, index);
    const latestFrom = this.normalizeDateValue(latest?.EffectiveFrom);
    if (!latestFrom) return null;

    const next = this.addDays(latestFrom, 1);
    return {
      year: next.getFullYear(),
      month: next.getMonth() + 1,
      day: next.getDate(),
    };
  }

  addCreditRequestRow(data?: any) {
    const sourceIndex = this.expandedIndex ?? (this.creditRequest.length ? this.creditRequest.length - 1 : null);
    const sourceBranchSid =
      data?.CustomerBranchSid ??
      (sourceIndex !== null ? this.creditRequest.at(sourceIndex)?.get('CustomerBranchSid')?.value : null) ??
      null;

    // The branch already has a request effective today: the next start (latest + 1
    // day) would be tomorrow, beyond the max (today). Warn the user — the row is still
    // added but the datepicker's min > max means no date can be selected for it.
    if (!data && this.nextEffectiveFromExceedsToday(sourceBranchSid)) {
      this.appSettingService.showWarning(
        'A credit request is already effective today for this branch. You can add the next one only from tomorrow.',
      );
    }

    const fg = this.createCreditRequest(data);

    if (!data && sourceBranchSid) {
      fg.patchValue({
        CustomerBranchSid: sourceBranchSid
      }, { emitEvent: false });
    }

    // Patch Salesman if passed separately
    if (data?.Salesman) {
      fg.patchValue({
        SalesmanSid: data.Salesman,
      });
    }

    this.creditRequest.push(fg);
    this.expandedIndex = this.creditRequest.length - 1;
    this.salesmanListPerRow[this.expandedIndex] = this.salesmanList;

    if (!data) {
      this.applyNextEffectiveFrom(this.expandedIndex, sourceBranchSid);
      if (sourceBranchSid) {
        this.onBranchSelect(sourceBranchSid, this.expandedIndex);
      }
    } else {
      this.refreshAuthorizationForCreditRequest(this.expandedIndex);
    }
  }

  removeCreditRequestRow(index: number, force = false) {
    if (!force && this.creditRequest.length <= 1) {
      return;
    }
    this.creditRequest.removeAt(index);
    this.departmentListPerRow.splice(index, 1);
    this.salesmanListPerRow.splice(index, 1);
    // The FormArray and the per-row arrays above shift down on removal, so the index-keyed
    // authorization maps must shift too. A plain `delete` would leave higher keys in place
    // and misalign authorization state with the wrong row.
    this.reindexAuthorizationMapsAfterRemoval(index);
  }

  private reindexAuthorizationMapsAfterRemoval(removedIndex: number): void {
    const maps: Array<{ [key: number]: any }> = [
      this.creditAuthorizationDetails,
      this.creditAuthorizationRequired,
      this.creditAuthorizationChecked,
      this.creditAuthorizationMessages,
      this.approvalStatusOptionsCache
    ];

    maps.forEach(map => {
      delete map[removedIndex];
      Object.keys(map)
        .map(Number)
        .filter(key => key > removedIndex)
        .sort((a, b) => a - b)
        .forEach(key => {
          map[key - 1] = map[key];
          delete map[key];
        });
    });
  }
  createKycRow(data?: any): FormGroup {
    return this.fb.group({
      CustomerKycSid: [data?.CustomerKycSid || null],
      CustomerCreditRequestSid: [data?.CustomerCreditRequestSid || null],
      CustomerBranchSid: [data?.CustomerBranchSid || null],
      KycSno: [data?.KycSno || null],
      KycDocName: [data?.KycDocName || '', Validators.required],
      KycDocNumber: [data?.KycDocNumber || '', Validators.required],
      AttachDocumentSid: [data?.AttachDocumentSid || null],
      CompanyMasterSid: [data?.CompanyMasterSid || this.currentCompany?.CompanyMasterSid],
      CustomerMasterSid: [data?.CustomerMasterSid || this.customerId],
    });
  }

  addKycRow(creditIndex: number, data?: any) {
    const kycArray = this.getKycArray(creditIndex);
    const fg = this.createKycRow(data);
    kycArray.push(fg);
    const creditForm = this.creditRequest.at(creditIndex) as FormGroup;
    this.applyApprovalLock(creditForm);
  }

  deleteKycRow(creditIndex: number, kycIndex: number) {
    const kycArray = this.getKycArray(creditIndex);
    const kycGroup = kycArray.at(kycIndex) as FormGroup;
    const CustomerKycSid = kycGroup.get('CustomerKycSid')?.value;

    if (!CustomerKycSid) {
      kycArray.removeAt(kycIndex);
      this.refreshKycFileNameMap(creditIndex);
      return;
    }

    const confirmed = confirm('Are you sure you want to delete this KYC document?');
    if (!confirmed) return;

    this.operationService.deleteCustomerKyc(CustomerKycSid).subscribe({
      next: (resp: any) => {
        if (resp?.status) {
          kycArray.removeAt(kycIndex);
          this.refreshKycFileNameMap(creditIndex);
          this.appSettingService.showSuccess('Customer KYC deleted successfully');
        } else {
          this.appSettingService.showError(resp?.message || 'Failed to delete customer KYC');
        }
      },
      error: (err) => {
        this.appSettingService.showError(err?.error?.message || 'Failed to delete customer KYC');
      }
    });
  }

  deleteCreditRequestRow(creditIndex: number) {
    const creditGroup = this.creditRequest.at(creditIndex) as FormGroup;
    const CustomerCreditRequestSid = creditGroup.get('CustomerCreditRequestSid')?.value;
    const approvalStatus = creditGroup.get('ApprovalStatus')?.value;
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];

    if (approvalStatus && approvalStatus !== 'Pending') {
      this.appSettingService.showWarning('Only pending credit requests can be deleted.');
      return;
    }

    if (!CustomerCreditRequestSid) {
      this.removeCreditRequestRow(creditIndex, true);
      if (this.creditRequest.length === 0) {
        this.addCreditRequestRow();
      }
      this.rebuildAllKycFileNameMap();
      return;
    }

    const confirmed = confirm('Are you sure you want to delete this credit request?');
    if (!confirmed) return;

    this.operationService.deleteCustomerCreditRequest(CustomerCreditRequestSid,updatedBy).subscribe({
      next: (resp: any) => {
        if (resp?.status) {
          this.removeCreditRequestRow(creditIndex, true);
          if (this.creditRequest.length === 0) {
            this.addCreditRequestRow();
          }
          this.rebuildAllKycFileNameMap();
          this.appSettingService.showSuccess('Credit request deleted successfully');
        } else {
          this.appSettingService.showError(resp?.message || 'Failed to delete credit request');
        }
      },
      error: (err) => {
        this.appSettingService.showError(err?.error?.message || 'Failed to delete credit request');
      }
    });
  }

  

  getCustomerById(CustomerMasterSid: number) {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const payload = {
      CustomerMasterSid,
      CompanyMasterSid
    }
    this.operationService.getCustomerById(payload).subscribe({
      next: (resp: any) => {
        if (resp.status && resp.data && resp.data.length > 0) {
          this.customerData = resp.data[0];

          // Prepare branch dropdown
          this.branchList = this.customerData.CustomerBranch?.map((branch: any) => ({
            id: branch.CustomerBranchSid,
            name: branch.BranchName
          })) || [];

          // Patch customer header
          this.cusForm.patchValue({
            CustomerName: this.customerData.CustomerName || '',
            CountryMasterSid: this.customerData.countryMaster?.countryName || '',
            status: this.customerData.Status || 'A',
          });
          this.cusForm.get('status')?.disable();

          // Clear existing rows
          this.creditRequest.clear();

          const creditRequests = this.customerData.customerCreditRequest || [];

          if (creditRequests.length > 0) {
            creditRequests.forEach((req: any, rowIndex: number) => {
              const fg = this.createCreditRequest(req);
              this.creditRequest.push(fg);

              // Populate Department dropdown per row
              const departmentObj = {
                DepartmentMasterSid: req.DepartmentMasterSid,
                departmentName: req.department?.departmentName || req.departmentName || ''
              };
              this.departmentListPerRow[rowIndex] = [departmentObj];

              // Populate Salesman dropdown per row
              const salesmanObj = {
                UserMasterSid: req.salesman?.UserMasterSid || req.SalesmanSid,
                userName: req.salesman?.userName || req.SalesmanName || ''
              };
              this.salesmanListPerRow[rowIndex] = this.salesmanList.length ? this.salesmanList : [salesmanObj];

              // Patch selected values
              fg.patchValue({
                DepartmentMasterSid: departmentObj.DepartmentMasterSid,
                SalesmanSid: salesmanObj.UserMasterSid
              });
              this.applySalesmenForRow(rowIndex, false);
              this.refreshAuthorizationForCreditRequest(rowIndex);

              // Load file names for existing KYC attachments
              if (req?.customerKyc?.length) {
                req.customerKyc.forEach((kyc: any, kycIndex: number) => {
                  if (kyc?.AttachDocumentSid) {
                    this.loadKycFileName(rowIndex, kycIndex, kyc.AttachDocumentSid);
                  }
                });
              }
            });
          } else {
            this.addCreditRequestRow();
          }
          this.scheduleDirtyTrackingSnapshot();
        } else {
          this.appSettingService.showError(resp.message);
        }
      },
      error: (err) => {
        console.error('Error fetching customer by ID', err);
        this.appSettingService.showError('Failed to fetch customer details.');
      }
    });
  }

  // private convertToNgbDate(dateString: string): any {
  //   if (!dateString) return null;
  //   const date = new Date(dateString);
  //   return {
  //     year: date.getFullYear(),
  //     month: date.getMonth() + 1,
  //     day: date.getDate()
  //   };
  // }

  private convertFromNgbDate(ngbDate: any): string | null {
    if (!ngbDate) return null;
    const { year, month, day } = ngbDate;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  onSubmit(resolve?: (value: boolean) => void) {
    this.isSaving = true;

    if (this.cusForm.invalid) {
      this.markFormGroupTouched(this.cusForm);
      this.appSettingService.showError('Please fill all required fields before saving');
      this.isSaving = false;
      if (resolve) resolve(false);
      return;
    }

    const currentValue = this.getCurrentNormalizedFormValue();
    if (this.deepEqual(currentValue, this.initialFormValue)) {
      this.appSettingService.showWarning('No changes to save');
      this.cusForm.markAsUntouched();
      this.isSaving = false;
      if (resolve) resolve(false);
      return;
    }

    if (this.creditRequest.controls.length === 0) {
      this.appSettingService.showError('Please add at least one Credit Request entry before saving');
      this.isSaving = false;
      if (resolve) resolve(false);
      return;
    }

    if (this.hasApprovedRowsWithoutKyc()) {
      this.appSettingService.showError('Please add at least one KYC document before saving');
      this.isSaving = false;
      if (resolve) resolve(false);
      return;
    }

    const rawCreditRequests = this.creditRequest.getRawValue();
    const continuityError = this.validateCreditRequestContinuity(rawCreditRequests);
    if (continuityError) {
      this.appSettingService.showError(continuityError);
      this.isSaving = false;
      if (resolve) resolve(false);
      return;
    }

    const missingUploads = this.getMissingKycUploads();
    if (missingUploads.length) {
      const docList = missingUploads.map(item => item.docName).join(', ');
      this.appSettingService.showError(`Please upload KYC documents for: ${docList}`);
      this.isSaving = false;
      if (resolve) resolve(false);
      return;
    }
    this.btnDisable = true;
    this.loading = true;

    const currentUserEmail = this.userData?.LoginId || this.appSettingService.userSettingSource.value['userEmail'];
    const approvalChanges = this.getCreditApprovalChanges();
    // Resolve authorizer details from the per-row map (not the shared `authorizerDetails`,
    // which is overwritten by whichever async authorizer check resolves last).
    const approvalAuthorizerDetails = approvalChanges.length
      ? this.getCreditAuthorizerDetails(approvalChanges[0]?.creditIndex)
      : this.getCreditAuthorizerDetails(this.expandedIndex ?? 0);

    // Build payload with nested KYC
    const creditRequests = rawCreditRequests.map((req) => ({
      CustomerCreditRequestSid: req.CustomerCreditRequestSid || null,
      CustomerMasterSid: this.customerId,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      CustomerBranchSid: req.CustomerBranchSid,
      DepartmentMasterSid: req.DepartmentMasterSid,
      SalesmanSid: req.SalesmanSid,
      CreditDays: req.CreditDays,
      CreditLimit: req.CreditLimit,
      PublishedDays: req.PublishedDays,
      PublishedLimit: req.PublishedLimit,
      EffectiveFrom: req.EffectiveFrom,
      ApprovalStatus: req.ApprovalStatus || 'Pending',
      ApprovedBy: req.ApprovedBy || null,
      Status: req.Status || 'A',
      CreatedBy: currentUserEmail,
      UpdatedBy: currentUserEmail,
      customerKyc: (req.customerKyc || []).map((kyc: any, index: number) => ({
        CustomerKycSid: kyc.CustomerKycSid || null,
        CustomerMasterSid: this.customerId,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        CustomerCreditRequestSid: kyc.CustomerCreditRequestSid || null,
        CustomerBranchSid: req.CustomerBranchSid,
        KycSno: index + 1,
        KycDocName: kyc.KycDocName,
        KycDocNumber: kyc.KycDocNumber,
        AttachDocumentSid: kyc.AttachDocumentSid || null,
        CreatedBy: currentUserEmail,
        UpdatedBy: currentUserEmail,
      }))
    }));

    const payload = {
      creditRequests,
      authDetails: {
        canAuthorize: approvalChanges.length > 0,
        AuthorityDetailSid: approvalAuthorizerDetails?.AuthorityDetailSid || null,
        ApprovalStatus: approvalChanges[0]?.ApprovalStatus || null,
        ApprovedBy: approvalAuthorizerDetails?.ApprovedBy || this.userData?.userName || currentUserEmail,
        approvalTargets: approvalChanges
      }
    };

    const apiCall = this.isEditMode 
      ? this.operationService.updateCreditRequest(payload)
      : this.operationService.createCreditRequest(payload);

    apiCall.subscribe({
      next: (response: any) => {
        this.loading = false;
        this.btnDisable = false;
        this.isSaving = false;

        if (response.status) {
          this.approvalStatusChanged = false;
          this.appSettingService.showSuccess(
            this.isEditMode ? 'Credit Request updated successfully.' : 'Credit Request created successfully.'
          );
          // Stay on same page and refresh form with latest data
          this.isEditMode = true;
          if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
            this.applySavedCreditRequests(response.data);
          } else {
            // Fallback to fetch full data (includes names, attachments)
            this.getCustomerById(this.customerId);
          }
          this.isDirty = false;
          if (resolve) resolve(true);
        } else {
          this.appSettingService.showError(response.message || 'Failed to save credit request.');
          if (resolve) resolve(false);
        }
      },
      error: (err) => {
        console.error('Error saving credit requests:', err);
        this.appSettingService.showError('Failed to save credit requests.');
        this.loading = false;
        this.btnDisable = false;
        this.isSaving = false;
        if (resolve) resolve(false);
      },
    });
  }

  private applySavedCreditRequests(savedItems: any[]) {
    // Capture existing dropdown data before reset so names survive the rebuild — the save
    // response often omits nested department/salesman names.
    const previousDepartmentLists = [...this.departmentListPerRow];

    // Reset arrays
    this.creditRequest.clear();
    this.departmentListPerRow = [];
    this.salesmanListPerRow = [];
    if (this.customerData) {
      this.customerData.customerCreditRequest = savedItems;
    }

    savedItems.forEach((item: any, rowIndex: number) => {
      const normalized = {
        ...item,
        customerKyc: item.customerKyc || item.kycRecords || []
      };

      const fg = this.createCreditRequest(normalized);
      this.creditRequest.push(fg);

      // Rebuild the Department dropdown for the row, resolving the name from the saved item or
      // the pre-save list so the selection stays visible after save.
      if (item.DepartmentMasterSid !== null && item.DepartmentMasterSid !== undefined) {
        const departmentName =
          item.department?.departmentName ||
          item.departmentName ||
          previousDepartmentLists[rowIndex]?.find((d: any) => d.DepartmentMasterSid === item.DepartmentMasterSid)?.departmentName ||
          '';
        this.departmentListPerRow[rowIndex] = [{ DepartmentMasterSid: item.DepartmentMasterSid, departmentName }];
      } else {
        this.departmentListPerRow[rowIndex] = previousDepartmentLists[rowIndex] || [];
      }

      // Rebuild the Sales Person dropdown (mirror getCustomerById): use the company list, falling
      // back to the saved salesman so the selection shows after save without a branch change.
      const salesmanObj = {
        UserMasterSid: item.salesman?.UserMasterSid || item.SalesmanSid,
        userName: item.salesman?.userName || item.SalesmanName || ''
      };
      this.salesmanListPerRow[rowIndex] = this.salesmanList.length ? this.salesmanList : [salesmanObj];
      this.applySalesmenForRow(rowIndex, false);

      // Reload file names if attachment exists
      if (normalized?.customerKyc?.length) {
        normalized.customerKyc.forEach((kyc: any, kycIndex: number) => {
          if (kyc?.AttachDocumentSid) {
            this.loadKycFileName(rowIndex, kycIndex, kyc.AttachDocumentSid);
          }
        });
      }
      this.refreshAuthorizationForCreditRequest(rowIndex);
    });

    if (this.creditRequest.length === 0) {
      this.addCreditRequestRow();
    } else {
      this.expandedIndex = 0;
    }

    this.scheduleDirtyTrackingSnapshot();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          this.markFormGroupTouched(arrayControl as FormGroup);
        });
      }
    });
  }

  isApprovedRow(credit: AbstractControl | null): boolean {
    if (!credit) return false;
    const raw = credit.get('ApprovalStatus')?.value;
    return this.normalizeApprovalStatus(raw) === 'approved';
  }

  private getDefaultAuthorizerDetails(): any {
    return {
      isAuthorizer: false,
      isAlreadyApproved: false,
      canAuthorize: false,
      AuthorityLevel: null,
      AuthorityDetailSid: null,
      ApprovedBy: this.userData?.userName || this.userData?.LoginId || this.appSettingService.userSettingSource.value['userEmail'] || '',
      totalNumberOfAuthorizers: 0,
      FinalAuthority: false
    };
  }

  private getCreditDocumentSid(creditIndex: number): number | null {
    const sid = this.creditRequest.at(creditIndex)?.get('CustomerCreditRequestSid')?.value;
    return Number(sid) || null;
  }

  private refreshAuthorizationForCreditRequest(creditIndex: number): void {
    const menuMasterSid = Number(this.currentMenuId || this.MenuMasterSid || sessionStorage.getItem('currentMenuId') || 0);
    this.currentMenuId = menuMasterSid;
    this.MenuMasterSid = menuMasterSid || this.MenuMasterSid;

    if (
      !this.userData?.UserMasterSid ||
      !menuMasterSid ||
      !this.currentCompany?.CompanyMasterSid ||
      !this.currentBranch?.BranchMasterSid
    ) {
      this.setCreditAuthorizationDefault(creditIndex, false, true);
      return;
    }

    const documentSid = this.getCreditDocumentSid(creditIndex);
    this.creditAuthorizationDetails[creditIndex] = this.getDefaultAuthorizerDetails();
    this.creditAuthorizationRequired[creditIndex] = true;
    this.creditAuthorizationChecked[creditIndex] = false;
    this.creditAuthorizationMessages[creditIndex] = { message: '', type: 'info' };
    this.applyAuthorizationControlState();

    // Credit Request authorization is MENU-ONLY. Department is intentionally NOT sent,
    // so the backend matches authorizers by Menu + Company + Branch only. This avoids the
    // department-name mismatch that could otherwise silently disable approval gating.
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: menuMasterSid,
      UserMasterSid: this.userData.UserMasterSid,
      DocumentSid: documentSid
    };

    this.leadService.isUserAuthorizer(payload).subscribe({
      next: (resp: any) => {
        const data = resp?.data || {};
        const totalNumberOfAuthorizers = Number(data?.totalNumberOfAuthorizers || 0);
        const hasPendingApproval = this.hasPendingCreditApproval(creditIndex);
        const details = {
          isAuthorizer: !!data?.canAuthorize,
          isAlreadyApproved: !!data?.alreadyApproved,
          canAuthorize: !!data?.canAuthorize && (!data?.alreadyApproved || hasPendingApproval),
          AuthorityLevel: data?.AuthorityLevel,
          AuthorityDetailSid: data?.AuthorityDetailSid,
          ApprovedBy: this.userData?.userName || this.userData?.LoginId || '',
          totalNumberOfAuthorizers,
          FinalAuthority: data?.FinalAuthority === 'Y' || data?.FinalAuthority === true || data?.isFinalAuthorizer === true
        };
        const hasAuthorizationSetup =
          totalNumberOfAuthorizers > 0 ||
          !!data?.canAuthorize ||
          !!data?.AuthorityDetailSid ||
          !!data?.AuthorityLevel;

        this.creditAuthorizationDetails[creditIndex] = details;
        this.authorizerDetails = details;
        this.creditAuthorizationRequired[creditIndex] = hasAuthorizationSetup;
        this.creditAuthorizationChecked[creditIndex] = true;
        this.creditAuthorizationMessages[creditIndex] = {
          message: hasAuthorizationSetup && !details.canAuthorize && !this.isApprovedRow(this.creditRequest.at(creditIndex))
            ? 'You are not authorized to approve this credit request.'
            : '',
          type: 'warning'
        };
        this.applyAuthorizationControlState();
      },
      error: () => this.setCreditAuthorizationDefault(creditIndex, false, true)
    });
  }

  private setCreditAuthorizationDefault(creditIndex: number, required: boolean, checked: boolean): void {
    this.creditAuthorizationDetails[creditIndex] = this.getDefaultAuthorizerDetails();
    this.creditAuthorizationRequired[creditIndex] = required;
    this.creditAuthorizationChecked[creditIndex] = checked;
    this.creditAuthorizationMessages[creditIndex] = { message: '', type: 'info' };
    this.applyAuthorizationControlState();
  }

  private getCreditAuthorizerDetails(creditIndex?: number): any {
    return Number.isInteger(creditIndex) && this.creditAuthorizationDetails[creditIndex] !== undefined
      ? this.creditAuthorizationDetails[creditIndex]
      : this.authorizerDetails;
  }

  private isAuthorizationRequiredForCredit(creditIndex: number): boolean {
    if (this.creditAuthorizationRequired[creditIndex] !== undefined) {
      return this.creditAuthorizationRequired[creditIndex];
    }
    return false;
  }

  isFinalAuthorizer(creditIndex?: number): boolean {
    const details = this.getCreditAuthorizerDetails(creditIndex);
    const level = Number(details?.AuthorityLevel || 0);
    const total = Number(details?.totalNumberOfAuthorizers || 0);
    return !!details?.FinalAuthority || (level > 0 && total > 0 && level === total);
  }

  getApprovalStatusOptions(creditIndex: number): any[] {
    const required = this.isAuthorizationRequiredForCredit(creditIndex);
    const isFinal = this.isFinalAuthorizer(creditIndex);
    const currentValue = this.creditRequest.at(creditIndex)?.get('ApprovalStatus')?.value || '';

    // This method is bound directly in the template, so Angular calls it on every change
    // detection cycle. Returning a fresh array each time makes ng-select re-process its items
    // and drop the user's click. Memoize on the inputs so the reference is stable until they change.
    const cacheKey = `${required}|${isFinal}|${currentValue}`;
    const cached = this.approvalStatusOptionsCache[creditIndex];
    if (cached && cached.key === cacheKey) {
      return cached.options;
    }

    const baseOptions = !required
      ? this.approvalStatus
      : isFinal
        ? this.finalApprovalStatusOptions
        : this.nonFinalApprovalStatusOptions;

    // Always include the row's current status so the dropdown can render it. The option subsets
    // are filtered by authorizer level, so a persisted value (an already 'Approved' row, or
    // 'WaitingForCustomerApproval') may not be in the subset; without this the field shows blank.
    const options = this.withCurrentApprovalStatusOption(baseOptions, currentValue);
    this.approvalStatusOptionsCache[creditIndex] = { key: cacheKey, options };
    return options;
  }

  private withCurrentApprovalStatusOption(options: any[], currentValue: string): any[] {
    if (!currentValue || options.some(option => option.value === currentValue)) {
      return options;
    }
    const match = this.allApprovalStatus.find(option => option.value === currentValue);
    return match ? [...options, match] : options;
  }

  canEditApprovalStatus(creditIndex: number): boolean {
    const credit = this.creditRequest.at(creditIndex);
    if (!credit || this.isCreditApprovalPersistedApproved(creditIndex) || !this.getCreditDocumentSid(creditIndex)) {
      return false;
    }

    const details = this.getCreditAuthorizerDetails(creditIndex);
    return !!details?.canAuthorize || !this.isAuthorizationRequiredForCredit(creditIndex);
  }

  private isCreditApprovalPersistedApproved(creditIndex: number): boolean {
    return this.normalizeApprovalStatus(this.getSavedCreditApprovalStatus(creditIndex)) === 'approved';
  }

  shouldShowAuthorizationMessage(creditIndex: number): boolean {
    if (!this.creditAuthorizationChecked[creditIndex] || this.isApprovedRow(this.creditRequest.at(creditIndex))) {
      return false;
    }
    return this.isAuthorizationRequiredForCredit(creditIndex) &&
      !this.getCreditAuthorizerDetails(creditIndex)?.canAuthorize &&
      !!this.creditAuthorizationMessages[creditIndex]?.message;
  }

  getAuthorizationMessage(creditIndex: number): string {
    return this.creditAuthorizationMessages[creditIndex]?.message || '';
  }

  getAuthorizationMessageType(creditIndex: number): 'info' | 'warning' | 'success' {
    return this.creditAuthorizationMessages[creditIndex]?.type || 'info';
  }

  private hasPendingCreditApproval(creditIndex: number): boolean {
    const status = this.creditRequest.at(creditIndex)?.get('ApprovalStatus')?.value || 'Pending';
    return !['approved', 'rejected'].includes(this.normalizeApprovalStatus(status));
  }

  private applyAuthorizationControlState(): void {
    this.creditRequest?.controls?.forEach((credit: FormGroup, creditIndex: number) => {
      const statusCtrl = credit.get('ApprovalStatus');
      if (!statusCtrl) return;

      if (this.canEditApprovalStatus(creditIndex)) {
        statusCtrl.enable({ emitEvent: false });
      } else {
        statusCtrl.disable({ emitEvent: false });
      }
    });
  }

  onApprovalStatusChange(creditIndex: number, status: any): void {
    if (!this.canEditApprovalStatus(creditIndex)) {
      this.appSettingService.showWarning(this.getAuthorizationMessage(creditIndex) || 'You are not authorized to approve this credit request.');
      this.revertCreditApprovalStatus(creditIndex);
      return;
    }

    const selectedStatus = typeof status === 'string' ? status : status?.value;
    const credit = this.creditRequest.at(creditIndex) as FormGroup;
    if (selectedStatus === 'Approved' && this.isAuthorizationRequiredForCredit(creditIndex) && !this.isFinalAuthorizer(creditIndex)) {
      this.appSettingService.showWarning('Only the final authorizer can approve the credit request.');
      credit.get('ApprovalStatus')?.setValue('WaitingForFinalApproval', { emitEvent: false });
      return;
    }

    const approvalError = selectedStatus === 'Approved' ? this.getApprovalKycError(credit) : null;
    if (approvalError) {
      this.appSettingService.showWarning(approvalError);
      this.revertCreditApprovalStatus(creditIndex);
      return;
    }

    if (['Approved', 'Rejected'].includes(selectedStatus)) {
      credit.get('ApprovedBy')?.setValue(this.getCreditAuthorizerDetails(creditIndex)?.ApprovedBy || '', { emitEvent: false });
    }
    this.approvalStatusChanged = true;
  }

  private revertCreditApprovalStatus(creditIndex: number): void {
    const credit = this.creditRequest.at(creditIndex) as FormGroup;
    const savedStatus = this.getSavedCreditApprovalStatus(creditIndex);
    credit.get('ApprovalStatus')?.setValue(savedStatus, { emitEvent: false });
  }

  private getSavedCreditApprovalStatus(creditIndex: number): string {
    const creditSid = this.getCreditDocumentSid(creditIndex);
    const savedRows = this.customerData?.customerCreditRequest || [];
    const saved = creditSid
      ? savedRows.find((row: any) => Number(row?.CustomerCreditRequestSid) === creditSid)
      : savedRows[creditIndex];
    return saved?.ApprovalStatus || 'Pending';
  }

  private getCreditApprovalChanges(): any[] {
    return this.creditRequest.controls
      .map((credit: FormGroup, creditIndex: number) => {
        const creditSid = this.getCreditDocumentSid(creditIndex);
        if (!creditSid) return null;

        const currentStatus = credit.get('ApprovalStatus')?.value || 'Pending';
        const savedStatus = this.getSavedCreditApprovalStatus(creditIndex);
        if (currentStatus === savedStatus) return null;

        const details = this.getCreditAuthorizerDetails(creditIndex);
        return {
          creditIndex,
          CustomerCreditRequestSid: creditSid,
          DocumentSid: creditSid,
          ApprovalStatus: currentStatus,
          AuthorizationRequired: this.isAuthorizationRequiredForCredit(creditIndex),
          AuthorityDetailSid: details?.AuthorityDetailSid || null,
          Remarks: `CreditRequest:${creditSid} Status:${currentStatus}`
        };
      })
      .filter(Boolean);
  }

  private normalizeApprovalStatus(raw: any): string {
    const status =
      typeof raw === 'string'
        ? raw
        : (raw?.value ?? raw?.name ?? raw?.Status ?? raw?.status ?? '');
    return String(status ?? '').trim().toLowerCase();
  }

  private getApprovalKycError(creditForm: FormGroup): string | null {
    const kycArray = creditForm.get('customerKyc') as FormArray | null;
    if (!kycArray || kycArray.length === 0) {
      return 'Please add at least one KYC document before approval.';
    }

    const missingAttachment = kycArray.controls.some(kycCtrl => !kycCtrl.get('AttachDocumentSid')?.value);
    return missingAttachment ? 'Please attach all KYC documents before approval.' : null;
  }

  private applyApprovalLock(creditForm: FormGroup) {
    const isApproved = this.normalizeApprovalStatus(creditForm.get('ApprovalStatus')?.value) === 'approved';
    const lockControls = [
      'CustomerBranchSid',
      'DepartmentMasterSid',
      'SalesmanSid',
      'CreditDays',
      'CreditLimit',
      'PublishedDays',
      'PublishedLimit',
      'EffectiveFrom',
      'Status'
    ];

    lockControls.forEach(name => {
      const ctrl = creditForm.get(name);
      if (!ctrl) return;
      if (isApproved) {
        ctrl.disable({ emitEvent: false });
      } else {
        ctrl.enable({ emitEvent: false });
      }
    });

    const kycArray = creditForm.get('customerKyc') as FormArray | null;
    if (kycArray) {
      kycArray.controls.forEach(kycCtrl => {
        const docName = kycCtrl.get('KycDocName');
        const docNo = kycCtrl.get('KycDocNumber');
        if (isApproved) {
          docName?.disable({ emitEvent: false });
          docNo?.disable({ emitEvent: false });
        } else {
          docName?.enable({ emitEvent: false });
          docNo?.enable({ emitEvent: false });
        }
      });
    }
  }

  isApprovedRowInvalid(credit: AbstractControl | null): boolean {
    if (!credit || !this.isApprovedRow(credit)) return false;
    const effectiveFrom = credit.get('EffectiveFrom')?.value;
    const status = credit.get('Status')?.value;
    return !effectiveFrom || !status;
  }

 isSaveDisabled(): boolean {

  if (this.isSaving) return true;

  // If approval status changed → enable save
  if (this.approvalStatusChanged) return false;

  if ((!this.mps.can('update') && this.isEditMode)) return true;
  return false;
}

  getApprovalStatusLabel(raw: any): string {
    const value =
      typeof raw === 'string'
        ? raw
        : (raw?.value ?? raw?.name ?? raw?.Status ?? raw?.status ?? '');
    if (!value) return 'Waiting for Approval';
    const match = this.allApprovalStatus.find(s => s.value === value);
    return match?.name || String(value);
  }

  getBranchName(branchId: number): string {
  const branch = this.branchList?.find(b => b.id === branchId);
  return branch ? branch.name : '';
}

getDepartmentName(deptId: number, rowIndex: number): string {
  const deptList = this.departmentListPerRow[rowIndex];
  const dept = deptList?.find(d => d.DepartmentMasterSid === deptId);
  return dept ? dept.departmentName : '';
}

  private normalizeUserSid(userSid: any): number | null {
    if (userSid === null || userSid === undefined || userSid === '') {
      return null;
    }
    const value = Number(userSid);
    return Number.isFinite(value) ? value : null;
  }

  // autoSelect=true is for user actions (picking a branch / new row): convenience auto-fill of a
  // single salesman. When restoring saved data (load / post-save), pass false so the saved value
  // — including an intentionally-empty one — is preserved and not overwritten.
  private applySalesmenForRow(rowIndex: number, autoSelect: boolean = true) {
    const branchSid = this.creditRequest.at(rowIndex).get('CustomerBranchSid')?.value;
    const current = this.normalizeUserSid(this.creditRequest.at(rowIndex).get('SalesmanSid')?.value);
    const previousList = this.salesmanListPerRow[rowIndex] || [];

    // Base list = company salespeople; keep the currently-selected salesman so the dropdown can
    // always display it even if it isn't in the company list.
    const list = [...this.salesmanList];
    if (current !== null && !list.some(s => this.normalizeUserSid(s.UserMasterSid) === current)) {
      const preserved = previousList.find((s: any) => this.normalizeUserSid(s.UserMasterSid) === current);
      if (preserved) list.push(preserved);
    }
    this.salesmanListPerRow[rowIndex] = list;

    if (!branchSid) {
      if (autoSelect) {
        this.creditRequest.at(rowIndex).get('SalesmanSid')?.reset();
      }
      return;
    }

    const normalizedBranchSid = this.normalizeBranchSid(branchSid);
    const branch = this.customerData?.CustomerBranch?.find(
      (b: any) => this.normalizeBranchSid(b?.CustomerBranchSid) === normalizedBranchSid
    );
    let ids: number[] = [];

    if (branch?.CustomerSalesTeam?.length) {
      ids = branch.CustomerSalesTeam
        .filter((t: any) => String(t?.status || 'A') === 'A')
        .map((t: any) => this.normalizeUserSid(t?.Salesman))
        .filter((id: number | null): id is number => id !== null);

      ids = [...new Set(ids)];
    }

    const isCurrentValid = current !== null && list.some(s => this.normalizeUserSid(s.UserMasterSid) === current);

    if (isCurrentValid || !autoSelect) {
      return;
    }

    const autoId = ids.length === 1
      ? ids[0]
      : this.salesmanList.length === 1
        ? this.normalizeUserSid(this.salesmanList[0].UserMasterSid)
        : null;

    if (autoId !== null) {
      this.creditRequest.at(rowIndex).get('SalesmanSid')?.setValue(autoId);
    } else if (current !== null) {
      this.creditRequest.at(rowIndex).get('SalesmanSid')?.reset();
    }
  }

  onBranchSelect(branchSid: number, rowIndex: number) {
  if (!branchSid) {
    this.departmentListPerRow[rowIndex] = [];
    this.salesmanListPerRow[rowIndex] = [];
    this.creditRequest.at(rowIndex).get('DepartmentMasterSid')?.reset();
    this.creditRequest.at(rowIndex).get('SalesmanSid')?.reset();
    this.applyNextEffectiveFrom(rowIndex, null);
    return;
  }

  this.applyNextEffectiveFrom(rowIndex, branchSid);
  this.applySalesmenForRow(rowIndex);

  const payload = {
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    CustomerMasterSid: this.customerId,
    CustomerBranchSid: branchSid,
  };

  this.operationService.getDepartment(payload).subscribe({
    next: (resp: any) => {
      const departments = resp?.data || resp || [];
      this.departmentListPerRow[rowIndex] = departments.map((d: any) => ({
        DepartmentMasterSid: d.DepartmentMasterSid,
        departmentName: d.departmentName || d.DepartmentName,
      }));

      this.creditRequest.at(rowIndex).get('DepartmentMasterSid')?.reset();
    },
    error: (err) => {
      console.error('Error loading departments:', err);
      this.appSettingService.showError('Failed to load departments for selected branch.');
    }
  });
}

  private normalizeBranchSid(branchSid: any): number | null {
    if (branchSid === null || branchSid === undefined || branchSid === '') {
      return null;
    }
    const value = Number(branchSid);
    return Number.isFinite(value) ? value : null;
  }

  private normalizeDateValue(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : new Date(value);
    }
    if (typeof value === 'object' && value.year && value.month && value.day) {
      const date = new Date(value.year, value.month - 1, value.day);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setUTCHours(0, 0, 0, 0);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }

  private getMatchingActiveRequests(branchSid: any, excludeRowIndex?: number): any[] {
    const normalizedBranchSid = this.normalizeBranchSid(branchSid);

    return this.creditRequest.controls
      .map((ctrl, index) => ({ index, value: ctrl.getRawValue() }))
      .filter(item => item.index !== excludeRowIndex)
      .filter(item => this.normalizeBranchSid(item.value?.CustomerBranchSid) === normalizedBranchSid)
      .filter(item => String(item.value?.Status || 'A') === 'A')
      .filter(item => this.normalizeDateValue(item.value?.EffectiveFrom))
      .map(item => item.value);
  }

  private getLatestMatchingActiveRequest(branchSid: any, excludeRowIndex?: number): any | null {
    const matches = this.getMatchingActiveRequests(branchSid, excludeRowIndex);
    if (!matches.length) return null;

    return matches.sort((a, b) => {
      const aDate = this.normalizeDateValue(a?.EffectiveFrom)?.getTime() || 0;
      const bDate = this.normalizeDateValue(b?.EffectiveFrom)?.getTime() || 0;
      return bDate - aDate;
    })[0];
  }

  // True when the next allowed start (latest active EffectiveFrom on the branch + 1 day)
  // would fall after today — i.e. a request is already effective today on this branch.
  private nextEffectiveFromExceedsToday(branchSid: any, excludeRowIndex?: number): boolean {
    const latest = this.getLatestMatchingActiveRequest(branchSid, excludeRowIndex);
    const latestFrom = this.normalizeDateValue(latest?.EffectiveFrom);
    if (!latestFrom) return false;

    const latestStart = new Date(latestFrom);
    latestStart.setHours(0, 0, 0, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    // next = latest + 1 day; exceeds today when the latest already starts today or later
    return latestStart.getTime() >= todayStart.getTime();
  }

  private applyNextEffectiveFrom(rowIndex: number, branchSid: any): void {
    const row = this.creditRequest.at(rowIndex) as FormGroup | null;
    if (!row) return;

    // No end date anymore: the latest request stays effective until the next one
    // starts. Suggest the new row's EffectiveFrom = latest EffectiveFrom + 1 day —
    // but never a future date (max is today); leave it blank so the picker blocks it.
    const latest = this.getLatestMatchingActiveRequest(branchSid, rowIndex);
    const latestFrom = this.normalizeDateValue(latest?.EffectiveFrom);
    if (!latestFrom) return;

    if (this.nextEffectiveFromExceedsToday(branchSid, rowIndex)) {
      row.patchValue({ EffectiveFrom: null }, { emitEvent: false });
      return;
    }

    row.patchValue({
      EffectiveFrom: this.addDays(latestFrom, 1)
    }, { emitEvent: false });
  }

  private validateCreditRequestContinuity(creditRequests: any[]): string | null {
    // One active request per (branch, EffectiveFrom): the latest start-date wins, so
    // two active rows on the same branch must not share the same EffectiveFrom.
    for (let i = 0; i < creditRequests.length; i++) {
      const current = creditRequests[i];
      const currentBranchSid = this.normalizeBranchSid(current?.CustomerBranchSid);
      const currentFrom = this.normalizeDateValue(current?.EffectiveFrom);

      if (!currentFrom) {
        continue;
      }

      for (let j = 0; j < creditRequests.length; j++) {
        if (i === j) continue;

        const other = creditRequests[j];
        const otherBranchSid = this.normalizeBranchSid(other?.CustomerBranchSid);
        if (currentBranchSid !== otherBranchSid) {
          continue;
        }

        if (String(other?.Status || 'A') !== 'A') {
          continue;
        }

        const otherFrom = this.normalizeDateValue(other?.EffectiveFrom);
        if (!otherFrom) {
          continue;
        }

        if (currentFrom.getTime() === otherFrom.getTime()) {
          if (currentBranchSid) {
            return 'A credit request already exists for this branch with the same Effective From date.';
          }
          return 'A credit request already exists for this customer (no branch) with the same Effective From date.';
        }
      }
    }

    return null;
  }
onDepartmentSelect(departmentSid: number, rowIndex: number) {
  const branchSid = this.creditRequest.at(rowIndex).get('CustomerBranchSid')?.value;

  if (!departmentSid || !branchSid) {
    this.salesmanListPerRow[rowIndex] = [];
    this.creditRequest.at(rowIndex).get('SalesmanSid')?.reset();
    this.refreshAuthorizationForCreditRequest(rowIndex);
    return;
  }

  this.applySalesmenForRow(rowIndex);
  this.refreshAuthorizationForCreditRequest(rowIndex);
}

  private loadAllSalesmen() {
    const companyMastersID = this.currentCompany?.CompanyMasterSid;
    if (!companyMastersID) return;
    this.masterService.getAllSalesmans(companyMastersID).subscribe({
      next: (resp: any) => {
        const salesmen = resp?.data || resp || [];
        this.salesmanList = (salesmen || []).map((s: any) => ({
          UserMasterSid: this.normalizeUserSid(
            s.salesman?.UserMasterSid ?? s.Salesman ?? s.SalesmanSid ?? s.UserMasterSid ?? null
          ),
          userName: s.salesman?.userName || s.userName || s.SalesmanName || 'Unknown'
        }));
        this.creditRequest?.controls?.forEach((ctrl, idx) => {
          this.applySalesmenForRow(idx, false);
        });
      },
      error: () => {
        this.salesmanList = [];
      }
    });
  }

  resetForm() {
    if (this.isEditMode) {
      this.getCustomerById(this.customerId);
    } else {
      this.creditRequest.clear();

      this.cusForm.reset({
        CustomerName: '',
        CountryMasterSid: null,
        status: 'A'
      });

      this.cusForm.get('status')?.disable();

      this.branchList = [];
      this.departmentList = [];
      this.salesmanList = [];
      this.customerData = null;

      this.addCreditRequestRow();
      this.scheduleDirtyTrackingSnapshot();
    }

    this.btnDisable = false;
    this.loading = false;
    this.isSaving = false;
    this.isDirty = false;
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    if (this.initialFormValue === null) {
      return false;
    }
    return !this.deepEqual(this.getCurrentNormalizedFormValue(), this.initialFormValue);
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.onSubmit(resolve);
    });
  }

  private subscribeToFormChanges(): void {
    this.formChangesSub?.unsubscribe();
    this.formChangesSub = this.cusForm.valueChanges.subscribe(() => {
      if (this.initialFormValue === null) {
        return;
      }
      this.isDirty = this.hasUnsavedChanges();
    });
  }

  private scheduleDirtyTrackingSnapshot(): void {
    setTimeout(() => {
      this.initialFormValue = this.getCurrentNormalizedFormValue();
      this.isDirty = false;
    }, 0);
  }

  private getCurrentNormalizedFormValue(): any {
    return this.normalizeValue(this.cusForm.getRawValue());
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined || value === '') {
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
      return value.map(v => this.normalizeValue(v));
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

  private deepEqual(obj1: any, obj2: any): boolean {
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
  }

  ngOnDestroy(): void {
    this.formChangesSub?.unsubscribe();
  }

  openEDoc(creditIndex: number, kycIndex: number) {
    const kycArray = this.getKycArray(creditIndex);
    // Use getRawValue so KycDocNumber is captured even when the row is approved (disabled controls
    // are omitted by .value), ensuring the Edoc Document No is always pre-filled.
    const kycData = kycArray.at(kycIndex).getRawValue();
    const creditRequest = this.creditRequest.at(creditIndex).value;

    if (!creditRequest?.CustomerCreditRequestSid) {
      this.appSettingService.showError('Please save the credit request before uploading documents.');
      return;
    }
    if (!kycData?.CustomerKycSid) {
      this.appSettingService.showError('Please save the KYC row before uploading documents.');
      return;
    }
    if (!this.MenuMasterSid) {
      this.appSettingService.showError('Menu not configured. Please refresh and try again.');
      return;
    }

    const modalRef = this.modalService.open(EdocComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });

    modalRef.componentInstance.item = kycData;
    modalRef.componentInstance.idLabel = 'KYC Document'; 
    modalRef.componentInstance.idValue = kycData?.CustomerKycSid;
    modalRef.componentInstance.formData = {
      AttachDocmentNo: kycData?.KycDocNumber || ''
    };
    
    const data: any = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: Number(this.MenuMasterSid),
      DocumentSid: kycData.CustomerKycSid,
    }

    this.commonService.documentData.set(data);

    let attachmentUpdated = false;
    modalRef.componentInstance.dataEmitter.subscribe((emitData: any) => {
      const attachDocumentSid = emitData?.attachDocumentSid;
      if (attachDocumentSid) {
        attachmentUpdated = true;
        this.getKycArray(creditIndex).at(kycIndex).patchValue({
          AttachDocumentSid: attachDocumentSid
        });
        this.loadKycFileName(
          creditIndex,
          kycIndex,
          attachDocumentSid,
          emitData?.fileName
        );
      }
    });

    modalRef.closed.subscribe(() => {
      if (!attachmentUpdated) {
        this.refreshKycAttachment(creditIndex, kycIndex);
      }
    });
  }

  private refreshKycAttachment(creditIndex: number, kycIndex: number) {
    const kycData = this.getKycArray(creditIndex).at(kycIndex).value;
    if (!kycData?.CustomerKycSid) return;
    if (!this.MenuMasterSid) return;

    const payload = {
      menuMasterSid: Number(this.MenuMasterSid),
      documentSid: kycData.CustomerKycSid
    };

    this.commonService.getExistingFile(payload).subscribe({
      next: (res: any) => {
        const files = res?.group?.attachFiles || (res?.attachDocument ? [res.attachDocument] : []);
        if (!files.length) return;
        const latest = files[files.length - 1];
        this.getKycArray(creditIndex).at(kycIndex).patchValue({
          AttachDocumentSid: latest.AttachDocumentSid || null
        });
        if (latest?.AttachDocumentSid) {
          this.loadKycFileName(creditIndex, kycIndex, latest.AttachDocumentSid, latest?.FileName);
        }
      },
      error: () => {
        this.appSettingService.showError('Failed to refresh document attachment.');
      }
    });
  }

  private loadKycFileName(
    creditIndex: number,
    kycIndex: number,
    attachDocumentSid: number,
    fileName?: string
  ) {
    if (fileName) {
      this.kycFileNameMap.set(this.getKycKey(creditIndex, kycIndex), fileName);
      return;
    }
    this.commonService.getEdocById(attachDocumentSid).subscribe({
      next: (res: any) => {
        const name = res?.FileName || res?.fileName || '';
        if (name) {
          this.kycFileNameMap.set(this.getKycKey(creditIndex, kycIndex), name);
        }
      }
    });
  }

  getKycFileName(creditIndex: number, kycIndex: number): string {
    return this.kycFileNameMap.get(this.getKycKey(creditIndex, kycIndex)) || '';
  }

  private getKycKey(creditIndex: number, kycIndex: number): string {
    return `${creditIndex}_${kycIndex}`;
  }

  private refreshKycFileNameMap(creditIndex: number) {
    const prefix = `${creditIndex}_`;
    for (const key of Array.from(this.kycFileNameMap.keys())) {
      if (key.startsWith(prefix)) {
        this.kycFileNameMap.delete(key);
      }
    }

    const kycArray = this.getKycArray(creditIndex);
    kycArray.controls.forEach((ctrl, idx) => {
      const sid = ctrl.get('AttachDocumentSid')?.value;
      if (sid) {
        this.loadKycFileName(creditIndex, idx, sid);
      }
    });
  }

  private rebuildAllKycFileNameMap() {
    this.kycFileNameMap.clear();
    this.creditRequest.controls.forEach((creditCtrl, creditIndex) => {
      const kycArray = creditCtrl.get('customerKyc') as FormArray | null;
      if (!kycArray) return;
      kycArray.controls.forEach((ctrl, kycIndex) => {
        const sid = ctrl.get('AttachDocumentSid')?.value;
        if (sid) {
          this.loadKycFileName(creditIndex, kycIndex, sid);
        }
      });
    });
  }

  removeKycAttachment(creditIndex: number, kycIndex: number) {
    this.getKycArray(creditIndex).at(kycIndex).patchValue({
      AttachDocumentSid: null
    });
    this.kycFileNameMap.delete(this.getKycKey(creditIndex, kycIndex));
  }

  private getMissingKycUploads(): { creditIndex: number; kycIndex: number; docName: string }[] {
    const missing: { creditIndex: number; kycIndex: number; docName: string }[] = [];

    this.creditRequest?.controls?.forEach((creditCtrl, creditIndex) => {
      if (!this.isApprovedRow(creditCtrl)) return;
      const kycArray = creditCtrl.get('customerKyc') as FormArray | null;
      if (!kycArray) return;

      kycArray.controls.forEach((kycCtrl, kycIndex) => {
        const attachSid = kycCtrl.get('AttachDocumentSid')?.value;
        if (attachSid) return;

        const nameValue = kycCtrl.get('KycDocName')?.value;
        const docName = nameValue ? String(nameValue) : `KYC #${kycIndex + 1}`;
        missing.push({ creditIndex, kycIndex, docName });
      });
    });

    return missing;
  }

  private hasApprovedRowsWithoutKyc(): boolean {
    return this.creditRequest?.controls?.some(ctrl => {
      if (!this.isApprovedRow(ctrl)) return false;
      const kycArray = ctrl.get('customerKyc') as FormArray | null;
      return (kycArray?.length || 0) === 0;
    }) ?? false;
  }

  

  goBack() {
    this.router.navigate(['operation/credit-request/list']);
  }

  showInfo() {
        if(!this.customerData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.customerData;
        modalRef.componentInstance.idLabel = 'Customer Id';
        modalRef.componentInstance.idValue = this.customerData?.CustomerMasterSid;
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
    modalRef.componentInstance.DocumentSid = this.customerData?.CustomerMasterSid;
  }
      openTandC() {
        this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
        const payload = { 
          MenuMasterSid: this.currentMenuId,
          DocumentSid: this.customerData?.CustomerMasterSid
        };
        const transactionPayload = {
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    MenuMasterSid: this.currentMenuId,
    DocumentSid: this.customerData?.CustomerMasterSid
  };

  const getTermText = (item: any): string =>
    (item?.Terms || item?.TandC || '').trim().toLowerCase();

  const isSameTerm = (a: any, b: any): boolean =>
    (
      a?.TandCTransactionSid &&
      b?.TandCTransactionSid &&
      a.TandCTransactionSid === b.TandCTransactionSid
    ) ||
    (
      getTermText(a) === getTermText(b) &&
      (a?.DocumentSid ?? this.customerData?.CustomerMasterSid ?? null) ===
      (b?.DocumentSid ?? this.customerData?.CustomerMasterSid ?? null)
    );
        const openModal = (terms: any[]) => {
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
                size: 'lg',
                backdrop: 'static',
                centered: true
              });
              modalRef.componentInstance.terms = terms || [];
              modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
              modalRef.componentInstance.DocumentSid = this.customerData?.CustomerMasterSid;
              modalRef.componentInstance.loadAllOnGet = !this.isTermsAndConditionsEnabled;
          };
if (this.isTermsAndConditionsEnabled) {
    forkJoin({
      tandc: this.masterService.getTandC(transactionPayload),
      defaults: this.masterService.getTandCByCondition(payload)
    }).subscribe(
      (resp: any) => {
        const tandcData = resp?.tandc?.status ? (resp.tandc.data || []) : [];
        const defaultData = resp?.defaults?.status ? (resp.defaults.data || []) : [];

        const combined = [...tandcData, ...defaultData].filter(
          (item: any, index: number, arr: any[]) =>
            index === arr.findIndex((x: any) => isSameTerm(x, item))
        );

        this.TandCList = combined;
        openModal(this.TandCList);
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
    return;
  }
    this.masterService.getTandC(transactionPayload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          openModal(this.TandCList);
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
      if (!this.customerData) return;
      const modalRef = this.modalService.open(EmailEntryComponent, { 
        size: 'lg', 
        centered: true, 
        backdrop: 'static' 
      });
      modalRef.componentInstance.item = this.customerData;
      modalRef.componentInstance.idLabel = 'Customer Id';
      modalRef.componentInstance.idValue = this.customerData?.CustomerMasterSid;
    }
    
    openAuthority() {
      if (!this.customerData) return;
      const creditIndex = this.expandedIndex ?? 0;
      const documentSid = this.getCreditDocumentSid(creditIndex);
      if (!documentSid) {
        this.appSettingService.showWarning('Please save the credit request before viewing authorization.');
        return;
      }
      const modalRef = this.modalService.open(AuthorityLogComponent, {
        size: 'lg',
        centered: true,
        backdrop: 'static'
      });
      modalRef.componentInstance.item = this.customerData;
      modalRef.componentInstance.idLabel = 'Credit Request Id';
      modalRef.componentInstance.idValue = documentSid;
      modalRef.componentInstance.documentSid = documentSid;
      modalRef.componentInstance.menuMasterSid = Number(this.currentMenuId || this.MenuMasterSid || sessionStorage.getItem('currentMenuId'));
      modalRef.componentInstance.CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
      modalRef.componentInstance.BranchMasterSid = this.currentBranch?.BranchMasterSid;
      // Menu-only authorization for Credit Request: do not scope the log by department.
      modalRef.componentInstance.DepartmentMasterSid = null;
      modalRef.componentInstance.DepartmentMaster = '';
    }
    
    openFollowup() {
  
    }

    openAuditLogs() {
      if (!this.customerId)return;
      const modalRef = this.modalService.open(AuditLogComponent, {
        centered: true,
        scrollable: true,
        size: 'xl',
        windowClass: 'audit-log-modal'
      });
      modalRef.componentInstance.title = 'Customer Credit Audit Logs';
      modalRef.componentInstance.tableName = 'CustomerMaster';
      modalRef.componentInstance.recordId = this.customerId.toString();
      modalRef.componentInstance.screenName = 'CreditRequest';
    }

}


