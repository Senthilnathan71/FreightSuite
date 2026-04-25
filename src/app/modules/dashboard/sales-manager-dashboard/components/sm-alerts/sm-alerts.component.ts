import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtRiskAlert } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sm-alerts.component.html',
  styleUrls: ['./sm-alerts.component.scss']
})
export class SmAlertsComponent {
  @Input() alerts: AtRiskAlert[] = [];
  @Input() loading = false;

  getIcon(alertType: string): string {
    switch (alertType) {
      case 'idle_leads': return 'fas fa-user-clock';
      case 'overdue_meetings': return 'fas fa-calendar-times';
      case 'stale_followups': return 'fas fa-phone-slash';
      case 'unconverted_hightouch': return 'fas fa-handshake-slash';
      case 'overload': return 'fas fa-weight-hanging';
      default: return 'fas fa-exclamation-triangle';
    }
  }

  getAlertTypeLabel(alertType: string): string {
    switch (alertType) {
      case 'idle_leads': return 'Idle Leads';
      case 'overdue_meetings': return 'Overdue Meetings';
      case 'stale_followups': return 'Stale Follow-ups';
      case 'unconverted_hightouch': return 'Unconverted High-Touch';
      case 'overload': return 'Overload';
      default: return alertType;
    }
  }
}
