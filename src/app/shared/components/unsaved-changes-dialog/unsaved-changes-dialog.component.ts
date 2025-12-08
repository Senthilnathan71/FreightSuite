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
            <button type="button" class="btn btn-secondary" (click)="onCancel()">
                <i class="fas fa-times me-1"></i>Cancel
            </button>
            <button type="button" class="btn btn-danger" (click)="onDiscard()">
                <i class="fas fa-trash me-1"></i>Discard
            </button>
            <button type="button" class="btn btn-primary" (click)="onSave()">
                <i class="fas fa-save me-1"></i>Save
            </button>
        </div>
    `,
    styles: [`
        .modal-header.bg-warning {
            background-color: #fff3cd !important;
            border-bottom: 1px solid #ffc107;
        }
        .modal-title {
            color: #856404;
        }
    `]
})
export class UnsavedChangesDialogComponent {
    constructor(public activeModal: NgbActiveModal) {}

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
