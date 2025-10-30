import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';

@Component({
  selector: 'app-common-entry-header',
  standalone: true,
  imports: [
    CommonModule,
    NgbDropdownModule,
    PreventMultiClickDirective
  ],
  templateUrl: './common-entry-header.component.html',
  styleUrls: ['./common-entry-header.component.scss']
})
export class CommonEntryHeaderComponent {
  @Input() isEditMode: boolean = false;
  @Input() pageTitle: string = '';
  @Input() iconClass: string = 'fas fa-file-alt';
  @Input() formInvalid: boolean = false;
  @Input() formPristine: boolean = true;
  @Input() showInfoButton: boolean = false;
  @Input() hasAnyDropdownPermission: boolean = false;
  @Input() permissions: string[] = [];
  
  // Permission-based button visibility
  @Input() showCreateButton: boolean = true;
  @Input() showSaveButton: boolean = true;
  @Input() showLogsButton: boolean = true;
  
  // Dropdown button permissions
  @Input() showEdocButton: boolean = false;
  @Input() showTandCButton: boolean = false;
  @Input() showAuthorityButton: boolean = false;
  @Input() showEmailButton: boolean = false;

  // Event emitters
  @Output() createNew = new EventEmitter<void>();
  @Output() goBack = new EventEmitter<void>();
  @Output() resetForm = new EventEmitter<void>();
  @Output() saveForm = new EventEmitter<void>();
  @Output() showInfo = new EventEmitter<void>();
  @Output() openAuditLogs = new EventEmitter<TemplateRef<any>>();
  @Output() openEdoc = new EventEmitter<void>();
  @Output() openTandC = new EventEmitter<void>();
  @Output() openAuthority = new EventEmitter<void>();
  @Output() openEmail = new EventEmitter<void>();

  constructor(
    private router: Router,
    private modalService: NgbModal
  ) {}

  onCreateNew(): void {
    this.createNew.emit();
  }

  onGoBack(): void {
    this.goBack.emit();
  }

  onResetForm(): void {
    this.resetForm.emit();
  }

  onSaveForm(): void {
    this.saveForm.emit();
  }

  onShowInfo(): void {
    this.showInfo.emit();
  }

  onOpenAuditLogs(modal: TemplateRef<any>): void {
    this.openAuditLogs.emit(modal);
  }

  onOpenEdoc(): void {
    this.openEdoc.emit();
  }

  onOpenTandC(): void {
    this.openTandC.emit();
  }

  onOpenAuthority(): void {
    this.openAuthority.emit();
  }

  onOpenEmail(): void {
    this.openEmail.emit();
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }
}