import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReportService } from '../../../services/report.service';
import { finalize } from 'rxjs/operators';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';

export interface ReportParameter {
  ReportMasterDetailSid: number;
  ParameterName: string;
  ParameterFieldType: string;
  DropDownValue?: any[];
  ParameterQuery?: string;
  DefaultValue ?: any;
  ValidationRules ?: string;
  Status: string;
}

@Component({
  selector: 'app-report-parameter-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    NgSelectModule,
    MultiSelectComponent, 
    NgbDatepickerModule
  ],
  templateUrl: './report-parameter-form.component.html',
  styleUrls: ['./report-parameter-form.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }
  ],
})
export class ReportParameterFormComponent implements OnInit, OnChanges {
  @Input() parameters: ReportParameter[] = [];
  @Input() loading: boolean = false;
  @Input() module: 'accounts' | 'operation' = 'accounts';
  @Input() companyId!: number;
  @Output() onGenerate = new EventEmitter<any>();
  @Output() onReset = new EventEmitter<void>();

  parameterForm!: FormGroup;
  dropdownData: Map<string, any[]> = new Map();
  loadingDropdowns: Map<string, boolean> = new Map();
  minDates: Map<string, any> = new Map();
  maxDates: Map<string, any> = new Map();

  readonly FIELD_TYPES = {
    TEXT: 'TEXT',
    NUMBER: 'NUMBER',
    DATE: 'DATE',
    EMAIL: 'EMAIL',
    TEXTAREA: 'TEXTAREA',
    DROPDOWN: 'DROPDOWN',
    DROPDOWN_M: 'DROPDOWN M',
    CHECKBOX: 'CHECKBOX',
    RADIO: 'RADIO',
    FILE: 'FILE',
    URL: 'URL',
    PHONE: 'PHONE'
  };

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['parameters'] && !changes['parameters'].firstChange) {
      this.buildForm();
    }
  }

   /**
   * Build dynamic form
   */
  buildForm(): void {
    const group: any = {};

    const today = new Date();

    this.parameters.forEach(param => {
      console.log(param);
      const validators = this.buildValidators(param);

      group[param.ParameterName] = [
        this.getDefaultValue(param),
        validators
      ];

      if (param.ParameterFieldType === this.FIELD_TYPES.DROPDOWN ||
          param.ParameterFieldType === this.FIELD_TYPES.DROPDOWN_M) {
        this.loadDynamicDropdown(param);
      }
    });

    this.parameterForm = this.fb.group(group);
  }

    /**
   * Build validators without ValidationService
   */
  private buildValidators(param: ReportParameter): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    // Required
    const rules = typeof param.ValidationRules === 'string'
    ? JSON.parse(param.ValidationRules)
    : param.ValidationRules;
    console.log("Received Validation Rules", rules);

    if (rules?.required) validators.push(Validators.required);
    if (rules?.minLength) validators.push(Validators.minLength(rules.minLength));
    if (rules?.maxLength) validators.push(Validators.maxLength(rules.maxLength));
    if (rules?.min != null) validators.push(Validators.min(rules.min));
    if (rules?.max != null) validators.push(Validators.max(rules.max));
    if (rules?.pattern) validators.push(Validators.pattern(rules.pattern));
    if(rules?.minDate) 
      this.minDates.set(param.ParameterName, new Date(rules.minDate));
    if(rules?.maxDate) 
      this.maxDates.set(param.ParameterName, new Date(rules.maxDate));

    // Field-specific
    switch (param.ParameterFieldType) {
      case this.FIELD_TYPES.EMAIL:
        validators.push(Validators.email);
        break;
      case this.FIELD_TYPES.URL:
        validators.push(this.urlValidator());
        break;
      case this.FIELD_TYPES.PHONE:
        validators.push(this.phoneValidator());
        break;
      case this.FIELD_TYPES.NUMBER:
        validators.push(this.numberValidator());
        break;
    }

    return validators;
  }

   /** Simple Validators */

  private urlValidator(): ValidatorFn {
    return (control) => {
      if (!control.value) return null;
      try {
        new URL(control.value);
        return null;
      } catch {
        return { invalidUrl: true };
      }
    };
  }

  private phoneValidator(): ValidatorFn {
    return (control) => {
      if (!control.value) return null;
      const regex = /^[0-9+\-\s()]+$/;
      return regex.test(control.value) ? null : { invalidPhone: true };
    };
  }

  private numberValidator(): ValidatorFn {
    return (control) => {
      if (!control.value) return null;
      return isNaN(Number(control.value)) ? { invalidNumber: true } : null;
    };
  }

  /**
   * Get default values
   */
  private getDefaultValue(param: ReportParameter) {
    if (param.ParameterFieldType === this.FIELD_TYPES.CHECKBOX)
      return param.DefaultValue === 'true';

    if (param.ParameterFieldType === this.FIELD_TYPES.DROPDOWN_M)
      return param.DefaultValue ? param.DefaultValue.split(',') : [];

    if (param.ParameterFieldType === this.FIELD_TYPES.NUMBER)
      return param.DefaultValue ? Number(param.DefaultValue) : null;

    return param.DefaultValue || null;
  }

  /**
   * Load dynamic dropdown options from API
   */
  private loadDynamicDropdown(param: ReportParameter): void {
    this.loadingDropdowns.set(param.ParameterName, true);

    this.reportService.executeParameterQuery(
      this.module,
      param.ReportMasterDetailSid,
      { companyId: this.companyId }
    ).pipe(
      finalize(() => this.loadingDropdowns.set(param.ParameterName, false))
    ).subscribe({
      next: (options) => {
        this.dropdownData.set(param.ParameterName, options);
      },
      error: (error) => {
        console.error(`Failed to load options for ${param.ParameterName}:`, error);
        this.dropdownData.set(param.ParameterName, []);
        // Optionally show error to user
      }
    });
  }

  /**
   * Check if dropdown is currently loading
   */
  isDropdownLoading(paramName: string): boolean {
    return this.loadingDropdowns.get(paramName) || false;
  }

  getParameterLabel(paramName: string): string {
    // Convert camelCase to Title Case with spaces
    return paramName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  getDropdownOptions(paramName: string): any[] {
    return this.dropdownData.get(paramName) || [];
  }

  isFieldRequired(paramName: string): boolean {
    const control = this.parameterForm.get(paramName);
    return control?.hasValidator(Validators.required) || false;
  }

  onSubmit(): void {
    if (this.parameterForm.valid) {
      const formValue = this.parameterForm.value;

      // Format dates to ISO string if they're date objects
      const formattedValue = Object.keys(formValue).reduce((acc, key) => {
        const param = this.parameters.find(p => p.ParameterName === key);
        if (param?.ParameterFieldType === 'DATE' && formValue[key] instanceof Date) {
          acc[key] = formValue[key].toISOString().split('T')[0];
        } else {
          acc[key] = formValue[key];
        }
        return acc;
      }, {} as any);

      this.onGenerate.emit(formattedValue);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.parameterForm.controls).forEach(key => {
        this.parameterForm.get(key)?.markAsTouched();
      });
    }
  }

  resetForm(): void {
    this.parameterForm.reset();
    this.onReset.emit();
  }

  isFormValid(): boolean {
    return this.parameterForm.valid;
  }

  hasError(paramName: string): boolean {
    const control = this.parameterForm.get(paramName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(paramName: string): string {
    const control = this.parameterForm.get(paramName);
    if (control?.hasError('required')) {
      return `${this.getParameterLabel(paramName)} is required`;
    }
    return '';
  }
}
