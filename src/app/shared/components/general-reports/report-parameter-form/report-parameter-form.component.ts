import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReportService } from '../../../services/report.service';
import { finalize } from 'rxjs/operators';

export interface ReportParameter {
  ReportMasterDetailSid: number;
  ParameterName: string;
  ParameterFieldType: string;
  DropDownValue?: any[];
  ParameterQuery?: string;
  Status: string;
}

@Component({
  selector: 'app-report-parameter-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './report-parameter-form.component.html',
  styleUrls: ['./report-parameter-form.component.scss']
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

  buildForm(): void {
    const group: any = {};

    this.parameters.forEach(param => {
      const validators = [];

      // Add required validator for most fields
      if (param.ParameterFieldType !== 'TEXT') {
        validators.push(Validators.required);
      }

      group[param.ParameterName] = [null, validators];

      // Load dropdown data
      if (param.ParameterFieldType === 'DROPDOWN') {
        if (param.DropDownValue) {
          // Static dropdown
          this.dropdownData.set(param.ParameterName, param.DropDownValue);
        } else if (param.ParameterQuery) {
          // Dynamic dropdown - load via API
          this.loadDynamicDropdown(param);
        }
      }
    });

    this.parameterForm = this.fb.group(group);
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
