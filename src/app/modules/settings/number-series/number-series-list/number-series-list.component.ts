import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { SettingsService } from '../../settings.service';

interface NumberSeriesConfig {
  NumberSeriesConfigSid?: number;
  MenuMasterSid: number;
  MenuName: string;
  MenuCode: string;
  configured: boolean;
  preview?: string;
  CompanyFlagRequired?: string;
  BranchFlagRequired?: string;
  DepartmentCodeRequired?: string;
  MonthFlagRequired?: string;
  YearFlagRequired?: string;
  Separator?: string;
  NumberLength?: number;
  ResetOption?: string;
  DepartmentWiseCounter?: string;
  StartingNumber?: number;
}

@Component({
  selector: 'app-number-series-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgbPaginationModule,
    NgxSpinnerModule,
  ],
  templateUrl: './number-series-list.component.html',
  styleUrl: './number-series-list.component.scss',
})
export class NumberSeriesListComponent implements OnInit {
  currentCompany: any;
  currentBranch: any;
  currentYear: any;

  menuList: NumberSeriesConfig[] = [];
  loading = false;

  constructor(
    private settingsService: SettingsService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company')
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch')
    );
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.spinner.show();

    // Load current financial year
    this.settingsService
      .getCurrentFinancialYear(this.currentCompany?.CompanyMasterSid)
      .subscribe({
        next: (resp) => {
          if (resp.status) {
            this.currentYear = resp.data;
          }
        },
        error: (err) => {
          console.error('Error loading financial year', err);
        },
      });

    // Load all menus and existing configurations
    this.loadMenusAndConfigs();
  }

  loadMenusAndConfigs(): void {
    // First get all document-type menus
    this.settingsService.getDocumentMenus().subscribe({
      next: (menus) => {
        // Then get existing configurations
        this.settingsService
          .getNumberSeriesConfigs(
            this.currentCompany?.CompanyMasterSid,
            this.currentBranch?.BranchMasterSid
          )
          .subscribe({
            next: (configResp) => {
              const configs = configResp.status ? configResp.data : [];

              // Merge menus with their configurations
              this.menuList = menus.map((menu) => {
                const config = configs.find(
                  (c) => c.MenuMasterSid === menu.MenuMasterSid
                );
                return {
                  MenuMasterSid: menu.MenuMasterSid,
                  MenuName: menu.MenuName,
                  MenuCode: menu.MenuCode,
                  configured: !!config,
                  NumberSeriesConfigSid: config?.NumberSeriesConfigSid,
                  CompanyFlagRequired: config?.CompanyFlagRequired,
                  BranchFlagRequired: config?.BranchFlagRequired,
                  DepartmentCodeRequired: config?.DepartmentCodeRequired,
                  MonthFlagRequired: config?.MonthFlagRequired,
                  YearFlagRequired: config?.YearFlagRequired,
                  Separator: config?.Separator,
                  NumberLength: config?.NumberLength,
                  ResetOption: config?.ResetOption,
                  DepartmentWiseCounter: config?.DepartmentWiseCounter,
                  StartingNumber: config?.StartingNumber,
                };
              });

              // Load preview for configured items
              this.menuList.forEach((item) => {
                if (item.configured) {
                  this.loadPreview(item);
                }
              });

              this.loading = false;
              this.spinner.hide();
            },
            error: (err) => {
              console.error('Error loading configs', err);
              this.loading = false;
              this.spinner.hide();
            },
          });
      },
      error: (err) => {
        console.error('Error loading menus', err);
        this.loading = false;
        this.spinner.hide();
      },
    });
  }

  loadPreview(item: NumberSeriesConfig): void {
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: item.MenuMasterSid,
    };

    this.settingsService.previewNumberSeries(payload).subscribe({
      next: (resp) => {
        if (resp.status) {
          item.preview = resp.data.preview;
        }
      },
      error: (err) => {
        console.error('Error loading preview', err);
      },
    });
  }

  editConfig(item: NumberSeriesConfig): void {
    this.router.navigate([
      '/settings/number-series/entry',
      item.MenuMasterSid,
    ]);
  }

  getFormatSummary(item: NumberSeriesConfig): string {
    if (!item.configured) return '-';

    const parts: string[] = [];
    if (item.CompanyFlagRequired === 'Y') parts.push('Company');
    if (item.BranchFlagRequired === 'Y') parts.push('Branch');
    if (item.DepartmentCodeRequired === 'Y') parts.push('Dept');
    if (item.MonthFlagRequired === 'Y') parts.push('Month');
    if (item.YearFlagRequired === 'Y') parts.push('Year');
    parts.push('Seq');

    let summary = parts.join(item.Separator || '/');

    // Show starting number if not 1
    if (item.StartingNumber && item.StartingNumber > 1) {
      summary += ` (Starts: ${item.StartingNumber})`;
    }

    return summary;
  }

  getResetLabel(item: NumberSeriesConfig): string {
    if (!item.configured) return '-';
    switch (item.ResetOption) {
      case 'Monthly':
        return 'Monthly';
      case 'Yearly':
        return 'Financial Year';
      default:
        return 'Never';
    }
  }

  refreshData(): void {
    this.loadData();
  }
}
