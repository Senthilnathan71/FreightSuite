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
  @Output() cardClicked = new EventEmitter<KpiCardConfig>();

  onClick(card: KpiCardConfig) {
    this.cardClicked.emit(card);
  }
}
