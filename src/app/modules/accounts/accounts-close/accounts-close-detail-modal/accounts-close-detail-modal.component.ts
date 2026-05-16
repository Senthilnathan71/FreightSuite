import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AccountsService } from '../../accounts.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';

@Component({
  selector: 'app-accounts-close-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    DatePipe,
    NgSelectModule,
    ElementStateGuardDirective,
    FormStateGuardDirective
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

  auditLogs: any[] = [];
  auditLogModalRef!: NgbModalRef;
  isLogLoading: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private accountsService: AccountsService,
    private spinner: NgxSpinnerService,
    private appSettingsService: AppSettingsService,
    private modalService: NgbModal,
    private masterService: MasterService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      GLClosed: [this.voucherPeriod?.GLClosed || 'N'],
      ARClosed: [this.voucherPeriod?.ARClosed || 'N'],
      APClosed: [this.voucherPeriod?.APClosed || 'N'],
      // PeriodClosed: [this.voucherPeriod?.PeriodClosed || 'N'],
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

  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.voucherPeriod?.VoucherPeriodSid) return;
    if (this.isLogLoading) return;

    this.isLogLoading = true;

    this.masterService.getAuditLogsVoucherPeriod(
      'VoucherPeriod',
      this.voucherPeriod.VoucherPeriodSid.toString()
    ).subscribe({
      next: (logs: any[]) => {
        this.isLogLoading = false;
        const ignoredFields = ['updatedOn', 'updatedBy', 'UpdatedOn', 'UpdatedBy'];

        const formatFields = (val: any) => {
          if (!val) return [];
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          if (Object.keys(obj).length === 0) return [];
          return Object.entries(obj)
            .filter(([key]) => !ignoredFields.includes(key))
            .map(([key, value]) => `${key}: ${value ?? 'NA'}`);
        };

        this.auditLogs = logs
          .map(log => ({
            ...log,
            oldValDisplay: formatFields(log.oldVal),
            newValDisplay: formatFields(log.newVal),
          }))
          .filter(log => log.oldValDisplay.length > 0 || log.newValDisplay.length > 0);

        this.auditLogModalRef = this.modalService.open(modal, {
          centered: true,
          scrollable: true,
          windowClass: 'audit-log-modal'
        });
      },
      error: err => {
        this.isLogLoading = false;
        console.error('Error fetching audit logs:', err);
      }
    });
  }
}
