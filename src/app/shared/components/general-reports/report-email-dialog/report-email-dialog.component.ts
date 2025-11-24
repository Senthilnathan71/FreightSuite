import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

export interface EmailReportData {
  email: string;
  cc?: string;
  subject: string;
  message: string;
  format: 'EXCEL' | 'PDF' | 'CSV';
}

@Component({
  selector: 'app-report-email-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './report-email-dialog.component.html',
  styleUrls: ['./report-email-dialog.component.scss']
})
export class ReportEmailDialogComponent implements OnInit {
  @Input() reportName: string = '';
  @Input() defaultSubject: string = '';
  @Output() onSend = new EventEmitter<EmailReportData>();

  emailForm!: FormGroup;
  sending: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm(): void {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      cc: ['', [Validators.email]],
      subject: [this.defaultSubject || `Report: ${this.reportName}`, [Validators.required]],
      message: [this.getDefaultMessage(), [Validators.required]],
      format: ['PDF', [Validators.required]]
    });
  }

  getDefaultMessage(): string {
    return `Dear Sir/Madam,\n\nPlease find attached the ${this.reportName} for your reference.\n\nBest regards`;
  }

  onSubmit(): void {
    if (this.emailForm.valid) {
      this.sending = true;
      this.onSend.emit(this.emailForm.value);
    } else {
      Object.keys(this.emailForm.controls).forEach(key => {
        this.emailForm.get(key)?.markAsTouched();
      });
    }
  }

  close(): void {
    this.activeModal.dismiss();
  }

  hasError(fieldName: string): boolean {
    const control = this.emailForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(fieldName: string): string {
    const control = this.emailForm.get(fieldName);

    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }

    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: any = {
      email: 'To Email',
      cc: 'CC',
      subject: 'Subject',
      message: 'Message',
      format: 'Format'
    };
    return labels[fieldName] || fieldName;
  }
}
