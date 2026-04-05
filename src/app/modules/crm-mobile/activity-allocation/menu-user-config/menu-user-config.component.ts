import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Stage } from '../activity-allocation.service';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

interface BranchOption {
  BranchMasterSid: number;
  BranchName: string;
}

interface AllocateUser {
  userSid: number;
  userName: string;
}

interface ConfigRow {
  stage: Stage;
  stageLabel: string;
  assignedRole: 'CS' | 'Doc' | null;
  UserMasterSid: number | null;
  userName: string;
  ResourceConfigurationSid?: number;
  dirty: boolean;
}

@Component({
  selector: 'app-menu-user-config',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
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
    { key: 'RateRequest', label: 'Enquiry' },
    { key: 'Quotation', label: 'Quotation' },
    { key: 'Booking', label: 'Booking' },
    { key: 'LoadPlan', label: 'Load Plan' },
    { key: 'MasterJob', label: 'Master Job' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private settingsService: SettingsService,
    private masterService: MasterService,
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
    const branchInfo = this.appSettingService.getCurrentBranchInfo();
    if (branchInfo) {
      this.branches = [
        {
          BranchMasterSid: branchInfo.BranchMasterSid,
          BranchName: branchInfo.branchName || branchInfo.branchCode || 'Current Branch',
        },
      ];
      this.selectedBranchSid = branchInfo.BranchMasterSid;
      this.loadConfig();
    }
  }

  private loadUsers(): void {
    const companyInfo = this.appSettingService.getCurrentCompanyInfo();
    const companyMasterSid = companyInfo?.CompanyMasterSid;
    if (!companyMasterSid) return;

    this.masterService
      .getAllCS(companyMasterSid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          const users = resp?.data || resp || [];
          this.csUsers = Array.isArray(users)
            ? users.map((u: any) => ({
                userSid: u.UserMasterSid,
                userName: u.userName,
              }))
            : [];
        },
        error: () => {
          this.appSettingService.showError('Failed to load CS users.');
        },
      });

    this.masterService
      .getAllDoc(companyMasterSid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          const users = resp?.data || resp || [];
          this.docUsers = Array.isArray(users)
            ? users.map((u: any) => ({
                userSid: u.UserMasterSid,
                userName: u.userName,
              }))
            : [];
        },
        error: () => {
          this.appSettingService.showError('Failed to load Doc users.');
        },
      });
  }

  onBranchChange(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    if (!this.selectedBranchSid) return;

    const companyInfo = this.appSettingService.getCurrentCompanyInfo();
    const companyMasterSid = companyInfo?.CompanyMasterSid;

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
    this.configRows = this.stages.map((s) => {
      const existing = existingConfigs.find(
        (c: any) => c.stage === s.key && c.BranchMasterSid === this.selectedBranchSid,
      );
      return {
        stage: s.key,
        stageLabel: s.label,
        assignedRole: existing?.assignedRole || null,
        UserMasterSid: existing?.UserMasterSid || null,
        userName: existing?.userName || '',
        ResourceConfigurationSid: existing?.ResourceConfigurationSid,
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
    const configs = this.configRows.map((r) => ({
      ResourceConfigurationSid: r.ResourceConfigurationSid,
      BranchMasterSid: this.selectedBranchSid!,
      stage: r.stage,
      assignedRole: r.assignedRole,
      UserMasterSid: r.UserMasterSid || undefined,
      userName: r.userName,
    }));

    const companyInfo = this.appSettingService.getCurrentCompanyInfo();
    const companyMasterSid = companyInfo?.CompanyMasterSid;

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
    this.router.navigate(['/settings/activity-allocation']);
  }
}
