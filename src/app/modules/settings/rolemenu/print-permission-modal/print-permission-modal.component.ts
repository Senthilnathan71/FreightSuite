import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { forkJoin } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { SettingsService } from '../../settings.service';
import { PrintMasterService } from 'src/app/modules/master/print-master/print-master.service';

export interface PrintPermissionRow {
    PrintMasterSid: number;
    Name: string;
    PrintMail: string;
    grantAccess: boolean;
    originalAccess: boolean;
}

@Component({
    selector: 'app-print-permission-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NgxSpinnerModule
    ],
    templateUrl: './print-permission-modal.component.html'
})
export class PrintPermissionModalComponent implements OnInit {
    @Input() menuItem!: {
        RoleMenuDetailSid: number;
        RoleMenuHeaderSid: number;
        CompanyMasterSid: number;
        MenuMasterSid: number;
        MenuName: string;
    };

    rows: PrintPermissionRow[] = [];
    isLoading = false;

    constructor(
        public activeModal: NgbActiveModal,
        private settingsService: SettingsService,
        private printMasterService: PrintMasterService,
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
            printMasters: this.printMasterService.getByMenu(
                this.menuItem.CompanyMasterSid,
                this.menuItem.MenuMasterSid
            ),
            existing: this.settingsService.getRoleMenuPrintPermissions(
                this.menuItem.CompanyMasterSid,
                this.menuItem.RoleMenuDetailSid
            )
        }).subscribe({
            next: ({ printMasters, existing }) => {
                // Returned list contains only explicitly DENIED prints (GiveAccess='N')
                // No record = allowed by default → all checked except denied ones
                const deniedSids = new Set<number>(
                    ((existing as any)?.data || []).map((r: any) => r.PrintMasterSid)
                );
                this.rows = ((printMasters as any)?.data || []).map((pm: any) => ({
                    PrintMasterSid: pm.PrintMasterSid,
                    Name: pm.Name,
                    PrintMail: pm.PrintMail,
                    grantAccess: !deniedSids.has(pm.PrintMasterSid),
                    originalAccess: !deniedSids.has(pm.PrintMasterSid)
                }));
                this.isLoading = false;
                this.spinner.hide();
            },
            error: () => {
                this.isLoading = false;
                this.spinner.hide();
                this.appSettingsService.showError('Failed to load print permissions.');
            }
        });
    }

    onSave(): void {
        const changes = this.rows
            .filter(r => r.grantAccess !== r.originalAccess)
            .map(r => ({ PrintMasterSid: r.PrintMasterSid, grantAccess: r.grantAccess }));

        if (changes.length === 0) {
            this.activeModal.close('no-change');
            return;
        }

        const userData = this.appSettingsService.getDecryptedUserProfile();
        const payload = {
            CompanyMasterSid: this.menuItem.CompanyMasterSid,
            RoleMenuHeaderSid: this.menuItem.RoleMenuHeaderSid,
            RoleMenuDetailSid: this.menuItem.RoleMenuDetailSid,
            changes,
            UpdatedBy: userData?.userEmail || ''
        };

        this.spinner.show();
        this.settingsService.saveRoleMenuPrintPermissions(payload).subscribe({
            next: (resp: any) => {
                this.spinner.hide();
                if (resp.status) {
                    this.appSettingsService.showSuccess('Print permissions saved.');
                    this.activeModal.close('saved');
                } else {
                    this.appSettingsService.showError(resp.message || 'Save failed.');
                }
            },
            error: () => {
                this.spinner.hide();
                this.appSettingsService.showError('Failed to save print permissions.');
            }
        });
    }

    onCancel(): void {
        this.activeModal.dismiss('cancel');
    }

    get hasNoPrints(): boolean {
        return !this.isLoading && this.rows.length === 0;
    }
}
