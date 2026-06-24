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
  MenuDisplay?: string;
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
  allMenus: MenuOption[] = [];
  // Stable array reference for the create dropdown — recomputed only when the
  // menu list or existing rows change. Must NOT be a getter: ng-select breaks
  // mouse selection if [items] returns a new array on every change detection.
  availableMenus: MenuOption[] = [];

  currentCompany: any;
  currentBranch: any;

  configRows: UserMenuConfigRow[] = [];
  isLoading = false;
  isSaving = false;

  // Create-new-configuration form state
  showCreateForm = false;
  newMenuSid: number | null = null;
  newUserSid: number | null = null;

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
    this.loadAllMenus();
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

  // Load the full menu list (used by the "Create" configuration dropdown).
  private loadAllMenus(): void {
    this.masterService
      .getAllMenus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list: any[]) => {
          this.allMenus = Array.isArray(list)
            ? list.map((m: any) => ({
              MenuMasterSid: m.MenuMasterSid,
              MenuCode: m.MenuCode,
              MenuName: m.MenuName,
              MenuDisplay: m.MenuCode ? `${m.MenuName} (${m.MenuCode})` : m.MenuName,
            }))
            : [];
          this.computeAvailableMenus();
        },
        error: () => {
          this.allMenus = [];
          this.appSettingService.showError('Failed to load menus.');
        },
      });
  }

  // Recompute the menus not yet present in the current rows (duplicate guard by
  // MenuMasterSid). Builds a fresh array intentionally — assigned to a stable
  // field so the reference only changes when this is explicitly called.
  private computeAvailableMenus(): void {
    const existingSids = new Set(
      this.configRows.map((r) => Number(r.MenuMasterSid)).filter((sid) => sid > 0)
    );
    this.availableMenus = this.allMenus.filter(
      (m) => !existingSids.has(Number(m.MenuMasterSid))
    );
  }

  openCreateForm(): void {
    this.computeAvailableMenus();
    this.showCreateForm = true;
    this.newMenuSid = null;
    this.newUserSid = null;
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.newMenuSid = null;
    this.newUserSid = null;
  }

  addConfiguration(): void {
    if (!this.selectedBranchSid) {
      this.appSettingService.showError('Please select a branch first.');
      return;
    }
    if (!this.newMenuSid) {
      this.appSettingService.showError('Please select a menu.');
      return;
    }

    // Duplicate check on MenuMasterSid against the existing rows.
    const isDuplicate = this.configRows.some(
      (r) => Number(r.MenuMasterSid) === Number(this.newMenuSid)
    );
    if (isDuplicate) {
      this.appSettingService.showError('A configuration for this menu already exists.');
      return;
    }

    const menu = this.allMenus.find(
      (m) => Number(m.MenuMasterSid) === Number(this.newMenuSid)
    );
    if (!menu) {
      this.appSettingService.showError('Selected menu was not found.');
      return;
    }

    const user = this.users.find(
      (u) => Number(u.UserMasterSid) === Number(this.newUserSid)
    );

    // Append a new dirty row; the existing Save Configuration flow persists it.
    this.configRows = [
      ...this.configRows,
      {
        MenuMasterSid: menu.MenuMasterSid,
        MenuCode: menu.MenuCode,
        MenuName: menu.MenuName,
        UserMasterSid: user?.UserMasterSid ?? null,
        userName: user?.userName || '',
        ResourceConfigurationSid: undefined,
        dirty: true,
      },
    ];

    this.computeAvailableMenus();
    this.cancelCreate();
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
    const matchedConfigSids = new Set<number>();
    const matchedConfigKeys = new Set<string>();

    const rows = this.menus.map((m) => {
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

      if (existing?.ResourceConfigurationSid != null) {
        matchedConfigSids.add(Number(existing.ResourceConfigurationSid));
      } else if (existing?.stage) {
        matchedConfigKeys.add(String(existing.stage));
      }

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

    const configOnlyRows = existingConfigs
      .filter((c: any) => {
        const branchMatches = Number(c.BranchMasterSid) === Number(this.selectedBranchSid);
        if (!branchMatches) return false;
        if (c.ResourceConfigurationSid != null) {
          return !matchedConfigSids.has(Number(c.ResourceConfigurationSid));
        }
        return c.stage && !matchedConfigKeys.has(String(c.stage));
      })
      .map((c: any) => ({
        MenuMasterSid: c.MenuMasterSid ?? 0,
        MenuCode: c.MenuCode || c.stage || '',
        MenuName: c.MenuName || c.stage || '',
        UserMasterSid: c.UserMasterSid ?? null,
        userName: c.userName || '',
        ResourceConfigurationSid: c.ResourceConfigurationSid,
        dirty: false,
      }));

    this.configRows = [...rows, ...configOnlyRows];
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
