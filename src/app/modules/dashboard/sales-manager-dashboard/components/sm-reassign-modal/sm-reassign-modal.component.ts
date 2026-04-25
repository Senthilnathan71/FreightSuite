import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SalespersonInfo } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-reassign-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sm-reassign-modal.component.html',
  styleUrls: ['./sm-reassign-modal.component.scss']
})
export class SmReassignModalComponent {
  @Input() meeting: any;
  @Input() salespersons: SalespersonInfo[] = [];
  @Input() currentAssignee = '';

  selectedSalespersonId: number | null = null;

  constructor(public activeModal: NgbActiveModal) {}

  get isValid(): boolean {
    return !!this.selectedSalespersonId;
  }

  onSubmit() {
    if (this.isValid) {
      this.activeModal.close(this.selectedSalespersonId);
    }
  }
}
