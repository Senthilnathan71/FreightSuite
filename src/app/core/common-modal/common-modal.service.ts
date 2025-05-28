import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModalComponent } from '../common-modal/common-modal.component';

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    constructor(private modalService: NgbModal) { }

    openSuccessModal(message: string, title: string = 'Success') {
        const modalRef = this.modalService.open(CommonModalComponent, { centered: true });
        modalRef.componentInstance.title = title;
        modalRef.componentInstance.message = message;
        modalRef.componentInstance.isError = false;
        modalRef.componentInstance.icon = 'bi bi-check-circle'; // Bootstrap success icon
        // Auto-close the modal after 500ms
        setTimeout(() => {
            modalRef.close();
        }, 1500);

    }

    openErrorModal(message: string, title: string = 'Error') {
        const modalRef = this.modalService.open(CommonModalComponent, { centered: true });
        modalRef.componentInstance.title = title;
        modalRef.componentInstance.message = message;
        modalRef.componentInstance.isError = true;
        modalRef.componentInstance.icon = 'bi bi-x-circle'; // Bootstrap error icon
        // Auto-close the modal after 500ms
        setTimeout(() => {
            modalRef.close();
        }, 1500);

    }
}
