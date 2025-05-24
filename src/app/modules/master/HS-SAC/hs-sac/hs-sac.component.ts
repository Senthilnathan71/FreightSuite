import { Component } from '@angular/core';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-hs-sac',
  standalone: true,
  imports: [NgbModalModule],
  templateUrl: './hs-sac.component.html',
  styleUrl: './hs-sac.component.scss',
})
export class HSSACComponent {
   constructor(private modalService: NgbModal) {}

  openModal(content: any): void {
    this.modalService.open(content, { centered: false ,size:"lg"});
  }
}
