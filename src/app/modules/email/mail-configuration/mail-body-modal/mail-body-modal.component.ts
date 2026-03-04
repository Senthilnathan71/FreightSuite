import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PlaceholderAutocompleteDirective } from 'src/app/core/Directives/placeholder-autocomplete.directive';

@Component({
  selector: 'app-mail-body-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, PlaceholderAutocompleteDirective],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Edit Mail Body</h5>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <textarea class="form-control" [(ngModel)]="mailBody" rows="12"
        maxlength="2000" placeholder="Enter mail body..."
        appPlaceholderAutocomplete></textarea>
      <small class="text-muted mt-1 d-block">Type <code>{{"{{"}}</code> to see available placeholders</small>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-sm btn-secondary" (click)="activeModal.dismiss()">Cancel</button>
      <button type="button" class="btn btn-sm btn-info" (click)="save()">Save</button>
    </div>
  `
})
export class MailBodyModalComponent {
  @Input() mailBody: string = '';

  constructor(public activeModal: NgbActiveModal) {}

  save(): void {
    this.activeModal.close(this.mailBody);
  }
}
