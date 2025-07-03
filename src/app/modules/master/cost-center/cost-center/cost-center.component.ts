import { Component, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-cost-center',
  standalone: true,
  imports: [FeatherModule,NgSelectModule],
  templateUrl: './cost-center.component.html',
  styleUrl: './cost-center.component.scss'
})
export class CostCenterComponent {
   @ViewChild('content') content!: TemplateRef<any>;

  constructor(private modalService: NgbModal) {}

  openModal() {
    this.modalService.open(this.content, { size: 'lg', backdrop: 'static',centered:true });
  }

    modeOfStatus = [
    { id: '1', name: 'Active' },
    { id: '2', name: 'Suspended' },
  ];
}
