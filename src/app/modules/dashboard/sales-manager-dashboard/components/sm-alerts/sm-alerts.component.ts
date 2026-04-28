import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtRiskAlert, ActionCenterItem } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sm-alerts.component.html',
  styleUrls: ['./sm-alerts.component.scss']
})
export class SmAlertsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() alerts: AtRiskAlert[] = [];
  @Input() loading = false;
  @Input() actionCenterItems: ActionCenterItem[] = [];
  @Input() redesignMode = false;
  renderedAlerts: AtRiskAlert[] = [];

  @ViewChild('scrollContainer')
  set scrollContainerSetter(el: ElementRef<HTMLDivElement> | undefined) {
    if (el) {
      this.scrollContainer = el;
      this.scheduleAutoScrollRestart();
    }
  }

  scrollContainer?: ElementRef<HTMLDivElement>;
  private autoScrollTimer?: ReturnType<typeof setInterval>;
  isAutoScroll = true;

  ngAfterViewInit() {
    this.updateRenderedAlerts();
    this.scheduleAutoScrollRestart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['alerts']) {
      this.updateRenderedAlerts();
      this.scheduleAutoScrollRestart();
    }
  }

  startAutoScroll() {
    if (this.autoScrollTimer || !this.shouldDuplicateAlerts) return;

    this.autoScrollTimer = setInterval(() => {
      if (!this.isAutoScroll) return;

      const el = this.scrollContainer?.nativeElement;
      if (!el) return;

      const loopHeight = el.scrollHeight / 2;
      if (loopHeight <= el.clientHeight) return;

      el.scrollTop += 1;

      if (el.scrollTop >= loopHeight) {
        el.scrollTop = 0;
      }
    }, 30);
  }

  onManualScrollStart() {
    this.stopAutoScroll();
  }

  stopAutoScroll() {
    this.isAutoScroll = false;
    if (this.autoScrollTimer) {
      clearInterval(this.autoScrollTimer);
      this.autoScrollTimer = undefined;
    }
  }

  private resetAutoScroll() {
    const el = this.scrollContainer?.nativeElement;
    if (el) {
      el.scrollTop = 0;
    }

    this.stopAutoScroll();
    this.isAutoScroll = true;
  }

  private scheduleAutoScrollRestart() {
    setTimeout(() => {
      this.resetAutoScroll();
      this.startAutoScroll();
    });
  }

  private updateRenderedAlerts() {
    this.renderedAlerts = this.shouldDuplicateAlerts ? [...this.alerts, ...this.alerts] : [...this.alerts];
  }

  get shouldDuplicateAlerts(): boolean {
    return this.alerts.length > 1;
  }

  trackAlert(index: number): number {
    return index;
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
    this.stopAutoScroll();
  }
}
