import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router, ActivatedRoute } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-charge-entry',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './charge-entry.component.html',
  styleUrls: ['./charge-entry.component.scss']
})
export class ChargeEntryComponent implements OnInit {
  chargeForm!: FormGroup;
  isEditMode = false;
  btnDisable = false;
  errorMessage: any;
  idParam: number;

  // Lookup options
  companyOptions: any[] = [];
  currencyOptions: any[] = [];
  departmentOptions: any[] = [];
  chargeGroupOptions: any[] = [];
  uomOptions: any[] = [];
  hsnsacOptions: any[] = [];
  tdsOptions: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private masterService: MasterService
  ) { }

  ngOnInit(): void {
    this.loadLookupData();
    this.initForm();

    this.route.paramMap.subscribe(params => {
      this.idParam = Number(params.get('id'));
      if (this.idParam) {
        this.isEditMode = true;
        this.loadCharge(this.idParam);
      }
    });
  }
  onHsnsacSelect(event: any): void {
  if (event) {
    const selectedHsnsac = this.hsnsacOptions.find(item => item.code === event);
    if (selectedHsnsac) {
      this.chargeForm.patchValue({
        TaxRate: selectedHsnsac.rate,
        GSTDescription: selectedHsnsac.description
      });
    }
  }
}

  initForm(): void {
    this.chargeForm = this.fb.group({
      chargeCode: ['', [Validators.required, Validators.maxLength(5)]],
      chargeName: ['', [Validators.required, Validators.maxLength(100)]],
      UOM: [null],
      HSNSAC: ['', Validators.required],
      Status: ['A', Validators.required],
      ChargeGroupSid: [null],
      CompanyMasterSid: [null],
      CurrencyMasterSid: [null],
      DepartmentMasterSid: [null, Validators.required],
      TDSMasterSid: [null],
      // GST fields
      GSTDescription: [''],
      TaxRate: [null],
      // TDS fields
      EffectiveFrom: [formatDate(new Date(), 'yyyy-MM-dd', 'en'), Validators.required],
      Remarks: ['']
    });
  }

  // Update the loadLookupData method to properly handle charge groups
loadLookupData(): void {
  this.masterService.getAllCompanies().subscribe(companies => {
    this.companyOptions = companies.data || companies;
  });

  this.masterService.getAllCurrencies().subscribe(currencies => {
    this.currencyOptions = currencies.data || currencies;
  });

  this.masterService.getAllDepartments().subscribe(departments => {
    this.departmentOptions = departments.data || departments;
  });

  // Updated charge groups loading
  this.masterService.getAllChargeGroups().subscribe({
    next: (response: any) => {
      // Handle different response structures
      if (Array.isArray(response)) {
        this.chargeGroupOptions = response;
      } else if (response.data && Array.isArray(response.data)) {
        this.chargeGroupOptions = response.data;
      } else {
        this.chargeGroupOptions = [];
        console.warn('Unexpected charge groups response format:', response);
      }
    },
    error: (error) => {
      console.error('Error loading charge groups:', error);
      this.chargeGroupOptions = [];
    }
  });

  this.masterService.getAllUom().subscribe(
    (resp: any) => {
      // Handle both array response and data.array response
      this.uomOptions = resp.data || resp;
    },
    (error) => {
      console.error('Error loading UOM', error);
      this.uomOptions = [];
    }
  );
  this.masterService.getAllHssac().subscribe({
    next: (resp: any) => {
      this.hsnsacOptions = resp.data || resp;
      // If editing, trigger the selection change to populate tax rate
      if (this.isEditMode && this.chargeForm.value.HSNSAC) {
        this.onHsnsacSelect(this.chargeForm.value.HSNSAC);
      }
    },
    error: (error) => {
      console.error('Error loading HSN/SAC codes:', error);
      this.hsnsacOptions = [];
    }
  });
    // this.masterService.getAllTdsSets().subscribe(tdsSets => {
    //   this.tdsOptions = tdsSets.data || tdsSets;
    // });
}
  loadCharge(ChargeMasterSid: number): void {
    this.masterService.getChargeById(ChargeMasterSid).subscribe(
      (resp) => {
        const chargeData = {
          ...resp,
          // EffectiveFrom: resp.EffectiveFrom ? formatDate(new Date(resp.EffectiveFrom), 'yyyy-MM-dd', 'en') : ''
        };
        this.chargeForm.patchValue(chargeData);
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading charge:', error);
      }
    );
  }

  goBack(): void {
    this.router.navigate(['master/charge/list']);
  }

  resetForm(): void {
    if (this.isEditMode) {
      this.loadCharge(this.idParam);
    } else {
      this.chargeForm.reset();
      this.chargeForm.patchValue({ 
        Status: 'A',
        EffectiveFrom: formatDate(new Date(), 'yyyy-MM-dd', 'en')
      });
    }
  }

  onSubmit(): void {
    if (this.chargeForm.invalid) {
      this.chargeForm.markAllAsTouched();
      this.chargeForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    const payload = {
      ...this.chargeForm.value,
      createdBy: this.appSettingService.userSettingSource.value['userEmail'],
      updatedBy: this.isEditMode ? this.appSettingService.userSettingSource.value['userEmail'] : null
    };

    if (this.isEditMode) {
      this.masterService.updateChargeById(this.idParam, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['master/charge/list']);
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error updating charge:', error);
        }
      );
    } else {
      this.masterService.createCharge(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['master/charge/list']);
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error creating charge:', error);
        }
      );
    }
  }
}