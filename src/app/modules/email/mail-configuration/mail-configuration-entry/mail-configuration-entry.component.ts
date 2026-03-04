import { Component, OnInit } from '@angular/core';
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
import { PlaceholderAutocompleteDirective } from 'src/app/core/Directives/placeholder-autocomplete.directive';

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
          this.rows = resp.data.map((item: any) => ({
            MailConfigurationMasterSid: item.MailConfigurationMasterSid,
            Sno: Number(item.Sno),
            MailName: item.MailName,
            MenuMasterSid: item.MenuMasterSid,
            MailSubject: item.MailSubject,
            MailBody: item.MailBody,
            ToEmailidFrom: item.ToEmailidFrom || '',
            CcEmailidFrom: item.CcEmailidFrom || '',
            AttachmentRequire: item.AttachmentRequire,
            Action: item.Action || '',
            Trigger: item.Trigger || 'A',
            AutoPopup: item.AutoPopup,
            Status: item.Status,
            isEditing: false,
            isNew: false
          }));
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Error loading data:', err);
      }
    });
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

  addRow(): void {
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
      isEditing: true,
      isNew: true
    });
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
  }

  editRow(index: number): void {
    this.rows[index].isEditing = true;
  }

  cancelEdit(index: number): void {
    if (this.rows[index].isNew) {
      this.rows.splice(index, 1);
    } else {
      // Reload the original data for this row
      this.loadExistingData();
    }
  }

  saveRow(index: number): void {
    const row = this.rows[index];

    // Validation
    if (!row.Sno || !row.MailName || !row.MenuMasterSid || !row.MailSubject || !row.MailBody) {
      this.appSettingService.showWarning('Please fill all required fields (Sno, Mail Name, Menu, Subject, Body).');
      return;
    }

    const payload = {
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
      Status: row.Status
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

  getMenuName(menuMasterSid: number | null): string {
    if (!menuMasterSid) return '';
    const menu = this.menuList.find(m => m.MenuMasterSid === menuMasterSid);
    return menu?.MenuName || '';
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
    this.router.navigate(['/dashboard']);
  }
}
