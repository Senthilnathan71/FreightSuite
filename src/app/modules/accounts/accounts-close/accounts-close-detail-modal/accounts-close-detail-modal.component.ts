import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AccountsService } from '../../accounts.service';

@Component({
  selector: 'app-accounts-close-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxSpinnerModule
  ],
  templateUrl: './accounts-close-detail-modal.component.html',
  styleUrl: './accounts-close-detail-modal.component.scss'
})
export class AccountsCloseDetailModalComponent implements OnInit {
  @Input() voucherPeriod: any;
  @Input() isEditMode: boolean = false;

  form: FormGroup;
  yesNoOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private accountsService: AccountsService,
    private spinner: NgxSpinnerService,
    private appSettingsService: AppSettingsService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      GLClosed: [this.voucherPeriod?.GLClosed || 'N'],
      ARClosed: [this.voucherPeriod?.ARClosed || 'N'],
      APClosed: [this.voucherPeriod?.APClosed || 'N'],
      PeriodClosed: [this.voucherPeriod?.PeriodClosed || 'N'],
      GLGraceDays: [this.voucherPeriod?.GLGraceDays || 0],
      ARGraceDays: [this.voucherPeriod?.ARGraceDays || 0],
      APGraceDays: [this.voucherPeriod?.APGraceDays || 0],
      Remarks: [this.voucherPeriod?.Remarks || '']
    });

    if (!this.isEditMode) {
      this.form.disable();
    }
  }

  getDisplayValue(value: string): string {
    return value === 'Y' ? 'Yes' : 'No';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).toUpperCase();
  }

  onSave(): void {
    if (!this.isEditMode) return;

    const payload = {
      ...this.form.value,
      GLGraceDays: Number(this.form.value.GLGraceDays) || 0,
      ARGraceDays: Number(this.form.value.ARGraceDays) || 0,
      APGraceDays: Number(this.form.value.APGraceDays) || 0
    };

    this.spinner.show();
    this.accountsService.updateVoucherPeriod(this.voucherPeriod.VoucherPeriodSid, payload).subscribe({
      next: (response: any) => {
        this.spinner.hide();
        if (response.status) {
          this.appSettingsService.showSuccess('Voucher Period updated successfully.');
          this.activeModal.close('saved');
        } else {
          this.appSettingsService.showError(response.message || 'Failed to update Voucher Period.');
        }
      },
      error: (error) => {
        this.spinner.hide();
        this.appSettingsService.showError('Error updating Voucher Period.');
        console.error('Error updating Voucher Period:', error);
      }
    });
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
