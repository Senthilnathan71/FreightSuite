import { Component, OnDestroy } from '@angular/core';
import { ToastService } from './toast.service';
import { NgbToastModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { ToastsContainer } from './toast-container.component';

@Component({
  selector: 'app-ng-toasts',
  standalone: true,
  imports: [NgbToastModule, NgbTooltipModule, ToastsContainer],
  templateUrl: 'toast.component.html',
})
export class ToastComponent implements OnDestroy {
  constructor(public toastService: ToastService) { }

  show = true;
  show2 = true;
  showmouseover = false;
  showauto = false;
  autohide = true;

  close() {
    this.show = false;
    setTimeout(() => (this.show = true), 3000);
  }

  showStandard() {
    this.toastService.show('I am a standard toast');
  }

  showSuccess() {
    this.toastService.show('I am a success toast', {
      classname: 'bg-success text-light',
      delay: 10000,
    });
  }

  showDanger(dangerTpl: any) {
    this.toastService.show(dangerTpl, {
      classname: 'bg-danger text-light',
      delay: 15000,
    });
  }

  ngOnDestroy(): void {
    this.toastService.clear();
  }
}
