import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-rolemenu',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './rolemenu.component.html',
  styleUrl: './rolemenu.component.scss'
})
export class RolemenuComponent {
    modalRef: any;
    constructor(
     private modalService: NgbModal,
    ) {}
    openModal(content: any): void {
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static'});
  }
} 
