import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router, ActivatedRoute } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { formatDate } from '@angular/common';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';

@Component({
  selector: 'app-charge-entry',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgSelectModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    DatePipe,
    PreventMultiClickDirective,
    FormsModule,
    MultiSelectComponent
  ],
  templateUrl: './charge-entry.component.html',
  styleUrls: ['./charge-entry.component.scss'],
  providers: [
      { provide: NgbDateAdapter, useClass: CustomDateAdapter },
      { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    ],
})
export class ChargeEntryComponent implements OnInit {
  chargeForm!: FormGroup;
  isEditMode = false;
  btnDisable = false;
  errorMessage: any;
  idParam: number;
  chargeData: any;
  displayedDepartments: any[] = [];
 extraDepartmentsCount = 0;
 selectedDepartments: string[] = [];

  // Lookup options
  companyOptions: any[] = [];
  currencyOptions: any[] = [];
  departmentOptions: any[] = [];
  chargeGroupOptions: any[] = [];
  uomOptions: any[] = [];
  hsnsacOptions: any[] = [];
  tdsOptions: any[] = [];
	today = this.calendar.getToday();
	todayDate = new Date(this.today.year,this.today.month,this.today.day);
  currentMenuId: any;
  TandCList: any;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private calendar : NgbCalendar,
    private modalService : NgbModal
  ) { }
  updateDisplayedDepartments(): void {
  this.displayedDepartments = this.departmentOptions
    .filter(dept => this.selectedDepartments.includes(dept.departmentName))
    .slice(0, 3);
  this.extraDepartmentsCount = Math.max(0, this.selectedDepartments.length - 3);
}

toggleDepartmentSelection(item: any): void {
  const index = this.selectedDepartments.indexOf(item.departmentName);
  if (index === -1) {
    this.selectedDepartments.push(item.departmentName);
  } else {
    this.selectedDepartments.splice(index, 1);
  }
  this.updateDisplayedDepartments();
  this.updateDepartmentValue();
}
isDepartmentSelected(item: any): boolean {
  return this.selectedDepartments.includes(item.departmentName);
}

updateDepartmentValue(): void {
  
  const selectedIds = this.departmentOptions
    .filter(dept => this.selectedDepartments.includes(dept.departmentName))
    .map(dept => dept.DepartmentMasterSid);
  
  this.chargeForm.get('DepartmentMasterSid').setValue(selectedIds);
}


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
      // CompanyMasterSid: [null],
      CurrencyMasterSid: [null],
      DepartmentMasterSid: [null, Validators.required],
      TDSMasterSid: [null],
      // GST fields
      GSTDescription: [''],
      TaxRate: [null],
      // TDS fields
      EffectiveFrom: [, Validators.required],
      Remarks: ['']
    });
  }


loadLookupData(): void {
  // this.masterService.getAllCompanies().subscribe(companies => {
  //   this.companyOptions = companies.data || companies;
  // });

  this.masterService.getAllCurrencies().subscribe(currencies => {
    this.currencyOptions = currencies.data || currencies;
  });

  this.masterService.getAllDepartments().subscribe(departments => {
    this.departmentOptions = departments.data || departments;
  });

  
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
      this.hsnsacOptions = resp;
      // if (this.isEditMode && this.chargeForm.value.HSNSAC) {
      //   this.onHsnsacSelect(this.chargeForm.value.HSNSAC);
      // }
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
        this.chargeData = resp;
        const chargeData = {
          ...resp,
          // EffectiveFrom: new Date(resp.EffectiveFrom)
        };
        this.chargeForm.patchValue(chargeData);
        if (this.isEditMode && resp.DepartmentMasterSid) {
        const departmentIds = Array.isArray(resp.DepartmentMasterSid) ? 
          resp.DepartmentMasterSid : [resp.DepartmentMasterSid];
        
        this.selectedDepartments = this.departmentOptions
          .filter(dept => departmentIds.includes(dept.DepartmentMasterSid))
          .map(dept => dept.departmentName);
        
        this.updateDisplayedDepartments();
        }
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

  showInfo() {
    if(!this.chargeData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.chargeData;
    modalRef.componentInstance.idLabel = 'Charge Id';
    modalRef.componentInstance.idValue = this.chargeData?.ChargeMasterSid;
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
          modalRef.componentInstance.DocumentSid = this.idParam;

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
    if (!this.chargeData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

openAuthority() {
  if (!this.chargeData) return;
  const modalRef = this.modalService.open(AuthorityEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.chargeData;
  modalRef.componentInstance.idLabel = 'charge Id';
  modalRef.componentInstance.idValue = this.chargeData?.ChargeMasterSid;
}

openEDoc() {
  if (!this.chargeData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.chargeData;
  modalRef.componentInstance.idLabel = 'charge Id';
  modalRef.componentInstance.idValue = this.chargeData?.ChargeMasterSid;
}


}