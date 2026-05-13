import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MasterService } from 'src/app/modules/master/master.service';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

interface BranchOption {
  BranchMasterSid: number;
  BranchName: string;
}

interface UserOption {
  UserMasterSid: number;
  userName: string;
}

interface MenuOption {
  MenuMasterSid: number;
  MenuCode: string;
  MenuName: string;
}

interface UserMenuConfigRow {
  MenuMasterSid: number;
  MenuCode: string;
  MenuName: string;
  UserMasterSid: number | null;
  userName: string;
  ResourceConfigurationSid?: number;
  dirty: boolean;
}

@Component({
  selector: 'app-user-activity-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './user-activity-configuration.component.html',
  styleUrls: ['./user-activity-configuration.component.scss'],
})
export class UserActivityConfigurationComponent implements OnInit, OnDestroy {
  branches: BranchOption[] = [];
  selectedBranchSid: number | null = null;

  users: UserOption[] = [];
  menus: MenuOption[] = [];

  currentCompany: any;
  currentBranch: any;

  configRows: UserMenuConfigRow[] = [];
  isLoading = false;
  isSaving = false;

  private destroy$ = new Subject<void>();

  constructor(
    private masterService: MasterService,
    private settingsService: SettingsService,
    private appSettingService: AppSettingsService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.loadBranches();
    this.loadUsers();
    this.loadMenus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // private loadBranches(): void {
  //   const branchInfo = this.appSettingService.getCurrentBranchInfo();
  //   if (branchInfo) {
  //     this.branches = [
  //       {
  //         BranchMasterSid: branchInfo.BranchMasterSid,
  //         BranchName: branchInfo.branchName || branchInfo.branchCode || 'Current Branch',
  //       },
  //     ];
  //     this.selectedBranchSid = branchInfo.BranchMasterSid;
  //   }
  // }

  private loadBranches(): void {
    const companyMastersID = this.currentCompany?.CompanyMasterSid;
    this.masterService.getCurrentBranch(companyMastersID).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (resp: any) => {
        this.branches = Array.isArray(resp) ? resp : [];
        const currentBranchSid = Number(this.currentBranch?.BranchMasterSid || this.currentBranch?.branchMasterSid);
        if (currentBranchSid) {
          const matchedBranch = this.branches.find(
            (b) => Number(b.BranchMasterSid) === currentBranchSid
          );
          this.selectedBranchSid = matchedBranch?.BranchMasterSid ?? null;
        }
        if (!this.selectedBranchSid && this.branches.length > 0) {
          this.selectedBranchSid = this.branches[0].BranchMasterSid;
        }
        this.loadConfig();
      }
    })
  }

  private loadUsers(): void {
    const companyMastersID = this.currentCompany?.CompanyMasterSid;
    this.masterService
      .getAllSalesmans(companyMastersID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          const list = resp?.data || resp || [];
          this.users = Array.isArray(list)
            ? list.map((u: any) => ({
              UserMasterSid: u.UserMasterSid,
              userName: u.userName,
            }))
            : [];
        },
        error: () => {
          this.appSettingService.showError('Failed to load users.');
        },
      });
  }

  private loadMenus(): void {
    this.isLoading = true;
    this.settingsService
      .getDocumentMenus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list: any[]) => {
          this.menus = Array.isArray(list)
            ? list.map((m: any) => ({
              MenuMasterSid: m.MenuMasterSid,
              MenuCode: m.MenuCode,
              MenuName: m.MenuName,
            }))
            : [];
          this.loadConfig();
        },
        error: () => {
          this.menus = [];
          this.isLoading = false;
          this.appSettingService.showError('Failed to load menus.');
        },
      });
  }

  onBranchChange(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    if (!this.selectedBranchSid) {
      this.buildConfigRows([]);
      return;
    }

    const companyInfo = this.appSettingService.getCurrentCompanyInfo();
    const companyMasterSid = companyInfo?.CompanyMasterSid;
    if (!companyMasterSid) {
      this.buildConfigRows([]);
      return;
    }

    this.isLoading = true;
    this.settingsService
      .getMenuUserConfig(this.selectedBranchSid, companyMasterSid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (configs: any[]) => {
          this.buildConfigRows(configs);
          this.isLoading = false;
        },
        error: () => {
          this.buildConfigRows([]);
          this.isLoading = false;
          this.appSettingService.showError('Failed to load configuration.');
        },
      });
  }

  private buildConfigRows(existingConfigs: any[]): void {
    this.configRows = this.menus.map((m) => {
      const existing = existingConfigs.find((c: any) => {
        const branchMatches = Number(c.BranchMasterSid) === Number(this.selectedBranchSid);
        if (!branchMatches) return false;
        if (c.MenuMasterSid != null && Number(c.MenuMasterSid) === Number(m.MenuMasterSid)) {
          return true;
        }
        if (c.stage && c.stage === m.MenuCode) {
          return true;
        }
        return false;
      });
      return {
        MenuMasterSid: m.MenuMasterSid,
        MenuCode: m.MenuCode,
        MenuName: m.MenuName,
        UserMasterSid: existing?.UserMasterSid ?? null,
        userName: existing?.userName || '',
        ResourceConfigurationSid: existing?.ResourceConfigurationSid,
        dirty: false,
      };
    });
  }

  onUserChange(row: UserMenuConfigRow, user: UserOption | null): void {
    row.UserMasterSid = user?.UserMasterSid ?? null;
    row.userName = user?.userName || '';
    row.dirty = true;
  }

  get hasDirtyRows(): boolean {
    return this.configRows.some((r) => r.dirty);
  }

  saveConfig(): void {
    if (!this.selectedBranchSid) return;

    const companyInfo = this.appSettingService.getCurrentCompanyInfo();
    const companyMasterSid = companyInfo?.CompanyMasterSid;
    if (!companyMasterSid) {
      this.appSettingService.showError('Company context is missing.');
      return;
    }

    this.isSaving = true;
    const configs = this.configRows.map((r) => ({
      ResourceConfigurationSid: r.ResourceConfigurationSid,
      BranchMasterSid: this.selectedBranchSid!,
      MenuMasterSid: r.MenuMasterSid,
      stage: r.MenuCode,
      UserMasterSid: r.UserMasterSid || undefined,
      userName: r.userName,
    }));

    this.settingsService
      .saveMenuUserConfig(configs, companyMasterSid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          this.isSaving = false;
          if (resp?.status === false) {
            this.appSettingService.showError(resp.message || 'Failed to save configuration.');
            return;
          }
          this.configRows.forEach((r) => (r.dirty = false));
          this.appSettingService.showSuccess('Configuration saved successfully.');
        },
        error: (err: any) => {
          this.isSaving = false;
          this.appSettingService.showError(err?.error?.message || 'Failed to save configuration.');
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/master']);
  }
}
