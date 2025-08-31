import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDatepickerModule,NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-invoice-entry',
  standalone: true,
  imports: [NgSelectModule, FeatherModule, NgbDatepickerModule, CommonModule],
  templateUrl: './invoice-entry.component.html',
  styleUrl: './invoice-entry.component.scss',
})
export class InvoiceEntryComponent {
  selectedTab = 'Others';
  selectTab(tab: string) {
    this.selectedTab = tab;
  }
  tabs = [
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
  ];

  ModeofStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];
  constructor(private router: Router,private modalService: NgbModal) {}
  goBack() {
    this.router.navigate(['operation/invoice/list']);
  }

   openDubaiModal(content: any) {
    this.modalService.open(content, { centered: true, size: 'md' });
  }

   openIGSTModal(content: any) {
    this.modalService.open(content, { centered: true, size: 'md' });
  }
}
