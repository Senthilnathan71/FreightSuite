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
        <span class="title-icon">
          <i class="fas fa-question-circle"></i>
        </span>
        <h5 class="modal-title">{{ title }}</h5>
      </div>
      <button type="button"
              class="btn-close"
              aria-label="Close"
              (click)="onCancel()">
      </button>
    </div>

    <div class="modal-body">
      <div class="message-panel">
        <span class="message-icon">
          <i class="fas fa-info-circle"></i>
        </span>
        <div class="message-content">
          <p class="modal-message" [innerHTML]="safeMessage"></p>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button type="button"
              class="btn btn-light cancel-btn"
              (click)="onCancel()">
        Cancel
      </button>

      <button type="button"
              class="btn btn-primary confirm-btn"
              (click)="onConfirm()">
        {{ confirmLabel }}
      </button>
    </div>
  `,
 styles: [`
  :host {
    display: block;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid #e7eef6;
  }

  .title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .title-icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    border-radius: 50%;
    background: #eaf8ff;
    color: #087aa8;
    font-size: 14px;
  }

  .modal-title {
    margin: 0;
    color: #172033;
    font-size: 15px;
    font-weight: 600;
  }

  .btn-close {
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 50%;
    background-color: #f3f6f9;
    background-size: 10px;
    opacity: .8;
  }

  .btn-close:hover {
    background-color: #e8eef5;
    opacity: 1;
  }

  .modal-body {
    padding: 14px 16px;
    background: #fff;
  }

  .message-panel {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid #dde8f1;
    border-left: 3px solid #f59e0b;
    border-radius: 6px;
    background: #f8fbff;
  }

  .message-icon {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    flex: 0 0 22px;
    border-radius: 50%;
    background: #fff7ed;
    color: #ea580c;
    font-size: 12px;
  }

  .message-content {
    min-width: 0;
  }

  .modal-message {
    margin: 0;
    color: #344054;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
    white-space: pre-line;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 0 16px 14px;
    background: #fff;
    border-top: none;
  }

  .cancel-btn,
  .confirm-btn {
    min-width: 72px;
    padding: 1px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
  }

  .cancel-btn {
    color: #475467;
    border: 1px solid #d0d5dd;
    background: #fff;
  }

  .cancel-btn:hover {
    background: #f8fafc;
  }

  .confirm-btn {
    background: #087aa8;
    border-color: #087aa8;
    box-shadow: 0 3px 10px rgba(8, 122, 168, 0.18);
  }

  .confirm-btn:hover {
    background: #06698f;
    border-color: #06698f;
  }

  @media (max-width: 575px) {
    .modal-header,
    .modal-body {
      padding: 12px;
    }

    .modal-footer {
      padding: 0 12px 12px;
    }
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
