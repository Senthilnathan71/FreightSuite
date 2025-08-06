import { Component, OnInit } from '@angular/core';
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
  companyName: string = '';
  companyId: number | null = null;
  isLoading: boolean = false;
  isNewConfig: boolean = false;

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
    const state = history.state;
    this.companyName = state.companyName || '';
    
    // Check if we have config data passed from the company entry
    if (state.config && Object.keys(state.config).length > 0) {
      this.config = state.config;
      this.loadFieldConfiguration(false); 
    } else {
      this.loadFieldConfiguration(true); 
    }
  }

  loadFieldConfiguration(overwrite: boolean) {
    this.isLoading = true;
    this.masterService.getFieldConfiguration().subscribe({
      next: (response: any) => {
        if (response?.fieldConfig) {
          const rawConfig = response.fieldConfig;

          if (overwrite) {
            // If we're overwriting, start with default config
            this.config = {
              masters: {},
              crm: {},
              account: {},
              settings: {}
            };
          }

          // Normalize and merge config
          ['masters', 'crm', 'account', 'settings'].forEach(section => {
            if (rawConfig[section]) {
              Object.keys(rawConfig[section]).forEach(subsection => {
                const subsectionData = rawConfig[section][subsection];
                
                // Initialize section if not exists
                if (!this.config[section]) {
                  this.config[section] = {};
                }
                
                // Initialize subsection if not exists
                if (!this.config[section][subsection]) {
                  this.config[section][subsection] = { fields: {} };
                }

                // Convert flat object to fields format if needed
                if (!subsectionData.fields) {
                  Object.keys(subsectionData).forEach(key => {
                    if (!this.config[section][subsection].fields[key]) {
                      this.config[section][subsection].fields[key] = {
                        visible: subsectionData[key] === true,
                        label: this.formatLabel(key)
                      };
                    }
                  });
                } else {
                  // Merge fields if they exist in both
                  Object.keys(subsectionData.fields).forEach(key => {
                    if (!this.config[section][subsection].fields[key]) {
                      this.config[section][subsection].fields[key] = {
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
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading field configuration:', error);
        this.isLoading = false;
      }
    });
  }

  private formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
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

    this.isLoading = true;
    this.masterService.saveCompanyConfig(this.companyId, this.config)
      .subscribe({
        next: (response) => {
          console.log('Config saved successfully', response);
          this.isLoading = false;
          this.goBackToCompany();
        },
        error: (error) => {
          console.error('Error saving config:', error);
          this.isLoading = false;
        }
      });
  }
}