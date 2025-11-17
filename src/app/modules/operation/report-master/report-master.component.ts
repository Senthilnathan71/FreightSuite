import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

type ReportFormat = 'XL' | 'PDF' | 'XML';
type FieldType = 'string' | 'date' | 'number' | 'dropdown' | 'lookup';

interface ReportRow {
  id: number;
  name: string;                    
  moduleId: number;
  formats: ReportFormat[];
  parameters: { name: string; value: string }[];
}

@Component({
  selector: 'app-report-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, NgbDropdownModule],
  templateUrl: './report-master.component.html',
  styleUrls: ['./report-master.component.scss']
})
export class ReportMasterComponent {
  constructor(private fb: FormBuilder, private modal: NgbModal) {}

  
  form: FormGroup = this.fb.group({
    reportName: ['', [Validators.required, Validators.maxLength(120)]],
    displayName: ['', [Validators.required, Validators.maxLength(120)]],
    menuId: ['', Validators.required],
    formats: [<ReportFormat[]>[], Validators.required],
    excludedCompanyIds: [<string[]>[]],
    query: ['', Validators.required],
    parameters: this.fb.array([]),
    Module:[]
  });

  get parameters(): FormArray { return this.form.get('parameters') as FormArray; }
  addParameter() {
    this.parameters.push(
      this.fb.group({
        name: ['', Validators.required],
        fieldType: ['string' as FieldType, Validators.required],
        value: [''],
        lookupKey: ['']
      })
    );
  }
  removeParameter(i: number) { this.parameters.removeAt(i); }

  
  ModeofModules = [
    { id: 1, name: 'Settings' }, { id: 2, name: 'CRM' }, { id: 3, name: 'Master' },
    { id: 4, name: 'Operation' }, { id: 5, name: 'Accounts' }
  ];
  formatsOptions: ReportFormat[] = ['XL', 'PDF', 'XML'];
  companies = [
    { id: 'C01', name: 'Alpha Logistics' }, { id: 'C02', name: 'Beta Freight' }, { id: 'C03', name: 'Gamma Shipping' }
  ];
  menus = [
    { id: 'OPR_REPORTS', name: 'Operation > Reports' },
    { id: 'ACC_REPORTS', name: 'Accounts > Reports' },
    { id: 'CRM_REPORTS', name: 'CRM > Reports' }
  ];

  
  reports: ReportRow[] = [];          
  selectedReportId: number | null = null;

  
  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const f = this.form.value as any;
    const name = this.normalize(f.reportName);
    const display = this.normalize(f.displayName);

    
    this.form.get('reportName')?.setErrors(null);
    this.form.get('displayName')?.setErrors(null);

    
    const exists = this.reports.some(r => {
      const existing = this.normalize(r.name);
      
      return existing === display || existing === name;
    });

    if (exists) {
      alert('A report with this name already exists. Please choose a different Report Name / Display Name.');
      
      this.form.get('reportName')?.setErrors({ duplicate: true });
      this.form.get('displayName')?.setErrors({ duplicate: true });
      return;
    }

    const newId = this.reports.length ? Math.max(...this.reports.map(r => r.id)) + 1 : 1;
    const row = this.toRowFromForm(newId);
    this.reports = [row, ...this.reports];
    this.selectedReportId = newId;
  }

  
  reset() {
    while (this.parameters.length) this.parameters.removeAt(0);
    this.form.reset({
      reportName: '', displayName: '', menuId: '', formats: [], excludedCompanyIds: [], query: ''
    });
    this.selectedReportId = null;
  }

  
  private toRowFromForm(id: number): ReportRow {
    const f = this.form.value as any;
    return {
      id,
      name: (f.displayName || f.reportName || `Report ${id}`).trim(),
      moduleId: 4, 
      formats: f.formats || [],
      parameters: (f.parameters || []).map((p: any) => ({ name: p.name, value: p.value || '' }))
    };
  }

  private normalize(s: string): string { return (s || '').trim().toLowerCase(); }

  
  selectReport(id: number) { this.selectedReportId = id; }
  get selectedReport() { return this.reports.find(r => r.id === this.selectedReportId) ?? null; }
  get selectedReportParameters() { return this.selectedReport?.parameters ?? []; }
  get selectedReportName() { return this.selectedReport?.name ?? ''; }

  @ViewChild('previewModal') previewModal!: TemplateRef<any>;
  openPreviewModal() {
    if (!this.selectedReportId) return;
    this.modal.open(this.previewModal, { centered: true, size: 'xl' });
  }
}
