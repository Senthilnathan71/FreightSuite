import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

export type UnsavedChangesAction = 'save' | 'discard' | 'cancel';

@Component({
    selector: 'app-unsaved-changes-dialog',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="modal-header bg-warning">
            <h5 class="modal-title">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Unsaved Changes
            </h5>
            <button type="button" class="btn-close" aria-label="Close" (click)="onCancel()"></button>
        </div>
        <div class="modal-body">
            <p class="mb-0">You have unsaved changes. What would you like to do?</p>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" (click)="onCancel()">
                <i class="fas fa-times me-1"></i>Cancel
            </button>
            <button type="button" class="btn btn-danger btn-sm" style="padding:2px;" (click)="onDiscard()">
                <i class="fas fa-trash me-1"></i>Discard
            </button>
            <button type="button" class="btn btn-info btn-sm" (click)="onSave()">
                <i class="fas fa-save me-1"></i>Save
            </button>
        </div>
    `,
    styles: [`
/* Modal container */
.modal-content {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

/* Header with accent bar */
.modal-header.bg-warning {
  position: relative;
  background: #ffffff !important;
  border-bottom: none;
  padding: 1rem 1.25rem;
}

/* Left accent strip */
.modal-header.bg-warning::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 6px;
  background: linear-gradient(to bottom, #ff9800, #ffc107);
}

/* Title */
.modal-title {
  color: #333;
  font-weight: 600;
  letter-spacing: 0.4px;
}

/* Body */
.modal-body {
  padding: 1rem 1.25rem;
  font-size: 15px;
  color: #555;
  background: #fafafa;
}

/* Footer */
.modal-footer {
  border-top: none;
  padding: 0rem 1.25rem 1.4rem;
  background: #fafafa;
  gap: 0.5rem;
}

`]

})
export class UnsavedChangesDialogComponent {
    constructor(public activeModal: NgbActiveModal) { }

    onSave(): void {
        this.activeModal.close('save' as UnsavedChangesAction);
    }

    onDiscard(): void {
        this.activeModal.close('discard' as UnsavedChangesAction);
    }

    onCancel(): void {
        this.activeModal.close('cancel' as UnsavedChangesAction);
    }
}
