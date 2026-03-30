import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  ActivityAllocationService,
  MenuUserConfig,
  Stage,
  AllocateUser,
} from '../activity-allocation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

interface BranchOption {
  BranchMasterSid: number;
  BranchName: string;
}

interface ConfigRow {
  stage: Stage;
  stageLabel: string;
  assignedRole: 'CS' | 'Doc' | null;
  UserMasterSid: number | null;
  userName: string;
  MenuUserConfigSid?: number;
  dirty: boolean;
}

@Component({
  selector: 'app-menu-user-config',
  templateUrl: './menu-user-config.component.html',
  styleUrls: ['./menu-user-config.component.scss'],
})
export class MenuUserConfigComponent implements OnInit, OnDestroy {
  branches: BranchOption[] = [];
  selectedBranchSid: number | null = null;

  csUsers: AllocateUser[] = [];
  docUsers: AllocateUser[] = [];

  configRows: ConfigRow[] = [];
  isLoading = false;
  isSaving = false;

  readonly stages: { key: Stage; label: string }[] = [
    { key: 'RateRequest', label: 'Rate Request' },
    { key: 'Quotation', label: 'Quotation' },
    { key: 'Booking', label: 'Booking' },
    { key: 'LoadPlan', label: 'Load Plan' },
    { key: 'MasterJob', label: 'Master Job' },
    { key: 'Job', label: 'Job' },
    { key: 'BL', label: 'BL' },
    { key: 'SI', label: 'SI' },
    { key: 'Invoice', label: 'Invoice' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private activityService: ActivityAllocationService,
    private appSettingService: AppSettingsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadBranches();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBranches(): void {
    const companyInfo = this.appSettingService.getCurrentCompanyInfo();
    if (companyInfo?.CompanyMasterSid) {
      this.activityService
        .getMenuUserConfig()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {},
          error: () => {},
        });
    }

    // Load branches from localStorage or appSettingService
    const branchInfo = this.appSettingService.getCurrentBranchInfo();
    if (branchInfo) {
      this.branches = [
        {
          BranchMasterSid: branchInfo.BranchMasterSid,
          BranchName: branchInfo.BranchName || branchInfo.BranchCode || 'Current Branch',
        },
      ];
      this.selectedBranchSid = branchInfo.BranchMasterSid;
      this.loadConfig();
    }
  }

  private loadUsers(): void {
    this.activityService
      .getCSUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.csUsers = users;
          this.docUsers = users; // Same endpoint, backend can differentiate if needed
        },
        error: () => {
          this.appSettingService.showError('Failed to load users.');
        },
      });
  }

  onBranchChange(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    if (!this.selectedBranchSid) return;

    this.isLoading = true;
    this.activityService
      .getMenuUserConfig(this.selectedBranchSid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (configs) => {
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

  private buildConfigRows(existingConfigs: MenuUserConfig[]): void {
    this.configRows = this.stages.map((s) => {
      const existing = existingConfigs.find(
        (c) => c.stage === s.key && c.BranchMasterSid === this.selectedBranchSid,
      );
      return {
        stage: s.key,
        stageLabel: s.label,
        assignedRole: existing?.assignedRole || null,
        UserMasterSid: existing?.UserMasterSid || null,
        userName: existing?.userName || '',
        MenuUserConfigSid: existing?.MenuUserConfigSid,
        dirty: false,
      };
    });
  }

  getUsersForRole(role: 'CS' | 'Doc' | null): AllocateUser[] {
    if (role === 'CS') return this.csUsers;
    if (role === 'Doc') return this.docUsers;
    return [];
  }

  onRoleChange(row: ConfigRow): void {
    row.UserMasterSid = null;
    row.userName = '';
    row.dirty = true;
  }

  onUserChange(row: ConfigRow, user: AllocateUser | null): void {
    row.UserMasterSid = user?.userSid || null;
    row.userName = user?.userName || '';
    row.dirty = true;
  }

  get hasDirtyRows(): boolean {
    return this.configRows.some((r) => r.dirty);
  }

  saveConfig(): void {
    if (!this.selectedBranchSid) return;

    this.isSaving = true;
    const configs: MenuUserConfig[] = this.configRows.map((r) => ({
      MenuUserConfigSid: r.MenuUserConfigSid,
      BranchMasterSid: this.selectedBranchSid!,
      stage: r.stage,
      assignedRole: r.assignedRole,
      UserMasterSid: r.UserMasterSid || undefined,
      userName: r.userName,
    }));

    this.activityService
      .saveMenuUserConfig(configs)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.configRows.forEach((r) => (r.dirty = false));
          this.appSettingService.showSuccess('Configuration saved successfully.');
        },
        error: () => {
          this.isSaving = false;
          this.appSettingService.showError('Failed to save configuration.');
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/crm/activity-allocation']);
  }
}
