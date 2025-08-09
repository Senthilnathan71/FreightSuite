import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MasterService } from '../../master.service';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, NgbAccordionModule, NgSelectModule, FormsModule],
  templateUrl: './config.component.html',
  styleUrl: './config.component.scss'
})
export class ConfigComponent implements OnInit {
  @Input() companyName: string = '';
  companyId: number | null = null;

  config: any = {
    masters: {
      basic: {
        s3Storage: true,
        manageRules: true,
        unifiedChat: true,
        addException: false
      },
      Fieldchange: {
        fields: {
          departmentName: { visible: true, label: 'Department Name' },
          departmentCode: { visible: true, label: 'Department Code' },
          departmentType: { visible: true, label: 'Department Type' },
          division: { label: "Division", visible: true },
          FCLAndLCL: { label: "FCL/LCL", visible: true },
          exportAndImport: { label: "Exp/Imp", visible: true }
        }
      }
    },
    crm: {
      basic: {
        s3Storage: true,
        manageRules: true,
        unifiedChat: false,
        addException: false
      },
      fieldchange: {
        fields: {
          customerName: { label: "Customer Name", visible: true },
          contactPerson: { label: "Contact Person", visible: true },
          email: { label: "Email", visible: true },
          phone: { label: "Phone", visible: true },
          address: { label: "Address", visible: true },
          customerType: { label: "Customer Type", visible: true }
        }
      }
    },
    accounts: {
      basic: {
        s3Storage: true,
        multiCurrency: false
      },
      fieldchange: {
        fields: {
          EffectiveFrom: { label: "Effective From", visible: true },
          FromCurrency: { label: "From Currency", visible: true },
          ToCurrency: { label: "To Currency", visible: true },
          RateFrom: { label: "Rate From", visible: true },
          SellRate: { label: "Sell Rate", visible: true },
          BuyRate: { label: "Buy Rate", visible: true },
          BankName: { label: "Bank Name", visible: true },
          Remarks: { label: "Remarks", visible: true }
        }
      }
    },
    settings: {
  basic: {
    s3Storage: true,
    auditLogs: false,
    darkMode: true
  },
  fieldchange: {
    fields: {
      MenuName: { label: "Menu Name", visible: true },
      parentId: { label: "Parent Menu", visible: true },
      MenuCode: { label: "Menu Code", visible: true },
      ModuleMasterSid: { label: "Module", visible: true },
      path: { label: "Path", visible: true },
      icon: { label: "Icon", visible: true }
    }
  }
}
  };

  hovered: string = '';
  activeSection: string = 'master';
  sectionHistory: string[] = ['master'];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private masterService: MasterService
  ) {}

  ngOnInit() {
    this.companyId = +this.route.snapshot.params['id'];
    this.companyName = history.state.companyName || '';

    const existingConfig = history.state.config;
    if (existingConfig) {
      this.mergeConfigurations(existingConfig);
    }
  }

  private normalizeConfig(config: any): any {
    const normalized: any = {};
    
    // Normalize masters section
    if (config?.masters) {
      normalized.masters = {};
      
      if (config.masters.basic) {
        normalized.masters.basic = {
          ...this.config.masters.basic,
          ...config.masters.basic
        };
      }
      
      Object.keys(this.config.masters).forEach(masterKey => {
        if (masterKey !== 'basic' && config.masters[masterKey]?.fields) {
          normalized.masters[masterKey] = {
            fields: {}
          };
          
          Object.keys(this.config.masters[masterKey].fields).forEach(fieldKey => {
            normalized.masters[masterKey].fields[fieldKey] = {
              visible: config.masters[masterKey].fields[fieldKey]?.visible ?? 
                      this.config.masters[masterKey].fields[fieldKey].visible,
              label: config.masters[masterKey].fields[fieldKey]?.label || 
                    this.config.masters[masterKey].fields[fieldKey].label
            };
          });
        }
      });
    }
    
    // Normalize CRM section
    if (config?.crm) {
      normalized.crm = {};
      
      if (config.crm.basic) {
        normalized.crm.basic = {
          ...this.config.crm.basic,
          ...config.crm.basic
        };
      }
      
      if (config.crm.fieldchange?.fields) {
        normalized.crm.fieldchange = {
          fields: {}
        };
        
        Object.keys(this.config.crm.fieldchange.fields).forEach(fieldKey => {
          normalized.crm.fieldchange.fields[fieldKey] = {
            visible: config.crm.fieldchange.fields[fieldKey]?.visible ?? 
                    this.config.crm.fieldchange.fields[fieldKey].visible,
            label: config.crm.fieldchange.fields[fieldKey]?.label || 
                  this.config.crm.fieldchange.fields[fieldKey].label
          };
        });
      }
    }
    
    // Normalize Accounts section
    if (config?.accounts) {
      normalized.accounts = {};
      
      if (config.accounts.basic) {
        normalized.accounts.basic = {
          ...this.config.accounts.basic,
          ...config.accounts.basic
        };
      }
      
      if (config.accounts.fieldchange?.fields) {
        normalized.accounts.fieldchange = {
          fields: {}
        };
        
        Object.keys(this.config.accounts.fieldchange.fields).forEach(fieldKey => {
          normalized.accounts.fieldchange.fields[fieldKey] = {
            visible: config.accounts.fieldchange.fields[fieldKey]?.visible ?? 
                    this.config.accounts.fieldchange.fields[fieldKey].visible,
            label: config.accounts.fieldchange.fields[fieldKey]?.label || 
                  this.config.accounts.fieldchange.fields[fieldKey].label
          };
        });
      }
    }
    
    // Normalize Settings section
    if (config?.settings) {
      normalized.settings = {};
      
      if (config.settings.basic) {
        normalized.settings.basic = {
          ...this.config.settings.basic,
          ...config.settings.basic
        };
      }
      
      if (config.settings.fieldchange?.fields) {
        normalized.settings.fieldchange = {
          fields: {}
        };
        
        Object.keys(this.config.settings.fieldchange.fields).forEach(fieldKey => {
          normalized.settings.fieldchange.fields[fieldKey] = {
            visible: config.settings.fieldchange.fields[fieldKey]?.visible ?? 
                    this.config.settings.fieldchange.fields[fieldKey].visible,
            label: config.settings.fieldchange.fields[fieldKey]?.label || 
                  this.config.settings.fieldchange.fields[fieldKey].label
          };
        });
      }
    }
    
    return normalized;
  }

  private mergeConfigurations(existingConfig: any) {
    const normalized = this.normalizeConfig(existingConfig);

    const mergedConfig = {
      ...this.config,
      ...normalized,
      masters: {
        ...this.config.masters,
        ...normalized.masters
      },
      crm: {
        ...this.config.crm,
        ...normalized.crm
      },
      accounts: {
        ...this.config.accounts,
        ...normalized.accounts
      },
      settings: {
        ...this.config.settings,
        ...normalized.settings
      }
    };

    this.config = mergedConfig;
  }

  toggleField(section: string, subsection: string, fieldKey: string) {
    if (subsection === 'basic') {
      this.config[section].basic[fieldKey] = !this.config[section].basic[fieldKey];
    } else {
      const field = this.config[section]?.[subsection]?.fields?.[fieldKey];
      if (field) {
        field.visible = !field.visible;
      }
    }
  }

  getConfigValue(section: string, subsection: string, fieldKey: string): boolean {
    if (subsection === 'basic') {
      return this.config[section].basic[fieldKey] ?? false;
    }
    return this.config[section]?.[subsection]?.fields?.[fieldKey]?.visible ?? false;
  }

  getMasterKeys(): string[] {
    return Object.keys(this.config.masters);
  }

  getMasterFieldKeys(master: string): string[] {
    if (master === 'basic') {
      return Object.keys(this.config.masters.basic);
    }
    return Object.keys(this.config.masters[master].fields || {});
  }

  getCrmSubsections(): string[] {
    return Object.keys(this.config.crm);
  }

  getCrmFieldKeys(subsection: string): string[] {
    if (subsection === 'basic') {
      return Object.keys(this.config.crm.basic);
    }
    return Object.keys(this.config.crm[subsection]?.fields || {});
  }

  getAccountsSubsections(): string[] {
    return Object.keys(this.config.accounts);
  }

  getAccountsFieldKeys(subsection: string): string[] {
    if (subsection === 'basic') {
      return Object.keys(this.config.accounts.basic);
    }
    return Object.keys(this.config.accounts[subsection]?.fields || {});
  }

  getSettingsSubsections(): string[] {
    return Object.keys(this.config.settings);
  }

  getSettingsFieldKeys(subsection: string): string[] {
  if (subsection === 'basic') {
    return Object.keys(this.config.settings.basic);
  }
  return Object.keys(this.config.settings[subsection]?.fields || {});
}

  getLabel(section: string, subsection: string, fieldKey: string): string {
    if (subsection === 'basic') {
      return fieldKey;
    }
    return this.config[section]?.[subsection]?.fields?.[fieldKey]?.label || fieldKey;
  }

  goToPreviousSection(): void {
    if (this.sectionHistory.length > 1) {
      this.sectionHistory.pop();
      const previousSection = this.sectionHistory[this.sectionHistory.length - 1];
      this.activeSection = previousSection;
    }
  }

  setSection(section: string): void {
    this.sectionHistory.push(section);
    this.activeSection = section;
  }

  goToNextSection(): void {
    const sections = ['master', 'crm', 'settings', 'accounts'];
    const currentIndex = sections.indexOf(this.activeSection);
    if (currentIndex < sections.length - 1) {
      const nextSection = sections[currentIndex + 1];
      this.setSection(nextSection);
    }
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

  isPreviousDisabled(): boolean {
    return this.sectionHistory.length <= 1 || this.activeSection === 'master';
  }

  isNextDisabled(): boolean {
    return this.activeSection === 'accounts';
  }

  saveConfig() {
    if (!this.companyId) {
      console.error('No company ID available');
      return;
    }

    const configToSave = {
      masters: this.config.masters,
      crm: this.config.crm,
      accounts: this.config.accounts,
      settings: this.config.settings
    };

    this.masterService.saveCompanyConfig(this.companyId, configToSave)
      .subscribe({
        next: (response) => {
          console.log('Config saved successfully', response);
          this.goBackToCompany();
        },
        error: (error) => {
          console.error('Error saving config:', error);
        }
      });
  }
}