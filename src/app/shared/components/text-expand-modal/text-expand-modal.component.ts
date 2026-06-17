import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';

/**
 * Generic "expand text" modal. Edits a local copy and pushes it to the passed
 * FormControl via setValue() on every keystroke, so the source field updates
 * live (two-way) without the fragility of binding one control to two views.
 * Opened via the `appExpandText` directive (or manually through NgbModal).
 */
@Component({
  selector: 'app-text-expand-modal',
  standalone: true,
  imports: [CommonModule, ElementStateGuardDirective],
  templateUrl: './text-expand-modal.component.html',
  styleUrl: './text-expand-modal.component.scss',
})
export class TextExpandModalComponent implements OnInit, AfterViewInit {
  @Input() control!: FormControl; // source control to keep in sync
  @Input() title = 'Edit Text';
  @Input() maxLength: number | null = null; // null => no char-count cap shown
  @Input() placeholder = '';
  @Input() onInput?: () => void; // fired on each keystroke
  @Input() disabled = false; // locked state mirrored from the host field (readonly/native/reactive)

  @ViewChild('ta') ta?: ElementRef<HTMLTextAreaElement>;

  text = '';

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    this.text = this.control?.value ?? '';
  }

  ngAfterViewInit(): void {
    const el = this.ta?.nativeElement;
    if (el && !this.isDisabled) {
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len); // cursor at end
    }
  }

  get isDisabled(): boolean {
    return this.disabled || !!this.control?.disabled;
  }

  get length(): number {
    return this.text?.length ?? 0;
  }

  onModelChange(value: string): void {
    if (this.isDisabled) {
      return; // locked field — ignore edits
    }
    this.text = value;
    if (this.control) {
      this.control.setValue(value);
      this.control.markAsDirty();
    }
    this.onInput?.();
  }

  /** Plain Enter saves & closes; Shift+Enter inserts a line break. */
  onEnter(event: Event): void {
    if ((event as KeyboardEvent).shiftKey) {
      return; // allow the newline
    }
    event.preventDefault();
    this.close();
  }

  close(): void {
    this.activeModal.close(this.text);
  }
}
