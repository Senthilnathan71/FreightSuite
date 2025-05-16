import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalModule, NgbModalRef, NgbNavModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { City } from 'src/app/modules/crm-mobile/Interfaces/city.interface';
import { MasterService } from '../../master.service';

@Component({
  selector: 'app-organization-entry',
  standalone: true,
  imports: [NgbNavModule, CommonModule, NgSelectModule, FeatherModule,
    FormsModule,
    NgbPaginationModule,
    ReactiveFormsModule, NgbModalModule,
  ],
  templateUrl: './organization-entry.component.html',
  styleUrl: './organization-entry.component.scss'
})
export class OrganizationEntryComponent {

  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfBranch: number;
  totalLengthOfBranchContact: number;
  totalLengthOfBranchEmail: number;
  totalLengthOfBranchLogin: number;

  active1 = 1;
  active2 = 1;
  active3 = 1;
  modeOfStatus = [
    { id: 'A', name: 'Active' },
    { id: 'I', name: 'Invalid' },
    { id: 'B', name: 'Block' }
  ];

  modeOfRegistered = [
    { id: 'Y', name: 'Active' },
    { id: 'N', name: 'Invalid' },
  ];
  modeofPAN = [
    { id: '1', name: "Company" },
    { id: '2', name: "Individual" },
    { id: '3', name: "Not Applicable" },
  ]
  customerBranchData: any
  customerBranchContactData: any
  customerBranchEmailData: any
  departmentList: any
  customerBranchName: any
  customerName: any
  modeOfCountry = [
    { id: 'India', name: 'India' },
    { id: 'Singapore', name: 'Singapore' },
    { id: 'Canada', name: 'Canada' }
  ];
  customerBranchLoginResults: any

  trackByIndex(index: number, item: any): number {
    return index;
  }
  companyList = [
    { id: '1', name: 'Artificial Juridical Person' },
    { id: '2', name: 'Association Of Persons(AOP)' },
    { id: '3', name: 'Body Of Individuals' },
    { id: '4', name: 'Company' },
    { id: '5', name: 'Firm' },
    { id: '6', name: 'Government Agency' },
    { id: '7', name: 'Individual(proprietor)' },
    { id: '8', name: 'Limited Liability Company(LLC)' },
    { id: '9', name: 'Limited Liability Partnership(LLP)' },
    { id: '10', name: 'Local Authority' }
  ];
  customerBranchEmailResults: any
  customerBranchLoginData: any
  gstTypeList = [
    { id: '1', name: 'Composite' },
    { id: '2', name: 'Exempt' },
    { id: '3', name: 'RCM Others' },
    { id: '4', name: 'RCM Specified' },
    { id: '5', name: 'Regular' },
    { id: '6', name: 'SEZ' },
    { id: '7', name: 'Zero Rated' }
  ]
  contactList = [
    { id: '1', name: 'Manager' },
    { id: '2', name: 'Accounts' },
    { id: '3', name: 'Operation Head' },
    { id: '4', name: 'Customer Service' },
    { id: '5', name: 'MNR' },
    { id: '6', name: 'Director' },
    { id: '7', name: 'Pricing' },
    { id: '8', name: 'Commercial' }
  ]


  // openModal(content: any) {
  //   this.modalRef = this.modalService.open(content, { size: "xl", backdrop: 'static', keyboard: false });
  // }
  CustomerLoginSid: any
  customerBranchId: any
  customerBranchContactResults: any
  CusBranchContactSid: any
  customerEmailData: any
  openModal(content: TemplateRef<any>, data?: any) {
    // Initialize both forms before patching
    this.initCustomerBranchForm();
    if (data) {
      this.isModalEditMode = true;
      // Patch form #1
      this.customerBranchForm.patchValue({
        CustBranchName: data.BranchName || '',
        CustBranchAddress: data.Address || '',
        CustBranchCity: data.CityMasterSid || '',
        CustBranchState: data.StateMasterSid || '',
        CustBranchZipPostCode: data.Zip_PostBox || '',
        CustBranchPhone: data.ContactNo || '',
        CustBranchEmail: data.Email || '',
        CustBranchRegistered: data.Registered || '',
        CustBranchGSTtype: data.CustomerGstType || '',
        CustBranchGSTIN: data.GSTNo || '',
        status: data.status === 'A' ? 'Active' : 'Invalid',
        CustomerMasterSid: data.CustomerMasterSid || ''
      });

      this.customerBranchName = data.BranchName

      // Add extra controls only if they exist
      if (data.CustomerBranchSid) {
        this.customerBranchForm.addControl('CustomerBranchSid', this.fb.control(data.CustomerBranchSid));
      }



      this.customerBranchId = data.CustomerBranchSid
    } else {
      this.isModalEditMode = false;
    }

    this.modalRef = this.modalService.open(content, { size: 'lg' }); // ✅ open the template
    this.loadCustomerBranchContact()
    this.loadCustomerBranchEmail()
    this.loadCustomerBranchLogin()
  }


  openBranchContactModal(content: TemplateRef<any>, data?: any) {
    this.initCustomerBranchContactForm();
    if (data) {
      // Patch form #2
      this.customerBranchContactForm.patchValue({
        ContactType: data.ContactType || '',
        ContactName: data.ContactName || '',
        MobileNo: data.MobileNo || '',
        Email: data.Email || ''
      });
      if (data.CusBranchContactSid) {
        this.customerBranchContactForm.addControl('CusBranchContactSid', this.fb.control(data.CusBranchContactSid));
      }
      this.CusBranchContactSid = data.CusBranchContactSid
      if (this.CusBranchContactSid) {
        this.loadCustomerBranchContactData()
      }

    } else {
      this.isModalEditMode = false;
    }

    this.modalRef = this.modalService.open(content, { size: 'lg' }); // ✅ open the template


  }



  openBranchEmailModal(content: TemplateRef<any>, data?: any) {
    this.initCustomerBranchEmailForm();
    if (data) {
      // Patch form #2
      this.customerBranchEmailForm.patchValue({
        CustomerBranchSid: data.CustomerBranchSid,
        DepartmentMasterSid: data.DepartmentMasterSid || '',
        Toemail: data.Toemail || '',
        CCemail: data.CCemail || '',
      });
      if (data.CustomerBrEmailSid) {
        this.customerBranchEmailForm.addControl('CustomerBrEmailSid', this.fb.control(data.CustomerBrEmailSid));
      }
      this.CustomerBrEmailSid = data.CustomerBrEmailSid
      if (this.CustomerBrEmailSid) {
        this.loadCustomerBranchEmailData()
      }

    } else {
      this.isModalEditMode = false;
    }

    this.modalRef = this.modalService.open(content, { size: 'lg' }); // ✅ open the template


  }


  openBranchLoginModal(content: TemplateRef<any>, data?: any) {
    this.initCustomerBranchLoginForm();
    if (data) {
      // Patch form #2
      this.customerBranchLoginForm.patchValue({
        CustomerMasterSid: data.CustomerMasterSid,
        CustomerBranchSid: data.CustomerBranchSid,
        LoginName: data.LoginName || '',
        LoginEmail: data.LoginEmail || '',
        LoginPassword: data.LoginPassword || '',
      });
      if (data.CustomerLoginSid) {
        this.customerBranchLoginForm.addControl('CustomerLoginSid', this.fb.control(data.CustomerLoginSid));
      }
      this.CustomerLoginSid = data.CustomerLoginSid
      if (this.CustomerLoginSid) {
        this.loadCustomerBranchLoginData()
      }
    } else {
      this.isModalEditMode = false;
    }
    this.modalRef = this.modalService.open(content, { size: 'lg' }); // ✅ open the template
  }
  modalRef: NgbModalRef;
  stateList: any
  customerForm!: FormGroup;
  customerBranchForm!: FormGroup
  customerBranchContactForm!: FormGroup
  customerBranchEmailForm!: FormGroup
  customerBranchLoginForm!: FormGroup

  isEditMode = false; // Flag for edit mode
  isModalEditMode = false
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  CustomerMasterSid: number;
  cityList: any
  countryList: any
  status: any
  CustomerBrEmailSid: any
  customerBranchResults: any
  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.getAllCountries()
    this.getAllState()
    this.loadCity()
    this.loadDepartments()
    this.route.paramMap.subscribe(params => {
      this.CustomerMasterSid = +params.get('id');
      if (this.CustomerMasterSid) {
        this.isEditMode = true;
        this.loadCustomerData(this.CustomerMasterSid);
        this.loadCustomerBranch()
      }
    })
    this.initForm()
  }

  initForm() {
    this.customerForm = this.fb.group({
      CustomerName: ['', [Validators.required]],
      CustomerShortCode: ['', [Validators.required]],
      CustomerAliasName: ['', [Validators.required]],
      CustomerAddress1: ['', [Validators.required]],
      CustomerAddress2: ['', [Validators.required]],
      CountryMasterSid: ['', [Validators.required]], // Dropdown
      LocalLanguage: ['', [Validators.required]],
      PanAvailable: [false],
      PanType: [{ value: '', disabled: true }, [Validators.required]],
      PanName: [{ value: '', disabled: true }, [Validators.required]],
      GroupName: ['', [Validators.required]],
      Website: ['', [Validators.required]],
      paymentType: [''], // or 'Cash' as default if you want
      IsMSME: ['', [Validators.required]],
      KYCSpecified: [false],
      RegistrationNo: [{ value: '', disabled: true }],
      CompanyType: [{ value: '', disabled: true }],
      Remarks: ['', [Validators.required]],
      status: [''],
      airlineName: [false],
      forwarder: [false],
      airline: [false],
      shipper: [false],
      airlineAgent: [false],
      seacto: [false],
      overseasAgent: [false],
      consignee: [false],
      SCACcode: [false],
      shippingLine: [false],
      broker: [false],
      unpackCFS: [false],
      shippingLineAgent: [false],
      transportClient: [false],
      localTransporter: [false],
      Coloader: [false],
      containerTerminal: [false],
      ownGroupCompany: [false],
      NVOCC: [false],
      Yard: [false],
      Transporter: [false],
      airCTO: [false],
      packCFS: [false],
      Warehouse: [false],
      CustomerType: [null],  // final JSON value     
    });
    this.setupCheckboxWatcher();
    this.customerForm.get('PanAvailable')?.valueChanges.subscribe((panAvailable: boolean) => {
      const panType = this.customerForm.get('PanType');
      const panName = this.customerForm.get('PanName');
      if (panAvailable) {
        panType?.enable();
        panName?.enable();
      } else {
        panType?.disable();
        panName?.disable();
      }
    });

    this.customerForm.get('KYCSpecified')?.valueChanges.subscribe((kycSpecified: boolean) => {
      const regNo = this.customerForm.get('RegistrationNo');
      const companyType = this.customerForm.get('CompanyType');
      if (kycSpecified) {
        regNo?.enable();
        companyType?.enable();
      } else {
        regNo?.disable();
        companyType?.disable();
      }
    });
  }

  initCustomerBranchForm() {
    this.customerBranchForm = this.fb.group({
      CustomerMasterSid: [''],
      CustBranchCity: [''],
      CustBranchState: [''],
      CustBranchName: ['', [Validators.required]],
      CustBranchZipPostCode: ['', [Validators.required]],
      CustBranchPhone: ['', [Validators.required]],
      CustBranchEmail: ['', [Validators.required]],
      CustBranchAddress: ['', [Validators.required]],
      CustBranchRegistered: ['Y', [Validators.required]], // default value if applicable
      CustBranchGSTtype: ['', [Validators.required]],
      CustBranchGSTIN: ['', [Validators.required]],
      status: ['']
    })

  }


  initCustomerBranchContactForm() {
    this.customerBranchContactForm = this.fb.group({
      CustomerMasterSid: [''],
      CustomerBranchSid: [''],
      ContactType: ['', [Validators.required]],
      ContactName: ['', [Validators.required]],
      MobileNo: ['', [Validators.required]],
      Email: ['', [Validators.required]],
    })
  }


  initCustomerBranchEmailForm() {
    this.customerBranchEmailForm = this.fb.group({
      CustomerBranchSid: [''],
      DepartmentMasterSid: [''],
      BranchName: [{ value: this.customerBranchName || '', disabled: true }],
      Toemail: ['', [Validators.required]],
      CCemail: ['', [Validators.required]],
    })
  }

  initCustomerBranchLoginForm() {
    this.customerBranchLoginForm = this.fb.group({
      CustomerMasterSid: [''],
      CustomerBranchSid: [''],
      CustomerName: [{ value: this.customerName || '', disabled: true }],
      BranchName: [{ value: this.customerBranchName || '', disabled: true }],
      LoginName: ['', [Validators.required]],
      LoginEmail: ['', [Validators.required]],
      LoginPassword: ['', [Validators.required]],
    })
  }

  setupCheckboxWatcher() {
    const keys = [
      'forwarder',
      'airline',
      'shipper',
      'airlineAgent',
      'seacto',
      'overseasAgent',
      'consignee',
      'SCACcode',
      'shippingLine',
      'broker',
      'unpackCFS',
      'shippingLineAgent',
      'transportClient',
      'localTransporter',
      'Coloader',
      'containerTerminal',
      'ownGroupCompany',
      'NVOCC',
      'Yard',
      'Transporter',
      'airCTO',
      'packCFS',
      'Warehouse'
    ];

    const updateCustomerType = () => {
      const result: any = {};
      keys.forEach(k => {
        result[k] = this.customerForm.get(k)?.value ? 'isTrue' : 'isFalse';
      });
      this.customerForm.get('CustomerType')?.setValue(result, { emitEvent: false });
    };

    updateCustomerType();

    keys.forEach(key => {
      this.customerForm.get(key)?.valueChanges.subscribe(() => {
        updateCustomerType();
      });
    });
  }


  onSubmit() {

    let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const formValue = this.customerForm.value;
    const selectedPaymentType = this.customerForm.value.paymentType;

    const payload = (this.isEditMode) ? {
      CustomerName: formValue.CustomerName,
      CustomerShortCode: formValue.CustomerShortCode,
      CustomerAliasName: formValue.CustomerAliasName,
      CustomerAddress1: formValue.CustomerAddress1,
      CustomerAddress2: formValue.CustomerAddress2,
      LocalLanguage: formValue.LocalLanguage,
      PanType: formValue.PanType,
      PanName: formValue.PanName,
      GroupName: formValue.GroupName,
      Website: formValue.Website,
      Remarks: formValue.Remarks,
      CountryMasterSid: Number(formValue.CountryMasterSid),
      CustomerType: formValue.CustomerType,
      CashCredit: selectedPaymentType,
      IsMSME: formValue.IsMSME ? "A" : "I",
      CompanyType: formValue.CompanyType,
      RegistrationNo: formValue.RegistrationNo,
      ...updatedBy,
      status: this.status === "A" ? "A" : "C"
    } : {
      CustomerName: formValue.CustomerName,
      CustomerShortCode: formValue.CustomerShortCode,
      CustomerAliasName: formValue.CustomerAliasName,
      CustomerAddress1: formValue.CustomerAddress1,
      CustomerAddress2: formValue.CustomerAddress2,
      LocalLanguage: formValue.LocalLanguage,
      PanType: formValue.PanType,
      PanName: formValue.PanName,
      GroupName: formValue.GroupName,
      Website: formValue.Website,
      Remarks: formValue.Remarks,
      CountryMasterSid: Number(formValue.CountryMasterSid),
      CustomerType: formValue.CustomerType,
      CashCredit: selectedPaymentType,
      IsMSME: formValue.IsMSME ? "A" : "I",
      CompanyType: formValue.CompanyType,
      RegistrationNo: formValue.RegistrationNo,
      ...createdBy,
      status: formValue.status === "Active" ? "A" : "C"
    };

    if (this.isEditMode) {
      this.masterService.updateCustomerById(this.CustomerMasterSid, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate([`master/organization/list`]);

          } else {
            this.appSettingService.showError(resp.message);
          }

        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error loading country:', error);
        }
      );
    } else {

      this.masterService.createCustomer(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate([`master/organization/list`]);

          } else {
            this.appSettingService.showError(resp.message);
          }

        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error loading country:', error);
        }
      );
    }

  }

  // Mapping for API status values
  statusMap: { [key: string]: string } = {
    A: 'Active',
    IA: 'Inactive'
  };


  // Fetch customer data and patch the form
  loadCustomerData(customerId: number) {
    this.masterService.getCustomerById(customerId).subscribe(
      (customerData: any) => {
        this.customerName = customerData.CustomerName
        this.status = customerData.status
        // Convert API status (A/IA) to display status (Active/Inactive)
        const formattedStatus = this.statusMap[customerData.status] || '';
        this.customerForm.patchValue({
          ...customerData,
          CountryMasterSid: customerData.CountryMasterSid,  // assign ID
          status: formattedStatus,
          paymentType: customerData.CashCredit,
          KYCSpecified: customerData.RegistrationNo || customerData.CompanyType ? true : false,
          PanAvailable: customerData.PanType || customerData.PanName ? true : false
        })
        // Patch checkbox fields from CustomerType
        const customerType = customerData.CustomerType || {};
        Object.keys(customerType).forEach(key => {
          const isChecked = customerType[key] === 'isTrue';
          if (this.customerForm.contains(key)) {
            this.customerForm.get(key)?.setValue(isChecked, { emitEvent: false });
          }
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading customer data.');
      }
    );
  }

  getAllCountries() {
    this.masterService.getAllCountry().subscribe((res) => {
      this.countryList = res.data
    })
  }

  getAllState() {
    this.masterService.getAllState().subscribe((res) => {
      this.stateList = res.data
      this.cdRef.detectChanges(); // trigger change detection
    })
  }

  loadCity(): void {
    this.masterService.getAllCity().subscribe(
      (resp: City[]) => {
        this.cityList = resp;
        this.cdRef.detectChanges(); // trigger change detection
      });
  }

  loadCustomerBranch(): void {
    this.masterService.getAllCustomerBranches().subscribe(
      (resp: any[]) => {
        // Filter only items with matching CustomerMasterSid
        this.customerBranchResults = resp.filter(
          item => item.CustomerMasterSid === this.CustomerMasterSid
        );
        this.updatePaginatedData();  // Update paginated data
        this.totalLengthOfBranch = this.customerBranchResults.length || 0;
        this.cdRef.detectChanges(); // trigger change detection
      });
  }


  loadCustomerBranchContact(): void {
    this.masterService.getAllCustomerBranchContacts().subscribe(
      (resp: any[]) => {
        // Filter only items with matching CustomerMasterSid
        this.customerBranchContactResults = resp.filter(
          item => item.CustomerMasterSid === this.CustomerMasterSid
        );
        this.updatePaginatedContactData();  // Update paginated data
        this.totalLengthOfBranchContact = this.customerBranchContactResults.length || 0;
        this.cdRef.detectChanges(); // trigger change detection
      });
  }

  getStateName(stateSid: number): string {
    if (!this.stateList) return '';
    return this.stateList.find(s => s.StateMasterSid === stateSid)?.stateName || '';
  }

  getCityName(citySid: number): string {
    if (!this.cityList) return '';
    return this.cityList.find(c => c.CityMasterSid === citySid)?.cityName || '';
  }

  getBranchName(CustomerBranchSid: number): string {
    if (!this.customerBranchData) return '';
    return this.customerBranchData.find(c => c.CustomerBranchSid === CustomerBranchSid)?.BranchName || '';
  }

  getDepartmentName(DepartmentMasterSid: number): string {
    if (!this.departmentList) return '';
    return this.departmentList.find(c => c.DepartmentMasterSid === DepartmentMasterSid)?.departmentName || '';
  }


  customerBranchSubmit() {
    let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const formValue = this.customerBranchForm.value;

    const payload =
      (this.isModalEditMode && this.customerBranchId) ? {
        CustomerMasterSid: this.CustomerMasterSid,
        CityMasterSid: Number(formValue.CustBranchCity),
        StateMasterSid: Number(formValue.CustBranchState),
        BranchName: formValue.CustBranchBranchName,
        Zip_PostBox: String(formValue.CustBranchZipPostCode),
        ContactNo: String(formValue.CustBranchPhone),
        Email: formValue.CustBranchEmail,
        Address: formValue.CustBranchAddress,
        Registered: formValue.CustBranchRegistered,
        CustomerGstType: formValue.CustBranchGSTtype,
        GSTNo: formValue.CustBranchGSTIN,
        ...updatedBy,
        status: formValue.status
      } :
        {
          CustomerMasterSid: this.CustomerMasterSid,
          CityMasterSid: Number(formValue.CustBranchCity),
          StateMasterSid: Number(formValue.CustBranchState),
          BranchName: formValue.CustBranchName,
          Zip_PostBox: String(formValue.CustBranchZipPostCode),
          ContactNo: String(formValue.CustBranchPhone),
          Email: formValue.CustBranchEmail,
          Address: formValue.CustBranchAddress,
          Registered: formValue.CustBranchRegistered,
          CustomerGstType: formValue.CustBranchGSTtype,
          GSTNo: formValue.CustBranchGSTIN,
          ...createdBy,
          status: formValue.status
        };

    if (this.isModalEditMode && this.customerBranchId) {
      this.masterService.updateCustomerBranchById(this.customerBranchId, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.customerBranchForm.reset()
            this.modalRef.close()
            this.loadCustomerBranch()
          } else {
            this.appSettingService.showError(resp.message);
          }

        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error loading country:', error);
        }
      );
    } else {

      this.masterService.createCustomerBranch(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.customerBranchForm.reset()
            this.modalRef.close()
            this.loadCustomerBranch()
          } else {
            this.appSettingService.showError(resp.message);
          }

        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error loading country:', error);
        }
      );
    }

  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.customerBranchData = this.customerBranchResults.slice(startIndex, endIndex);
  }

  updatePaginatedContactData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.customerBranchContactData = this.customerBranchContactResults.slice(startIndex, endIndex);
  }

  updatePaginatedEmailData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.customerBranchEmailData = this.customerBranchEmailResults.slice(startIndex, endIndex);
  }

  updatePaginatedLoginData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.customerBranchLoginData = this.customerBranchLoginResults.slice(startIndex, endIndex);
  }


  deleteCustomerBranch(id) {
    this.masterService.deleteCustomerBranchById(id).subscribe((resp: any) => {
      this.appSettingService.showSuccess("Deleted!");
      this.loadCustomerBranch()
    });
  }

  // Fetch customer data and patch the form
  loadCustomerBranchData(cusBranchId: number) {
    this.masterService.getCustomerBranchById(cusBranchId).subscribe(
      (cusData: any) => {
        console.log(cusData)
        // Convert API status (A/IA) to display status (Active/Inactive)
        const formattedStatus = this.statusMap[cusData.Status] || '';
        this.customerBranchForm.patchValue({
          ...cusData,
          Status: formattedStatus
        },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading customer data.');
      }
    );
  }



  //branch-contact
  customerBranchContactSubmit() {

    let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const formValue = this.customerBranchContactForm.value;

    const payload =
      (this.isModalEditMode && this.CusBranchContactSid) ? {
        CustomerMasterSid: this.CustomerMasterSid,
        CustomerBranchSid: this.customerBranchId,
        ContactType: formValue.ContactType,
        MobileNo: String(formValue.MobileNo),
        Email: formValue.Email,
        ContactName: formValue.ContactName,
        ...updatedBy,
        status: formValue.status
      } :
        {
          CustomerMasterSid: this.CustomerMasterSid,
          CustomerBranchSid: this.customerBranchId,
          ContactType: formValue.ContactType,
          MobileNo: String(formValue.MobileNo),
          Email: formValue.Email,
          ContactName: formValue.ContactName,
          ...createdBy,
          status: formValue.status
        };

    if (this.isModalEditMode && this.CusBranchContactSid) {
      this.masterService.updateCustomerBranchContactById(this.CusBranchContactSid, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.customerBranchContactForm.reset()
            this.modalRef.close()
            this.loadCustomerBranchContact()
          } else {
            this.appSettingService.showError(resp.message);
          }

        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error loading country:', error);
        }
      );
    } else {

      this.masterService.createCustomerBranchContact(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.customerBranchContactForm.reset()
            this.modalRef.close()
            this.loadCustomerBranchContact()
          } else {
            this.appSettingService.showError(resp.message);
          }

        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error loading country:', error);
        }
      );
    }

  }


  deleteCustomerBranchContact(id) {
    this.masterService.deleteCustomerBranchContactById(id).subscribe((resp: any) => {
      this.appSettingService.showSuccess("Deleted!");
      this.loadCustomerBranchContact()
    });
  }

  // Fetch customer data and patch the form
  loadCustomerBranchContactData() {
    this.masterService.getCustomerBranchById(this.CusBranchContactSid).subscribe(
      (cusData: any) => {
        console.log(cusData)
        const formattedStatus = this.statusMap[cusData.Status] || '';
        this.customerBranchForm.patchValue({
          ...cusData,
          Status: formattedStatus
        },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading customer data.');
      }
    );
  }


  //customer-branch-email
  customerBranchEmailSubmit() {

    let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const formValue = this.customerBranchEmailForm.value;

    const payload =
      (this.isModalEditMode && this.CustomerBrEmailSid) ? {
        CustomerBranchSid: Number(this.customerBranchId),
        DepartmentMasterSid: Number(formValue.DepartmentMasterSid),
        Toemail: formValue.Toemail,
        CCemail: formValue.CCemail,
        ...updatedBy,
      } :
        {
          CustomerBranchSid: Number(this.customerBranchId),
          DepartmentMasterSid: Number(formValue.DepartmentMasterSid),
          Toemail: formValue.Toemail,
          CCemail: formValue.CCemail,
          ...createdBy,
        };

    if (this.isModalEditMode && this.CustomerBrEmailSid) {
      this.masterService.updateCustomerBranchEmailById(this.CustomerBrEmailSid, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.customerBranchEmailForm.reset()
            this.modalRef.close()
            this.loadCustomerBranchEmail()
          } else {
            this.appSettingService.showError(resp.message);
          }

        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error loading country:', error);
        }
      );
    } else {

      this.masterService.createCustomerBranchEmail(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.customerBranchEmailForm.reset()
            this.modalRef.close()
            this.loadCustomerBranchEmail()
          } else {
            this.appSettingService.showError(resp.message);
          }

        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error loading country:', error);
        }
      );
    }

  }


  deleteCustomerBranchEmail(id) {
    this.masterService.deleteCustomerBranchEmailById(id).subscribe((resp: any) => {
      this.appSettingService.showSuccess("Deleted!");
      this.loadCustomerBranchEmail()
    });
  }

  // Fetch customer data and patch the form
  loadCustomerBranchEmailData() {
    this.masterService.getCustomerBranchEmailById(this.CustomerBrEmailSid).subscribe(
      (cusData: any) => {
        this.customerBranchData.find()
        this.customerBranchEmailForm.patchValue({
          ...cusData,
        },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading customer data.');
      }
    );
  }


  loadCustomerBranchEmail(): void {
    this.masterService.getAllCustomerBranchEmail().subscribe(
      (resp: any[]) => {
        this.customerBranchEmailResults = resp.filter(
          item => item.CustomerBranchSid === this.customerBranchId
        );
        this.updatePaginatedEmailData();  // Update paginated data
        this.totalLengthOfBranchEmail = this.customerBranchEmailResults.length || 0;
        this.cdRef.detectChanges(); // trigger change detection
      });
  }


  loadDepartments() {
    this.masterService.getAllDepartments().subscribe((res) => {
      this.departmentList = res
    })
  }

  //customer-branch-login
  loadCustomerBranchLoginData() {
    this.masterService.getCustomerLoginById(this.CustomerLoginSid).subscribe(
      (cusData: any) => {
        this.customerBranchData.find()
        this.customerBranchLoginForm.patchValue({
          ...cusData,
        },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading customer data.');
      }
    );
  }


  loadCustomerBranchLogin(): void {
    this.masterService.getAllCustomerLogin().subscribe(
      (resp: any[]) => {
        this.customerBranchLoginResults = resp.filter(
          item => item.CustomerMasterSid === this.CustomerMasterSid
        );
        this.customerBranchLoginResults = resp.filter(
          item => item.CustomerBranchSid === this.customerBranchId
        );
        this.updatePaginatedLoginData();  // Update paginated data
        this.totalLengthOfBranchLogin = this.customerBranchLoginResults.length || 0;
        this.cdRef.detectChanges(); // trigger change detection
      });
  }


  customerBranchLoginSubmit() {

    let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const formValue = this.customerBranchLoginForm.value;

    const payload =
      (this.isModalEditMode && this.CustomerLoginSid) ? {
        CustomerMasterSid: Number(this.CustomerMasterSid),
        CustomerBranchSid: Number(this.customerBranchId),
        LoginName: formValue.LoginName,
        LoginEmail: formValue.LoginEmail,
        LoginPassword: formValue.LoginPassword,
        ...updatedBy,
      } :
        {
          CustomerMasterSid: Number(this.CustomerMasterSid),
          CustomerBranchSid: Number(this.customerBranchId),
          LoginName: formValue.LoginName,
          LoginEmail: formValue.LoginEmail,
          LoginPassword: formValue.LoginPassword,
          ...createdBy,
        };

    if (this.isModalEditMode && this.CustomerLoginSid) {
      this.masterService.updateCustomerLoginById(this.CustomerLoginSid, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.customerBranchLoginForm.reset()
            this.modalRef.close()
            this.loadCustomerBranchLogin()
          } else {
            this.appSettingService.showError(resp.message);
          }

        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error loading country:', error);
        }
      );
    } else {

      this.masterService.createCustomerLogin(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.customerBranchLoginForm.reset()
            this.modalRef.close()
            this.loadCustomerBranchLogin()
          } else {
            this.appSettingService.showError(resp.message);
          }

        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error loading customer branch email:', error);
        }
      );
    }

  }


  deleteCustomerBranchLogin(id) {
    this.masterService.deleteCustomerLoginById(id).subscribe((resp: any) => {
      this.appSettingService.showSuccess("Deleted!");
      this.loadCustomerBranchLogin()
    });
  }


  reset() {
    this.customerForm.reset();
  }

  goBack() {
    history.back()
  }
}
