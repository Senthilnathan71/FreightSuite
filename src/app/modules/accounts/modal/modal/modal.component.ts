import { Component, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  @ViewChild('addNewModal') addNewModal: any;
   @ViewChild('editModal') editModal!: TemplateRef<any>;
  constructor(private modalService: NgbModal) {}

  openModal(content: any) {
    this.modalService.open(content, { size: 'lg',centered: true });
  }

  openAddNew(currentModal: NgbModalRef) {
    currentModal.close();
    setTimeout(() => {
      this.modalService.open(this.addNewModal, {size: 'lg' , centered: true});
    }, 100);
  }
 openEditModal(currentModal: any) {
    currentModal.dismiss(); 
    setTimeout(() => {
      this.modalService.open(this.editModal, {size: 'lg', centered: true });
    }, 200); 
  }


}
