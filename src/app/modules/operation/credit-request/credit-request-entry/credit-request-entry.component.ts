import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
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
    DecimalPrecisionDirective
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
  tabs = [
    { name: 'Credit', icon: 'fas fa-file-signature' },
    { name: 'KYC', icon: 'fas fa-layer-group' },
  ];
  selectedTab = this.tabs[0].name;
  cusForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  loading = false;
  customerId: number;
  customerData: any;
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  departmentListPerRow: any[][] = [];
  salesmanListPerRow: any[][] = [];

  currentMenuId: any;
  TandCList: any;

  branchList: any[] = [];
  departmentList: any[] = [];
  salesmanList: any[] = [];
  today = this.calendar.getToday();
  typeofStatus = [
    { id: 'A', name: "Active" },
    { id: 'S', name: "Suspended" }
  ]
  currentCompany: any;
  currentBranch: any;

  constructor(
    private fb: FormBuilder,
    private operationService: OperationService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private calendar: NgbCalendar,
    private modalService: NgbModal,
    private datePipe: DatePipe,
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
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
      this.checkPermissions();
    }
    this.loadLookupData();
  }

  initForm() {
    this.cusForm = this.fb.group({
      CustomerName: [''],
      CountryMasterSid: [''],
      status: [''],
      creditRequest: this.fb.array([]),
      // kyc: this.fb.array([])
    });
  }

  get creditRequest(): FormArray {
    return this.cusForm.get('creditRequest') as FormArray;
  }

  // get kyc(): FormArray {
  //   return this.cusForm.get('kyc') as FormArray;
  // }

  createCreditRequest(data?:any): FormGroup {
    return this.fb.group({
      CustomerCreditRequestSid: [data?.CustomerCreditRequestSid || null],
      CustomerBranchSid: [data?.CustomerBranchSid || ''],
      DepartmentMasterSid: [data?.DepartmentMasterSid || ''],
      SalesmanSid: [data?.SalesmanSid || ''],
      CreditDays: [data?.CreditDays || 0],
      CreditLimit: [data?.CreditLimit || 0],
      PublishedDays: [data?.PublishedDays || 0],
      PublishedLimit: [data?.PublishedLimit || 0],
      EffectiveFrom: [data?.EffectiveFrom ? new Date(data?.EffectiveFrom) : null],
      EffectiveTo: [data?.EffectiveTo ? new Date(data?.EffectiveTo) : null],
      ApprovalStatus: [data?.ApprovalStatus || 'Pending'], 
      Status: [data?.Status || ''],
    });
  }

  addCreditRequestRow(data?: any) {
  // Convert API date strings (ISO) to yyyy-MM-dd for HTML <input type="date">
  const formattedData = data
    ? {
        ...data,
        EffectiveFrom: this.formatDateForInput(data.EffectiveFrom),
        EffectiveTo: this.formatDateForInput(data.EffectiveTo),
      }
    : null;

  const fg = this.createCreditRequest(formattedData);

  // Patch Salesman if passed separately
  if (data?.Salesman) {
    fg.patchValue({
      SalesmanSid: data.Salesman,
    });
  }

  this.creditRequest.push(fg);
}


  removeCreditRequestRow(index: number) {
    this.creditRequest.removeAt(index);
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    if (currentMenuId && userRole) {
      this.operationService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response) => {
          this.currentMenuPermissions = response.data.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions)
          .filter(key => this.currentMenuPermissions[key] === 'isTrue');
        }
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

  loadLookupData() {
  // 👇 Construct payload exactly as backend expects
  const payload = {
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    EffectiveFrom: this.cusForm.get('EffectiveFrom')?.value,
    CustomerMasterSid: this.cusForm.get('CustomerMasterSid')?.value,
    CustomerBranchSid: this.cusForm.get('CustomerBranchSid')?.value,
    DepartmentMasterSid: this.cusForm.get('DepartmentMasterSid')?.value, // needed for salesman only
  };

  forkJoin([
    this.operationService.getDepartment(payload),
    this.operationService.getSalesman(payload),
  ]).subscribe({
    next: ([departments, salesman]) => {
      // The backend returns arrays directly, not {data: ...}, so handle both
      this.departmentList = departments?.data || departments;
      this.salesmanList = (salesman?.data || salesman).map((x: any) => ({
  UserMasterSid: x.salesman?.UserMasterSid,
  userName: x.salesman?.userName
}));
    },
    error: (err) => {
      console.error('Error loading lookup data:', err);
      this.appSettingService.showError('Failed to load department/salesman data.');
    }
  });
}


 getCustomerById(CustomerMasterSid: number) {
  this.operationService.getCustomerById(CustomerMasterSid).subscribe({
    next: (resp: any) => {
      if (resp.status && resp.data) {
        this.customerData = resp.data;

        // 🔹 Prepare branch dropdown
        this.branchList = this.customerData.CustomerBranch?.map((branch: any) => ({
          id: branch.CustomerBranchSid,
          name: branch.BranchName
        })) || [];

        // 🔹 Patch customer header
        this.cusForm.patchValue({
          CustomerName: this.customerData.CustomerName || '',
          CountryMasterSid: this.customerData.Country || '',
          status: this.customerData.Status || 'A',
        });
        this.cusForm.get('status')?.disable();

        // 🔹 Clear existing rows
        this.creditRequest.clear();

        const creditRequests = this.customerData.customerCreditRequest || [];

        if (creditRequests.length > 0) {
          creditRequests.forEach((req: any, rowIndex: number) => {
           const fg = this.createCreditRequest({
  ...req,
  EffectiveFrom: req.EffectiveFrom,
  EffectiveTo: req.EffectiveTo
});

            this.creditRequest.push(fg);

            // ✅ Populate Department dropdown per row
            const departmentObj = {
              DepartmentMasterSid: req.DepartmentMasterSid,
              departmentName: req.department?.departmentName || req.departmentName || ''
            };
            this.departmentListPerRow[rowIndex] = [departmentObj];

            // ✅ Populate Salesman dropdown per row
            const salesmanObj = {
              UserMasterSid: req.salesman?.UserMasterSid || req.SalesmanSid,
              userName: req.salesman?.userName || req.SalesmanName || ''
            };
            this.salesmanListPerRow[rowIndex] = [salesmanObj];

            // ✅ Patch selected department and salesman after dropdowns are set
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

private convertToNgbDate(dateString: string): any {
  const date = new Date(dateString);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  };
}

private formatDateForInput(dateString: string): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  this.btnDisable = true;
  this.loading = true;

  const currentUserEmail =
    this.userData?.LoginId || this.appSettingService.userSettingSource.value['userEmail'];

  // Build full list of request objects
  const requests = this.creditRequest.getRawValue().map((req) => ({
    CustomerCreditRequestSid: req.CustomerCreditRequestSid || null,
    CustomerMasterSid: this.customerId,
    CustomerBranchSid: req.CustomerBranchSid,
    DepartmentMasterSid: req.DepartmentMasterSid,
    SalesmanSid: req.SalesmanSid,
    CreditDays: req.CreditDays,
    CreditLimit: req.CreditLimit,
    PublishedDays: req.PublishedDays,
    PublishedLimit: req.PublishedLimit,
    EffectiveFrom: req.EffectiveFrom
      ? this.datePipe.transform(req.EffectiveFrom, 'yyyy-MM-dd')
      : null,
    EffectiveTo: req.EffectiveTo
      ? this.datePipe.transform(req.EffectiveTo, 'yyyy-MM-dd')
      : null,
    ApprovalStatus: req.ApprovalStatus || 'Pending',
    Status: req.Status || 'A',
    CreatedBy: currentUserEmail,
  }));

  // Separate into new and existing entries
  const createPayload = requests.filter((r) => !r.CustomerCreditRequestSid);
  const updatePayload = requests.filter((r) => r.CustomerCreditRequestSid);

  const apiCalls = [];

  // 👇 CREATE new entries
  if (createPayload.length > 0) {
    apiCalls.push(
      this.operationService.createCreditRequest({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        CustomerMasterSid: this.customerId,
        customerCreditRequest: createPayload,
      })
    );
  }

  // 👇 UPDATE existing entries
  updatePayload.forEach((row) => {
    apiCalls.push(this.operationService.updateCreditRequest(row.CustomerCreditRequestSid, row));
  });

  if (apiCalls.length === 0) {
    this.appSettingService.showInfo('No changes detected to save.');
    this.loading = false;
    this.btnDisable = false;
    return;
  }

  // Execute all create/update requests together
  forkJoin(apiCalls).subscribe({
    next: (responses: any[]) => {
      this.loading = false;
      this.btnDisable = false;

      const allSuccess = responses.every((r) => r.status);
      if (allSuccess) {
        this.appSettingService.showSuccess('Credit Request saved successfully.');
        this.router.navigate(['/operation/credit-request/list']);
      } else {
        this.appSettingService.showError('Some records failed to save.');
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

  // ✅ Payload matches your backend expectation
  const payload = {
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    CustomerMasterSid: this.customerId,
    CustomerBranchSid: branchSid,
    departmentName: String(departmentSid) // backend wants departmentName as string
  };

  this.operationService.getSalesman(payload).subscribe({
    next: (resp: any) => {
      const salesmen = resp?.data || [];
      this.salesmanListPerRow[rowIndex] = salesmen.map((s: any) => ({
        UserMasterSid: s.salesman?.UserMasterSid,
        userName: s.salesman?.userName
      }));

      // reset Salesman selection after department change
      this.creditRequest.at(rowIndex).get('SalesmanSid')?.reset();
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
    // 🔁 Reload existing data if in edit mode
    this.getCustomerById(this.customerId);
  } else {
    // 🧹 Clear all form arrays and reset values
    this.creditRequest.clear();

    this.cusForm.reset({
      CustomerName: '',
      CountryMasterSid: null,
      status: 'A'
    });

    // Disable status for new entry
    this.cusForm.get('status')?.disable();

    // Reset dependent lists or selections
    this.branchList = [];
    this.departmentList = [];
    this.salesmanList = [];
    this.customerData = null;

    // Add one empty credit request row
    this.addCreditRequestRow();
  }

  // Optional: Reset UI state
  this.btnDisable = false;
  this.loading = false;
  this.selectedTab = this.tabs[0].name;
}


clearFormArrays() {
  // Clear all credit request rows
  while (this.creditRequest.length !== 0) {
    this.creditRequest.removeAt(0);
  }

  // (Optional) If you later add more FormArrays like KYC, clear them here too:
  // while (this.kyc.length !== 0) {
  //   this.kyc.removeAt(0);
  // }
}
selectTab(tab: string) {
  this.selectedTab = tab;
}
  goBack() {
    this.router.navigate(['operation/credit-request/list'])
  }
}
