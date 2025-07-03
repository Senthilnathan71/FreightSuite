import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Currency } from 'src/app/modules/crm-mobile/Interfaces/currency.interface';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-currency-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    DatePipe,
    NgSelectModule,
  ],
  templateUrl: './currency-entry.component.html',
  styleUrls: ['./currency-entry.component.scss']
})
export class CurrencyEntryComponent implements OnInit {
  currencyForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  currencyID: number;
  loading = false;
  currencyData: any;
  
  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];
  currentMenuId: any;
  TandCList: any;

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private modalService : NgbModal
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.currencyID = +params['id'];
        this.isEditMode = true;
        this.getCurrencyById(this.currencyID);
      }
    });
  }

  initForm() {
    this.currencyForm = this.fb.group({
      currencyName: ['', [
        Validators.required, 
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z\s]*$/)
      ]],
      currencyCode: ['', [
        Validators.required,
        Validators.maxLength(3),
        Validators.pattern(/^[A-Z]{3}$/)
      ]],
      CurrencyUnit: ['', [
        Validators.required, 
        Validators.maxLength(50)
      ]],
      CurrencySubUnit: ['', [
        Validators.maxLength(50)
      ]],
      SubUnitIn: ['', [
      Validators.pattern(/^[1-9]\d{0,2}$/), 
      Validators.maxLength(3) 
    ]],
      ShortCode: ['', [
        Validators.maxLength(3)
      ]],
      Symbol: ['', [
        Validators.required, 
        Validators.maxLength(5)
      ]],
      amountDecimal: [2, [
        Validators.required,
        Validators.min(0),
        Validators.max(8),
        Validators.pattern(/^\d+$/)
      ]],
      exchangeDecimal: [4, [
        Validators.required,
        Validators.min(0),
        Validators.max(8),
        Validators.pattern(/^\d+$/)
      ]],
      RoundOf: ['', [
        Validators.maxLength(100)
      ]],
      status: [{value: 'A', disabled: !this.isEditMode}, Validators.required]
    });

    // Add value change handlers for form controls
    this.setupValueChangeHandlers();
  }

  setupValueChangeHandlers() {
  this.currencyForm.get('SubUnitIn')?.valueChanges.subscribe(val => {
    if (val && !/^[1-9]\d{0,2}$/.test(val)) {
      this.currencyForm.get('SubUnitIn')?.setValue('', { emitEvent: false });
    }
  });


    this.currencyForm.get('ShortCode')?.valueChanges.subscribe(val => {
      if (val) {
        const upperVal = val.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
        if (upperVal !== val) {
          this.currencyForm.get('ShortCode')?.setValue(upperVal, { emitEvent: false });
        }
      }
    });

    this.currencyForm.get('currencyName')?.valueChanges.subscribe(val => {
      if (val) {
        const cleanVal = val.replace(/[^a-zA-Z\s]/g, '');
        if (cleanVal !== val) {
          this.currencyForm.get('currencyName')?.setValue(cleanVal, { emitEvent: false });
        }
      }
    });

    this.currencyForm.get('SubUnitIn')?.valueChanges.subscribe(val => {
      if (val && (isNaN(val) || val < 1 || val > 1000)) {
        this.currencyForm.get('SubUnitIn')?.setValue(null, { emitEvent: false });
      }
    });
  }

  getCurrencyById(id: number) {
    this.loading = true;
    this.masterService.getCurrencyById(id).subscribe({
      next: (currency: Currency) => {
        if (this.isEditMode) {
          this.currencyForm.get('status')?.enable();
        }
        this.currencyData = currency;
        this.currencyForm.patchValue({
          currencyName: currency.currencyName,
          currencyCode: currency.currencyCode,
          CurrencyUnit: currency.CurrencyUnit, 
          CurrencySubUnit: currency.CurrencySubUnit,
          SubUnitIn: currency.SubUnitIn,
          ShortCode: currency.ShortCode,
          Symbol: currency.Symbol,
          amountDecimal: currency.amountDecimal,
          exchangeDecimal: currency.exchangeDecimal,
          RoundOf: currency.RoundOf,
          status: currency.status
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading currency:', err);
        this.loading = false;
        this.appSettingService.showError('Failed to load currency data');
      }
    });
  }

  onSubmit() {
    if (this.currencyForm.invalid) {
      this.markFormGroupTouched(this.currencyForm);
      return;
    }
  
    this.btnDisable = true;
    this.loading = true;

    const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    
    const payload = {
      currencyName: this.currencyForm.value.currencyName,
      currencyCode: this.currencyForm.value.currencyCode,
      CurrencyUnit: this.currencyForm.value.CurrencyUnit,
      CurrencySubUnit: this.currencyForm.value.CurrencySubUnit,
      SubUnitIn: this.currencyForm.value.SubUnitIn !== null 
      ? String(this.currencyForm.value.SubUnitIn) 
      : null,
      ShortCode: this.currencyForm.value.ShortCode,
      Symbol: this.currencyForm.value.Symbol,
      amountDecimal: Number(this.currencyForm.value.amountDecimal),
      exchangeDecimal: Number(this.currencyForm.value.exchangeDecimal),
      RoundOf: this.currencyForm.value.RoundOf,
      status: this.currencyForm.value.status,
      ...(this.isEditMode ? {updatedBy : currentUserEmail} : {createdBy : currentUserEmail})
    };
  
    const operation = this.isEditMode 
      ? this.masterService.editCurrency(this.currencyID, payload)
      : this.masterService.createCurrency(payload);
  
    operation.subscribe({
      next: (resp) => {
        this.loading = false;
        this.btnDisable = false;
        const message = this.isEditMode 
          ? 'Currency updated successfully!' 
          : 'Currency created successfully!';
        
        this.appSettingService.showSuccess(message);
        this.router.navigate(['/master/currency/list']);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.btnDisable = false;
        if (err.status === 400 && err.error.message.includes('already exists')) {
          this.appSettingService.showError(err.error.message);
        } else {
          this.appSettingService.showError('Failed to process currency. Please try again.');
        }      
      }
    });
  }
  
  resetForm() {
    if (this.isEditMode) {
      this.getCurrencyById(this.currencyID);
    } else {
      this.currencyForm.reset({
        currencyName: '',
        currencyCode: '',
        CurrencyUnit: '',
        CurrencySubUnit: '',
        SubUnitIn: null,
        ShortCode: '',
        Symbol: '',
        amountDecimal: 2,
        exchangeDecimal: 4,
        RoundOf: '',
        status: 'A'
      });
    }
  }

  goBack() {
    this.router.navigate(['master/currency/list']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  showInfo() {
    if (!this.currencyData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.currencyData;
    modalRef.componentInstance.idLabel = 'Currency Id';
    modalRef.componentInstance.idValue = this.currencyData?.CurrencyMasterSid;
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
          modalRef.componentInstance.DocumentSid = this.currencyID;

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
  if (!this.currencyData) return;
  const modalRef = this.modalService.open(EmailEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.currencyData;
  modalRef.componentInstance.idLabel = 'Currency Id';
  modalRef.componentInstance.idValue = this.currencyData?.CurrencyMasterSid;
}

openAuthority() {
  if (!this.currencyData) return;
  const modalRef = this.modalService.open(AuthorityEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.currencyData;
  modalRef.componentInstance.idLabel = 'Currency Id';
  modalRef.componentInstance.idValue = this.currencyData?.CurrencyMasterSid;
}

openEDoc() {
  if (!this.currencyData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.currencyData;
  modalRef.componentInstance.idLabel = 'Currency Id';
  modalRef.componentInstance.idValue = this.currencyData?.CurrencyMasterSid;
}

}