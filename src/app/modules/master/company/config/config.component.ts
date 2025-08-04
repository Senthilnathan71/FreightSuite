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
  configSid: number | null = null;
  isLoading: boolean = false;

  config: any = {
    masters: {},
    crm: {},
    account: {},
    settings: {}
  };

  hovered: string = '';
  activeSection: string = 'masters';
  sectionHistory: string[] = ['masters'];
  sections: string[] = ['masters', 'crm', 'settings', 'account'];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private masterService: MasterService
  ) {}

  ngOnInit() {
    this.companyId = +this.route.snapshot.params['id'];
    this.companyName = history.state.companyName || '';
    this.configSid = history.state.configSid || null;

    this.loadFieldConfiguration();
  }

  loadFieldConfiguration() {
    this.isLoading = true;
    this.masterService.getFieldConfiguration().subscribe({
      next: (response: any) => {
        if (response?.fieldConfig) {
          const rawConfig = response.fieldConfig;

          // Normalize fields for all sections
          ['masters', 'crm', 'account', 'settings'].forEach(section => {
            if (rawConfig[section]) {
              Object.keys(rawConfig[section]).forEach(subsection => {
                const subsectionData = rawConfig[section][subsection];
                if (!subsectionData.fields) {
                  // Convert flat object to fields format
                  rawConfig[section][subsection] = {
                    fields: Object.fromEntries(
                      Object.keys(subsectionData).map(key => [
                        key,
                        {
                          visible: subsectionData[key] === true,
                          label: this.formatLabel(key)
                        }
                      ])
                    )
                  };
                }
              });
            }
          });

          // Deep merge normalized config into default config
          const merged = { ...this.config };
          ['masters', 'crm', 'account', 'settings'].forEach(section => {
            merged[section] = this.deepMerge(this.config[section] || {}, rawConfig[section] || {});
          });

          this.config = merged;
          console.log('Normalized and merged config:', this.config);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading field configuration:', error);
        this.isLoading = false;
      }
    });
  }

  private deepMerge(target: any, source: any) {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = { ...source[key] };
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  toggleField(section: string, subsection: string, fieldKey: string) {
    if (!this.config[section]) this.config[section] = {};
    if (!this.config[section][subsection]) {
      this.config[section][subsection] = { fields: {} };
    } else if (!this.config[section][subsection].fields) {
      this.config[section][subsection].fields = {};
    }

    if (!this.config[section][subsection].fields[fieldKey]) {
      this.config[section][subsection].fields[fieldKey] = {
        visible: true,
        label: this.formatLabel(fieldKey)
      };
    } else {
      this.config[section][subsection].fields[fieldKey].visible =
        !this.config[section][subsection].fields[fieldKey].visible;
    }
  }

  private formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }

  getConfigValue(section: string, subsection: string, fieldKey: string): boolean {
    return this.config[section]?.[subsection]?.fields?.[fieldKey]?.visible ?? false;
  }

  getLabel(section: string, subsection: string, fieldKey: string): string {
    return this.config[section]?.[subsection]?.fields?.[fieldKey]?.label || this.formatLabel(fieldKey);
  }

  getFieldKeys(section: string, subsection: string): string[] {
    return this.config[section]?.[subsection]?.fields ? Object.keys(this.config[section][subsection].fields) : [];
  }

  getSubsections(section: string): string[] {
    if (!this.config[section]) return [];
    return Object.keys(this.config[section]).filter(
      key => typeof this.config[section][key] === 'object' && !Array.isArray(this.config[section][key])
    );
  }

  goToPreviousSection(): void {
    if (this.sectionHistory.length > 1) {
      this.sectionHistory.pop();
      this.activeSection = this.sectionHistory[this.sectionHistory.length - 1];
    }
  }

  setSection(section: string): void {
    this.sectionHistory.push(section);
    this.activeSection = section;
  }

  goToNextSection(): void {
    const currentIndex = this.sections.indexOf(this.activeSection);
    if (currentIndex < this.sections.length - 1) {
      this.setSection(this.sections[currentIndex + 1]);
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
    return this.sectionHistory.length <= 1 || this.activeSection === 'masters';
  }

  isNextDisabled(): boolean {
    return this.activeSection === 'account';
  }

  saveConfig() {
    if (!this.companyId) {
      console.error('No company ID available');
      return;
    }

    this.masterService.saveCompanyConfig(this.companyId, this.config)
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
