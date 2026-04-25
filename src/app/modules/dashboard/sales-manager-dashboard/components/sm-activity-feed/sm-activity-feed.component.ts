import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityFeedItem } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-activity-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sm-activity-feed.component.html',
  styleUrls: ['./sm-activity-feed.component.scss']
})
export class SmActivityFeedComponent {
  @Input() items: ActivityFeedItem[] = [];
  @Input() loading = false;

  getIcon(type: string): string {
    switch (type) {
      case 'meeting_completed': return 'fas fa-handshake';
      case 'quote_created': return 'fas fa-file-invoice';
      case 'booking_created': return 'fas fa-ship';
      default: return 'fas fa-info-circle';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'meeting_completed': return 'Meeting Completed';
      case 'quote_created': return 'Quote Created';
      case 'booking_created': return 'Booking Created';
      default: return type;
    }
  }

  getColorClass(type: string): string {
    switch (type) {
      case 'meeting_completed': return 'meeting';
      case 'quote_created': return 'quote';
      case 'booking_created': return 'booking';
      default: return 'default';
    }
  }

  formatTimeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Math.round((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
}
