import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbAccordionModule, NgbNavModule, NgbTooltipModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

import { CompanyConfigService } from '../services/company-config.service';
import { MasterService } from '../../master.service';
import { CompanySettingsManagerService } from '../../../../core/services/company-settings-manager.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

interface CompanyConfig {
  CompanyMasterSid: number;
  ConfigurationName: string;
  ConfigurationValue: any;
  ConfigurationType: 'string' | 'number' | 'boolean' | 'email-array' | 'json';
  CompanyConfigurationSid?: number;
}

@Component({
  selector: 'app-company-config',
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
  templateUrl: './company-config.component.html',
  styleUrl: './company-config.component.scss'
})
export class CompanyConfigComponent implements OnInit {
  companyName: string = '';
  companyId: number | null = null;
  isLoading: boolean = false;
  isSaving: boolean = false;
  activeTab: string = 'general-settings';
  isCreateMode: boolean = false;
   tempCompanyData: any = null;
  tempCompanyId: string | null = null;

  // Forms
  configForm!: FormGroup;

  // Configuration templates
  configTemplates = [
    {
      name: 'QuoteRateLockUser',
      displayName: 'Quote Rate Lock Users',
     
      type: 'email-array' as const,
      defaultValue: []
    },
    {
      name: 'ExchangeJVCOA',
      displayName: 'Exchange JV COA',
      
      type: 'number' as const,
      defaultValue: null
    },
    
  ];

  // Current configurations
  currentConfigs: CompanyConfig[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private configService: CompanyConfigService,
    private masterService: MasterService,
    private companySettingsManager: CompanySettingsManagerService,
    private modalService: NgbModal,
    private appSettingService: AppSettingsService,
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.companyId = +this.route.snapshot.params['id'];
    const state = history.state;
    this.companyName = state.companyName || '';
     this.tempCompanyData = state.companyData || null;
    this.tempCompanyId = state.tempCompanyId || null;
    
    // Check if we're in create mode (companyId is null or 0)
    this.isCreateMode = !this.companyId || this.companyId === 0;

    this.loadConfiguration();
  }

  private initializeForm() {
    this.configForm = this.fb.group({
      configurations: this.fb.array([])
    });
  }

  get configurations(): FormArray {
    return this.configForm.get('configurations') as FormArray;
  }

  private createConfigFormGroup(configTemplate: any, existingValue?: any): FormGroup {
    let value = existingValue !== undefined ? existingValue : configTemplate.defaultValue;
    
    // Handle email arrays
    if (configTemplate.type === 'email-array' && Array.isArray(value)) {
      value = value.join(', ');
    }

    return this.fb.group({
      ConfigurationName: [configTemplate.name],
      DisplayName: [configTemplate.displayName],
      Description: [configTemplate.description],
      Type: [configTemplate.type],
      Value: [value, this.getValidatorsForType(configTemplate.type)]
    });
  }

  private getValidatorsForType(type: string) {
    switch (type) {
      case 'email-array':
        return [this.emailArrayValidator()];
      case 'number':
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
      
      const emails = control.value.split(',').map((email: string) => email.trim()).filter((email: string) => email);
      
      for (const email of emails) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return { invalidEmail: true };
        }
      }
      
      return null;
    };
  }

  private loadConfiguration() {
    this.isLoading = true;

    if (this.companyId && !this.isCreateMode) {
      // Load existing configurations for existing company
      this.masterService.getAllCompanyConfigsByCompanyId(this.companyId).subscribe({
        next: (response: any) => {
          this.currentConfigs = response || [];
          this.initializeConfigurations();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading configurations:', error);
          this.initializeConfigurations(); // Initialize with defaults if error
          this.isLoading = false;
        }
      });
    } else {
      // Create mode - initialize with empty/default values
      this.initializeConfigurations();
      this.isLoading = false;
    }
  }

  private initializeConfigurations() {
    // Clear existing configurations
    while (this.configurations.length !== 0) {
      this.configurations.removeAt(0);
    }

    // Create form groups for each template
    this.configTemplates.forEach(template => {
      const existingConfig = this.currentConfigs.find(config => 
        config.ConfigurationName === template.name
      );
      
      const formGroup = this.createConfigFormGroup(
        template, 
        existingConfig?.ConfigurationValue
      );
      
      this.configurations.push(formGroup);
    });
  }

 

  isConfigInvalid(index: number): boolean {
    const config = this.configurations.at(index);
    const valueControl = config.get('Value');
    return valueControl ? valueControl.invalid && (valueControl.dirty || valueControl.touched) : false;
  }

  getConfigError(index: number): string {
    const config = this.configurations.at(index);
    const valueControl = config.get('Value');
    
    if (valueControl?.errors) {
      if (valueControl.errors['required']) return 'This field is required';
      if (valueControl.errors['invalidEmail']) return 'Contains invalid email address';
      if (valueControl.errors['pattern']) return 'Must be a valid number';
    }
    
    return '';
  }

   saveConfiguration() {
    if (this.configForm.invalid) {
      this.markFormArrayTouched(this.configurations);
      return;
    }

    this.isSaving = true;

    if (this.isCreateMode) {
      this.handleCreateModeSave();
    } else {
      this.updateConfiguration();
    }
  }
    private handleCreateModeSave() {
    // In create mode, we need to handle the configuration differently
    if (this.tempCompanyData) {
      // Option 1: Store config temporarily and link when company is created
      this.storeTemporaryConfiguration();
    } else {
      this.appSettingService.showError('Company data is required to save configuration.');
      this.isSaving = false;
    }
  }
  private storeTemporaryConfiguration() {
    const configData = {
      companyName: this.companyName,
      companyData: this.tempCompanyData,
      configurations: this.prepareCreatePayload(),
      tempCompanyId: this.tempCompanyId,
      timestamp: new Date().toISOString()
    };

    // Store in local storage or service for later retrieval
    localStorage.setItem(`temp_company_config_${this.tempCompanyId}`, JSON.stringify(configData));
    
    this.appSettingService.showSuccess('Configuration saved temporarily. It will be linked when company is created.');
    this.isSaving = false;
    this.goBackToCompany();
  }

  private createConfiguration() {
    const payload = this.prepareCreatePayload();

    if (payload.length === 1) {
      // Single configuration - use createCompanyConfig
      this.masterService.createCompanyConfig(payload[0]).subscribe({
        next: (response) => {
          console.log('Configuration created successfully', response);
          this.appSettingService.showSuccess('Configuration created successfully');
          this.isSaving = false;
          this.goBackToCompany();
        },
        error: (error) => {
          console.error('Error creating configuration:', error);
          this.appSettingService.showError('Error creating configuration');
          this.isSaving = false;
        }
      });
    } else {
      // Multiple configurations - use createBulkCompanyConfigs
      this.masterService.createBulkCompanyConfigs(payload).subscribe({
        next: (response) => {
          console.log('Configurations created successfully', response);
          this.appSettingService.showSuccess('Configurations created successfully');
          this.isSaving = false;
          this.goBackToCompany();
        },
        error: (error) => {
          console.error('Error creating configurations:', error);
          this.appSettingService.showError('Error creating configurations');
          this.isSaving = false;
        }
      });
    }
  }

  private updateConfiguration() {
    const payload = this.prepareUpdatePayload();

    this.masterService.bulkUpdateCompanyConfigs(payload).subscribe({
      next: (response) => {
        console.log('Configuration updated successfully', response);
        this.appSettingService.showSuccess('Configuration updated successfully');
        this.isSaving = false;
        this.goBackToCompany();
      },
      error: (error) => {
        console.error('Error updating configuration:', error);
        this.appSettingService.showError('Error updating configuration');
        this.isSaving = false;
      }
    });
  }

   private prepareCreatePayload(): any[] {
    return this.configurations.value.map((config: any) => {
      let processedValue = config.Value;

      // Process based on type
      switch (config.Type) {
        case 'email-array':
          if (typeof processedValue === 'string') {
            processedValue = processedValue.split(',').map((email: string) => email.trim()).filter((email: string) => email).join(', ');
          } else if (Array.isArray(processedValue)) {
            processedValue = processedValue.join(', ');
          }
          break;
        case 'number':
          processedValue = processedValue ? Number(processedValue).toString() : null;
          break;
        case 'boolean':
          processedValue = Boolean(processedValue).toString();
          break;
        default:
          processedValue = processedValue !== null && processedValue !== undefined ? processedValue.toString() : '';
      }

      return {
        CompanyMasterSid: this.companyId, // This will be null in create mode
        ConfigurationName: config.ConfigurationName,
        ConfigurationValue: processedValue
      };
    });
  }

  private prepareUpdatePayload(): any {
  const configurations = this.configurations.value.map((config: any) => {
    let processedValue = config.Value;

    // Process based on type - CONVERT ARRAYS TO STRINGS
    switch (config.Type) {
      case 'email-array':
        // Convert array to comma-separated string
        if (Array.isArray(processedValue)) {
          processedValue = processedValue.join(', ');
        } else if (typeof processedValue === 'string') {
          // If it's already a string, ensure it's properly formatted
          processedValue = processedValue.split(',').map((email: string) => email.trim()).filter((email: string) => email).join(', ');
        }
        break;
      case 'number':
        processedValue = processedValue ? Number(processedValue) : null;
        // Convert to string if your Prisma expects string for numbers
        processedValue = processedValue !== null ? processedValue.toString() : null;
        break;
      case 'boolean':
        processedValue = Boolean(processedValue);
        // Convert to string if your Prisma expects string for booleans
        processedValue = processedValue.toString();
        break;
      default:
        // Ensure all values are strings
        processedValue = processedValue !== null && processedValue !== undefined ? processedValue.toString() : '';
    }

    // Find existing config to get CompanyConfigurationSid if it exists
    const existingConfig = this.currentConfigs.find(c => c.ConfigurationName === config.ConfigurationName);

    return {
      CompanyConfigurationSid: existingConfig?.CompanyConfigurationSid || null,
      CompanyMasterSid: this.companyId,
      ConfigurationName: config.ConfigurationName,
      ConfigurationValue: processedValue  // This should now always be a string
    };
  });

  return {
    CompanyMasterSid: this.companyId,
    configurations: configurations
  };
}

  private markFormArrayTouched(formArray: FormArray) {
    formArray.controls.forEach(control => {
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(key => {
          const formControl = control.get(key);
          formControl?.markAsTouched();
        });
      }
    });
  }

  resetConfiguration() {
    this.initializeConfigurations();
  }

  goBackToCompany() {
    if (this.companyId) {
      this.router.navigate(['/master/company/entry', this.companyId]);
    } else {
      // Go back to company creation
      this.router.navigate(['/master/company/entry']);
    }
  }

  onTabChange(event: any) {
    this.activeTab = event.nextId;
  }

  // Helper method to check if we're in create mode
  isInCreateMode(): boolean {
    return this.isCreateMode;
  }
  
}