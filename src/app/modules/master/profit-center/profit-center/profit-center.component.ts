import { Component, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-profit-center',
  standalone: true,
  imports: [FeatherModule,NgSelectModule],
  templateUrl: './profit-center.component.html',
  styleUrl: './profit-center.component.scss'
})
export class ProfitCenterComponent {
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
