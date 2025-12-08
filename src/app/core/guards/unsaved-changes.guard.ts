import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HasUnsavedChanges } from '../interfaces/has-unsaved-changes.interface';
import { UnsavedChangesDialogComponent, UnsavedChangesAction } from '../../shared/components/unsaved-changes-dialog/unsaved-changes-dialog.component';

@Injectable({
    providedIn: 'root'
})
export class UnsavedChangesGuard implements CanDeactivate<HasUnsavedChanges> {

    constructor(private modalService: NgbModal) {}

    canDeactivate(component: HasUnsavedChanges): Observable<boolean> | boolean {
        // Check if component implements the interface and has unsaved changes
        if (!component || typeof component.hasUnsavedChanges !== 'function') {
            return true;
        }

        if (!component.hasUnsavedChanges()) {
            return true;
        }

        // Open the confirmation dialog
        const modalRef = this.modalService.open(UnsavedChangesDialogComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false
        });

        return from(modalRef.result).pipe(
            switchMap((action: UnsavedChangesAction) => {
                switch (action) {
                    case 'save':
                        // Call saveChanges and return the result
                        return from(component.saveChanges());
                    case 'discard':
                        // Allow navigation without saving
                        return of(true);
                    case 'cancel':
                    default:
                        // Stay on current page
                        return of(false);
                }
            })
        );
    }
}
