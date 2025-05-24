import { Component } from '@angular/core';
import {
  NgbModal,
  NgbModalModule,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-hs-sac',
  standalone: true,
  imports: [NgbModalModule,NgSelectModule],
  templateUrl: './hs-sac.component.html',
  styleUrl: './hs-sac.component.scss',
})
export class HSSACComponent {
  modeOfTaxType = [
   { id: 'type1', name: 'type1' },
    { id: 'type2', name: 'type2' },
    { id: 'type3', name: 'type3' }
  ];
  constructor(private modalService: NgbModal) {}

  openModal(content: any): void {
    this.modalService.open(content, { centered: false, size: 'lg' });
  }
}
