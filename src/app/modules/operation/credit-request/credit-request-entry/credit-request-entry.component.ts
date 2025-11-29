import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
    NgbDropdownModule
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
    this.MenuMasterSid = localStorage.getItem('currentMenuId');
    this.mps.init().subscribe();
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
      EffectiveTo: [data?.EffectiveTo ? new Date(data.EffectiveTo) : null],
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
  }

  removeCreditRequestRow(index: number) {
    if (this.creditRequest.length > 1) {
      this.creditRequest.removeAt(index);
      this.departmentListPerRow.splice(index, 1);
      this.salesmanListPerRow.splice(index, 1);
    }
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
  }

  removeKycRow(creditIndex: number, kycIndex: number) {
    const kycArray = this.getKycArray(creditIndex);
    kycArray.removeAt(kycIndex);
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
              this.salesmanListPerRow[rowIndex] = [salesmanObj];

              // Patch selected values
              fg.patchValue({
                DepartmentMasterSid: departmentObj.DepartmentMasterSid,
                SalesmanSid: salesmanObj.UserMasterSid
              });
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
    if (this.cusForm.invalid) {
      this.markFormGroupTouched(this.cusForm);
      this.appSettingService.showError('Please fill all required fields before saving');
      return;
    }

    if (this.creditRequest.controls.length === 0) {
      this.appSettingService.showError('Please add at least one Credit Request entry before saving');
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

        if (response.status) {
          this.appSettingService.showSuccess(
            this.isEditMode ? 'Credit Request updated successfully.' : 'Credit Request created successfully.'
          );
          this.router.navigate(['/operation/credit-request/list']);
        } else {
          this.appSettingService.showError(response.message || 'Failed to save credit request.');
        }
      },
      error: (err) => {
        console.error('Error saving credit requests:', err);
        this.appSettingService.showError('Failed to save credit requests.');
        this.loading = false;
        this.btnDisable = false;
      },
    });
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

  getBranchName(branchId: number): string {
  const branch = this.branchList?.find(b => b.id === branchId);
  return branch ? branch.name : '';
}

getDepartmentName(deptId: number, rowIndex: number): string {
  const deptList = this.departmentListPerRow[rowIndex];
  const dept = deptList?.find(d => d.DepartmentMasterSid === deptId);
  return dept ? dept.departmentName : '';
}


  onBranchSelect(branchSid: number, rowIndex: number) {
  if (!branchSid) {
    this.departmentListPerRow[rowIndex] = [];
    this.creditRequest.at(rowIndex).get('DepartmentMasterSid')?.reset();
    return;
  }

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

  // Reset salesman if department or branch not selected
  if (!departmentSid || !branchSid) {
    this.salesmanListPerRow[rowIndex] = [];
    this.creditRequest.at(rowIndex).get('SalesmanSid')?.reset();
    return;
  }

  // ✅ Payload as expected by backend
  const payload = {
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    CustomerMasterSid: this.customerId,
    CustomerBranchSid: branchSid,
    departmentName: String(departmentSid)
  };

  this.operationService.getSalesman(payload).subscribe({
    next: (resp: any) => {
      const salesmen = resp?.data || [];

      // ✅ Map correctly — handle API with no ID field
      this.salesmanListPerRow[rowIndex] = salesmen.map((s: any, i: number) => ({
        id: i + 1, // temporary ID since API doesn’t return one
        userName: s.salesman?.userName || 'Unknown'
      }));

      // Reset selection
      this.creditRequest.at(rowIndex).get('SalesmanSid')?.reset();

      // ✅ Optional: auto-select if only one salesman
      if (this.salesmanListPerRow[rowIndex].length === 1) {
        this.creditRequest.at(rowIndex)
          .get('SalesmanSid')
          ?.setValue(this.salesmanListPerRow[rowIndex][0].id);
      }
    },
    error: (err) => {
      console.error('Error loading salesmen:', err);
      this.salesmanListPerRow[rowIndex] = [];
      this.creditRequest.at(rowIndex).get('SalesmanSid')?.reset();
      this.appSettingService.showError('Failed to load salesmen for selected department.');
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
  }

  openEDoc(creditIndex: number, kycIndex: number) {
    const kycArray = this.getKycArray(creditIndex);
    const kycData = kycArray.at(kycIndex).value;
    const creditRequest = this.creditRequest.at(creditIndex).value;
    const modalRef = this.modalService.open(EdocComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });

    modalRef.componentInstance.item = kycData;
    modalRef.componentInstance.idLabel = 'KYC Document'; 
    modalRef.componentInstance.idValue = kycData?.CustomerKycSid;
    
    const data: any = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      DocumentSid: creditRequest.CustomerCreditRequestSid,
    }

    this.commonService.documentData.set(data);
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