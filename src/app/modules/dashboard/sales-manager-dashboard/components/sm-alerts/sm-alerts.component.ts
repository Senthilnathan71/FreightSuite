import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtRiskAlert, ActionCenterItem } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sm-alerts.component.html',
  styleUrls: ['./sm-alerts.component.scss']
})
export class SmAlertsComponent implements AfterViewInit , OnDestroy {
  @Input() alerts: AtRiskAlert[] = [];
  @Input() loading = false;
  @Input() actionCenterItems: ActionCenterItem[] = [];
  @Input() redesignMode = false;

  @ViewChild('scrollContainer')
  set scrollContainerSetter(el: ElementRef) {
    if (el) {
      this.scrollContainer = el;
      this.startAutoScroll();
    }
  }

  scrollContainer!: ElementRef;
  private scrollInterval: any;
  isAutoScroll = true;

  ngAfterViewInit() {
    console.log(this.scrollContainer);
    this.startAutoScroll();
  }

  startAutoScroll() {
    if (this.scrollInterval) return; // prevent duplicate

    this.scrollInterval = setInterval(() => {
      if (!this.isAutoScroll) return;

      const el = this.scrollContainer?.nativeElement;
      if (!el) return;

      el.scrollTop += 1;

      // loop back
      if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
        el.scrollTop = 0;
      }
    }, 30);
  }

  onUserScroll() {
    this.isAutoScroll = false;
  }

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

  getItemIconBg(colorClass: string): string {
    switch (colorClass) {
      case 'danger': return '#fef2f2';
      case 'warning': return '#fffbeb';
      case 'info': return '#f0fdfa';
      default: return '#f1f5f9';
    }
  }

  getItemIconColor(colorClass: string): string {
    switch (colorClass) {
      case 'danger': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#0f766e';
      default: return '#94a3b8';
    }
  }

  ngOnDestroy() {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
    }
  }
}
