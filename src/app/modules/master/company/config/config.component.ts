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
      department: {
        fields: {
          departmentName: { visible: true, label: 'Department Name' },
          departmentCode: { visible: true, label: 'Department Code' },
          departmentType: { visible: true, label: 'Department Type' }
        }
      }
    },
    crm: {
      basic: {
        s3Storage: true,
        manageRules: true,
        unifiedChat: false,
        addException: false
      }
    },
    account: {
      basic: {
        s3Storage: true
      }
    },
    settings: {
      basic: {
        s3Storage: true
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
    const departmentFields = config?.masters?.department?.fields || {};
    return {
      ...config,
      masters: {
        department: {
          fields: {
            departmentName: {
              visible: departmentFields?.departmentName?.visible ?? true,
              label: departmentFields?.departmentName?.label || 'Department Name'
            },
            departmentCode: {
              visible: departmentFields?.departmentCode?.visible ?? true,
              label: departmentFields?.departmentCode?.label || 'Department Code'
            },
            departmentType: {
              visible: departmentFields?.departmentType?.visible ?? true,
              label: departmentFields?.departmentType?.label || 'Department Type'
            }
          }
        }
      }
    };
  }

  private mergeConfigurations(existingConfig: any) {
    const normalized = this.normalizeConfig(existingConfig);

    this.config = {
      ...this.config,
      ...normalized,
      masters: {
        department: {
          fields: {
            ...this.config.masters.department.fields,
            ...normalized.masters.department.fields
          }
        }
      },
      crm: {
        basic: {
          ...this.config.crm.basic,
          ...normalized.crm?.basic
        }
      },
      account: {
        basic: {
          ...this.config.account.basic,
          ...normalized.account?.basic
        }
      },
      settings: {
        basic: {
          ...this.config.settings.basic,
          ...normalized.settings?.basic
        }
      }
    };
  }

  toggleField(section: string, subsection: string, fieldKey: string) {
    const field = this.config[section]?.[subsection]?.fields?.[fieldKey];
    if (field) {
      field.visible = !field.visible;
    }
  }

  getConfigValue(section: string, subsection: string, fieldKey: string): boolean {
    return this.config[section]?.[subsection]?.fields?.[fieldKey]?.visible ?? false;
  }

  getLabel(section: string, subsection: string, fieldKey: string): string {
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
    const sections = ['master', 'crm', 'settings', 'account'];
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
    return this.activeSection === 'account';
  }

  saveConfig() {
    if (!this.companyId) {
      console.error('No company ID available');
      return;
    }

    const configToSave = {
      masters: this.config.masters,
      crm: this.config.crm,
      account: this.config.account,
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
