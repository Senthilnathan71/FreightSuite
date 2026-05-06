import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SalespersonInfo } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-reassign-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sm-reassign-modal.component.html'
})
export class SmReassignModalComponent implements OnInit {
  @Input() meeting: any;
  @Input() salespersons: SalespersonInfo[] = [];
  @Input() currentAssignee = '';

  selectedSalespersonId: number | null = null;
  filteredSalespersons: SalespersonInfo[] = [];
  searchTerm: string = '';
  isSubmitting = false;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    this.filteredSalespersons = this.salespersons.filter(
      sp => sp.userName !== this.currentAssignee && sp.userEmail !== this.currentAssignee
    );
  }

  filterSalespersons(): void {
    if (!this.searchTerm) {
      this.filteredSalespersons = this.salespersons.filter(
        sp => sp.userName !== this.currentAssignee && sp.userEmail !== this.currentAssignee
      );
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredSalespersons = this.salespersons.filter(sp =>
        (sp.userName !== this.currentAssignee && sp.userEmail !== this.currentAssignee) &&
        (sp.userName?.toLowerCase().includes(term) ||
          sp.userEmail?.toLowerCase().includes(term))
      );
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterSalespersons();
  }

  selectSalesperson(sid: number): void {
    this.selectedSalespersonId = sid;
  }

  get isValid(): boolean {
    return !!this.selectedSalespersonId;
  }

  onSubmit() {
    if (this.isValid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.activeModal.close(this.selectedSalespersonId);
    }
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }
}
