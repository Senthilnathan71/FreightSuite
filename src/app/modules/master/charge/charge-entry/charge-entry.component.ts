import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router, ActivatedRoute } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';

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
  // uomOptions: any[] = [];

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

  initForm(): void {
    this.chargeForm = this.fb.group({
      chargeCode: ['', [Validators.required, Validators.maxLength(5)]],
      chargeName: ['', [Validators.required, Validators.maxLength(100)]],
      UOM: [null],
      Status: ['A', Validators.required],
      ChargeGroupSid: [null, Validators.required],
      CompanyMasterSid: [null],
      CurrencyMasterSid: [null, Validators.required],
      DepartmentMasterSid: [null, Validators.required],
      // GST fields
      SACCode: [''],
      GSTDescription: [''],
      TaxRate: [null],
      // TDS fields
      TDSSet: [''],
      EffectiveFrom: ['']
    });
  }

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

    this.masterService.getAllChargeGroups().subscribe(chargeGroups => {
      this.chargeGroupOptions = chargeGroups.data || chargeGroups;
    });

  //   this.masterService.getAllUom().subscribe(uoms => {
  //   this.uomOptions = uoms.data || uoms;
  // });
  }

  loadCharge(ChargeMasterSid: number): void {
    this.masterService.getChargeById(ChargeMasterSid).subscribe(
      (resp) => {
        this.chargeForm.patchValue(resp);
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
      this.chargeForm.patchValue({ Status: 'A' });
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