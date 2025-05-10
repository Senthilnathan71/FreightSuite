import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
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
    ReactiveFormsModule,
  ],
  templateUrl: './organization-entry.component.html',
  styleUrl: './organization-entry.component.scss'
})
export class OrganizationEntryComponent {
  active1 = 1;
  active2 = 1;
  modeOfStatus = [
    { id: 'Active', name: 'Active' },
    { id: 'Invalid', name: 'Invalid' },
    { id: 'Block', name: 'Block' }
  ];
  modeofPAN = [
    { id: '1', name: "Company" },
    { id: '2', name: "Individual" },
    { id: '3', name: "Not Applicable" },
  ]





  customerForm!: FormGroup;
  isEditMode = false; // Flag for edit mode
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  CustomerMasterSid: number;

  countryList: any
  status: any
  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.getAllCountries()
    // Subscribe to route params and load lead if ID exists
    this.route.paramMap.subscribe(params => {
      this.CustomerMasterSid = +params.get('id');
      if (this.CustomerMasterSid) {
        this.isEditMode = true;
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
      PanType: ['', [Validators.required]],
      PanName: ['', [Validators.required]],
      GroupName: ['', [Validators.required]],
      Website: ['', [Validators.required]],
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
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched(); // Force validation messages to show
      this.customerForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.customerForm.value;

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
        ...createdBy,
        status: formValue.status === "Active" ? "A" : "C"
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


  reset() {
    this.customerForm.reset();
  }

  goBack() {
    history.back()
  }
}
