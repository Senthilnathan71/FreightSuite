import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { SettingsService } from '../../settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface PreviewResult {
  preview: string;
  nextNumber: number;
}

@Component({
  selector: 'app-number-series-entry',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgxSpinnerModule,
  ],
  templateUrl: './number-series-entry.component.html',
  styleUrl: './number-series-entry.component.scss',
})
export class NumberSeriesEntryComponent implements OnInit {
  configForm!: FormGroup;
  currentCompany: any;
  currentBranch: any;
  currentYear: any;
  menuInfo: any;
  config: any;
  menuMasterSid!: number;
  isEditMode = false;
  loading = false;
  btnDisable = false;

  // Dropdown options
  separatorOptions = [
    { value: '/', label: '/ (Slash)' },
    { value: '-', label: '- (Hyphen)' },
    { value: '', label: 'None' },
  ];

  resetOptions = [
    { value: 'None', label: 'Never' },
    { value: 'Monthly', label: 'Monthly' },
    { value: 'Yearly', label: 'Financial Year' },
  ];

  numberLengthOptions = [
    { value: 3, label: '3 digits' },
    { value: 4, label: '4 digits' },
    { value: 5, label: '5 digits' },
    { value: 6, label: '6 digits' },
    { value: 7, label: '7 digits' },
    { value: 8, label: '8 digits' },
  ];

  departmentList: any[] = [];
  portList: any[] = [];

  // Preview
  previewResult: PreviewResult | null = null;
  selectedDepartmentForPreview: number | null = null;
  selectedPOLForPreview: number | null = null;
  selectedPODForPreview: number | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private settingsService: SettingsService,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company')
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch')
    );

    this.initForm();
    this.loadFinancialYear();
    this.loadDepartments();
    this.loadPorts();

    this.route.paramMap.subscribe((params) => {
      const menuId = params.get('menuId');
      if (menuId) {
        this.menuMasterSid = +menuId;
        this.loadMenuInfo();
        this.loadExistingConfig();
      }
    });

    // Subscribe to form changes for live preview
    this.configForm.valueChanges.subscribe(() => {
      this.updatePreview();
    });
  }

  initForm(): void {
    this.configForm = this.fb.group({
      CompanyFlagRequired: ['N'],
      CompanyPrefix: [''],
      BranchFlagRequired: ['N'],
      BranchPrefix: [''],
      POLPODFlagRequired: ['N'],
      POLPODPortWiseCounter: ['Y'],
      DepartmentCodeRequired: ['N'],
      MonthFlagRequired: ['N'],
      YearFlagRequired: ['N'],
      Separator: ['/'],
      NumberLength: [5, [Validators.required, Validators.min(3), Validators.max(8)]],
      ResetOption: ['None'],
      DepartmentWiseCounter: ['N'],
      StartingNumber: [1, [Validators.required, Validators.min(1)]],
    });
  }

  loadFinancialYear(): void {
    this.settingsService
      .getCurrentFinancialYear(this.currentCompany?.CompanyMasterSid)
      .subscribe({
        next: (resp) => {
          if (resp.status) {
            this.currentYear = resp.data;
            this.updatePreview();
          }
        },
        error: (err) => {
          console.error('Error loading financial year', err);
        },
      });
  }

  loadDepartments(): void {
    this.masterService
      .getAllDepartments(this.currentCompany?.CompanyMasterSid)
      .subscribe({
        next: (resp: any) => {
          this.departmentList = resp || [];
        },
        error: (err) => {
          console.error('Error loading departments', err);
        },
      });
  }

  loadPorts(): void {
    this.masterService.getAllPorts().subscribe({
      next: (resp: any) => {
        this.portList = resp?.data || resp || [];
      },
      error: (err) => {
        console.error('Error loading ports', err);
      },
    });
  }

  loadMenuInfo(): void {
    this.settingsService.getMenuById(this.menuMasterSid).subscribe({
      next: (resp: any) => {
        if (resp.data) {
          this.menuInfo = resp.data;
        }
      },
      error: (err) => {
        console.error('Error loading menu info', err);
      },
    });
  }

  loadExistingConfig(): void {
    this.loading = true;
    this.spinner.show();

    this.settingsService
      .getNumberSeriesConfig(
        this.currentCompany?.CompanyMasterSid,
        this.currentBranch?.BranchMasterSid,
        this.menuMasterSid
      )
      .subscribe({
        next: (resp) => {
          if (resp.status && resp.data) {
            this.isEditMode = true;
            const config = resp.data;
            this.config = config;
            this.configForm.patchValue({
              CompanyFlagRequired: config.CompanyFlagRequired || 'N',
              CompanyPrefix: config.CompanyPrefix || '',
              BranchFlagRequired: config.BranchFlagRequired || 'N',
              BranchPrefix: config.BranchPrefix || '',
              POLPODFlagRequired: config.POLPODFlagRequired || 'N',
              POLPODPortWiseCounter: config.POLPODPortWiseCounter || 'Y',
              DepartmentCodeRequired: config.DepartmentCodeRequired || 'N',
              MonthFlagRequired: config.MonthFlagRequired || 'N',
              YearFlagRequired: config.YearFlagRequired || 'N',
              Separator: config.Separator !== null && config.Separator !== undefined ? config.Separator : '/',
              NumberLength: config.NumberLength || 5,
              ResetOption: config.ResetOption || 'None',
              DepartmentWiseCounter: config.DepartmentWiseCounter || 'N',
              StartingNumber: config.StartingNumber || 1,
            });
          }
          this.loading = false;
          this.spinner.hide();
          this.updatePreview();
        },
        error: (err) => {
          console.error('Error loading config', err);
          this.loading = false;
          this.spinner.hide();
        },
      });
  }

  onToggleChange(controlName: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.configForm.get(controlName)?.setValue(isChecked ? 'Y' : 'N');
  }

  updatePreview(): void {
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: this.menuMasterSid,
      DepartmentMasterSid: this.selectedDepartmentForPreview,
    };

    // Build local preview based on current form values
    this.previewResult = this.buildLocalPreview();
  }

  buildLocalPreview(): PreviewResult {
    const formValue = this.configForm.value;
    const parts: string[] = [];
    const sep = formValue.Separator || '';

    // Company Prefix
    if (formValue.CompanyFlagRequired === 'Y' && formValue.CompanyPrefix) {
      parts.push(formValue.CompanyPrefix);
    }

    // Branch Prefix
    if (formValue.BranchFlagRequired === 'Y' && formValue.BranchPrefix) {
      parts.push(formValue.BranchPrefix);
    }

    // POL-POD segment
    if (formValue.POLPODFlagRequired === 'Y') {
      if (this.selectedPOLForPreview && this.selectedPODForPreview) {
        const pol = this.portList.find(p => p.PortMasterSid === this.selectedPOLForPreview);
        const pod = this.portList.find(p => p.PortMasterSid === this.selectedPODForPreview);
        const polCode = pol?.PortCode ? (pol.PortCode.length > 3 ? pol.PortCode.slice(-3) : pol.PortCode) : 'POL';
        const podCode = pod?.PortCode ? (pod.PortCode.length > 3 ? pod.PortCode.slice(-3) : pod.PortCode) : 'POD';
        parts.push(`${polCode}-${podCode}`);
      } else {
        parts.push('POL-POD');
      }
    }

    // Department Code
    if (formValue.DepartmentCodeRequired === 'Y') {
      if (this.selectedDepartmentForPreview) {
        const dept = this.departmentList.find(
          (d) => d.DepartmentMasterSid === this.selectedDepartmentForPreview
        );
        parts.push(dept?.departmentCode || 'XX');
      } else {
        parts.push('XX');
      }
    }

    // Month
    if (formValue.MonthFlagRequired === 'Y') {
      const month = new Date().getMonth() + 1;
      parts.push(month.toString().padStart(2, '0'));
    }

    // Year
   if (formValue.YearFlagRequired === 'Y') {
  parts.push(this.getYearCodeForPreview());
}


    // Sequence Number (use StartingNumber from config)
    const seqLength = formValue.NumberLength || 5;
    const startingNumber = formValue.StartingNumber || 1;
    parts.push(startingNumber.toString().padStart(seqLength, '0'));

    return {
      preview: parts.join(sep),
      nextNumber: startingNumber,
    };
  }

  onDepartmentPreviewChange(departmentSid: number | null): void {
    this.selectedDepartmentForPreview = departmentSid;
    this.updatePreview();
  }

  onPOLPreviewChange(): void {
    this.updatePreview();
  }

  onPODPreviewChange(): void {
    this.updatePreview();
  }

  onSubmit(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const formValue = this.configForm.value;

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: this.menuMasterSid,
      CompanyFlagRequired: formValue.CompanyFlagRequired,
      CompanyPrefix: formValue.CompanyPrefix,
      BranchFlagRequired: formValue.BranchFlagRequired,
      BranchPrefix: formValue.BranchPrefix,
      POLPODFlagRequired: formValue.POLPODFlagRequired,
      POLPODPortWiseCounter: formValue.POLPODPortWiseCounter,
      DepartmentCodeRequired: formValue.DepartmentCodeRequired,
      MonthFlagRequired: formValue.MonthFlagRequired,
      YearFlagRequired: formValue.YearFlagRequired,
      Separator: formValue.Separator,
      NumberLength: formValue.NumberLength,
      ResetOption: formValue.ResetOption,
      DepartmentWiseCounter: formValue.DepartmentWiseCounter,
      StartingNumber: formValue.StartingNumber,
      CreatedBy: userEmail,
      UpdatedBy: userEmail,
    };

    this.btnDisable = true;
    this.spinner.show();

    this.settingsService.saveNumberSeriesConfig(payload).subscribe({
      next: (resp) => {
        this.btnDisable = false;
        this.spinner.hide();

        if (resp.status) {
          this.appSettingService.showSuccess(
            resp.message || 'Configuration saved successfully'
          );
          this.router.navigate(['/settings/number-series/list']);
        } else {
          this.appSettingService.showError(
            resp.message || 'Error saving configuration'
          );
        }
      },
      error: (err) => {
        this.btnDisable = false;
        this.spinner.hide();
        console.error('Error saving config', err);
        this.appSettingService.showError('Error saving configuration');
      },
    });
  }

  navigateBack(): void {
    this.router.navigate(['/settings/number-series/list']);
  }

  get isPolPodDisallowed(): boolean {
    const code = (this.menuInfo?.MenuCode || '').toUpperCase();
    const name = (this.menuInfo?.MenuName || '').toLowerCase();
    return code === 'RAT' || code === 'QUA' || code === 'QT' ||
           name.includes('enquiry') || name.includes('quotation');
  }

  getFormatPreviewParts(): string[] {
    const formValue = this.configForm.value;
    const parts: string[] = [];

    if (formValue.CompanyFlagRequired === 'Y') parts.push('Company');
    if (formValue.BranchFlagRequired === 'Y') parts.push('Branch');
    if (formValue.POLPODFlagRequired === 'Y') parts.push('POL-POD');
    if (formValue.DepartmentCodeRequired === 'Y') parts.push('Dept');
    if (formValue.MonthFlagRequired === 'Y') parts.push('Month');
    if (formValue.YearFlagRequired === 'Y') parts.push('Year');
    parts.push('Sequence');

    return parts;
  }
  getYearCodeForPreview(): string {
  const yearCode = this.currentYear?.YearCode;

  if (!yearCode) {
    return 'YY';
  }

  const yearStr = yearCode.toString();

  // If full year like 2026 → take last 2 digits
  if (yearStr.length === 4) {
    return yearStr.slice(-2);
  }

  // If already 2 digits like 26
  if (yearStr.length === 2) {
    return yearStr;
  }

  return 'YY';
}

openAuditLogs() {
      if (!this.config.NumberSeriesConfigSid) return;
      const modalRef = this.modalService.open(AuditLogComponent, {
      centered: true,
      scrollable: true,
      size: 'xl',
      windowClass: 'audit-log-modal'
    });
    modalRef.componentInstance.title = 'Operation Doc Number Logs';
    modalRef.componentInstance.tableName = 'NumberSeriesConfig';
    modalRef.componentInstance.recordId = this.config.NumberSeriesConfigSid.toString();
    modalRef.componentInstance.screenName = 'NumberSeriesConfig';
    }

}
