import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbAccordionModule, NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

import { CompanyConfigService } from '../services/company-config.service';
import { MasterService } from '../../master.service';
import { CompanySettingsManagerService } from '../../../../core/services/company-settings-manager.service';
import {
  CompanyConfiguration,
  SystemSettings,
  ModuleFeatures,
  CurrencySettings
} from '../models/company-config.interface';

@Component({
  selector: 'app-config-new',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbAccordionModule,
    NgbNavModule,
    NgbTooltipModule,
    NgSelectModule
  ],
  templateUrl: './config-new.component.html',
  styleUrl: './config-new.component.scss'
})
export class ConfigNewComponent implements OnInit {
  companyName: string = '';
  countryCode : string = 'ae';
  companyId: number | null = null;
  isLoading: boolean = false;
  isSaving: boolean = false;
  activeTab: string = 'system-settings';

  // Forms
  systemSettingsForm!: FormGroup;

  // Configuration data
  config: CompanyConfiguration = {
    systemSettings: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24',
      timezone: 'UTC',
      currency: {
        currencyMasterSid : null,
        code: null,
        symbol: null,
        position: 'before',
        decimalPlaces: 2
      },
      company: {
        name: '',
        address: '',
        contact: ''
      }
    },
    moduleFeatures: {
      crm: {},
      operations: {},
      accounts: {},
      masters: {}
    },
    fieldCustomization: {
      crm: {},
      operations: {},
      accounts: {},
      masters: {}
    },
    documentConfiguration: {
      logoPosition: 'left',
      companyPosition: 'center',
      companyAlignment : 'center'
      // enableFooter: true,
      // footerText: 'Thank you for your business',
      // footerPosition: 'center',
      // marginTop: 20,
      // marginBottom: 20,
      // marginLeft: 15,
      // marginRight: 15
    }
  };

  // Field configuration from existing config component pattern
  fieldConfig: any = {
    masters: {},
    crm: {},
    accounts: {},
    settings: {}
  };

  // Dropdown options
  dateFormatOptions: { value: string; label: string }[] = [];
  timeFormatOptions: { value: string; label: string }[] = [];
  currencyOptions: { code: string; name: string; symbol: string , amountDecimal : number}[] = [];
  timezoneOptions: { value: string; label: string }[] = [];
  currencyPositionOptions: { value: string; label: string }[] = [];

  // Module features
  moduleFeatures = {
    crm: [
      { key: 'leadManagement', name: 'Lead Management', description: 'Enable lead capture and management functionality' },
      { key: 'enquiryProcessing', name: 'Enquiry Processing', description: 'Enable enquiry workflow and processing' },
      { key: 'quotationGeneration', name: 'Quotation Generation', description: 'Enable quotation creation and approval workflow' },
      { key: 'customerPortal', name: 'Customer Portal', description: 'Enable customer self-service portal access' },
      { key: 'emailIntegration', name: 'Email Integration', description: 'Enable email notifications and templates' },
      { key: 'reportingDashboard', name: 'Reporting Dashboard', description: 'Enable CRM analytics and reporting dashboard' }
    ],
    operations: [
      { key: 'bookingManagement', name: 'Booking Management', description: 'Enable booking creation and tracking' },
      { key: 'documentGeneration', name: 'Document Generation', description: 'Enable document generation (BL, Invoice, etc.)' },
      { key: 'containerTracking', name: 'Container Tracking', description: 'Enable real-time container tracking' },
      { key: 'milestoneTracking', name: 'Milestone Tracking', description: 'Enable shipment milestone updates' },
      { key: 'vendorManagement', name: 'Vendor Management', description: 'Enable vendor and supplier management' },
      { key: 'cargoManagement', name: 'Cargo Management', description: 'Enable cargo details and handling' }
    ],
    accounts: [
      { key: 'invoiceGeneration', name: 'Invoice Generation', description: 'Enable automated invoice generation' },
      { key: 'paymentTracking', name: 'Payment Tracking', description: 'Enable payment status tracking' },
      { key: 'creditManagement', name: 'Credit Management', description: 'Enable credit limit and terms management' },
      { key: 'taxCalculation', name: 'Tax Calculation', description: 'Enable automated tax calculations' },
      { key: 'multiCurrency', name: 'Multi-Currency', description: 'Enable multi-currency support' },
      { key: 'profitAnalysis', name: 'Profit Analysis', description: 'Enable profit margin analysis' }
    ],
    masters: [
      { key: 'portManagement', name: 'Port Management', description: 'Enable port master data management' },
      { key: 'vesselManagement', name: 'Vessel Management', description: 'Enable vessel master data management' },
      { key: 'chargeManagement', name: 'Charge Management', description: 'Enable charge master data management' },
      { key: 'customerManagement', name: 'Customer Management', description: 'Enable customer master data management' },
      { key: 'supplierManagement', name: 'Supplier Management', description: 'Enable supplier master data management' },
      { key: 'userManagement', name: 'User Management', description: 'Enable user and role management' }
    ]
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private configService: CompanyConfigService,
    private masterService: MasterService,
    private companySettingsManager: CompanySettingsManagerService
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.companyId = +this.route.snapshot.params['id'];
    const state = history.state;
    this.companyName = state.companyName || '';
    this.countryCode = state.countryCode || '';

    // Load options first, then configuration to ensure dropdowns are populated
    this.loadOptions().then(() => {
      this.loadConfiguration();
    });
  }

  private initializeForms() {
    this.systemSettingsForm = this.fb.group({
      dateFormat: ['DD/MM/YYYY', Validators.required],
      timeFormat: ['24', Validators.required],
      timezone: ['UTC', Validators.required],
      currencyMasterSid : [{ value : null , disabled : true },[Validators.required]],
      currencyCode: [{ value : null, disabled : true }, Validators.required],
      currencySymbol: [{ value : null , disabled : true }, Validators.required],
      currencyDecimalPlaces: [{ value : 2 , disabled : true} , [Validators.required, Validators.min(0), Validators.max(4)]],
      currencyPosition: ['before', Validators.required],
      decimalSeparator: ['.', Validators.required],
      thousandSeparator: [',', Validators.required],
      enableNotifications: [true],
      autoSave: [true],
      sessionTimeout: [30, [Validators.required, Validators.min(5), Validators.max(120)]],
      // Email Configuration
      smtpHost: [''],
      smtpPort: [587, [Validators.min(1), Validators.max(65535)]],
      smtpSecure: [false],
      smtpUser: [''],
      smtpPassword: [''],
      fromEmail: ['', Validators.email],
      fromName: [''],
      replyToEmail: ['', Validators.email]
    });

    // Listen for date format changes
    this.systemSettingsForm.get('dateFormat')?.valueChanges.subscribe(value => {
      if (value) {
        this.companySettingsManager.updateDateFormat(value);
      }
    });
  }

  private loadOptions(): Promise<void> {
    return new Promise((resolve) => {
      this.dateFormatOptions = this.configService.getDateFormatOptions();
      this.timeFormatOptions = this.configService.getTimeFormatOptions();
      this.currencyPositionOptions = this.configService.getCurrencyPositionOptions();

      let currenciesLoaded = false;
      let timezonesLoaded = false;

      const checkComplete = () => {
        if (currenciesLoaded && timezonesLoaded) {
          resolve();
        }
      };

      this.configService.getAvailableCurrencies().subscribe(currencies => {
        this.currencyOptions = currencies;
        currenciesLoaded = true;
        checkComplete();
      });

      this.configService.getAvailableTimezones().subscribe(timezones => {
        this.timezoneOptions = timezones;
        timezonesLoaded = true;
        checkComplete();
      });
    });
  }

  private loadConfiguration() {
    this.isLoading = true;

    // Load field configuration (existing pattern)
    this.configService.getFieldConfiguration().subscribe({
      next: (response: any) => {
        if (response?.fieldConfig) {
          this.fieldConfig = response.fieldConfig;
          this.mergeFieldConfiguration();
        }

        // Load existing company config if passed from state
        const state = history.state;
        if (state.config && Object.keys(state.config).length > 0) {
          this.config = { ...this.config, ...state.config };
        } else {
          // Set default configuration
          this.config = this.configService.getDefaultConfiguration();
        }
        
        this.config.documentConfiguration ??= {
          logoPosition: 'left',
          companyPosition: 'center',
          companyAlignment : 'center'
          // enableFooter: true,
          // footerText: 'Thank you for your business',
          // footerPosition: 'center',
          // marginTop: 20,
          // marginBottom: 20,
          // marginLeft: 15,
          // marginRight: 15
        };
        console.log("CONFIG",this.config)
        this.updateFormValues();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading configuration:', error);
        this.isLoading = false;
      }
    });
  }

  onLogoPositionChange(position: 'left' | 'center' | 'right') {
    const docConfig = this.config.documentConfiguration!;
    docConfig.logoPosition = position;

    // If company position conflicts, auto-move it
    if (docConfig.companyPosition === position) {
      docConfig.companyPosition = position === 'left'
        ? 'right'
        : 'left';
    }
  }

  onCompanyPositionChange(position: 'left' | 'center' | 'right') {
    const docConfig = this.config.documentConfiguration!;
    docConfig.companyPosition = position;

    // If logo position conflicts, auto-move it
    if (docConfig.logoPosition === position) {
      docConfig.logoPosition = position === 'left'
        ? 'right'
        : 'left';
    }
  }


  private mergeFieldConfiguration() {
    // Merge field configuration following existing pattern from config.component.ts
    (['masters', 'crm', 'accounts', 'settings'] as const).forEach(section => {
      if (this.fieldConfig[section]) {
        Object.keys(this.fieldConfig[section]).forEach(subsection => {
          const subsectionData = this.fieldConfig[section][subsection];

          // Only process crm, accounts, masters for fieldCustomization (skip settings)
          if (section === 'settings') return;

          const configSection = section as 'crm' | 'accounts' | 'masters';

          if (!this.config.fieldCustomization[configSection]) {
            this.config.fieldCustomization[configSection] = {};
          }

          if (!this.config.fieldCustomization[configSection][subsection]) {
            this.config.fieldCustomization[configSection][subsection] = { fields: {} };
          }

          if (!subsectionData.fields) {
            Object.keys(subsectionData).forEach(key => {
              if (!this.config.fieldCustomization[configSection][subsection].fields[key]) {
                this.config.fieldCustomization[configSection][subsection].fields[key] = {
                  visible: subsectionData[key] === true,
                  label: this.formatLabel(key)
                };
              }
            });
          } else {
            Object.keys(subsectionData.fields).forEach(key => {
              if (!this.config.fieldCustomization[configSection][subsection].fields[key]) {
                this.config.fieldCustomization[configSection][subsection].fields[key] = {
                  visible: subsectionData.fields[key].visible,
                  label: subsectionData.fields[key].label || this.formatLabel(key)
                };
              }
            });
          }
        });
      }
    });
  }

  private updateFormValues() {
    if (this.config.systemSettings) {
      this.systemSettingsForm.patchValue({
        dateFormat: this.config.systemSettings.dateFormat,
        timeFormat: this.config.systemSettings.timeFormat,
        timezone: this.config.systemSettings.timezone,
        currencyMasterSid : this.config.systemSettings.currency.currencyMasterSid,
        currencyCode: this.config.systemSettings.currency.code,
        currencySymbol: this.config.systemSettings.currency.symbol,
        currencyPosition: this.config.systemSettings.currency.position,
        currencyDecimalPlaces: this.config.systemSettings.currency.decimalPlaces,
        decimalSeparator: '.',
        thousandSeparator: ',',
        enableNotifications: true,
        autoSave: true,
        sessionTimeout: 30,
        // Email configuration
        smtpHost: this.config.systemSettings.emailConfig?.smtpHost || '',
        smtpPort: this.config.systemSettings.emailConfig?.smtpPort || 587,
        smtpSecure: this.config.systemSettings.emailConfig?.smtpSecure || false,
        smtpUser: this.config.systemSettings.emailConfig?.smtpUser || '',
        smtpPassword: this.config.systemSettings.emailConfig?.smtpPassword || '',
        fromEmail: this.config.systemSettings.emailConfig?.fromEmail || '',
        fromName: this.config.systemSettings.emailConfig?.fromName || '',
        replyToEmail: this.config.systemSettings.emailConfig?.replyToEmail || ''
      });
    }
  }

  onCurrencyChange(currency: any) {
    console.log(currency);
    this.systemSettingsForm.patchValue({
      currencyMasterSid : currency.CurrencyMasterSid,
      currencySymbol: currency.symbol,
      currencyDecimalPlaces : currency.amountDecimal
    });
  }

  toggleModuleFeature(module: 'crm' | 'operations' | 'accounts' | 'masters', featureKey: string) {
    if (!this.config.moduleFeatures[module]) {
      this.config.moduleFeatures[module] = {};
    }

    if (!this.config.moduleFeatures[module][featureKey]) {
      this.config.moduleFeatures[module][featureKey] = { enabled: false, description: '' };
    }

    this.config.moduleFeatures[module][featureKey].enabled =
      !this.config.moduleFeatures[module][featureKey].enabled;
  }

  isModuleFeatureEnabled(module: 'crm' | 'operations' | 'accounts' | 'masters', featureKey: string): boolean {
    return this.config.moduleFeatures[module]?.[featureKey]?.enabled || false;
  }

  getEnabledFeaturesCount(module: 'crm' | 'operations' | 'accounts' | 'masters'): number {
    const features = this.moduleFeatures[module];
    if (!features) return 0;
    return features.filter(f => this.isModuleFeatureEnabled(module, f.key)).length;
  }

  getTotalFeaturesCount(module: 'crm' | 'operations' | 'accounts' | 'masters'): number {
    return this.moduleFeatures[module]?.length || 0;
  }

  getValidSections(): ('crm' | 'accounts' | 'masters')[] {
    return ['masters', 'crm', 'accounts'];
  }

  toggleFieldVisibility(section: 'crm' | 'operations' | 'accounts' | 'masters', subsection: string, fieldKey: string) {
    if (!this.config.fieldCustomization[section]) {
      this.config.fieldCustomization[section] = {};
    }
    if (!this.config.fieldCustomization[section][subsection]) {
      this.config.fieldCustomization[section][subsection] = { fields: {} };
    }
    if (!this.config.fieldCustomization[section][subsection].fields[fieldKey]) {
      this.config.fieldCustomization[section][subsection].fields[fieldKey] = {
        visible: true,
        label: this.formatLabel(fieldKey)
      };
    } else {
      this.config.fieldCustomization[section][subsection].fields[fieldKey].visible =
        !this.config.fieldCustomization[section][subsection].fields[fieldKey].visible;
    }
  }

  getFieldVisibility(section: 'crm' | 'operations' | 'accounts' | 'masters', subsection: string, fieldKey: string): boolean {
    return this.config.fieldCustomization[section]?.[subsection]?.fields?.[fieldKey]?.visible ?? false;
  }

  getFieldLabel(section: 'crm' | 'operations' | 'accounts' | 'masters', subsection: string, fieldKey: string): string {
    return this.config.fieldCustomization[section]?.[subsection]?.fields?.[fieldKey]?.label || this.formatLabel(fieldKey);
  }

  getFieldKeys(section: 'crm' | 'operations' | 'accounts' | 'masters', subsection: string): string[] {
    return this.config.fieldCustomization[section]?.[subsection]?.fields ?
      Object.keys(this.config.fieldCustomization[section][subsection].fields) : [];
  }

  getSubsections(section: 'crm' | 'operations' | 'accounts' | 'masters'): string[] {
    if (!this.config.fieldCustomization[section]) return [];
    return Object.keys(this.config.fieldCustomization[section]).filter(
      key => typeof this.config.fieldCustomization[section][key] === 'object' &&
             !Array.isArray(this.config.fieldCustomization[section][key])
    );
  }

  private formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }

  onTabChange(event: any) {
    this.activeTab = event.nextId;
  }

  onDocumentConfigChange() {
  }

  saveConfiguration() {
    if (this.systemSettingsForm.invalid) {
      this.markFormGroupTouched(this.systemSettingsForm);
      return;
    }

    if (!this.companyId) {
      console.error('No company ID available');
      return;
    }

    this.isSaving = true;

    // Update config with form values
    const formValues = this.systemSettingsForm.value;
    this.config.systemSettings = {
      ...this.config.systemSettings,
      dateFormat: formValues.dateFormat,
      timeFormat: formValues.timeFormat,
      timezone: formValues.timezone,
      currency: {
        currencyMasterSid : formValues.currencyMasterSid,
        code: formValues.currencyCode,
        symbol: formValues.currencySymbol,
        position: formValues.currencyPosition,
        decimalPlaces: formValues.currencyDecimalPlaces
      },
      emailConfig: {
        smtpHost: formValues.smtpHost || '',
        smtpPort: formValues.smtpPort || 587,
        smtpSecure: formValues.smtpSecure || false,
        smtpUser: formValues.smtpUser || '',
        smtpPassword: formValues.smtpPassword || '',
        fromEmail: formValues.fromEmail || '',
        fromName: formValues.fromName || '',
        replyToEmail: formValues.replyToEmail || ''
      }
    };

    // Save using existing pattern
    this.configService.saveCompanyConfiguration(this.companyId, this.config)
      .subscribe({
        next: (response) => {
          console.log('Configuration saved successfully', response);

          // Update the company settings manager with the saved configuration
          this.companySettingsManager.setCurrentCompany(this.companyId);

          this.isSaving = false;
          this.goBackToCompany();
        },
        error: (error) => {
          console.error('Error saving configuration:', error);
          this.isSaving = false;
        }
      });
  }

  resetConfiguration() {
    this.config = this.configService.getDefaultConfiguration();
    this.updateFormValues();
  }

  goBackToCompany() {
    if (this.companyId) {
      this.router.navigate(['/master/company/entry', this.companyId], {
        state: { config: this.config }
      });
    } else {
      this.router.navigate(['/master/company/list']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.systemSettingsForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.systemSettingsForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
      if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
    }
    return '';
  }
}