import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { catchError, forkJoin, of } from 'rxjs';

import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { MasterService } from '../../master.service';

type ConfigType = 'string' | 'number' | 'boolean' | 'email-array';

interface CompanyOption {
  CompanyMasterSid: number;
  companyName: string;
  companyCode?: string | null;
}

interface CompanyConfigRow {
  CompanyConfigurationSid?: number;
  CompanyMasterSid: number;
  ConfigurationName: string;
  DisplayName?: string | null;
  ConfigType?: ConfigType | null;
  ConfigurationValue: any;
}

interface ConfigTemplate {
  configurationName: string;
  displayName: string;
  configType: ConfigType;
}

const CONFIG_TEMPLATES: ConfigTemplate[] = [
  { configurationName: 'QuoteRateLockUser', displayName: 'Quote Rate Lock Users', configType: 'email-array' },
  { configurationName: 'CustomerNameUpdateUsers', displayName: 'Customer Name Update Users(Allow)', configType: 'email-array' },
  { configurationName: 'ExchangeJVCOA', displayName: 'Exchange JV COA', configType: 'number' },
  { configurationName: 'SaveAsFilePath', displayName: 'Save As File Path (PDF file)', configType: 'boolean' },
  { configurationName: 'MawbStockAllocation', displayName: 'MAWB Stock Auto Allocation', configType: 'boolean' },
  { configurationName: 'TermsandConditions', displayName: 'Terms and Conditions', configType: 'boolean' },
  { configurationName: 'CreditRequestChecking', displayName: 'Credit Request Checking(Limit)', configType: 'boolean' },
  { configurationName: 'ExportToImportCompanyMasterSid', displayName: 'Export To Import Companies', configType: 'string' },
  { configurationName: 'OSandStatementShowBankDetails', displayName: 'OS & Statement Show Bank Details', configType: 'boolean' },
  { configurationName: 'Printallbank', displayName: 'Printallbank ( Invoice & OS print)', configType: 'boolean' },
  { configurationName: 'DisableRateUpdateBack', displayName: 'Disable Rate Update Back', configType: 'boolean' },
  { configurationName: 'ReceiptAllowtoprintbeforePosting', displayName: 'Receipt Allow to print before posting', configType: 'boolean' },
  { configurationName: 'QuoteApproval', displayName: 'Quote Approval', configType: 'boolean'},
  { configurationName: 'ShowCargowithContainer', displayName: 'Show Cargo with Container(Invoice Print)', configType: 'boolean'},
  { configurationName: 'EnableReportColumnCustomization', displayName: 'Enable Report Column Customization (New report view)', configType: 'boolean'},
  { configurationName: 'TrackingMilestoneDisplayMode', displayName: 'Tracking Milestone Display Mode (Hide unused pending before latest)', configType: 'boolean'},
];

@Component({
  selector: 'app-company-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbNavModule,
    NgbTooltipModule,
    NgSelectModule,
    SearchableDropdown
  ],
  templateUrl: './company-config.component.html',
  styleUrl: './company-config.component.scss'
})
export class CompanyConfigComponent implements OnInit {
  companyName = '';
  companyId: number | null = null;
  isLoading = false;
  isSaving = false;
  activeTab = 'general-settings';
  isEditMode = false;
  isTemporaryMode = false;
  manualConfigNameMode = false;

  configForm!: FormGroup;
  newConfigForm!: FormGroup;

  currentConfigs: CompanyConfigRow[] = [];
  companyOptions: CompanyOption[] = [];
  eligibleCompanyOptions: CompanyOption[] = [];
  selectedCompanyIds: number[] = [];

  availableTypes: Array<{ value: ConfigType; label: string }> = [
    { value: 'string', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Y/N' },
    { value: 'email-array', label: 'Email List' }
  ];

  configTemplates = CONFIG_TEMPLATES;

  // Existing-configuration list filters (search by name + tab by config type).
  configSearch = '';
  configTypeFilter: 'all' | ConfigType = 'all';
  configTypeFilters: Array<{ value: 'all' | ConfigType; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'string', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Y/N' },
    { value: 'email-array', label: 'Email List' },
  ];

  /** True when a config row matches the current search term and the selected type tab. */
  matchesConfigFilter(control: any): boolean {
    const name = String(control?.get('ConfigurationName')?.value || '').toLowerCase();
    const display = String(control?.get('DisplayName')?.value || '').toLowerCase();
    const type = control?.get('ConfigType')?.value;
    const term = this.configSearch.trim().toLowerCase();
    const matchesSearch = !term || name.includes(term) || display.includes(term);
    const matchesType = this.configTypeFilter === 'all' || type === this.configTypeFilter;
    return matchesSearch && matchesType;
  }

  /** Number of config rows visible under the current search + type filter. */
  get filteredConfigCount(): number {
    return this.configurations.controls.filter((control) => this.matchesConfigFilter(control)).length;
  }

  /** How many configured rows exist for a given type tab (for the tab badges). */
  configTypeCount(value: 'all' | ConfigType): number {
    if (value === 'all') {
      return this.configurations.length;
    }
    return this.configurations.controls.filter((control) => control.get('ConfigType')?.value === value).length;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    this.companyId = idParam ? Number(idParam) : null;

    const state = history.state || {};
    this.companyName = state.companyName || '';
    this.isTemporaryMode = !this.companyId && !!state.companyData;
    this.isEditMode = !!this.companyId;
    this.selectedCompanyIds = this.companyId ? [this.companyId] : [];

    this.configureCompanySelector();

    this.newConfigForm.get('ConfigType')?.valueChanges.subscribe((type: ConfigType) => {
      this.applyCreateType(type);
    });

    this.applyCreateType(this.normalizeConfigType(this.newConfigForm.get('ConfigType')?.value));

    this.loadPageData();
  }

  private configureCompanySelector(): void {
    const companyControl = this.newConfigForm.get('CompanyMasterSids');
    if (!companyControl) return;

    if (this.isTemporaryMode) {
      companyControl.clearValidators();
      companyControl.setValue([], { emitEvent: false });
      companyControl.disable({ emitEvent: false });
    } else {
      companyControl.setValidators([Validators.required]);
      companyControl.enable({ emitEvent: false });
    }

    if (this.companyId && !this.isTemporaryMode && !companyControl.value?.length) {
      companyControl.setValue([this.companyId], { emitEvent: false });
    }

    companyControl.updateValueAndValidity({ emitEvent: false });
  }

  private initializeForm(): void {
    this.configForm = this.fb.group({
      configurations: this.fb.array([])
    });

    this.newConfigForm = this.fb.group({
      CompanyMasterSids: [[], this.isEditMode || this.isTemporaryMode ? [] : [Validators.required]],
      ConfigurationName: ['', Validators.required],
      DisplayName: [''],
      ConfigType: ['string', Validators.required],
      ConfigurationValue: ['']
    });
  }

  get configurations(): FormArray {
    return this.configForm.get('configurations') as FormArray;
  }

  get companyMultiSelectDisabled(): boolean {
    return this.isTemporaryMode;
  }

  get createButtonDisabled(): boolean {
    return this.isSaving || this.newConfigForm.invalid || !this.canCreateSelectedConfig();
  }

  get selectedCompanyLabel(): string {
    if (this.companyId) return this.companyName || this.getCompanyLabel(this.companyId);
    if (this.selectedCompanyIds.length === 0) return 'No company selected';
    if (this.selectedCompanyIds.length === 1) {
      return this.getCompanyLabel(this.selectedCompanyIds[0]);
    }
    return `${this.selectedCompanyIds.length} companies selected`;
  }

  private loadPageData(): void {
    this.isLoading = true;

    forkJoin({
      companies: this.masterService.getAllCompanies().pipe(catchError(() => of([]))),
      configs: this.companyId
        ? this.masterService.getAllCompanyConfigsByCompanyId(this.companyId).pipe(catchError(() => of([])))
        : of([])
    }).subscribe({
      next: ({ companies, configs }) => {
        const companyList = this.unwrapResponseArray(companies);
        const configList = this.unwrapResponseArray(configs);

        this.companyOptions = companyList.length
          ? companyList
            .filter((company: any) => company?.status === 'A' || company?.Status === 'A' || company?.status === undefined)
            .map((company: any) => ({
              CompanyMasterSid: Number(company.CompanyMasterSid),
              companyName: company.companyName || company.CompanyName || '',
              companyCode: company.companyCode || company.CompanyCode || null
            }))
          : [];

        if (!this.companyName && this.companyId) {
          const current = this.companyOptions.find(option => option.CompanyMasterSid === this.companyId);
          this.companyName = current?.companyName || this.companyName;
        }

        this.currentConfigs = configList.map((config: any) => this.normalizeConfigRow(config));

        this.initializeConfigurations();

        if (this.companyId) {
          this.newConfigForm.patchValue({ CompanyMasterSids: [this.companyId] }, { emitEvent: false });
          this.newConfigForm.get('CompanyMasterSids')?.enable({ emitEvent: false });
        }

        this.isLoading = false;
        this.refreshEligibleCompanies();
      },
      error: () => {
        this.appSettingService.showError('Unable to load company configuration data.');
        this.currentConfigs = [];
        this.initializeConfigurations();
        this.isLoading = false;
      }
    });
  }

  private initializeConfigurations(): void {
    while (this.configurations.length) {
      this.configurations.removeAt(0);
    }

    this.currentConfigs.forEach((config) => {
      this.configurations.push(this.buildConfigRow(config));
    });
  }

  private unwrapResponseArray(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
  }

  private buildConfigRow(config: CompanyConfigRow): FormGroup {
    const configType = this.normalizeConfigType(config.ConfigType || this.inferTypeFromValue(config.ConfigurationValue));
    const value = this.normalizeValueForForm(config.ConfigurationValue, configType);

    const row = this.fb.group({
      CompanyConfigurationSid: [config.CompanyConfigurationSid || null],
      CompanyMasterSid: [{ value: config.CompanyMasterSid, disabled: true }],
      ConfigurationName: [{ value: config.ConfigurationName, disabled: true }],
      DisplayName: [config.DisplayName || this.formatLabel(config.ConfigurationName)],
      ConfigType: [configType, Validators.required],
      ConfigurationValue: [value, this.getValidatorsForType(configType, config.ConfigurationName)]
    });

    row.get('ConfigType')?.valueChanges.subscribe((type: ConfigType) => {
      this.applyRowType(row, type);
    });

    return row;
  }

  private applyRowType(row: FormGroup, type: ConfigType): void {
    const valueControl = row.get('ConfigurationValue');
    if (!valueControl) return;

    valueControl.clearValidators();
    valueControl.setValue(this.normalizeValueForForm(valueControl.value, type), { emitEvent: false });
    valueControl.setValidators(this.getValidatorsForType(type, row.get('ConfigurationName')?.value));
    valueControl.updateValueAndValidity({ emitEvent: false });
  }

  private applyCreateType(type: ConfigType): void {
    const valueControl = this.newConfigForm.get('ConfigurationValue');
    if (!valueControl) return;

    const normalizedType = this.normalizeConfigType(type);
    valueControl.clearValidators();
    valueControl.setValidators(this.getValidatorsForType(normalizedType, this.newConfigForm.get('ConfigurationName')?.value));
    valueControl.setValue(this.normalizeValueForForm(valueControl.value, normalizedType), { emitEvent: false });
    valueControl.updateValueAndValidity({ emitEvent: false });
  }

  private normalizeConfigRow(config: any): CompanyConfigRow {
    return {
      CompanyConfigurationSid: config.CompanyConfigurationSid,
      CompanyMasterSid: Number(config.CompanyMasterSid),
      ConfigurationName: config.ConfigurationName,
      DisplayName: config.DisplayName || this.formatLabel(config.ConfigurationName),
      ConfigType: this.normalizeConfigType(config.ConfigType || this.inferTypeFromValue(config.ConfigurationValue)),
      ConfigurationValue: config.ConfigurationValue
    };
  }

  private normalizeConfigType(type: any): ConfigType {
    const normalized = String(type || 'string').toLowerCase();
    return ['string', 'number', 'boolean', 'email-array'].includes(normalized) ? normalized as ConfigType : 'string';
  }

  private getValidatorsForType(type: ConfigType, configName?: string) {
    if (configName === 'ExportToImportCompanyMasterSid') {
      return [];
    }

    switch (type) {
      case 'email-array':
        return [this.emailArrayValidator()];
      case 'number':
        if (configName === 'ExchangeJVCOA') {
          return [Validators.pattern(/^-?\d*\.?\d+$/)];
        }
        return [Validators.required, Validators.pattern(/^-?\d*\.?\d+$/)];
      case 'boolean':
        return [];
      default:
        return [Validators.required];
    }
  }

  private emailArrayValidator() {
    return (control: any) => {
      if (!control.value) return null;
      const emails = String(control.value)
        .split(',')
        .map((email: string) => email.trim())
        .filter((email: string) => email);

      for (const email of emails) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return { invalidEmail: true };
        }
      }
      return null;
    };
  }

  private refreshEligibleCompanies(): void {
    const configName = this.getConfigurationNameForLookup();

    if (!configName) {
      this.eligibleCompanyOptions = [...this.companyOptions];
      if (!this.companyId && !this.isTemporaryMode) {
        this.newConfigForm.get('CompanyMasterSids')?.enable({ emitEvent: false });
      }
      return;
    }

    this.masterService.getEligibleCompaniesForConfiguration(configName).pipe(
      catchError(() => of([]))
    ).subscribe((companies: any) => {
      const companyList = this.unwrapResponseArray(companies);
      const eligible = companyList.length
        ? companyList.map((company: any) => ({
            CompanyMasterSid: Number(company.CompanyMasterSid),
            companyName: company.companyName || company.CompanyName || '',
            companyCode: company.companyCode || company.CompanyCode || null
          }))
        : [];

      this.eligibleCompanyOptions = eligible;

      if (!this.companyMultiSelectDisabled) {
        const eligibleIds = new Set(eligible.map(option => option.CompanyMasterSid));
        this.selectedCompanyIds = this.selectedCompanyIds.filter(id => eligibleIds.has(id));
        this.newConfigForm.get('CompanyMasterSids')?.setValue(this.selectedCompanyIds, { emitEvent: false });
        this.newConfigForm.get('CompanyMasterSids')?.enable({ emitEvent: false });
      } else if (this.companyId && !eligible.some(option => option.CompanyMasterSid === this.companyId)) {
        this.appSettingService.showWarning('This configuration already exists for the selected company.');
      }
    });
  }

  private getConfigurationNameForLookup(): string {
    const rawName = String(this.newConfigForm.get('ConfigurationName')?.value || '').trim();
    return rawName;
  }

  onConfigurationNameChanged(event: any): void {
    const selectedName = typeof event === 'string' ? event : event?.configurationName || event?.ConfigurationName || event?.value || '';
    const configName = String(selectedName || this.newConfigForm.get('ConfigurationName')?.value || '').trim();
    const template = this.configTemplates.find(item => item.configurationName === configName);

    if (template) {
      this.manualConfigNameMode = false;
      this.newConfigForm.patchValue({
        ConfigurationName: template.configurationName,
        DisplayName: template.displayName,
        ConfigType: template.configType
      }, { emitEvent: false });
      this.applyCreateType(template.configType);
    } else if (configName) {
      if (!this.newConfigForm.get('DisplayName')?.value) {
        this.newConfigForm.patchValue({ DisplayName: this.formatLabel(configName) }, { emitEvent: false });
      }
      if (!this.newConfigForm.get('ConfigType')?.value) {
        this.newConfigForm.patchValue({ ConfigType: 'string' }, { emitEvent: false });
      }
      this.applyCreateType(this.normalizeConfigType(this.newConfigForm.get('ConfigType')?.value));
    }

    this.refreshEligibleCompanies();
  }

  onManualConfigNameInput(): void {
    const configName = String(this.newConfigForm.get('ConfigurationName')?.value || '').trim();

    if (!configName) {
      this.newConfigForm.patchValue({ DisplayName: '', ConfigType: 'string' }, { emitEvent: false });
      this.applyCreateType('string');
      this.refreshEligibleCompanies();
      return;
    }

    if (!this.newConfigForm.get('DisplayName')?.value) {
      this.newConfigForm.patchValue({ DisplayName: this.formatLabel(configName) }, { emitEvent: false });
    }
    if (!this.newConfigForm.get('ConfigType')?.value) {
      this.newConfigForm.patchValue({ ConfigType: 'string' }, { emitEvent: false });
    }
    this.applyCreateType(this.normalizeConfigType(this.newConfigForm.get('ConfigType')?.value));

    this.refreshEligibleCompanies();
  }

  toggleManualConfigNameMode(): void {
    this.manualConfigNameMode = !this.manualConfigNameMode;
    if (!this.manualConfigNameMode) {
      this.onConfigurationNameChanged(this.newConfigForm.get('ConfigurationName')?.value);
    }
  }

  toggleSelectAllCompanies(): void {
    if (this.companyMultiSelectDisabled) return;

    const eligibleIds = this.eligibleCompanyOptions.map(company => company.CompanyMasterSid);
    const selectedIds = this.newConfigForm.get('CompanyMasterSids')?.value || [];

    if (selectedIds.length === eligibleIds.length) {
      this.selectedCompanyIds = [];
    } else {
      this.selectedCompanyIds = [...eligibleIds];
    }

    this.newConfigForm.get('CompanyMasterSids')?.setValue(this.selectedCompanyIds);
    this.newConfigForm.get('CompanyMasterSids')?.markAsTouched();
  }

  onCompanySelectionChange(companyIds: number[]): void {
    this.selectedCompanyIds = Array.isArray(companyIds)
      ? companyIds.map((item: any) => Number(item?.CompanyMasterSid ?? item)).filter((id: number) => Number.isInteger(id) && id > 0)
      : [];
  }

  private canCreateSelectedConfig(): boolean {
    if (this.isTemporaryMode) {
      return true;
    }

    const selectedIds = this.selectedCompanyIds.length
      ? this.selectedCompanyIds
      : (this.newConfigForm.get('CompanyMasterSids')?.value || []);

    if (!selectedIds.length && !this.companyId) {
      return false;
    }

    return selectedIds.every((id: number) => this.eligibleCompanyOptions.some(option => option.CompanyMasterSid === Number(id)));
  }

  addConfigRow(): void {
    if (this.isTemporaryMode) {
      this.storeTemporaryConfiguration();
      return;
    }

    if (this.newConfigForm.invalid) {
      this.markFormGroupTouched(this.newConfigForm);
      return;
    }

    if (!this.canCreateSelectedConfig()) {
      this.appSettingService.showWarning('Please choose only companies that do not already have this configuration.');
      return;
    }

    const payload = this.buildCreatePayload();
    this.isSaving = true;

    this.masterService.createCompanyConfig(payload).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        if (response?.status === false) {
          this.appSettingService.showError(response.message || 'Unable to create configuration.');
          return;
        }

        this.appSettingService.showSuccess('Configuration created successfully.');
        this.resetCreateForm();
        this.reloadCurrentConfigurationsIfNeeded();
      },
      error: (error) => {
        this.isSaving = false;
        this.appSettingService.showError(error?.error?.message || 'Error creating configuration.');
      }
    });
  }

  private reloadCurrentConfigurationsIfNeeded(): void {
    if (!this.companyId) {
      this.refreshEligibleCompanies();
      return;
    }

    this.masterService.getAllCompanyConfigsByCompanyId(this.companyId).pipe(catchError(() => of([]))).subscribe((configs: any) => {
      this.currentConfigs = this.unwrapResponseArray(configs).map((config: any) => this.normalizeConfigRow(config));
      this.initializeConfigurations();
      this.refreshEligibleCompanies();
    });
  }

  private storeTemporaryConfiguration(): void {
    const configData = {
      companyName: this.companyName,
      companyData: history.state?.companyData || null,
      configurations: [this.buildCreatePayload()],
      tempCompanyId: history.state?.tempCompanyId || null,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(`temp_company_config_${configData.tempCompanyId || 'draft'}`, JSON.stringify(configData));
    this.appSettingService.showSuccess('Configuration saved temporarily. It will be linked when the company is created.');
    this.goBackToCompany();
  }

  private buildCreatePayload(): any {
    const rawCompanyIds = this.newConfigForm.get('CompanyMasterSids')?.value || [];

    const selectedCompanyIds = Array.isArray(rawCompanyIds)
      ? rawCompanyIds.map((item: any) => Number(item?.CompanyMasterSid ?? item)).filter((id: number) => Number.isInteger(id) && id > 0)
      : [];

    const configurationName = String(this.newConfigForm.get('ConfigurationName')?.value || '').trim();
    const displayName = String(this.newConfigForm.get('DisplayName')?.value || '').trim() || this.formatLabel(configurationName);
    const configType = this.normalizeConfigType(this.newConfigForm.get('ConfigType')?.value);
    const configurationValue = this.serializeValue(this.newConfigForm.get('ConfigurationValue')?.value, configType);

    return {
      CompanyMasterSid: selectedCompanyIds.length === 1 ? selectedCompanyIds[0] : selectedCompanyIds,
      CompanyMasterSids: selectedCompanyIds,
      ConfigurationName: configurationName,
      DisplayName: displayName,
      ConfigType: configType,
      ConfigurationValue: configurationValue
    };
  }

  saveConfiguration(): void {
    if (this.configForm.invalid) {
      this.markFormArrayTouched(this.configurations);
      return;
    }

    if (!this.companyId) {
      this.appSettingService.showWarning('Existing configurations can be saved only from a company context.');
      return;
    }

    this.isSaving = true;

    const payload = this.prepareUpdatePayload();
    this.masterService.bulkUpdateCompanyConfigs(payload).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        if (response?.status === false) {
          this.appSettingService.showError(response.message || 'Unable to save configuration.');
          return;
        }

        this.appSettingService.showSuccess('Configuration updated successfully.');
        this.reloadCurrentConfigurationsIfNeeded();
      },
      error: (error) => {
        this.isSaving = false;
        this.appSettingService.showError(error?.error?.message || 'Error updating configuration.');
      }
    });
  }

  private prepareUpdatePayload(): any {
    const configurations = this.configurations.controls.map((control: any) => {
      const row = control as FormGroup;
      const type = this.normalizeConfigType(row.get('ConfigType')?.value);
      return {
        CompanyConfigurationSid: row.get('CompanyConfigurationSid')?.value || null,
        CompanyMasterSid: this.companyId,
        ConfigurationName: String(row.get('ConfigurationName')?.value || '').trim(),
        DisplayName: String(row.get('DisplayName')?.value || '').trim(),
        ConfigType: type,
        ConfigurationValue: this.serializeValue(row.get('ConfigurationValue')?.value, type)
      };
    });

    return {
      CompanyMasterSid: this.companyId,
      configurations
    };
  }

  private serializeValue(value: any, type: ConfigType): any {
    switch (type) {
      case 'email-array':
        if (Array.isArray(value)) {
          return value.map(item => String(item).trim()).filter(Boolean).join(', ');
        }
        return String(value || '')
          .split(',')
          .map(item => item.trim())
          .filter(Boolean)
          .join(', ');
      case 'number':
        if (value === null || value === undefined || value === '') return null;
        return Number(value).toString();
      case 'boolean':
        return this.formatBooleanValue(value);
      default:
        return value === null || value === undefined ? '' : String(value);
    }
  }

  private normalizeValueForForm(value: any, type: ConfigType): any {
    switch (type) {
      case 'email-array':
        if (Array.isArray(value)) return value.join(', ');
        return value === null || value === undefined ? '' : String(value);
      case 'number':
        return value === null || value === undefined ? '' : String(value);
      case 'boolean':
        return this.parseBooleanValue(value);
      default:
        return value === null || value === undefined ? '' : String(value);
    }
  }

  isConfigInvalid(index: number): boolean {
    const config = this.configurations.at(index);
    const valueControl = config.get('ConfigurationValue');
    return valueControl ? valueControl.invalid && (valueControl.dirty || valueControl.touched) : false;
  }

  getConfigError(index: number): string {
    const valueControl = this.configurations.at(index).get('ConfigurationValue');
    const errors = valueControl?.errors;

    if (!errors) return '';
    if (errors['required']) return 'This field is required';
    if (errors['invalidEmail']) return 'Contains invalid email address';
    if (errors['pattern']) return 'Must be a valid number';
    return 'Invalid value';
  }

  resetConfiguration(): void {
    this.resetCreateForm();
    this.loadPageData();
  }

  private resetCreateForm(): void {
    this.manualConfigNameMode = false;
    this.newConfigForm.reset({
      CompanyMasterSids: this.companyId ? [this.companyId] : [],
      ConfigurationName: '',
      DisplayName: '',
      ConfigType: 'string',
      ConfigurationValue: ''
    });

    this.configureCompanySelector();

    this.selectedCompanyIds = this.companyId ? [this.companyId] : [];
    this.eligibleCompanyOptions = [...this.companyOptions];
  }

  private markFormArrayTouched(formArray: FormArray): void {
    formArray.controls.forEach(control => {
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(key => control.get(key)?.markAsTouched());
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => formGroup.get(key)?.markAsTouched());
  }

  private parseBooleanValue(value: any): boolean {
    if (value === true || value === 1) return true;
    if (value === false || value === 0 || value === null || value === undefined) return false;
    const normalized = String(value).trim().toUpperCase();
    return ['Y', 'YES', 'TRUE', '1'].includes(normalized);
  }

  private formatBooleanValue(value: any): string {
    return this.parseBooleanValue(value) ? 'Y' : 'N';
  }

  private inferTypeFromValue(value: any): ConfigType {
    if (value === true || value === false) return 'boolean';
    if (value !== null && value !== undefined) {
      const normalized = String(value).trim().toUpperCase();
      if (['Y', 'N', 'YES', 'NO', 'TRUE', 'FALSE', '1', '0'].includes(normalized)) {
        return 'boolean';
      }
      if (String(value).includes('@') && String(value).includes(',')) {
        return 'email-array';
      }
      if (String(value).trim() !== '' && !isNaN(Number(value))) {
        return 'number';
      }
    }
    return 'string';
  }

  private formatLabel(key: string): string {
    return String(key || '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  getCompanyLabel(companyId: number): string {
    const company = this.companyOptions.find(option => option.CompanyMasterSid === companyId);
    return company?.companyName || String(companyId);
  }

  goBackToCompany(): void {
    if (this.companyId) {
      this.router.navigate(['/master/company/entry', this.companyId]);
      return;
    }

    this.router.navigate(['/master/company/entry']);
  }

  onTabChange(event: any): void {
    this.activeTab = event.nextId;
  }

  isInCreateMode(): boolean {
    return !this.isEditMode;
  }
}
