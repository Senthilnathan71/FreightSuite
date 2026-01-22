import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

export type ConfirmAction = 'confirm' | 'cancel';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-header bg-warning">
      <h5 class="modal-title">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ title }}
      </h5>
      <button type="button"
              class="btn-close"
              aria-label="Close"
              (click)="onCancel()">
      </button>
    </div>

    <div class="modal-body">
      <p class="mb-0">{{ message }}</p>
    </div>

    <div class="modal-footer">
      <button type="button"
              class="btn btn-secondary btn-sm"
              (click)="onCancel()">
        Cancel
      </button>

      <button type="button"
              class="btn btn-primary btn-sm"
              (click)="onConfirm()">
        {{ confirmLabel }}
      </button>
    </div>
  `,
  styles: [`
    .modal-content {
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(6px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
      overflow: hidden;
    }

    .modal-header {
      position: relative;
      background: #ffffff !important;
      border-bottom: none;
      padding: 1rem 1.25rem;
    }

    .modal-header::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 6px;
      background: linear-gradient(to bottom, #ff9800, #ffc107);
    }

    .modal-title {
      font-weight: 600;
      color: #333;
    }

    .modal-body {
      padding: 1rem 1.25rem;
      font-size: 15px;
      color: #555;
      background: #fafafa;
    }

    .modal-footer {
      border-top: none;
      padding: 0 1.25rem 1.4rem;
      background: #fafafa;
      gap: 0.5rem;
    }
  `]
})
export class ConfirmDialogComponent {

  @Input() title = 'Confirmation';
  @Input() message = '';
  @Input() confirmLabel = 'Proceed';

  constructor(public activeModal: NgbActiveModal) {}

  onConfirm(): void {
    this.activeModal.close('confirm' as ConfirmAction);
  }

  onCancel(): void {
    this.activeModal.close('cancel' as ConfirmAction);
  }
}
