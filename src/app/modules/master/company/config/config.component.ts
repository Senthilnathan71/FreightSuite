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
  
  // Default configuration structure
  config: any = {
    masters: {
      basic: {companyName: true,companyCode: true,addressLine1: true, pan: true}
    },
    crm: {
      basic: {s3Storage: true,manageRules: true,unifiedChat: false,addException: false}
    },
    account: {
      basic: {s3Storage: true}
    },
    settings: {
      basic: {s3Storage: true}
    }
  };

  constructor(private router: Router, 
              private route: ActivatedRoute,
              private masterService: MasterService,
            ) {}
  
  hovered: string = '';
  activeSection: string = 'master';
  sectionHistory: string[] = ['master'];

  ngOnInit() {
    this.companyId = +this.route.snapshot.params['id'];
    this.companyName = history.state.companyName || '';
    
    // Load existing config if available
    const existingConfig = history.state.config;
    if (existingConfig) {
      this.mergeConfigurations(existingConfig);
    }
  }

  private mergeConfigurations(existingConfig: any) {
    // Deep merge the existing config with our default structure
    this.config = {
      ...this.config,
      ...existingConfig,
      masters: {
        basic: {
          ...this.config.masters?.basic,
          ...existingConfig.masters?.basic
        }
      },
      crm: {
        basic: {
          ...this.config.crm?.basic,
          ...existingConfig.crm?.basic
        }
      },
      account: {
        basic: {
          ...this.config.account?.basic,
          ...existingConfig.account?.basic
        }
      },
      settings: {
        basic: {
          ...this.config.settings?.basic,
          ...existingConfig.settings?.basic
        }
      }
    };
  }

  setSection(section: string): void {
    this.sectionHistory.push(section);
    this.activeSection = section;
  }

  goToPreviousSection(): void {
    if (this.sectionHistory.length > 1) {
      this.sectionHistory.pop();
      const previousSection = this.sectionHistory[this.sectionHistory.length - 1];
      this.activeSection = previousSection;
    }
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



  toggleField(section: string, subsection: string, fieldName: string) {
    if (this.config[section]?.[subsection]) {
      this.config[section][subsection][fieldName] = !this.config[section][subsection][fieldName];
    }
  }

  getConfigValue(section: string, subsection: string, fieldName: string): boolean {
    return this.config[section]?.[subsection]?.[fieldName] ?? false;
  }
}