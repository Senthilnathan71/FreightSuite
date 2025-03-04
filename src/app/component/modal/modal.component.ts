import { Component } from '@angular/core';
import {
  ModalDismissReasons,
  NgbDatepickerModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { StackedModalComponent } from './stackedmodal.component';

@Component({
  // tslint:disable-next-line: indent
  selector: 'app-ngbd-modal',
  templateUrl: './modal.component.html',
  standalone: true,
  imports: [FeatherModule, NgbDatepickerModule, StackedModalComponent],
})
export class NgbdModalBasicComponent {
  closeResult = '';
  constructor(private modalService: NgbModal) {}

  // modal basic
  modalOpen(modalBasic: any) {
    this.modalService
      .open(modalBasic, { ariaLabelledBy: 'modal-basic-title' })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  // modal Open Vertically Centered
  modalOpenVC(modalCenter: any) {
    this.modalService.open(modalCenter, {
      centered: true,
    });
  }

  // modal Open Backdrop Disabled
  modalOpenBackdrop(modalBackdrop: any) {
    this.modalService.open(modalBackdrop, {
      backdrop: false,
      centered: true,
    });
  }

  // modal primary
  modalPOpen(modalPrimary: any) {
    this.modalService.open(modalPrimary);
  }

  // modal info
  modalIOpen(modalInfo: any) {
    this.modalService.open(modalInfo);
  }

  // modal success
  modalSOpen(modalSuccess: any) {
    this.modalService.open(modalSuccess);
  }

  // modal danger
  modalDOpen(modalDanger: any) {
    this.modalService.open(modalDanger);
  }

  // modal warning
  modalWOpen(modalWarning: any) {
    this.modalService.open(modalWarning);
  }

  // modal Open Small
  modalOpensm(modalSmall: any) {
    this.modalService.open(modalSmall, {
      centered: true,
      size: 'sm', // size:'sm' | 'md' | 'lg'
    });
  }

  // modal Open Medium
  modalOpenmd(modalMedium: any) {
    this.modalService.open(modalMedium, {
      centered: true,
      size: 'md', // size:'sm' | 'md' | 'lg'
    });
  }

  // modal Open Large
  modalOpenlg(modalLarge: any) {
    this.modalService.open(modalLarge, {
      centered: true,
      size: 'lg', // size:'sm' | 'md' | 'lg'
    });
  }

  // modal login
  modalOpenLogin(modalLogin: any) {
    this.modalService.open(modalLogin);
  }
  // modal register
  modalOpenRegiser(modalRegiser: any) {
    this.modalService.open(modalRegiser);
  }

  // modal scroll long
  modalOpenScrollLong(modalScrollLong: any) {
    this.modalService.open(modalScrollLong);
  }

  // modal scroll long inside
  modalOpenScrollLongInside(modalScrollLongInside: any) {
    this.modalService.open(modalScrollLongInside, { scrollable: true });
  }
}
