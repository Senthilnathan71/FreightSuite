import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { forkJoin } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { SettingsService } from '../../settings.service';
import { ReportService } from 'src/app/shared/services/report.service';

export interface ReportPermissionRow {
    ReportMasterSid: number;
    ReportDisplayName: string;
    ReportType: string;
    ReportFormat: string;
    grantAccess: boolean;
    originalAccess: boolean;
}

@Component({
    selector: 'app-report-permission-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, NgxSpinnerModule],
    templateUrl: './report-permission-modal.component.html'
})
export class ReportPermissionModalComponent implements OnInit {
    @Input() menuItem!: {
        RoleMenuDetailSid: number;
        RoleMenuHeaderSid: number;
        CompanyMasterSid: number;
        MenuMasterSid: number;
        MenuName: string;
    };

    rows: ReportPermissionRow[] = [];
    isLoading = false;

    constructor(
        public activeModal: NgbActiveModal,
        private settingsService: SettingsService,
        private reportService: ReportService,
        private appSettingsService: AppSettingsService,
        private spinner: NgxSpinnerService
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    private loadData(): void {
        this.isLoading = true;
        this.spinner.show();

        forkJoin({
            reports: this.reportService.getReportsByMenu(
                this.menuItem.MenuMasterSid,
                this.menuItem.CompanyMasterSid
            ),
            existing: this.settingsService.getRoleMenuReportPermissions(
                this.menuItem.CompanyMasterSid,
                this.menuItem.RoleMenuDetailSid
            )
        }).subscribe({
            next: ({ reports, existing }) => {
                // Records with ReportPermission='N' and Status='A' are explicitly denied
                // No record = allowed by default
                const deniedSids = new Set<number>(
                    ((existing as any)?.data || []).map((r: any) => r.ReportMasterSid)
                );
                this.rows = (reports || []).map((r: any) => ({
                    ReportMasterSid: r.ReportMasterSid,
                    ReportDisplayName: r.ReportDisplayName,
                    ReportType: (r.ReportType || '').trim().toUpperCase(),
                    ReportFormat: (r.ReportFormat || '').trim().toUpperCase(),
                    grantAccess: !deniedSids.has(r.ReportMasterSid),
                    originalAccess: !deniedSids.has(r.ReportMasterSid)
                }));
                this.isLoading = false;
                this.spinner.hide();
            },
            error: () => {
                this.isLoading = false;
                this.spinner.hide();
                this.appSettingsService.showError('Failed to load report permissions.');
            }
        });
    }

    onSave(): void {
        const changes = this.rows
            .filter(r => r.grantAccess !== r.originalAccess)
            .map(r => ({ ReportMasterSid: r.ReportMasterSid, grantAccess: r.grantAccess }));

        if (changes.length === 0) {
            this.activeModal.close('no-change');
            return;
        }

        const userData = this.appSettingsService.getDecryptedUserProfile();
        const payload = {
            RoleMenuDetailSid: this.menuItem.RoleMenuDetailSid,
            changes,
            UpdatedBy: userData?.userEmail || ''
        };

        this.spinner.show();
        this.settingsService.saveRoleMenuReportPermissions(payload).subscribe({
            next: (resp: any) => {
                this.spinner.hide();
                if (resp.status) {
                    this.appSettingsService.showSuccess('Report permissions saved.');
                    this.activeModal.close('saved');
                } else {
                    this.appSettingsService.showError(resp.message || 'Save failed.');
                }
            },
            error: () => {
                this.spinner.hide();
                this.appSettingsService.showError('Failed to save report permissions.');
            }
        });
    }

    onCancel(): void {
        this.activeModal.dismiss('cancel');
    }

    get hasNoReports(): boolean {
        return !this.isLoading && this.rows.length === 0;
    }

    get grantedCount(): number {
        return this.rows.filter(r => r.grantAccess).length;
    }
}
