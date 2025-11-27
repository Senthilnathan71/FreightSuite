import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appPreventMultiClick]',
  standalone: true
})
export class PreventMultiClickDirective {
  @Input() disableTime: number = 2000; // Delay between clicks
  @Input() isLoading: boolean = false; // API loading state
  private isClicked = false;
  private externallyDisabled = false;   // Whether the button is disabled externally(eg in Html)

  constructor(private elementRef: ElementRef, private renderer: Renderer2) { }

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    const element = this.elementRef.nativeElement as HTMLButtonElement;
    this.externallyDisabled = element.hasAttribute('disabled');

    // If button is disabled due to API loading, prevent clicks
    if (this.isLoading || this.isClicked) {
      event.stopImmediatePropagation();
      return;
    }

    // Disable button immediately to prevent multiple clicks
    this.isClicked = true;
    this.renderer.setAttribute(element, 'disabled', 'true');

    // Enable button after the specified delay
    setTimeout(() => {
      if (!this.isLoading && !this.externallyDisabled) {
        this.isClicked = false;
        this.renderer.removeAttribute(element, 'disabled');
      }
    }, this.disableTime);
  }

  // Watch for `isLoading` changes to manage enable/disable states dynamically
  ngOnChanges() {
    const element = this.elementRef.nativeElement as HTMLButtonElement;
    this.externallyDisabled = element.hasAttribute('disabled');
    if (this.externallyDisabled) return;

    if (this.isLoading) {
      this.renderer.setAttribute(element, 'disabled', 'true');
    } else if (!this.isClicked) {
      this.renderer.removeAttribute(element, 'disabled');
    }
  }
}
