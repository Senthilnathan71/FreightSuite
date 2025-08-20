import { Component, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cost-entry',
  standalone: true,
  imports: [CommonModule, NgSelectModule],
  templateUrl: './cost-entry.component.html',
  styleUrls: ['./cost-entry.component.scss'],
})
export class CostEntryComponent {
  tabs = [
    { name: 'Cost', icon: 'fas fa-rupee-sign' },
    { name: 'Revenue', icon: 'fas fa-chart-line' }
  ];

  selectedTab = 'Cost';

  @ViewChild('costModal') costModal!: TemplateRef<any>;
  @ViewChild('revenueModal') revenueModal!: TemplateRef<any>;

  constructor(private modalService: NgbModal) {}

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  openCostModal() {
    this.modalService.open(this.costModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  openRevenueModal() {
    this.modalService.open(this.revenueModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }
}
