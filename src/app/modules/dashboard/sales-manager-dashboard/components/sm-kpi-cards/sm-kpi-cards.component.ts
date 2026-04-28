import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCardConfig } from '../../../interfaces/sales-manager-dashboard.interfaces';
import { toNumber } from 'src/app/common/helper';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';

@Component({
  selector: 'app-sm-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sm-kpi-cards.component.html',
  styleUrls: ['./sm-kpi-cards.component.scss']
})
export class SmKpiCardsComponent implements OnChanges, OnDestroy {
  @Input() cards: KpiCardConfig[] = [];
  @Input() loading = false;
  @Input() showExpandToggle = false;
  @Input() isPrimaryRow = false;
  @Input() isSecondaryRow = false;
  @Output() cardClicked = new EventEmitter<KpiCardConfig>();
  animatedValues: Record<string, number> = {};
  private animationTimers: Record<string, any> = {};

  constructor(private companySettings: CompanySettingsManagerService) {}

  onClick(card: KpiCardConfig) {
    this.cardClicked.emit(card);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cards']) {
      this.syncAnimatedValues();
    }

    if (changes['loading'] && !this.loading) {
      this.syncAnimatedValues(true);
    }
  }

  ngOnDestroy(): void {
    this.clearAnimationTimers();
  }

  formatValue(card: KpiCardConfig, rawValue?: number): string {
    let value = toNumber(rawValue) || toNumber(card.value);
    if (card.isCurrency) {
      const currencySymbol = this.companySettings.getCurrencySettings().symbol;
      value = Math.abs(value);
      if (value >= 1000000) return currencySymbol + " " + (value / 1000000).toFixed(1) + 'M';
      if (value >= 1000) return currencySymbol+ " " + (value / 1000).toFixed(1) + 'K';
      return currencySymbol+ " " + value.toLocaleString();
    }
    return value.toLocaleString();
  }

  getChangeIcon(card: KpiCardConfig): string {
    if (card.changeDirection === 'up') return 'fas fa-arrow-up';
    if (card.changeDirection === 'down') return 'fas fa-arrow-down';
    return 'fas fa-minus';
  }

  getChangeClass(card: KpiCardConfig): string {
    if (card.changeDirection === 'up') return 'change-up';
    if (card.changeDirection === 'down') return 'change-down';
    return 'change-flat';
  }

  getAnimatedValue(card: KpiCardConfig): number {
    return this.animatedValues[card.key] ?? 0;
  }

  private syncAnimatedValues(forceRestart = false): void {
    const activeKeys = new Set(this.cards.map(card => card.key));

    Object.keys(this.animationTimers).forEach(key => {
      if (!activeKeys.has(key)) {
        clearInterval(this.animationTimers[key]);
        delete this.animationTimers[key];
        delete this.animatedValues[key];
      }
    });

    this.cards.forEach(card => {
      this.animateCardValue(card, forceRestart);
    });
  }

  private animateCardValue(card: KpiCardConfig, forceRestart = false): void {
    const key = card.key;
    const target = Math.max(0, Math.floor(card.value ?? 0));

    if (this.animationTimers[key]) {
      clearInterval(this.animationTimers[key]);
      delete this.animationTimers[key];
    }

    const start = forceRestart ? 0 : (this.animatedValues[key] ?? 0);

    if (forceRestart) {
      this.animatedValues[key] = 0;
    }

    if (start === target) {
      this.animatedValues[key] = target;
      return;
    }

    if (target < start) {
      this.animatedValues[key] = target;
      return;
    }

    const durationMs = card.isCurrency ? 1100 : 850;
    const steps = 30;
    const increment = Math.max(1, Math.ceil((target - start) / steps));
    const intervalMs = Math.max(20, Math.floor(durationMs / steps));

    this.animatedValues[key] = start;

    this.animationTimers[key] = setInterval(() => {
      const current = this.animatedValues[key] ?? 0;
      const nextValue = Math.min(target, current + increment);
      this.animatedValues[key] = nextValue;

      if (nextValue >= target) {
        clearInterval(this.animationTimers[key]);
        delete this.animationTimers[key];
      }
    }, intervalMs);
  }

  private clearAnimationTimers(): void {
    Object.keys(this.animationTimers).forEach(key => {
      clearInterval(this.animationTimers[key]);
      delete this.animationTimers[key];
    });
  }
}
