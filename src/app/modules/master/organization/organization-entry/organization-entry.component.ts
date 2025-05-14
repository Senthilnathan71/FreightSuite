import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalModule, NgbNavModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
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
  totalLengthOfCollection: number;
  active1 = 1;
  active2 = 1;
  active3 = 1;
  modeOfStatus = [
    { id: 'Active', name: 'Active' },
    { id: 'Invalid', name: 'Invalid' },
    { id: 'Block', name: 'Block' }
  ];

  modeOfRegistered = [
    { id: 'Active', name: 'Yes' },
    { id: 'Invalid', name: 'No' },
  ];
  modeofPAN = [
    { id: '1', name: "Company" },
    { id: '2', name: "Individual" },
    { id: '3', name: "Not Applicable" },
  ]
  customerBranchData: any
  modeOfCountry = [
    { id: 'India', name: 'India' },
    { id: 'Singapore', name: 'Singapore' },
    { id: 'Canada', name: 'Canada' }
  ];

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

  gstTypeList = [
    { id: '1', name: 'Composite' },
    { id: '2', name: 'Exempt' },
    { id: '3', name: 'RCM Others' },
    { id: '4', name: 'RCM Specified' },
    { id: '5', name: 'Regular' },
    { id: '6', name: 'SEZ' },
    { id: '7', name: 'Zero Rated' }
  ]


  openModal(content: any) {
    this.modalService.open(content, { size: "xl", backdrop: 'static', keyboard: false });
  }
  stateList: any

  customerForm!: FormGroup;
  customerBranchForm!: FormGroup
  isEditMode = false; // Flag for edit mode
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  CustomerMasterSid: number;
  cityList: any
  countryList: any
  status: any
  customerBranchResults: any
  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.getAllCountries()
    this.getAllState()
    this.loadCity()
    // Subscribe to route params and load lead if ID exists
    this.route.paramMap.subscribe(params => {
      this.CustomerMasterSid = +params.get('id');
      if (this.CustomerMasterSid) {
        this.isEditMode = true;
        this.initCustomerBranchForm()
        this.loadCustomerData(this.CustomerMasterSid);
      }
    });
  }

  // Initialize the Form
  initForm() {
    this.customerForm = this.fb.group({
      CustomerName: ['', [Validators.required]],
      CustomerShortCode: ['', [Validators.required]],
      CustomerAliasName: ['', [Validators.required]],
      CustomerAddress1: ['', [Validators.required]],
      CountryMasterSid: ['', [Validators.required]], // Dropdown
      LocalLanguage: ['', [Validators.required]],
      PanAvailable: false,
      PanType: ['', [Validators.required]],
      PanName: ['', [Validators.required]],
      GroupName: ['', [Validators.required]],
      Website: ['', [Validators.required]],
      paymentType: [''], // or 'Cash' as default if you want
      IsMSME: ['', [Validators.required]],
      KYCSpecified: false,
      RegistrationNo: [''],
      CompanyType: [''],
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
      CustomerType: [null]  // final JSON value
    });
    this.setupCheckboxWatcher();

  }

  initCustomerBranchForm() {
    this.customerBranchForm = this.fb.group({
      CustomerMasterSid: [''],
      CityMasterSid: [''],
      StateMasterSid: [''],
      BranchName: ['', [Validators.required]],
      Zip_PostBox: ['', [Validators.required]],
      ContactNo: ['', [Validators.required]],
      Email: ['', [Validators.required]],
      Address: ['', [Validators.required]],
      Registered: ['', [Validators.required]],
      CustomerGstType: ['', [Validators.required]],
      GSTNo: ['', [Validators.required]],
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

    // Initial run
    updateCustomerType();

    // Watch changes
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
            this.router.navigate([`master/organization/${this.CustomerMasterSid}`]);

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
            this.router.navigate([`master/organization/${this.CustomerMasterSid}`]);

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


  // Fetch lead data and patch the form
  loadCustomerData(customerId: number) {
    this.masterService.getCustomerById(customerId).subscribe(
      (customerData: any) => {
        this.status = customerData.status
        console.log(customerData)
        // Convert API status (A/IA) to display status (Active/Inactive)
        const formattedStatus = this.statusMap[customerData.status] || '';
        this.customerForm.patchValue({
          ...customerData,
          CountryMasterSid: customerData.CountryMasterSid,  // assign ID
          status: formattedStatus
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
        this.appSettingService.showError('Error loading lead data.');
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
    })
  }

  loadCity(): void {
    this.masterService.getAllCity().subscribe(
      (resp: City[]) => {
        this.cityList = resp['data'];  // On success, store the leads data in the component
      });
  }


  customerBranchSubmit() {

    let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const formValue = this.customerBranchForm.value;

    const payload = (this.isEditMode) ? {
      CustomerMasterSid: this.CustomerMasterSid,
      CityMasterSid: formValue.CustBranchCity,
      StateMasterSid: formValue.CustBranchState,
      BranchName: formValue.CustBranchBranchName,
      Zip_PostBox: formValue.CustBranchZipPostCode,
      ContactNo: formValue.CustBranchPhone,
      Email: formValue.CustBranchEmail,
      Address: formValue.CustBranchAddress,
      Registered: formValue.CustBranchRegistered,
      CustomerGstType: formValue.CustBranchGSTtype,
      GSTNo: formValue.CustBranchGSTIN,
      ...updatedBy,
      status: formValue.status
    } : {
      CustomerMasterSid: this.CustomerMasterSid,
      CityMasterSid: formValue.CustBranchCity,
      StateMasterSid: formValue.CustBranchState,
      BranchName: formValue.CustBranchBranchName,
      Zip_PostBox: formValue.CustBranchZipPostCode,
      ContactNo: formValue.CustBranchPhone,
      Email: formValue.CustBranchEmail,
      Address: formValue.CustBranchAddress,
      Registered: formValue.CustBranchRegistered,
      CustomerGstType: formValue.CustBranchGSTtype,
      GSTNo: formValue.CustBranchGSTIN,
      ...createdBy,
      status: formValue.status
    };

    if (this.isEditMode) {
      this.masterService.updateCustomerById(this.CustomerMasterSid, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['master/organization/list']);

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
            this.router.navigate(['master/organization/list']);

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
  deleteCustomerBranch(id) { }

  reset() {
    this.customerForm.reset();
  }

  goBack() {
    history.back()
  }
}
