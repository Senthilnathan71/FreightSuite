import { Component, ViewChild, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-revenue-entry',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './revenue-entry.component.html',
  styleUrl: './revenue-entry.component.scss',
})
export class RevenueEntryComponent {
  @ViewChild('revenueModal') revenueModal!: TemplateRef<any>;

  constructor(private modalService: NgbModal) {}

  openRevenueModal() {
    this.modalService.open(this.revenueModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }
}
