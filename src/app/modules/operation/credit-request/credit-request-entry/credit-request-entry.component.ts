import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbAccordionModule, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
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
import { forkJoin } from 'rxjs';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { MasterService } from 'src/app/modules/master/master.service';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { PreventMultiClickDirective } from "src/app/core/Directives/prevent-multi-click.directive";

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
    PreventMultiClickDirective
],
  templateUrl: './credit-request-entry.component.html',
  styleUrl: './credit-request-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter},
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter},
    DatePipe
  ]
})
export class CreditRequestEntryComponent {
  MenuMasterSid: any;
  cusForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  loading = false;
  isSaving: boolean = false;
  customerId: number;
  customerData: any;
  userData: any;
  
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
  
  authorizerDetails = {
    isAuthorizer: false,
    isAlreadyApproved: false,
    canAuthorize: false,
    AuthorityLevel: null,
    AuthorityDetailSid: null,
    ApprovedBy: ''
  };
  allApprovalStatus = [
    { value : "Pending" , name :"Waiting for Approval"},
    { value : "WaitingForFinalApproval" , name :"Waiting for Final Approval"},
    { value : "WaitingForCustomerApproval" , name :"Waiting for Customer Approval"},
    { value : "Approved" , name :"Approved"},
    { value : "Counter" , name :"Counter"},
    { value : "Rejected" , name : "Rejected"}
  ]

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

  expandedIndex: number | null = null;
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
    public mps : MenuPermissionService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid = sessionStorage.getItem('currentMenuId');
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
      EffectiveTo: [data?.EffectiveTo ? new Date(data.EffectiveTo) : null, Validators.required],
      ApprovalStatus: [data?.ApprovalStatus || 'Pending'], 
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
    creditForm.get('ApprovalStatus')?.valueChanges.subscribe(() => {
      this.applyApprovalLock(creditForm);
    });

    return creditForm;
  }

  getKycArray(creditIndex: number): FormArray {
    return this.creditRequest.at(creditIndex).get('customerKyc') as FormArray;
  }

  addCreditRequestRow(data?: any) {
    const fg = this.createCreditRequest(data);
    
    // Patch Salesman if passed separately
    if (data?.Salesman) {
      fg.patchValue({
        SalesmanSid: data.Salesman,
      });
    }

    this.creditRequest.push(fg);
    this.expandedIndex = this.creditRequest.length - 1;
    this.salesmanListPerRow[this.expandedIndex] = this.salesmanList;
  }

  removeCreditRequestRow(index: number, force = false) {
    if (!force && this.creditRequest.length <= 1) {
      return;
    }
    this.creditRequest.removeAt(index);
    this.departmentListPerRow.splice(index, 1);
    this.salesmanListPerRow.splice(index, 1);
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

    this.operationService.deleteCustomerCreditRequest(CustomerCreditRequestSid).subscribe({
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
    this.operationService.getCustomerById(CustomerMasterSid).subscribe({
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
              this.applySalesmenForRow(rowIndex);

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
        } else {
          console.warn('Empty customer response:', resp);
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

  onSubmit() {
    this.isSaving = true;
    if (this.cusForm.invalid) {
      this.markFormGroupTouched(this.cusForm);
      this.appSettingService.showError('Please fill all required fields before saving');
      this.isSaving = false;
      return;
    }

    if (this.creditRequest.controls.length === 0) {
      this.appSettingService.showError('Please add at least one Credit Request entry before saving');
      this.isSaving = false;
      return;
    }

     const creditRequests = this.creditRequest.getRawValue();
     if (!this.isEditMode) {
    for (let i = 0; i < creditRequests.length; i++) {
      const current = creditRequests[i];
      for (let j = 0; j < creditRequests.length; j++) {
        if (i !== j) {
          const other = creditRequests[j];

          if (
            current.CustomerBranchSid === other.CustomerBranchSid &&
            current.DepartmentMasterSid === other.DepartmentMasterSid
          ) {
            const curFrom = new Date(current.EffectiveFrom);
            const othTo = other.EffectiveTo ? new Date(other.EffectiveTo) : null;
            const othStatus = other.Status;

            const isAllowed =
              (othStatus === 'S') ||
              (othTo && curFrom > othTo);

            if (!isAllowed) {
              this.appSettingService.showError(
                `Existing Branch & Department not allowed.`
              );
              this.isSaving = false;
              return;
            }
          }
        }
      }
    }
  }
    this.btnDisable = true;
    this.loading = true;

    const currentUserEmail = this.userData?.LoginId || this.appSettingService.userSettingSource.value['userEmail'];

    // Build payload with nested KYC
    const payload = this.creditRequest.getRawValue().map((req) => ({
      CustomerCreditRequestSid: req.CustomerCreditRequestSid || null,
      CustomerMasterSid: this.customerId,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      CustomerBranchSid: req.CustomerBranchSid,
      DepartmentMasterSid: req.DepartmentMasterSid,
      SalesmanSid: req.SalesmanSid,
      CreditDays: req.CreditDays,
      CreditLimit: req.CreditLimit,
      PublishedDays: req.PublishedDays,
      PublishedLimit: req.PublishedLimit,
      EffectiveFrom: req.EffectiveFrom,
      EffectiveTo: req.EffectiveTo,
      ApprovalStatus: req.ApprovalStatus || 'Pending',
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

    const apiCall = this.isEditMode 
      ? this.operationService.updateCreditRequest(payload)
      : this.operationService.createCreditRequest(payload);

    apiCall.subscribe({
      next: (response: any) => {
        this.loading = false;
        this.btnDisable = false;
        this.isSaving = false;

        if (response.status) {
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
        } else {
          this.appSettingService.showError(response.message || 'Failed to save credit request.');
        }
      },
      error: (err) => {
        console.error('Error saving credit requests:', err);
        this.appSettingService.showError('Failed to save credit requests.');
        this.loading = false;
        this.btnDisable = false;
        this.isSaving = false;
      },
    });
  }

  private applySavedCreditRequests(savedItems: any[]) {
    // Reset arrays
    this.creditRequest.clear();
    this.departmentListPerRow = [];
    this.salesmanListPerRow = [];

    savedItems.forEach((item: any, rowIndex: number) => {
      const normalized = {
        ...item,
        customerKyc: item.customerKyc || item.kycRecords || []
      };

      const fg = this.createCreditRequest(normalized);
      this.creditRequest.push(fg);

      // Keep dropdown data if already loaded; otherwise leave empty
      this.departmentListPerRow[rowIndex] = this.departmentListPerRow[rowIndex] || [];
      this.salesmanListPerRow[rowIndex] = this.salesmanListPerRow[rowIndex] || [];

      // Reload file names if attachment exists
      if (normalized?.customerKyc?.length) {
        normalized.customerKyc.forEach((kyc: any, kycIndex: number) => {
          if (kyc?.AttachDocumentSid) {
            this.loadKycFileName(rowIndex, kycIndex, kyc.AttachDocumentSid);
          }
        });
      }
    });

    if (this.creditRequest.length === 0) {
      this.addCreditRequestRow();
    } else {
      this.expandedIndex = 0;
    }
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

  private normalizeApprovalStatus(raw: any): string {
    const status =
      typeof raw === 'string'
        ? raw
        : (raw?.value ?? raw?.name ?? raw?.Status ?? raw?.status ?? '');
    return String(status ?? '').trim().toLowerCase();
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
      'ApprovalStatus'
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
    const effectiveTo = credit.get('EffectiveTo')?.value;
    const status = credit.get('Status')?.value;
    return !effectiveTo || !status;
  }

  isSaveDisabled(): boolean {
    if ((!this.mps.can('update') && this.isEditMode) || this.isSaving) return true;
    const anyApprovedInvalid = this.creditRequest?.controls?.some(ctrl => this.isApprovedRowInvalid(ctrl));
    return !!anyApprovedInvalid;
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

  private applySalesmenForRow(rowIndex: number) {
    const branchSid = this.creditRequest.at(rowIndex).get('CustomerBranchSid')?.value;
    if (!branchSid) return;

    const branch = this.customerData?.CustomerBranch?.find((b: any) => b.CustomerBranchSid === branchSid);
    let list = this.salesmanList;
    let ids: any[] = [];

    if (branch?.CustomerSalesTeam?.length) {
      ids = branch.CustomerSalesTeam
        .map((t: any) => t?.Salesman)
        .filter((id: any) => id != null);
      if (ids.length) {
        list = this.salesmanList.filter(s => ids.includes(s.UserMasterSid));
      }
    }

    this.salesmanListPerRow[rowIndex] = list;

    const current = this.creditRequest.at(rowIndex).get('SalesmanSid')?.value;
    if (!current) {
      const autoId = ids.length === 1
        ? ids[0]
        : list.length === 1
          ? list[0].UserMasterSid
          : list[0]?.UserMasterSid;
      if (autoId) {
        this.creditRequest.at(rowIndex).get('SalesmanSid')?.setValue(autoId);
      }
    }
  }

  onBranchSelect(branchSid: number, rowIndex: number) {
  if (!branchSid) {
    this.departmentListPerRow[rowIndex] = [];
    this.salesmanListPerRow[rowIndex] = [];
    this.creditRequest.at(rowIndex).get('DepartmentMasterSid')?.reset();
    this.creditRequest.at(rowIndex).get('SalesmanSid')?.reset();
    return;
  }

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
  onDepartmentSelect(departmentSid: number, rowIndex: number) {
  const branchSid = this.creditRequest.at(rowIndex).get('CustomerBranchSid')?.value;

  if (!departmentSid || !branchSid) {
    this.salesmanListPerRow[rowIndex] = [];
    this.creditRequest.at(rowIndex).get('SalesmanSid')?.reset();
    return;
  }

  this.salesmanListPerRow[rowIndex] = this.salesmanList;

  const current = this.creditRequest.at(rowIndex).get('SalesmanSid')?.value;
  if (!current && this.salesmanListPerRow[rowIndex].length === 1) {
    this.creditRequest.at(rowIndex)
      .get('SalesmanSid')
      ?.setValue(this.salesmanListPerRow[rowIndex][0].UserMasterSid);
  }
}

  private loadAllSalesmen() {
    const companyMastersID = this.currentCompany?.CompanyMasterSid;
    if (!companyMastersID) return;
    this.masterService.getAllSalesmans(companyMastersID).subscribe({
      next: (resp: any) => {
        const salesmen = resp?.data || resp || [];
        this.salesmanList = (salesmen || []).map((s: any) => ({
          UserMasterSid: s.salesman?.UserMasterSid ?? s.Salesman ?? s.SalesmanSid ?? s.UserMasterSid ?? null,
          userName: s.salesman?.userName || s.userName || s.SalesmanName || 'Unknown'
        }));
        this.creditRequest?.controls?.forEach((ctrl, idx) => {
          this.applySalesmenForRow(idx);
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
    }

    this.btnDisable = false;
    this.loading = false;
    this.isSaving = false;
  }

  openEDoc(creditIndex: number, kycIndex: number) {
    const kycArray = this.getKycArray(creditIndex);
    const kycData = kycArray.at(kycIndex).value;
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
      openTandC() {
        this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
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
              modalRef.componentInstance.DocumentSid = this.currentClauseId;
    
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
      const modalRef = this.modalService.open(AuthorityLogComponent, { 
        size: 'lg', 
        centered: true, 
        backdrop: 'static' 
      });
      modalRef.componentInstance.item = this.customerData;
      modalRef.componentInstance.idLabel = 'Customer Id';
      modalRef.componentInstance.idValue = this.customerData?.CustomerMasterSid;
    }
    
    openFollowup() {
  
    }
}


