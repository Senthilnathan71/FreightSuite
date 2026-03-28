import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import { EmailModuleService } from '../../email.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MailBodyModalComponent } from '../mail-body-modal/mail-body-modal.component';
import { MailSubjectModalComponent } from '../mail-subject-modal/mail-subject-modal.component';
import { PlaceholderAutocompleteDirective } from 'src/app/core/Directives/placeholder-autocomplete.directive';
import { ALL_PLACEHOLDERS } from '../../mail-placeholder.constants';

interface MailConfigRow {
  MailConfigurationMasterSid?: number;
  Sno: number;
  MailName: string;
  MenuMasterSid: number | null;
  MailSubject: string;
  MailBody: string;
  ToEmailidFrom: string;
  CcEmailidFrom: string;
  AttachmentRequire: string;
  Action: string;
  Trigger: string;
  AutoPopup: string;
  Status: string;
  UpdateFields?: string;
  selectedActions: string[];
  selectedUpdateFields: string[];
  isEditing: boolean;
  isNew: boolean;
}

@Component({
  selector: 'app-mail-configuration-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    FeatherModule,
    NgxSpinnerModule,
    PlaceholderAutocompleteDirective
  ],
  templateUrl: './mail-configuration-entry.component.html',
  styleUrl: './mail-configuration-entry.component.scss'
})
export class MailConfigurationEntryComponent implements OnInit {
  mailConfigForm!: FormGroup;
  currentCompany: any;
  userData: any;
  menuList: any[] = [];

  rows: MailConfigRow[] = [];

  editingIndex: number | null = null;
  editingSnapshot: MailConfigRow | null = null;
  editingRow: MailConfigRow | null = null;

  statusOptions = [
    { value: 'A', label: 'Active' },
    { value: 'I', label: 'Inactive' }
  ];

  @ViewChild('detailFormSection') detailFormSection!: ElementRef;

  attachmentOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  triggerOptions = [
    { value: 'A', label: 'Auto' },
    { value: 'M', label: 'Manual' }
  ];

  autoPopupOptions = [
    { value: 'A', label: 'Auto' },
    { value: 'P', label: 'Popup' }
  ];

  actionOptions = [
    { value: 'CREATE', label: 'Create' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'SendSIMail', label: 'Send SI Mail' }
  ];

  updateFieldOptions = ALL_PLACEHOLDERS.map(p => ({ key: p.key, label: p.label }));

  constructor(
    private fb: FormBuilder,
    private emailService: EmailModuleService,
    private settingsService: SettingsService,
    private appSettingService: AppSettingsService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private ngbModal: NgbModal
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    this.userData = this.appSettingService.getDecryptedUserProfile();

    this.loadMenuList();
    this.loadExistingData();
  }

  private loadMenuList(): void {
    this.settingsService.getAllMenu().subscribe({
      next: (menus) => {
        this.menuList = menus || [];
      },
      error: (err) => {
        this.appSettingService.showError('Error loading menu list.');
        console.error('Error loading menus:', err);
      }
    });
  }

  private loadExistingData(): void {
    if (!this.currentCompany?.CompanyMasterSid) return;

    this.spinner.show();
    this.emailService.getAllByCompany(this.currentCompany.CompanyMasterSid).subscribe({
      next: (resp) => {
        this.spinner.hide();
        if (resp.status && resp.data) {
          this.rows = resp.data.map((item: any) => {
            const actionStr = item.Action || '';
            const selectedActions = actionStr ? actionStr.split(',').map((a: string) => a.trim()).filter((a: string) => a) : [];
            const updateFieldsStr = item.UpdateFields || '';
            const selectedUpdateFields = updateFieldsStr ? updateFieldsStr.split(',').map((f: string) => f.trim()).filter((f: string) => f) : [];
            return {
              MailConfigurationMasterSid: item.MailConfigurationMasterSid,
              Sno: Number(item.Sno),
              MailName: item.MailName,
              MenuMasterSid: item.MenuMasterSid,
              MailSubject: item.MailSubject,
              MailBody: item.MailBody,
              ToEmailidFrom: item.ToEmailidFrom || '',
              CcEmailidFrom: item.CcEmailidFrom || '',
              AttachmentRequire: item.AttachmentRequire,
              Action: actionStr,
              Trigger: item.Trigger || 'A',
              AutoPopup: item.AutoPopup,
              Status: item.Status,
              UpdateFields: updateFieldsStr,
              selectedActions,
              selectedUpdateFields,
              isEditing: false,
              isNew: false
            };
          });
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Error loading data:', err);
      }
    });
  }

  private readonly defaultMailSubjects: { [key: string]: string } = {
    'Enquiry': 'Enquiry Received | No: {{EnquiryNo}} | Date: {{date}} | {{POO}} -> {{POD}}',
    'Quotation': 'Quotation Ready | No: {{quotationNumber}} | Date: {{date}} | {{POO}} -> {{POD}}',
    'Booking': 'Booking Confirmed | No: {{BookingNo}} | Date: {{date}} | {{POO}} -> {{POD}}',
  };

  private readonly defaultMailSubject = 'Notification | {{date}} | {{POO}} -> {{POD}}';

  getDefaultMailSubject(menuName: string): string {
    return this.defaultMailSubjects[menuName] || this.defaultMailSubject;
  }

  private readonly defaultMailBodies: { [key: string]: string } = {
    'Quotation': `Dear Sir/Madam,\n\nPlease find enclosed the quotation as requested.\nKindly review the details at your convenience.\nLooking forward to your feedback and the opportunity to work together.\n{{approvalLink}}\n\nBest Regards,\n\n{{userName}}`,
    'Enquiry': `Dear Sir/Madam,\n\nThank you for your enquiry. Please find the details below.\nKindly review and let us know if you need any further information.\n\nBest Regards,\n\n{{userName}}`,
    'Booking': `Dear Sir/Madam,\n\nPlease find the booking confirmation details below.\nKindly review the details at your convenience.\n\nBest Regards,\n\n{{userName}}`,
  };

  private readonly defaultMailBody = `Dear Sir/Madam,\n\nPlease find the details as requested.\nKindly review at your convenience.\n\nBest Regards,\n\n{{userName}}`;

  getDefaultMailBody(menuName: string): string {
    return this.defaultMailBodies[menuName] || this.defaultMailBody;
  }

  scrollToDetailForm(): void {
    setTimeout(() => {
      this.detailFormSection?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  getTriggerLabel(value: string): string {
    return value === 'A' ? 'Auto' : 'Manual';
  }

  getStatusLabel(value: string): string {
    return value === 'A' ? 'Active' : 'Inactive';
  }

  addRow(): void {
    /* OLD UI addRow() body:
    const newSno = this.rows.length > 0 ? Math.max(...this.rows.map(r => r.Sno)) + 1 : 1;
    this.rows.push({
      Sno: newSno, MailName: '', MenuMasterSid: null, MailSubject: '', MailBody: '',
      ToEmailidFrom: '{{menuEmail}}', CcEmailidFrom: '{{organizationEmail}}, {{userEmail}}',
      AttachmentRequire: 'Y', Action: '', Trigger: 'A', AutoPopup: 'A', Status: 'A',
      isEditing: true, isNew: true
    });
    */

    if (this.editingIndex !== null) {
      this.appSettingService.showWarning('Please save or cancel the current edit before adding a new row.');
      return;
    }

    const newSno = this.rows.length > 0 ? Math.max(...this.rows.map(r => r.Sno)) + 1 : 1;

    this.rows.push({
      Sno: newSno,
      MailName: '',
      MenuMasterSid: null,
      MailSubject: '',
      MailBody: '',
      ToEmailidFrom: '{{menuEmail}}',
      CcEmailidFrom: '{{organizationEmail}}, {{userEmail}}',
      AttachmentRequire: 'Y',
      Action: '',
      Trigger: 'A',
      AutoPopup: 'A',
      Status: 'A',
      UpdateFields: '',
      selectedActions: [],
      selectedUpdateFields: [],
      isEditing: true,
      isNew: true
    });

    this.editingIndex = this.rows.length - 1;
    this.editingRow = this.rows[this.editingIndex];
    this.editingSnapshot = null;
    this.scrollToDetailForm();
  }

  onMenuChange(row: MailConfigRow, menuMasterSid: number | null): void {
    row.MenuMasterSid = menuMasterSid;
    if (!menuMasterSid) return;

    const menuName = this.getMenuName(menuMasterSid);
    // Only auto-fill MailBody if it's empty or still matches a default template
    const isDefaultBody = !row.MailBody ||
      row.MailBody === this.defaultMailBody ||
      Object.values(this.defaultMailBodies).includes(row.MailBody);

    if (isDefaultBody) {
      row.MailBody = this.getDefaultMailBody(menuName);
    }

    const isDefaultSubject = !row.MailSubject ||
      row.MailSubject === this.defaultMailSubject ||
      Object.values(this.defaultMailSubjects).includes(row.MailSubject);

    if (isDefaultSubject) {
      row.MailSubject = this.getDefaultMailSubject(menuName);
    }
  }

  editRow(index: number): void {
    /* OLD UI editRow() body:
    this.rows[index].isEditing = true;
    */

    if (this.editingIndex !== null && this.editingIndex !== index) {
      this.appSettingService.showWarning('Please save or cancel the current edit first.');
      return;
    }

    this.editingSnapshot = { ...this.rows[index] };
    this.editingIndex = index;
    this.editingRow = this.rows[index];
    this.rows[index].isEditing = true;
    this.scrollToDetailForm();
  }

  cancelEdit(index: number): void {
    /* OLD UI cancelEdit() body:
    if (this.rows[index].isNew) {
      this.rows.splice(index, 1);
    } else {
      this.loadExistingData();
    }
    */

    if (this.rows[index].isNew) {
      this.rows.splice(index, 1);
    } else if (this.editingSnapshot) {
      this.rows[index] = { ...this.editingSnapshot };
      this.rows[index].isEditing = false;
    }

    this.editingIndex = null;
    this.editingRow = null;
    this.editingSnapshot = null;
  }

  saveRow(index: number): void {
    const row = this.rows[index];

    // Check for duplicate MenuMasterSid + Trigger combination (excluding current row)
    const isDuplicate = this.rows.some((r, idx) =>
      idx !== index &&
      r.MenuMasterSid === row.MenuMasterSid &&
      r.Trigger === row.Trigger
    );
    if (isDuplicate) {
      this.appSettingService.showWarning('A mail configuration already exists for this menu with the same trigger.');
      return;
    }

    // Validation
    if (!row.Sno || !row.MailName || !row.MenuMasterSid || !row.MailSubject || !row.MailBody) {
      this.appSettingService.showWarning('Please fill all required fields (Sno, Mail Name, Menu, Subject, Body).');
      return;
    }

    // Sync selectedActions back to Action CSV
    row.Action = (row.selectedActions || []).join(',');
    row.UpdateFields = (row.selectedUpdateFields || []).join(',');

    const payload: any = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      Sno: row.Sno,
      MailName: row.MailName,
      MenuMasterSid: row.MenuMasterSid,
      MailSubject: row.MailSubject,
      MailBody: row.MailBody,
      ToEmailidFrom: row.ToEmailidFrom || '',
      CcEmailidFrom: row.CcEmailidFrom || '',
      AttachmentRequire: row.AttachmentRequire,
      Action: row.Action,
      Trigger: row.Trigger,
      AutoPopup: row.AutoPopup,
      Status: row.Status,
      UpdateFields: row.UpdateFields || ''
    };

    this.spinner.show();

    if (row.isNew) {
      this.emailService.createMailConfiguration(payload).subscribe({
        next: (resp) => {
          this.spinner.hide();
          if (resp.status) {
            this.appSettingService.showSuccess('Mail configuration saved successfully.');
            row.MailConfigurationMasterSid = resp.data.MailConfigurationMasterSid;
            row.isEditing = false;
            row.isNew = false;
            this.editingIndex = null;
            this.editingRow = null;
            this.editingSnapshot = null;
          } else {
            this.appSettingService.showError(resp.message || 'Error saving mail configuration.');
          }
        },
        error: (err) => {
          this.spinner.hide();
          this.appSettingService.showError('Error saving mail configuration.');
          console.error('Save error:', err);
        }
      });
    } else {
      this.emailService.updateMailConfiguration(row.MailConfigurationMasterSid!, payload).subscribe({
        next: (resp) => {
          this.spinner.hide();
          if (resp.status) {
            this.appSettingService.showSuccess('Mail configuration updated successfully.');
            row.isEditing = false;
            this.editingIndex = null;
            this.editingRow = null;
            this.editingSnapshot = null;
          } else {
            this.appSettingService.showError(resp.message || 'Error updating mail configuration.');
          }
        },
        error: (err) => {
          this.spinner.hide();
          this.appSettingService.showError('Error updating mail configuration.');
          console.error('Update error:', err);
        }
      });
    }
  }

  deleteRow(index: number): void {
    const row = this.rows[index];

    if (row.isNew) {
      this.rows.splice(index, 1);
      if (this.editingIndex === index) {
        this.editingIndex = null;
        this.editingRow = null;
        this.editingSnapshot = null;
      }
      return;
    }

    if (!confirm('Are you sure you want to delete this mail configuration?')) {
      return;
    }

    this.spinner.show();
    this.emailService.deleteMailConfiguration(row.MailConfigurationMasterSid!).subscribe({
      next: (resp) => {
        this.spinner.hide();
        if (resp.status) {
          this.appSettingService.showSuccess('Mail configuration deleted successfully.');
          if (this.editingIndex === index) {
            this.editingIndex = null;
            this.editingRow = null;
            this.editingSnapshot = null;
          } else if (this.editingIndex !== null && this.editingIndex > index) {
            this.editingIndex--;
            this.editingRow = this.rows[this.editingIndex];
          }
          this.rows.splice(index, 1);
        } else {
          this.appSettingService.showError(resp.message || 'Error deleting mail configuration.');
        }
      },
      error: (err) => {
        this.spinner.hide();
        this.appSettingService.showError('Error deleting mail configuration.');
        console.error('Delete error:', err);
      }
    });
  }

  onTriggerChange(row: MailConfigRow): void {
    if (row.Trigger === 'A') {
      row.AutoPopup = 'A';
    }
  }

  onActionChange(row: MailConfigRow): void {
    row.Action = (row.selectedActions || []).join(',');
    if (!row.selectedActions?.includes('UPDATE')) {
      row.selectedUpdateFields = [];
      row.UpdateFields = '';
    }
  }

  onUpdateFieldsChange(row: MailConfigRow): void {
    row.UpdateFields = (row.selectedUpdateFields || []).join(',');
  }

  getMenuName(menuMasterSid: number | null): string {
    if (!menuMasterSid) return '';
    const menu = this.menuList.find(m => m.MenuMasterSid === menuMasterSid);
    return menu?.MenuName || '';
  }

  openMailSubjectModal(row: MailConfigRow): void {
    const modalRef = this.ngbModal.open(MailSubjectModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.mailSubject = row.MailSubject;
    modalRef.result.then((result: string) => {
      row.MailSubject = result;
    }).catch(() => {});
  }

  openMailBodyModal(row: MailConfigRow): void {
    const modalRef = this.ngbModal.open(MailBodyModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.mailBody = row.MailBody;
    modalRef.result.then((result: string) => {
      row.MailBody = result;
    }).catch(() => {});
  }

  navigateBack(): void {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    const salespersonFlag = String(userProfile?.isSalesperson || '').toUpperCase();

    if (salespersonFlag === '1' || salespersonFlag === 'Y') {
      this.router.navigate(['/dashboard/sales']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  get activeCount(): number {
    return (this.rows?.filter(r => r.Status === 'A')?.length) || 0;
  }

  get manualTriggerCount(): number {
    return (this.rows?.filter(r => r.Trigger === 'M')?.length) || 0;
  }
}
