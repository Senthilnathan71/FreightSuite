import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCardConfig } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sm-kpi-cards.component.html',
  styleUrls: ['./sm-kpi-cards.component.scss']
})
export class SmKpiCardsComponent {
  @Input() cards: KpiCardConfig[] = [];
  @Input() loading = false;
  @Input() showExpandToggle = false;
  @Input() isPrimaryRow = false;
  @Input() isSecondaryRow = false;
  @Output() cardClicked = new EventEmitter<KpiCardConfig>();

  onClick(card: KpiCardConfig) {
    this.cardClicked.emit(card);
  }

  formatValue(card: KpiCardConfig): string {
    if (card.isCurrency) {
      if (card.value >= 1000000) return '$' + (card.value / 1000000).toFixed(1) + 'M';
      if (card.value >= 1000) return '$' + (card.value / 1000).toFixed(1) + 'K';
      return '$' + card.value.toLocaleString();
    }
    return card.value?.toLocaleString() || '0';
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
}
