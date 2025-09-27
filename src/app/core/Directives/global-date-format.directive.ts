import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalDateFormatService } from '../services/global-date-format.service';

@Directive({
  selector: '[appGlobalDateFormat]',
  standalone: true
})
export class GlobalDateFormatDirective implements OnInit, OnDestroy {
  @Input('appGlobalDateFormat') dateValue: Date | string | null = null;
  @Input() customFormat?: string;

  private destroy$ = new Subject<void>();

  constructor(
    private el: ElementRef,
    private globalDateService: GlobalDateFormatService
  ) {}

  ngOnInit() {
    // Initial format
    this.updateDateDisplay();

    // Listen for date format changes
    this.globalDateService.dateFormat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateDateDisplay();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateDateDisplay() {
    if (this.dateValue) {
      const formattedDate = this.globalDateService.formatDate(this.dateValue, this.customFormat);
      this.el.nativeElement.textContent = formattedDate;
    }
  }
}