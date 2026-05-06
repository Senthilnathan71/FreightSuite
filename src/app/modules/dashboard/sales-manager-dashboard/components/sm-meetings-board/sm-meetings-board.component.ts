import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-sm-meetings-board',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './sm-meetings-board.component.html',
  styleUrls: ['./sm-meetings-board.component.scss']
})
export class SmMeetingsBoardComponent {
  @Input() overdue: any = { items: [], totalCount: 0 };
  @Input() today: any = { items: [], totalCount: 0 };
  @Input() upcoming: any = { items: [], totalCount: 0 };
  @Input() loading = false;

  // Individual loading states per bucket (passed from parent)
  @Input() overdueLoading = false;
  @Input() todayLoading = false;
  @Input() upcomingLoading = false;

  // Has more states per bucket
  @Input() overdueHasMore = true;
  @Input() todayHasMore = true;
  @Input() upcomingHasMore = true;

  @Output() meetingClicked = new EventEmitter<any>();
  @Output() reassignClicked = new EventEmitter<any>();

  @Output() scrollReached = new EventEmitter<'overdue' | 'today' | 'future'>();

  private scrollThreshold = 100;
  private scrollDebounceTimer: any;

  onMeetingClick(meeting: any) {
    this.meetingClicked.emit(meeting);
  }

  onReassign(event: Event, meeting: any) {
    event.stopPropagation();
    this.reassignClicked.emit(meeting);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  onScroll(event: Event, bucket: 'overdue' | 'today' | 'future'): void {
    // Clear previous timer
    if (this.scrollDebounceTimer) {
      clearTimeout(this.scrollDebounceTimer);
    }
    
    // Debounce scroll events
    this.scrollDebounceTimer = setTimeout(() => {
      const target = event.target as HTMLElement;
      const scrollPosition = target.scrollTop + target.clientHeight;
      const scrollHeight = target.scrollHeight;
      const distanceFromBottom = scrollHeight - scrollPosition;
      
      // Trigger when within threshold of bottom AND not already loading
      if (distanceFromBottom <= this.scrollThreshold && !this.isBucketLoading(bucket)) {
        this.scrollReached.emit(bucket);
      }
    }, 150);
  }

  isBucketLoading(bucket: 'overdue' | 'today' | 'future'): boolean {
    switch (bucket) {
      case 'overdue': return this.overdueLoading;
      case 'today': return this.todayLoading;
      case 'future': return this.upcomingLoading;
      default: return false;
    }
  }

  hasMoreItems(bucket: 'overdue' | 'today' | 'future'): boolean {
    switch (bucket) {
      case 'overdue': return this.overdueHasMore;
      case 'today': return this.todayHasMore;
      case 'future': return this.upcomingHasMore;
      default: return false;
    }
  }
}
