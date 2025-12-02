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
    NgxSpinnerModule
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
    private spinner: NgxSpinnerService
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

  addRow(): void {
    const newSno = this.rows.length > 0 ? Math.max(...this.rows.map(r => r.Sno)) + 1 : 1;

    this.rows.push({
      Sno: newSno,
      MailName: '',
      MenuMasterSid: null,
      MailSubject: '',
      MailBody: '',
      ToEmailidFrom: '',
      CcEmailidFrom: '',
      AttachmentRequire: 'Y',
      AutoPopup: 'P',
      Status: 'A',
      isEditing: true,
      isNew: true
    });
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

  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
