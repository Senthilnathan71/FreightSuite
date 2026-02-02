import { Component, ViewChild, OnInit } from '@angular/core';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { catchError, forkJoin, of, tap } from 'rxjs';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { MasterService } from '../../master.service';
import { AccountsService } from 'src/app/modules/accounts/accounts.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';

@Component({
  selector: 'app-standard-charge-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    SearchableDropdown,
    NgbDatepickerModule,
    FeatherModule,
    ReactiveFormsModule,
    CommonModule,
    CustomDatePipe
  ],
  templateUrl: './standard-charge-entry.component.html',
  styles: ``,
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class StandardChargeEntryComponent implements OnInit {

  @ViewChild('departmentLookup') departmentLookup!: SearchableDropdown;
  @ViewChild('chargeLookup') chargeLookup!: SearchableDropdown;
  @ViewChild('uomLookup') uomLookup!: SearchableDropdown;
  @ViewChild('currenciesLookup') currenciesLookup!: SearchableDropdown;

  standardChargeForm!: FormGroup;
  isEditMode = false;
  StdRateHeaderSid!: number;
  departments: any[] = [];
  charge: any[] = [];
  UOMType: any[] = [];
  currencies: any[] = [];
  currencyList: any[] = [];
  currentCompany: any;
  currentBranch: any;

  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;
  UOMLookupConfig = DROPDOWN_CONFIGS.UOM;
  currenciesLookupConfig = DROPDOWN_CONFIGS.CURRENCY;

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'I', name: 'Inactive' }
  ];

  modeOfCargoType = [
    { id: 1, name: 'General' },
    { id: 2, name: 'Haz' },
    { id: 3, name: 'Refer' },
    { id: 4, name: 'Tanker' },
    { id: 5, name: 'OOG' },
  ];

  constructor(
    private fb: FormBuilder,
    private appSettingsService: AppSettingsService,
    public dropdownStore: DropdownStore,
    private leadService: LeadService,
    private currencyConfigService: CurrencyConfigurationService,
    private masterService: MasterService,
    private accountService: AccountsService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    public mps: MenuPermissionService,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingsService.decrypt(localStorage.getItem('selected-branch'));

    this.loadAllLookups().subscribe(() => {
      const id = this.route.snapshot.params['id'];
      if (id) {
        this.isEditMode = true;
        this.StdRateHeaderSid = +id;
        this.loadStandardChargeById(this.StdRateHeaderSid);
      }
    });
    this.mps.init().subscribe();
  }


  loadAllLookups() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;

    return forkJoin({
      departments: this.dropdownStore.loadDepartments({ CompanyMasterSid }).pipe(catchError(() => of([]))),
      charge: this.masterService.getAllCharges(CompanyMasterSid).pipe(catchError(() => of([]))),
      UOMType: this.leadService.getUOMsByType('C').pipe(catchError(() => of([]))),
      currencies: this.dropdownStore.loadCurrencies().pipe(catchError(() => of([]))),
    }).pipe(
      tap(({ departments, UOMType, currencies, charge }) => {
        this.departments = departments;
        this.UOMType = UOMType.data || [];
        this.currencyList = (currencies || []).map((c) => ({
          ...c,
          countryName: c?.countryMaster?.countryName,
        }));
        this.currencyConfigService.initializeConfigurations(this.currencyList);
        this.charge = Array.isArray(charge) ? charge : charge?.data || [];
      })
    );
  }


  initForm() {
    this.standardChargeForm = this.fb.group({
      DepartmentMasterSid: ['', Validators.required],
      Remarks: [''],
      Status: ['A'],
      StdTariffDetails: this.fb.array([this.createChargeRow()])
    });
  }


  createChargeRow(): FormGroup {
    return this.fb.group({
      CargoType: ['', Validators.required],
      ChargeMasterSid: ['', Validators.required],
      UomSid: ['', Validators.required],
      SaleCurrency: ['', Validators.required],
      SaleAmount: ['', Validators.required],
      CostCurrency: ['', Validators.required],
      CostAmount: ['', Validators.required],
      ValidFrom: ['', Validators.required],
      ValidTo: ['', Validators.required],
      ChargeName: [''],
      Status: 'A'
    });
  }

  get StdTariffDetails(): FormArray {
    return this.standardChargeForm.get('StdTariffDetails') as FormArray;
  }

  addRow() { this.StdTariffDetails.push(this.createChargeRow()); }
  removeRow(index: number) { if (this.StdTariffDetails.length > 1) this.StdTariffDetails.removeAt(index); }


  loadStandardChargeById(id: number) {
    this.masterService.fetchStdChargeById(id).subscribe({
      next: (res: any) => {
        if (!res) return;
        const header = res.header;
        const details = res.details || [];

        this.standardChargeForm.patchValue({
          DepartmentMasterSid: header.DepartmentMasterSid,
          Remarks: header.Remarks,
          Status: header.Status
        });


        this.StdTariffDetails.clear();
        details.forEach((row: any) => {
          const fg = this.createChargeRow();
          fg.patchValue({
            CargoType: row.CargoType,
            ChargeMasterSid: row.ChargeMasterSid,
            UomSid: row.UOMMasterSid,
            SaleCurrency: row.SaleCurrency,
            SaleAmount: row.SaleAmount,
            ValidFrom: row.ValidFrom,
            ValidTo: row.ValidTo,
            ChargeName: row.ChargeName,
            CostCurrency: row.CostCurrency,
            CostAmount: row.CostAmount,
            Status: row.Status
          });
          this.StdTariffDetails.push(fg);
        });
      },
      error: err => console.error('Failed to load standard charge:', err)
    });
  }

  onCharge(event: any, index?: number) {
    const selectedCharge = this.charge.find(
      c => c.ChargeMasterSid === event?.ChargeMasterSid
    );

    console.log(selectedCharge, "ChargeMasterSid")
    if (!selectedCharge) return;

    if (index !== undefined) {
      const row = this.StdTariffDetails.at(index);
      row.patchValue({
        ChargeName: selectedCharge.ChargeName
      });
    }
  }


  onSubmit() {
    if (this.standardChargeForm.invalid) {
      this.standardChargeForm.markAllAsTouched();
      return;
    }

    const formValue = this.standardChargeForm.value;
    const mappedDetails = formValue.StdTariffDetails.map((row: any) => {
      const selectedCharge = this.charge.find(
        c => c.ChargeMasterSid === row.ChargeMasterSid
      );

      return {
        ...row,
        ChargeName: selectedCharge?.ChargeName || ''
      };
    });

    const CreatedOn = new Date();
    const currentUser = this.appSettingService.userSettingSource.value['userEmail'];
    const payload = this.isEditMode
      ? {
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        UpdatedBy: currentUser,
        StdRateHeaderSid: this.StdRateHeaderSid,
        ...formValue,
        StdTariffDetails: mappedDetails
      }
      : {
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        CreatedOn,
        CreatedBy: currentUser,
        ...formValue,
        StdTariffDetails: mappedDetails
      };

    const operation = this.isEditMode
      ? this.masterService.updateStdChargeById(this.StdRateHeaderSid, payload)
      : this.masterService.createNewStdCharge(payload);

    operation.subscribe({
      next: (res: any) => {
        if (res.status) {

          this.router.navigate(['/master/standard-charge/list']);
          this.appSettingService.showSuccess("Standard-Charge is successfully Created!");
        } else {
          this.appSettingService.showError("Internal Server Error");
        }
      },
      error: err => console.error('Error saving standard charge:', err)
    });
  }


  reset() {
    if (this.isEditMode) {
      this.loadStandardChargeById(this.StdRateHeaderSid);
    } else {
      this.standardChargeForm.reset({ Status: 'Active' });
      this.StdTariffDetails.clear();
      this.StdTariffDetails.push(this.createChargeRow());
    }
  }

  goBack() {
    this.router.navigate(['/master/standard-charge/list']);
  }

}
