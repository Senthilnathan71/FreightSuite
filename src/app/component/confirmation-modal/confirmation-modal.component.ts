// confirmation-dialog.component.ts
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-header bg-info text-white">
      <h5 class="modal-title">{{ header }}</h5>
      <button type="button" class="btn-close btn-close-white" aria-label="Close" (click)="dismiss()"></button>
    </div>
    
    <div class="modal-body">
      <ng-container *ngIf="bodyTemplate; else defaultBody">
        <ng-container *ngTemplateOutlet="bodyTemplate"></ng-container>
      </ng-container>
      <ng-template #defaultBody>
        <p class="mb-0">{{ body }}</p>
      </ng-template>
    </div>
    
    <div class="modal-footer">
      <button type="button" class="btn btn-light" (click)="onNo()">{{ noButtonText }}</button>
      <button type="button" class="btn bg-info text-white" (click)="onYes()">{{ yesButtonText }}</button>
    </div>
  `
})
export class ConfirmationDialogComponent {
  @Input() header: string = 'Confirm';
  @Input() body: string = 'Are you sure?';
  @Input() bodyTemplate?: any;
  @Input() yesButtonText: string = 'Yes';
  @Input() noButtonText: string = 'No';

  constructor(public activeModal: NgbActiveModal) {}

  onYes() {
    this.activeModal.close('yes');
  }

  onNo() {
    this.activeModal.close('no');
  }

  dismiss() {
    this.activeModal.dismiss('dismiss');
  }
}

// ============================================
// USAGE EXAMPLE IN PARENT COMPONENT
// ============================================

// parent.component.ts
/*
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

@Component({
  selector: 'app-parent',
  standalone: true,
  imports: [],
  template: `
    <div class="container mt-5">
      <h1>Confirmation Dialog Examples</h1>
      
      <div class="btn-group" role="group">
        <button class="btn btn-danger" (click)="showDeleteDialog()">Delete Item</button>
        <button class="btn btn-warning" (click)="showUnsavedDialog()">Unsaved Changes</button>
        <button class="btn btn-primary" (click)="showCustomDialog()">Custom Template</button>
      </div>

      <!-- Custom template for dialog body -->
      <ng-template #customBody>
        <div>
          <p><strong>Please review your information:</strong></p>
          <ul>
            <li>Name: John Doe</li>
            <li>Email: john@example.com</li>
            <li>Items: 5</li>
          </ul>
          <p>Are you ready to submit?</p>
        </div>
      </ng-template>
    </div>
  `
})
export class ParentComponent {
  @ViewChild('customBody') customBodyTemplate!: TemplateRef<any>;

  constructor(private modalService: NgbModal) {}

  // Example 1: Simple delete confirmation
  showDeleteDialog() {
    const modalRef = this.modalService.open(ConfirmationDialogComponent, {
      centered: true,
      backdrop: 'static'
    });

    modalRef.componentInstance.header = 'Delete Confirmation';
    modalRef.componentInstance.body = 'Are you sure you want to delete this item? This action cannot be undone.';
    modalRef.componentInstance.yesButtonText = 'Delete';
    modalRef.componentInstance.noButtonText = 'Cancel';

    modalRef.result.then(
      (result) => {
        if (result === 'yes') {
          console.log('Item deleted!');
          this.handleDelete();
        } else if (result === 'no') {
          console.log('Delete cancelled');
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
  }

  // Example 2: Unsaved changes confirmation
  showUnsavedDialog() {
    const modalRef = this.modalService.open(ConfirmationDialogComponent, {
      centered: true
    });

    modalRef.componentInstance.header = 'Unsaved Changes';
    modalRef.componentInstance.body = 'You have unsaved changes. Do you want to discard them?';
    modalRef.componentInstance.yesButtonText = 'Discard';
    modalRef.componentInstance.noButtonText = 'Keep Editing';

    modalRef.result.then(
      (result) => {
        if (result === 'yes') {
          console.log('Changes discarded');
          this.discardChanges();
        } else {
          console.log('Continue editing');
        }
      }
    );
  }

  // Example 3: Custom template body
  showCustomDialog() {
    const modalRef = this.modalService.open(ConfirmationDialogComponent, {
      centered: true,
      size: 'lg'
    });

    modalRef.componentInstance.header = 'Confirm Submission';
    modalRef.componentInstance.bodyTemplate = this.customBodyTemplate;
    modalRef.componentInstance.yesButtonText = 'Submit';
    modalRef.componentInstance.noButtonText = 'Review';

    modalRef.result.then(
      (result) => {
        if (result === 'yes') {
          console.log('Form submitted');
          this.submitForm();
        } else {
          console.log('Reviewing form');
        }
      }
    );
  }

  handleDelete() {
    // Your delete logic here
    alert('Item deleted successfully!');
  }

  discardChanges() {
    // Your discard logic here
    alert('Changes discarded!');
  }

  submitForm() {
    // Your submit logic here
    alert('Form submitted!');
  }
}
*/

// ============================================
// ALTERNATIVE: SERVICE-BASED APPROACH
// ============================================

/*
// confirmation-dialog.service.ts
import { Injectable, TemplateRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

export interface ConfirmDialogConfig {
  header?: string;
  body?: string;
  bodyTemplate?: TemplateRef<any>;
  yesButtonText?: string;
  noButtonText?: string;
  centered?: boolean;
  size?: 'sm' | 'lg' | 'xl';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  constructor(private modalService: NgbModal) {}

  confirm(config: ConfirmDialogConfig = {}): Promise<boolean> {
    const modalRef = this.modalService.open(ConfirmationDialogComponent, {
      centered: config.centered !== false,
      backdrop: 'static',
      size: config.size
    });

    // Set component inputs
    if (config.header) modalRef.componentInstance.header = config.header;
    if (config.body) modalRef.componentInstance.body = config.body;
    if (config.bodyTemplate) modalRef.componentInstance.bodyTemplate = config.bodyTemplate;
    if (config.yesButtonText) modalRef.componentInstance.yesButtonText = config.yesButtonText;
    if (config.noButtonText) modalRef.componentInstance.noButtonText = config.noButtonText;

    return modalRef.result.then(
      (result) => result === 'yes',
      () => false
    );
  }
}

// Usage in component:
// constructor(private confirmService: ConfirmationDialogService) {}
//
// async deleteItem() {
//   const confirmed = await this.confirmService.confirm({
//     header: 'Delete Item',
//     body: 'Are you sure?',
//     yesButtonText: 'Delete',
//     noButtonText: 'Cancel'
//   });
//
//   if (confirmed) {
//     // Perform delete
//   }
// }
*/