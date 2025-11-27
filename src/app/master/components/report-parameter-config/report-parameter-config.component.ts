import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService, ReportCard, ReportParameter } from '../../../shared/services/report.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-report-parameter-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './report-parameter-config.component.html',
  styleUrls: ['./report-parameter-config.component.scss']
})
export class ReportParameterConfigComponent implements OnInit {
  reportId!: number;
  report: ReportCard | null = null;
  parameters: ReportParameter[] = [];

  parameterForm!: FormGroup;
  showForm = false;
  editingParameter: ReportParameter | null = null;

  loading = false;
  saving = false;

  fieldTypes = [
    { value: 'DATE', label: 'Date' },
    { value: 'DROPDOWN', label: 'Dropdown' },
    { value: 'NUMBER', label: 'Number' },
    { value: 'TEXT', label: 'Text' },
    { value: 'YEAR', label: 'Year' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadReport();
  }

  /**
   * Build parameter form
   */
  buildForm(): void {
    this.parameterForm = this.fb.group({
      ParameterName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      ParameterDisplayName: ['', Validators.required],
      ParameterFieldType: ['DATE', Validators.required],
      DropDownValue: [''],
      ParameterQuery: [''],
      IsMandatory: [true],
      Status: ['A']
    });

    // Watch field type changes to show/hide dropdown config
    this.parameterForm.get('ParameterFieldType')?.valueChanges.subscribe(value => {
      if (value === 'DROPDOWN') {
        this.parameterForm.get('DropDownValue')?.setValidators(Validators.required);
        this.parameterForm.get('ParameterQuery')?.setValidators(Validators.required);
      } else {
        this.parameterForm.get('DropDownValue')?.clearValidators();
        this.parameterForm.get('ParameterQuery')?.clearValidators();
      }
      this.parameterForm.get('DropDownValue')?.updateValueAndValidity();
      this.parameterForm.get('ParameterQuery')?.updateValueAndValidity();
    });
  }

  /**
   * Load report and its parameters
   */
  loadReport(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      alert('Invalid report ID');
      this.goBack();
      return;
    }

    this.reportId = parseInt(id, 10);
    this.loading = true;

    this.reportService.getReportById(this.reportId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (report) => {
          this.report = report;
          this.loadParameters();
        },
        error: (error) => {
          console.error('Error loading report:', error);
          alert('Failed to load report. Please try again.');
          this.goBack();
        }
      });
  }

  /**
   * Load parameters for the report
   */
  loadParameters(): void {
    this.reportService.getReportParametersById(this.reportId).subscribe({
      next: (parameters) => {
        this.parameters = parameters;
      },
      error: (error) => {
        console.error('Error loading parameters:', error);
      }
    });
  }

  /**
   * Show add parameter form
   */
  showAddForm(): void {
    this.editingParameter = null;
    this.parameterForm.reset({
      ParameterFieldType: 'DATE',
      IsMandatory: true,
      Status: 'A'
    });
    this.showForm = true;
  }

  /**
   * Show edit parameter form
   */
  showEditForm(parameter: ReportParameter): void {
    this.editingParameter = parameter;
    this.parameterForm.patchValue({
      ParameterName: parameter.ParameterName,
      ParameterDisplayName: parameter.ParameterDisplayName,
      ParameterFieldType: parameter.ParameterFieldType,
      DropDownValue: parameter.DropDownValue ? JSON.stringify(parameter.DropDownValue) : '',
      ParameterQuery: parameter.ParameterQuery || '',
      IsMandatory: parameter.IsMandatory,
      Status: parameter.Status
    });
    this.showForm = true;
  }

  /**
   * Cancel form
   */
  cancelForm(): void {
    this.showForm = false;
    this.editingParameter = null;
    this.parameterForm.reset();
  }

  /**
   * Submit parameter form
   */
  onSubmit(): void {
    if (this.parameterForm.invalid) {
      Object.keys(this.parameterForm.controls).forEach(key => {
        this.parameterForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.parameterForm.value;

    // Parse DropDownValue if it's a string
    let dropDownValue = null;
    if (formValue.DropDownValue) {
      try {
        dropDownValue = JSON.parse(formValue.DropDownValue);
      } catch {
        dropDownValue = formValue.DropDownValue;
      }
    }

    const parameterData = {
      ParameterName: formValue.ParameterName,
      ParameterDisplayName: formValue.ParameterDisplayName,
      ParameterFieldType: formValue.ParameterFieldType,
      DropDownValue: dropDownValue,
      ParameterQuery: formValue.ParameterQuery || null,
      IsMandatory: formValue.IsMandatory,
      Status: formValue.Status,
      ReportMasterSid: this.reportId
    };

    this.saving = true;

    if (this.editingParameter) {
      // Update existing parameter
      this.reportService.updateReportParameter(this.editingParameter.ReportMasterDetailSid, parameterData)
        .pipe(finalize(() => this.saving = false))
        .subscribe({
          next: () => {
            alert('Parameter updated successfully!');
            this.cancelForm();
            this.loadParameters();
          },
          error: (error) => {
            console.error('Error updating parameter:', error);
            alert('Failed to update parameter. Please try again.');
          }
        });
    } else {
      // Create new parameter
      this.reportService.addReportParameter(this.reportId, parameterData)
        .pipe(finalize(() => this.saving = false))
        .subscribe({
          next: () => {
            alert('Parameter added successfully!');
            this.cancelForm();
            this.loadParameters();
          },
          error: (error) => {
            console.error('Error adding parameter:', error);
            alert('Failed to add parameter. Please try again.');
          }
        });
    }
  }

  /**
   * Delete parameter
   */
  deleteParameter(parameter: ReportParameter): void {
    const confirmDelete = confirm(
      `Are you sure you want to delete the parameter "${parameter.ParameterDisplayName}"?`
    );

    if (confirmDelete) {
      this.reportService.deleteReportParameter(parameter.ReportMasterDetailSid).subscribe({
        next: () => {
          alert('Parameter deleted successfully!');
          this.loadParameters();
        },
        error: (error) => {
          console.error('Error deleting parameter:', error);
          alert('Failed to delete parameter. Please try again.');
        }
      });
    }
  }

  /**
   * Navigate back to list
   */
  goBack(): void {
    this.router.navigate(['/master/report-master']);
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string): boolean {
    const control = this.parameterForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Get error message
   */
  getErrorMessage(fieldName: string): string {
    const control = this.parameterForm.get(fieldName);

    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (control?.hasError('pattern')) {
      return 'Only letters, numbers, and underscores are allowed';
    }

    return '';
  }

  /**
   * Get field label
   */
  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      ParameterName: 'Parameter Name',
      ParameterDisplayName: 'Display Name',
      ParameterFieldType: 'Field Type',
      DropDownValue: 'Dropdown Values',
      ParameterQuery: 'Parameter Query',
      IsMandatory: 'Is Mandatory',
      Status: 'Status'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Get badge class for field type
   */
  getFieldTypeBadgeClass(type: string): string {
    switch (type) {
      case 'DATE':
        return 'badge-primary';
      case 'DROPDOWN':
        return 'badge-info';
      case 'NUMBER':
        return 'badge-success';
      case 'TEXT':
        return 'badge-secondary';
      case 'YEAR':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Check if dropdown field type is selected
   */
  isDropdownFieldType(): boolean {
    return this.parameterForm.get('ParameterFieldType')?.value === 'DROPDOWN';
  }
}
