import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type ConfirmAction = 'confirm' | 'cancel';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-header">
      <div class="title-wrap">
        <div>
          <h5 class="modal-title">{{ title }}</h5>
        </div>
      </div>
      <button type="button"
              class="btn-close"
              aria-label="Close"
              (click)="onCancel()">
      </button>
    </div>

    <div class="modal-body">
      <div class="message-panel">
        <div class="message-accent"></div>
        <div class="message-content">
          <p class="modal-message" [innerHTML]="safeMessage"></p>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button type="button"
              class="btn btn-secondary btn-sm"
              (click)="onCancel()">
        Cancel
      </button>

      <button type="button"
              class="btn btn-info btn-sm"
              (click)="onConfirm()">
        {{ confirmLabel }}
      </button>
    </div>
  `,
  styles: [`
    .modal-content {
      border-radius: 20px;
      background: #ffffff;
      box-shadow: 0 26px 60px rgba(15, 23, 42, 0.2);
      overflow: hidden;
      border: 1px solid #e6edf5;
    }

    .modal-header {
      position: relative;
      background: linear-gradient(90deg, #f8fbff 0%, #ffffff 100%) !important;
      border-bottom: none;
      padding: 1.1rem 1.4rem 0.85rem 1.4rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .modal-header::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 2px;
      background: linear-gradient(90deg, #0ea5e9, #38bdf8, #bae6fd);
    }

    .title-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .modal-title {
      font-weight: 600;
      color: #333;
    }


    .modal-body {
      padding: 1.1rem 1.4rem 0.9rem 1.4rem;
      font-size: 15px;
      color: #555;
      background: #ffffff;
    }
      
    .modal-message {
      white-space: pre-line;
      margin: 0;
    }

    .modal-footer {
      border-top: none;
      padding: 0.5rem 1.25rem 0.75rem;
      background: #ffffff;
      gap: 0.5rem;
    }

    .message-panel {
      display: grid;
      grid-template-columns: 6px 1fr;
      gap: 12px;
      border-radius: 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .message-accent {
      background: linear-gradient(180deg, #f59e0b, #f97316);
    }

    .message-content {
      padding: 12px 14px;
    }

  `]
})
export class ConfirmDialogComponent {

  @Input() title = 'Confirmation';
  // @Input() message = '';
  @Input() confirmLabel = 'Proceed';

  safeMessage!: SafeHtml;

  @Input() set message(value: string) {
    this.safeMessage = this.sanitizer.bypassSecurityTrustHtml(value);
  }

  constructor(public activeModal: NgbActiveModal,private sanitizer: DomSanitizer) {}

  onConfirm(): void {
    this.activeModal.close('confirm' as ConfirmAction);
  }

  onCancel(): void {
    this.activeModal.close('cancel' as ConfirmAction);
  }
}
