import {
  AfterViewInit,
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  Optional,
  Renderer2,
  Self
} from '@angular/core';
import { AbstractControl, ControlContainer, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

/**
 * Form-level guard that prevents interaction with disabled form controls,
 * even if the user removes the `disabled` attribute via browser DevTools.
 *
 * Auto-attaches to every [formGroup] element. No per-control [disabled] needed.
 * Snapshots rendered DOM values and restores them when a blocked event is caught.
 */
@Directive({
  selector: '[formGroup]',
  standalone: true
})
export class FormStateGuardDirective implements AfterViewInit, OnDestroy {
  private fg: FormGroup | null = null;

  private static readonly EVENTS = [
    'click', 'auxclick', 'dblclick', 'pointerdown', 'mousedown',
    'mouseup', 'keydown', 'beforeinput', 'input', 'change', 'paste', 'drop'
  ];

  private static readonly NAV_KEYS = new Set([
    'Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End', 'PageUp', 'PageDown'
  ]);

  private cleanups: (() => void)[] = [];
  private subs: Subscription[] = [];
  private savedValues = new WeakMap<Element, { value?: unknown; checked?: unknown }>();
  private snapshotQueued = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private zone: NgZone,
    @Self() @Optional() private container: ControlContainer | null
  ) {}

  ngAfterViewInit(): void {
    this.fg = (this.container?.control as FormGroup) ?? null;
    if (!this.fg) return;

    this.zone.runOutsideAngular(() => {
      const host = this.el.nativeElement;
      this.cleanups = FormStateGuardDirective.EVENTS.map(evt => {
        const handler = (e: Event) => this.guard(e);
        host.addEventListener(evt, handler, true);
        return () => host.removeEventListener(evt, handler, true);
      });
    });

    this.queueSnapshot();
    this.subs = [
      this.fg.valueChanges.subscribe(() => this.queueSnapshot()),
      this.fg.statusChanges.subscribe(() => this.queueSnapshot())
    ];
  }

  ngOnDestroy(): void {
    this.cleanups.forEach(fn => fn());
    this.subs.forEach(s => s.unsubscribe());
  }

  private guard(event: Event): void {
    if (!(event.target instanceof Element)) return;
    const target = this.closestFormControl(event.target);
    if (!target) return;

    const control = this.resolveControl(target);
    if (!control?.disabled) {
      this.save(target);
      return;
    }

    // Re-apply disabled in case it was removed via DevTools
    const native = target as any;
    if ('disabled' in native) this.renderer.setProperty(native, 'disabled', true);
    if (!target.hasAttribute('disabled')) this.renderer.setAttribute(target, 'disabled', 'true');

    if (event instanceof KeyboardEvent && FormStateGuardDirective.NAV_KEYS.has(event.key)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    this.restore(target, control);
  }

  private closestFormControl(el: Element | null): Element | null {
    while (el && el !== this.el.nativeElement) {
      if (el.hasAttribute('formcontrolname')) return el;
      el = el.parentElement;
    }
    return null;
  }

  private resolveControl(el: Element): AbstractControl | null {
    const name = el.getAttribute('formcontrolname');
    if (!name || !this.fg) return null;

    const path: string[] = [];
    let cur = el.parentElement;
    while (cur && cur !== this.el.nativeElement) {
      const g = cur.getAttribute('formgroupname');
      const a = cur.getAttribute('formarrayname');
      if (g) path.unshift(g);
      else if (a) path.unshift(a);
      cur = cur.parentElement;
    }
    path.push(name);
    return this.fg.get(path);
  }

  private save(el: Element): void {
    const e = el as any;
    const v: { value?: unknown; checked?: unknown } = {};
    if ('value' in e) v.value = e.value;
    if ('checked' in e) v.checked = e.checked;
    this.savedValues.set(el, v);
  }

  private queueSnapshot(): void {
    if (this.snapshotQueued) return;
    this.snapshotQueued = true;
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.snapshotQueued = false;
        this.el.nativeElement.querySelectorAll('[formcontrolname]')
          .forEach(el => this.save(el));
      });
    });
  }

  private restore(el: Element, control: AbstractControl): void {
    const s = this.savedValues.get(el);
    const e = el as any;
    if ('checked' in e) this.renderer.setProperty(e, 'checked', s?.checked ?? control.value);
    if ('value' in e) this.renderer.setProperty(e, 'value', s?.value ?? control.value);
  }
}
