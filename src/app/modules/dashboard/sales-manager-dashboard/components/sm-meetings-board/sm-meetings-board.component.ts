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
  @Output() meetingClicked = new EventEmitter<any>();
  @Output() reassignClicked = new EventEmitter<any>();

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
}
