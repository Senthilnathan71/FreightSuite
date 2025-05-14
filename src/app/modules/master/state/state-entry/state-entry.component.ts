import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { MasterService } from '../../master.service';
import { State } from 'src/app/modules/crm-mobile/Interfaces/state.interface';
import { Country } from 'src/app/modules/crm-mobile/Interfaces/country.interface';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-state-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule
  ],
  templateUrl: './state-entry.component.html',
  styleUrls: ['./state-entry.component.scss']
})
export class StateEntryComponent implements OnInit {
onCountryChange(event: any) {
throw new Error('Method not implemented.');
}
  stateForm: FormGroup;
  countries: Country[] = [];
  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'I', name: 'Inactive' }
  ];
  isEditMode = false;
  btnDisable = false;
  stateId: number;
  loading = false;
  notifyService: any;
countryOptions: readonly any[];
countryInput$: Subject<string>;

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.stateForm = this.fb.group({
      stateName: ['', [
        Validators.required,
        Validators.maxLength(100),
        this.alphaSpaceValidator()
      ]],
      stateCode: ['', [
        Validators.required,
        Validators.maxLength(2),
        this.alphaValidator()
      ]],
      CountryMasterSid: [null, Validators.required],
      region: [''],
      status: [{value: 'A', disabled: !this.isEditMode}, Validators.required],
      Remarks: ['']
    });

    this.stateForm.get('stateCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.stateForm.get('stateCode')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.loadCountries();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.stateId = +params['id'];
        this.isEditMode = true;
        this.stateForm.get('status')?.enable();
        this.getStateById(this.stateId);
      }
    });
  }

  private alphaValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z]+$/.test(control.value);
      return valid ? null : { invalidAlpha: true };
    };
  }

  private alphaSpaceValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z\s]+$/.test(control.value);
      return valid ? null : { invalidAlphaSpace: true };
    };
  }

  onKeyPress(event: KeyboardEvent, field: string) {
    if (field === 'stateCode') {
      const pattern = /[A-Za-z]/;
      if (!pattern.test(event.key)) {
        event.preventDefault();
      }
    } else if (field === 'stateName') {
      const pattern = /[A-Za-z\s]/;
      if (!pattern.test(event.key)) {
        event.preventDefault();
      }
    }
  }

  loadCountries() {
    this.loading = true;
    this.masterService.getAllCountry().subscribe({
      next: (resp: any) => {
        this.countries = resp.data || resp;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading countries:', err);
        this.loading = false;
      }
    });
  }

  getStateById(id: number) {
    this.loading = true;
    this.masterService.getStateById(id).subscribe({
      next: (state: State) => {
        this.stateForm.patchValue({
          stateName: state.stateName,
          stateCode: state.stateCode,
          CountryMasterSid: state.CountryMasterSid,
          region: state.region,
          status: state.status,
          Remarks: state.Remarks 
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading state:', err);
        this.loading = false;
        alert('Failed to load state data');
      }
    });
  }

  onSubmit() {
    if (this.stateForm.invalid) {
      this.markFormGroupTouched(this.stateForm);
      return;
    }

    this.btnDisable = true;
    this.loading = true;
    const payload = this.stateForm.value;

    const operation = this.isEditMode 
      ? this.masterService.updateStateById(this.stateId, payload)
      : this.masterService.createState(payload);

    operation.subscribe({
      next: (resp) => {
        this.loading = false;
        this.btnDisable = false;
        const message = this.isEditMode 
          ? 'State updated successfully!' 
          : 'State created successfully!';
        
        if (this.notifyService?.showSuccess) {
          this.notifyService.showSuccess(message);
        } else {
          alert(message);
        }
        
        const highlightId = this.isEditMode ? this.stateId : resp.data?.StateMasterSid;
        this.router.navigate(['/master/state/list'], {
          queryParams: { highlight: highlightId }
        });
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.btnDisable = false;
        const errorMessage = `Error ${this.isEditMode ? 'updating' : 'creating'} state`;
        
        if (this.notifyService?.showError) {
          this.notifyService.showError(errorMessage + ': ' + (err.error?.message || ''));
        } else {
          alert(errorMessage);
        }
      }
    });
  }

  resetForm() {
    if (this.isEditMode) {
      this.getStateById(this.stateId);
    } else {
      this.stateForm.reset({
        stateName: '',
        stateCode: '',
        CountryMasterSid: null,
        region: '',
        status: 'A',
        Remarks: ''
      });
    }
  }

  goBack() {
    this.router.navigate(['/master/state/list']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}