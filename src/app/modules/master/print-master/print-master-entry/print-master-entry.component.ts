import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { PrintMasterService } from '../print-master.service';

@Component({
    selector: 'app-print-master-entry',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NgSelectModule,
        NgxSpinnerModule
    ],
    templateUrl: './print-master-entry.component.html'
})
export class PrintMasterEntryComponent implements OnInit, OnDestroy {
    form!: FormGroup;
    isEditMode = false;
    printMasterSid!: number;
    isLoading = false;
    menuList: any[] = [];

    readonly printMailOptions = [
        { value: 'Print', label: 'Print' },
        { value: 'Send Mail', label: 'Send Mail' },
        { value: 'Download', label: 'Download' }
    ];

    readonly statusOptions = [
        { value: 'A', label: 'Active' },
        { value: 'S', label: 'Suspended' }
    ];

    currentCompany: any;
    userData: any;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private printMasterService: PrintMasterService,
        private settingsService: SettingsService,
        private appSettingsService: AppSettingsService,
        private spinner: NgxSpinnerService
    ) {}

    ngOnInit(): void {
        this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
        this.userData = this.appSettingsService.getDecryptedUserProfile();
        this.initForm();
        this.loadMenuList();

        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.isEditMode = true;
                this.printMasterSid = Number(id);
                this.loadRecord();
            }
        });
    }

    private initForm(): void {
        this.form = this.fb.group({
            MenuMasterSid: [null, Validators.required],
            Name: ['', [Validators.required, Validators.maxLength(50)]],
            PrintMail: [null, Validators.required],
            Status: [{ value: 'Active', disabled: true }]
        });
    }

    private loadMenuList(): void {
        this.settingsService.getAllModulesWithMenus().subscribe({
            next: (resp: any) => {
                // Flatten the module→menu map into a simple menu list
                const menuMap: Record<string, any[]> = resp.data || {};
                const menus: any[] = [];
                Object.values(menuMap).forEach((moduleMenus: any[]) => {
                    moduleMenus.forEach(m => menus.push(m));
                });
                this.menuList = menus.sort((a, b) =>
                    String(a.MenuName).localeCompare(String(b.MenuName))
                );
            },
            error: () => this.appSettingsService.showError('Failed to load menu list.')
        });
    }

    private loadRecord(): void {
        this.spinner.show();
        this.printMasterService.fetchById(this.printMasterSid).subscribe({
            next: (resp: any) => {
                const d = resp.data;
                this.form.patchValue({
                    MenuMasterSid: d.MenuMasterSid,
                    Name: d.Name,
                    PrintMail: d.PrintMail,
                    Status: d.Status
                });
                // Enable Status in edit mode
                this.form.get('Status')?.enable();
                this.spinner.hide();
            },
            error: () => {
                this.appSettingsService.showError('Failed to load record.');
                this.spinner.hide();
            }
        });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.appSettingsService.showWarning('Please fill all required fields.');
            return;
        }

        const formValue = this.form.getRawValue();
        this.spinner.show();
        this.isLoading = true;

        if (this.isEditMode) {
            const payload = {
                Name: formValue.Name,
                PrintMail: formValue.PrintMail,
                MenuMasterSid: formValue.MenuMasterSid,
                Status: formValue.Status,
                UpdatedBy: this.userData?.userEmail || ''
            };
            this.printMasterService.update(this.printMasterSid, payload).subscribe({
                next: (resp: any) => {
                    this.spinner.hide();
                    this.isLoading = false;
                    if (resp.status) {
                        this.appSettingsService.showSuccess(resp.message || 'Updated successfully.');
                        this.router.navigate(['/master/print-master']);
                    } else {
                        this.appSettingsService.showError(resp.message || 'Update failed.');
                    }
                },
                error: (err: any) => {
                    this.spinner.hide();
                    this.isLoading = false;
                    this.appSettingsService.showError(err.error?.message || 'Update failed.');
                }
            });
        } else {
            const payload = {
                Name: formValue.Name,
                PrintMail: formValue.PrintMail,
                MenuMasterSid: formValue.MenuMasterSid,
                CreatedBy: this.userData?.userEmail || ''
            };
            this.printMasterService.create(payload).subscribe({
                next: (resp: any) => {
                    this.spinner.hide();
                    this.isLoading = false;
                    if (resp.status) {
                        this.appSettingsService.showSuccess(resp.message || 'Created successfully.');
                        this.router.navigate(['/master/print-master']);
                    } else {
                        this.appSettingsService.showError(resp.message || 'Create failed.');
                    }
                },
                error: (err: any) => {
                    this.spinner.hide();
                    this.isLoading = false;
                    this.appSettingsService.showError(err.error?.message || 'Create failed.');
                }
            });
        }
    }

    resetForm(): void {
        if (this.isEditMode) {
            this.loadRecord();
        } else {
            this.form.reset({ Status: 'Active' });
        }
    }

    navigateBack(): void {
        this.router.navigate(['/master/print-master']);
    }

    ngOnDestroy(): void {
        this.spinner.hide();
    }
}
