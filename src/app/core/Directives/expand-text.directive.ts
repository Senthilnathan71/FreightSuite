import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  Optional,
  Renderer2,
  Self,
} from '@angular/core';
import { NgControl, FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TextExpandModalComponent } from 'src/app/shared/components/text-expand-modal/text-expand-modal.component';

/**
 * Drop on any reactive <input>/<textarea> to open its full text in a modal
 * (live two-way bound to the same FormControl) on double-click or double-Enter.
 *
 * Usage: <input formControlName="Narration" maxlength="300" appExpandText="Narration" />
 *
 * Works on locked fields too: a natively `disabled` input fires no mouse events,
 * so when disabled the host is made `pointer-events: none` and the double-click is
 * caught on the parent (which is not a `formcontrolname` element, so the app's form
 * guards don't block it). The modal then opens read-only.
 */
@Directive({
  selector: '[appExpandText]',
  standalone: true,
})
export class ExpandTextDirective implements AfterViewInit, OnDestroy {
  /** Modal title (falls back to the host placeholder, then 'Edit Text'). */
  @Input('appExpandText') title = '';
  /** Optional explicit max length; defaults to the host's maxlength attribute. */
  @Input() expandMaxLength?: number;

  private lastEnterTime = 0;
  private removeParentListener?: () => void;

  constructor(
    private host: ElementRef<HTMLInputElement | HTMLTextAreaElement>,
    @Optional() @Self() private ngControl: NgControl,
    private modalService: NgbModal,
    private renderer: Renderer2,
  ) {}

  /** Make a disabled host transparent to the pointer so the parent receives the dblclick. */
  @HostBinding('style.pointerEvents')
  get hostPointerEvents(): string | null {
    return this.host.nativeElement.disabled ? 'none' : null;
  }

  ngAfterViewInit(): void {
    const parent = this.host.nativeElement.parentElement;
    if (parent) {
      this.removeParentListener = this.renderer.listen(parent, 'dblclick', (e: MouseEvent) =>
        this.onParentDblClick(e),
      );
    }
  }

  ngOnDestroy(): void {
    this.removeParentListener?.();
  }

  @HostListener('dblclick')
  onDblClick(): void {
    // Fires for enabled / readonly hosts (disabled hosts are handled via the parent).
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

  /** Disabled hosts can't fire their own dblclick; catch it on the parent over the host's box. */
  private onParentDblClick(event: MouseEvent): void {
    const el = this.host.nativeElement;
    if (!el.disabled) {
      return; // enabled / readonly already handled by the host listener
    }
    const r = el.getBoundingClientRect();
    if (
      event.clientX >= r.left &&
      event.clientX <= r.right &&
      event.clientY >= r.top &&
      event.clientY <= r.bottom
    ) {
      this.open();
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
    const currentValue = `${control.value ?? ''}`;
    const lineCount = currentValue.split(/\r\n|\r|\n/).length;
    const isCompact = currentValue.length <= 120 && lineCount <= 3;
    const widthClass = isCompact
      ? 'text-expand-compact-modal'
      : currentValue.length <= 350 && lineCount <= 6
        ? 'text-expand-medium-modal'
        : 'text-expand-modal';

    const modalRef = this.modalService.open(TextExpandModalComponent, {
      size: isCompact ? undefined : 'lg',
      centered: true,
      backdrop: 'static',
      windowClass: widthClass,
    });
    modalRef.componentInstance.control = control;
    modalRef.componentInstance.title = this.title || el.getAttribute('placeholder') || 'Edit Text';
    modalRef.componentInstance.maxLength = maxLength;
    modalRef.componentInstance.placeholder = el.getAttribute('placeholder') || '';
    modalRef.componentInstance.compact = isCompact;
    modalRef.result.catch(() => {}); // dismiss is a no-op for the read-only preview
  }
}
