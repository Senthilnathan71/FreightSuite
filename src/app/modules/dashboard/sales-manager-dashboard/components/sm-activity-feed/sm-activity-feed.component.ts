import { Component, Input, Output, EventEmitter, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TimeAgoPipe } from 'src/app/core/pipes/timeAgo.pipe';
import { ActivityFeedItem } from '../../../interfaces/sales-manager-dashboard.interfaces';


@Component({
  selector: 'app-sm-activity-feed',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  templateUrl: './sm-activity-feed.component.html'
})
export class SmActivityFeedComponent implements OnInit , OnDestroy {
  @Input() items: ActivityFeedItem[] = [];
  @Input() loading = false;
  @Output() activityClicked = new EventEmitter<ActivityFeedItem>();
  @Output() refreshClicked = new EventEmitter<void>();

  hoveredItem: ActivityFeedItem | null = null;
  refreshing = false;
  lastUpdated: Date | null = null;

  intervalId: any;

  constructor(private router: Router,private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.cdr.detectChanges();
    }, 60000);
  }
7
  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'meeting_completed': return 'fas fa-handshake';
      case 'quote_created': return 'fas fa-file-invoice-dollar';
      case 'booking_created': return 'fas fa-ship';
      default: return 'fas fa-info-circle';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'meeting_completed': return 'completed meeting with';
      case 'quote_created': return 'created quote for';
      case 'booking_created': return 'created booking for';
      default: return type;
    }
  }

  getColorCode(type: string): string {
    switch (type) {
      case 'meeting_completed': return '#05608D';
      case 'quote_created': return '#f59e0b';
      case 'booking_created': return '#10b981';
      default: return '#94a3b8';
    }
  }

  getIconBgColor(type: string): string {
    switch (type) {
      case 'meeting_completed': return '#e0f2f4';
      case 'quote_created': return '#fef3c7';
      case 'booking_created': return '#d1fae5';
      default: return '#f1f5f9';
    }
  }

  getIconColor(type: string): string {
    switch (type) {
      case 'meeting_completed': return '#05608D';
      case 'quote_created': return '#f59e0b';
      case 'booking_created': return '#10b981';
      default: return '#64748b';
    }
  }

  onActivityClick(item: ActivityFeedItem): void {
    // Emit for parent component
    this.activityClicked.emit(item);
    
    // Validate sid
    if (!item.sid) {
      console.warn('No sid found for activity item');
      return;
    }
    
    // Navigate based on activityType
    switch (item.activityType) {
      case 'quote_created':
        // Navigate to Quote Entry page using sid (QuoteHeaderSid)
        this.router.navigate(['/crm/quotation/entry', item.sid]);
        break;
        
      case 'booking_created':
        // Navigate to Booking Entry page using sid (BookingHeaderSid)
        this.router.navigate(['/operation/booking/entry', item.sid]);
        break;
        
      case 'meeting_completed':
        // Navigate to Meeting Update page using sid (PreCustomerMeetingSid)
        this.router.navigate(['/crm/meeting-update'], {
          state: { viewMeetingSid: item.sid }
        });
        break;
        
      default:
        console.warn('Unknown activity type:', item.activityType);
        break;
    }
  }

  onRefresh(): void {
    this.refreshing = true;
    this.refreshClicked.emit();
  }

  // Call this method after data is loaded to update timestamp and stop refreshing
  setDataLoaded(): void {
    this.refreshing = false;
    this.lastUpdated = new Date();
    this.cdr.detectChanges();
  }
}