import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';

/**
 * Generic "expand text" modal. Shows a selectable read-only copy of the source
 * FormControl value so users can inspect/copy long text without editing it here.
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
  @Input() compact = false;

  @ViewChild('ta') ta?: ElementRef<HTMLTextAreaElement>;

  text = '';

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    this.text = this.control?.value ?? '';
  }

  ngAfterViewInit(): void {
    const el = this.ta?.nativeElement;
    if (!el) {
      return;
    }

    setTimeout(() => this.fitTextareaToContent());

    el.focus();
    el.select();
  }

  get length(): number {
    return this.text?.length ?? 0;
  }

  get rows(): number {
    return 1;
  }

  /** Enter closes the read-only preview. */
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

  private fitTextareaToContent(): void {
    const el = this.ta?.nativeElement;
    if (!el) {
      return;
    }

    el.style.height = 'auto';
    const minHeight = this.compact ? 48 : 72;
    const maxHeight = Math.round(window.innerHeight * 0.55);
    const nextHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }
}
