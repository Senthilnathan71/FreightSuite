import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Renderer2
} from '@angular/core';

@Directive({
  selector: '[disabled], [readonly]',
  standalone: true
})
export class ElementStateGuardDirective implements AfterViewInit, OnChanges, OnDestroy {
  @Input()
  set disabled(value: unknown) {
    this.disabledExplicit = true;
    this.disabledRaw = value;
  }

  @Input()
  set readonly(value: unknown) {
    this.readonlyExplicit = true;
    this.readonlyRaw = value;
  }

  private static readonly GUARDED_EVENTS = [
    'click', 'auxclick', 'dblclick', 'pointerdown', 'mousedown',
    'mouseup', 'keydown', 'beforeinput', 'input', 'change', 'paste', 'drop'
  ];

  private static readonly EDIT_EVENTS = new Set([
    'keydown', 'beforeinput', 'input', 'paste', 'drop'
  ]);

  private static readonly NAV_KEYS = new Set([
    'Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End', 'PageUp', 'PageDown'
  ]);

  private cleanups: (() => void)[] = [];
  private observer?: MutationObserver;

  private isDisabled = false;
  private isReadonly = false;
  private disabledRaw: unknown;
  private readonlyRaw: unknown;
  private disabledExplicit = false;
  private readonlyExplicit = false;
  private hadDisabledAttr = false;
  private hadReadonlyAttr = false;
  private initialCaptured = false;

  private savedValue: unknown;
  private savedChecked: unknown;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.syncState();
    this.saveValue();

    this.zone.runOutsideAngular(() => {
      const native = this.el.nativeElement;

      this.cleanups = ElementStateGuardDirective.GUARDED_EVENTS.map(event => {
        const handler = (e: Event) => this.guard(e);
        native.addEventListener(event, handler, true);
        return () => native.removeEventListener(event, handler, true);
      });

      this.observer = new MutationObserver(() => this.syncState());
      this.observer.observe(native, { attributes: true, attributeFilter: ['disabled', 'readonly'] });
    });
  }

  ngOnChanges(): void {
    this.syncState();
    if (this.isDisabled || this.isReadonly) this.saveValue();
  }

  ngOnDestroy(): void {
    this.cleanups.forEach(fn => fn());
    this.observer?.disconnect();
  }

  private guard(event: Event): void {
    if (!this.shouldBlock(event)) {
      this.saveValue();
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    this.restoreValue();
  }

  private shouldBlock(event: Event): boolean {
    const isNavKey = event instanceof KeyboardEvent && ElementStateGuardDirective.NAV_KEYS.has(event.key);

    if (this.isDisabled) return !isNavKey;

    if (!this.isReadonly) return false;

    if (this.isTextControl()) {
      return ElementStateGuardDirective.EDIT_EVENTS.has(event.type) && !isNavKey;
    }

    // Non-text controls: also block click/pointer/change
    if (['click', 'pointerdown', 'mousedown', 'mouseup', 'change'].includes(event.type)) return true;
    return ElementStateGuardDirective.EDIT_EVENTS.has(event.type) && !isNavKey;
  }

  private syncState(): void {
    const el = this.el.nativeElement;
    if (!this.initialCaptured) {
      this.hadDisabledAttr = el.hasAttribute('disabled');
      this.hadReadonlyAttr = el.hasAttribute('readonly');
      this.initialCaptured = true;
    }

    this.isDisabled = this.toBool(this.disabledRaw, this.disabledExplicit, this.hadDisabledAttr);
    this.isReadonly = this.toBool(this.readonlyRaw, this.readonlyExplicit, this.hadReadonlyAttr);

    this.applyAttr('disabled', this.isDisabled);
    this.applyAttr('readonly', this.isReadonly);
  }

  private toBool(value: unknown, wasExplicit: boolean, hadAttr: boolean): boolean {
    if (!wasExplicit) return hadAttr;
    if (value === false || value == null) return false;
    if (typeof value === 'string') {
      return !['false', '0', 'null', 'undefined'].includes(value.trim().toLowerCase());
    }
    return Boolean(value);
  }

  private applyAttr(attr: 'disabled' | 'readonly', active: boolean): void {
    const el = this.el.nativeElement as any;
    const prop = attr === 'readonly' ? 'readOnly' : attr;

    if (prop in el && el[prop] !== active) {
      this.renderer.setProperty(el, prop, active);
    }

    if (active) {
      if (!el.hasAttribute(attr)) this.renderer.setAttribute(el, attr, 'true');
    } else if (el.hasAttribute(attr)) {
      this.renderer.removeAttribute(el, attr);
    }
  }

  private saveValue(): void {
    const el = this.el.nativeElement as any;
    if ('value' in el) this.savedValue = el.value;
    if ('checked' in el) this.savedChecked = el.checked;
  }

  private restoreValue(): void {
    const el = this.el.nativeElement as any;
    if ('value' in el && this.savedValue !== undefined) {
      this.renderer.setProperty(el, 'value', this.savedValue);
    }
    if ('checked' in el && this.savedChecked !== undefined) {
      this.renderer.setProperty(el, 'checked', this.savedChecked);
    }
  }

  private isTextControl(): boolean {
    const tag = this.el.nativeElement.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA';
  }
}
