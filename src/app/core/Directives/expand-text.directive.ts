import { Directive, ElementRef, HostListener, Input, Optional, Self } from '@angular/core';
import { NgControl, FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TextExpandModalComponent } from 'src/app/shared/components/text-expand-modal/text-expand-modal.component';

/**
 * Drop on any reactive <input>/<textarea> to open its full text in a modal
 * (live two-way bound to the same FormControl) on double-click or double-Enter.
 *
 * Usage: <input formControlName="Narration" maxlength="300" appExpandText="Narration" />
 */
@Directive({
  selector: '[appExpandText]',
  standalone: true,
})
export class ExpandTextDirective {
  /** Modal title (falls back to the host placeholder, then 'Edit Text'). */
  @Input('appExpandText') title = '';
  /** Optional explicit max length; defaults to the host's maxlength attribute. */
  @Input() expandMaxLength?: number;

  private lastEnterTime = 0;

  constructor(
    private host: ElementRef<HTMLInputElement | HTMLTextAreaElement>,
    @Optional() @Self() private ngControl: NgControl,
    private modalService: NgbModal,
  ) {}

  @HostListener('dblclick')
  onDblClick(): void {
    this.open();
  }

  @HostListener('keydown.enter', ['$event'])
  onEnter(event: Event): void {
    // Don't hijack Enter inside a textarea (newline). dblclick still works there.
    if (this.host.nativeElement.tagName === 'TEXTAREA') {
      return;
    }
    event.preventDefault();
    const now = Date.now();
    if (now - this.lastEnterTime < 400) {
      this.lastEnterTime = 0;
      this.open();
    } else {
      this.lastEnterTime = now;
    }
  }

  private open(): void {
    const control = this.ngControl?.control as FormControl | null;
    if (!control) {
      return;
    }

    const el = this.host.nativeElement;
    const maxAttr = el.getAttribute('maxlength');
    const maxLength = this.expandMaxLength ?? (maxAttr ? +maxAttr : null);

    const modalRef = this.modalService.open(TextExpandModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.control = control;
    modalRef.componentInstance.title = this.title || el.getAttribute('placeholder') || 'Edit Text';
    modalRef.componentInstance.maxLength = maxLength;
    modalRef.componentInstance.placeholder = el.getAttribute('placeholder') || '';
    // Re-run the host's own (input) handler (e.g. header->detail sync) on each keystroke.
    modalRef.componentInstance.onInput = () =>
      el.dispatchEvent(new Event('input', { bubbles: true }));

    modalRef.result.catch(() => {}); // dismiss is a no-op; value is already live-bound
  }
}
