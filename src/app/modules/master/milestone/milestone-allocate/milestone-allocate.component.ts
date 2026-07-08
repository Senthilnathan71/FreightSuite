import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-milestone-allocate',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
  ],
  templateUrl: './milestone-allocate.component.html',
})
export class MilestoneAllocateComponent implements OnInit {
  // Set by the caller via modalRef.componentInstance
  @Input() sourceCompanyId!: number;
  @Input() createdBy = 'system';

  companies: { CompanyMasterSid: number; companyName: string }[] = [];
  selectedCompanyId: number | null = null;
  milestones: any[] = [];

  companiesLoading = false;
  loading = false; // milestones are being fetched
  creating = false;
  loaded = false; // a company has been selected and its milestones fetched

  constructor(
    public activeModal: NgbActiveModal,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  // Loads every company from the company master; the login company is excluded
  // since it can't be an allocation target.
  loadCompanies(): void {
    this.companiesLoading = true;
    this.masterService.getAllCompanies().subscribe({
      next: (resp: any) => {
        this.companiesLoading = false;
        const list = Array.isArray(resp) ? resp : resp?.data || [];
        this.companies = list
          .filter((c: any) => c.CompanyMasterSid !== this.sourceCompanyId)
          .map((c: any) => ({
            CompanyMasterSid: c.CompanyMasterSid,
            companyName: c.companyName || 'Unnamed Company',
          }));
      },
      error: (err) => {
        this.companiesLoading = false;
        console.error('Error loading companies:', err);
        this.appSettingService.showError('Failed to load companies');
      },
    });
  }

  get selectedCount(): number {
    return this.milestones.filter((m) => m.selected).length;
  }

  get allSelected(): boolean {
    return this.milestones.length > 0 && this.milestones.every((m) => m.selected);
  }

  onCompanyChange(): void {
    this.milestones = [];
    this.loaded = false;
    if (!this.selectedCompanyId) {
      return;
    }
    this.loading = true;
    this.masterService
      .getAllocatableMilestones(this.sourceCompanyId, this.selectedCompanyId)
      .subscribe({
        next: (resp: any) => {
          this.loading = false;
          if (resp.status) {
            this.milestones = (resp.data || []).map((m: any) => ({ ...m, selected: false }));
            this.loaded = true;
          } else {
            this.appSettingService.showError(resp.message || 'Failed to load milestones');
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error loading allocatable milestones:', err);
          this.appSettingService.showError('Failed to load milestones');
        },
      });
  }

  toggleAll(event: any): void {
    const checked = event?.target?.checked;
    this.milestones.forEach((m) => (m.selected = checked));
  }

  hasSelectedMilestones(): boolean {
    return this.selectedCount > 0;
  }

  confirm(): void {
    if (!this.selectedCompanyId) {
      this.appSettingService.showWarning('Please select a company');
      return;
    }
    const selectedSids = this.milestones
      .filter((m) => m.selected)
      .map((m) => m.MilestoneMasterSid);
    if (selectedSids.length === 0) {
      this.appSettingService.showWarning('Please select at least one milestone');
      return;
    }

    this.creating = true;
    const payload = {
      TargetCompanyMasterSid: this.selectedCompanyId,
      MilestoneMasterSids: selectedSids,
      createdBy: this.createdBy || 'system',
    };
    this.masterService.allocateMilestones(payload).subscribe({
      next: (resp: any) => {
        this.creating = false;
        if (resp.status) {
          this.appSettingService.showSuccess(resp.message || 'Milestones allocated successfully');
          this.activeModal.close(true);
        } else {
          this.appSettingService.showError(resp.message || 'Allocation failed');
        }
      },
      error: (err) => {
        this.creating = false;
        console.error('Error allocating milestones:', err);
        this.appSettingService.showError(err.error?.message || 'Allocation failed');
      },
    });
  }

  cancel(): void {
    this.activeModal.dismiss();
  }

  trackByIndex(index: number): number {
    return index;
  }
}
