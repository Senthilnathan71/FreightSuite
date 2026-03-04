import { Directive, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { ALL_PLACEHOLDERS, PlaceholderVariable } from 'src/app/modules/email/mail-placeholder.constants';

@Directive({
  selector: '[appPlaceholderAutocomplete]',
  standalone: true
})
export class PlaceholderAutocompleteDirective implements OnDestroy {
  private dropdown: HTMLDivElement | null = null;
  private filtered: PlaceholderVariable[] = [];
  private activeIndex = 0;
  private triggerStart = -1;

  constructor(private el: ElementRef<HTMLInputElement | HTMLTextAreaElement>) {}

  @HostListener('input')
  onInput(): void {
    const element = this.el.nativeElement;
    const cursorPos = element.selectionStart ?? 0;
    const text = element.value.substring(0, cursorPos);

    // Find the last '{{' before cursor that doesn't have a closing '}}'
    const lastOpen = text.lastIndexOf('{{');
    if (lastOpen === -1) {
      this.hideDropdown();
      return;
    }

    // Check if there's a closing '}}' after this '{{' but before cursor
    const afterOpen = text.substring(lastOpen + 2);
    if (afterOpen.includes('}}')) {
      this.hideDropdown();
      return;
    }

    this.triggerStart = lastOpen;
    const query = afterOpen.toLowerCase();

    this.filtered = ALL_PLACEHOLDERS.filter(p =>
      p.key.toLowerCase().includes(query) || p.label.toLowerCase().includes(query)
    );

    if (this.filtered.length === 0) {
      this.hideDropdown();
      return;
    }

    this.activeIndex = 0;
    this.showDropdown();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.dropdown) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex = (this.activeIndex + 1) % this.filtered.length;
        this.updateActiveItem();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex = (this.activeIndex - 1 + this.filtered.length) % this.filtered.length;
        this.updateActiveItem();
        break;
      case 'Enter':
      case 'Tab':
        event.preventDefault();
        this.selectItem(this.filtered[this.activeIndex]);
        break;
      case 'Escape':
        this.hideDropdown();
        break;
    }
  }

  @HostListener('blur')
  onBlur(): void {
    // Delay to allow click on dropdown item
    setTimeout(() => this.hideDropdown(), 200);
  }

  private showDropdown(): void {
    if (!this.dropdown) {
      this.dropdown = document.createElement('div');
      this.dropdown.className = 'placeholder-autocomplete-dropdown';
      document.body.appendChild(this.dropdown);
    }

    this.positionDropdown();
    this.renderItems();
  }

  private positionDropdown(): void {
    if (!this.dropdown) return;

    const rect = this.el.nativeElement.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 2;
    const left = rect.left + window.scrollX;

    this.dropdown.style.top = `${top}px`;
    this.dropdown.style.left = `${left}px`;
    this.dropdown.style.width = `${Math.max(rect.width, 280)}px`;
  }

  private renderItems(): void {
    if (!this.dropdown) return;

    this.dropdown.innerHTML = '';
    this.filtered.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'placeholder-autocomplete-item';
      if (index === this.activeIndex) {
        div.classList.add('active');
      }
      div.innerHTML = `<span class="placeholder-key">{{${item.key}}}</span> <span class="placeholder-label">${item.label}</span>`;
      div.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.selectItem(item);
      });
      div.addEventListener('mouseenter', () => {
        this.activeIndex = index;
        this.updateActiveItem();
      });
      this.dropdown!.appendChild(div);
    });
  }

  private updateActiveItem(): void {
    if (!this.dropdown) return;
    const items = this.dropdown.querySelectorAll('.placeholder-autocomplete-item');
    items.forEach((el, i) => {
      el.classList.toggle('active', i === this.activeIndex);
    });
  }

  private selectItem(item: PlaceholderVariable): void {
    const element = this.el.nativeElement;
    const cursorPos = element.selectionStart ?? 0;
    const before = element.value.substring(0, this.triggerStart);
    const after = element.value.substring(cursorPos);
    const insertion = `{{${item.key}}}`;

    element.value = before + insertion + after;

    // Place cursor after the inserted placeholder
    const newPos = before.length + insertion.length;
    element.setSelectionRange(newPos, newPos);

    // Dispatch input event so ngModel picks up the change
    element.dispatchEvent(new Event('input', { bubbles: true }));

    this.hideDropdown();
    element.focus();
  }

  private hideDropdown(): void {
    if (this.dropdown) {
      this.dropdown.remove();
      this.dropdown = null;
    }
    this.triggerStart = -1;
  }

  ngOnDestroy(): void {
    this.hideDropdown();
  }
}
