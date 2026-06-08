import { Injectable } from '@angular/core';
import {
  REPORT_COLUMN_LAYOUT_PREFIX,
  ReportColumnLayout,
} from '../components/reports/generic-table-report/report-column-config';

/**
 * Per-user, per-report column layout persistence (browser localStorage).
 *
 * Stores `{ order, hidden }` under `report-columns:{ReportMasterSid}`, mirroring the
 * direct-localStorage pattern used by ReportCardListComponent for report-card order.
 */
@Injectable({ providedIn: 'root' })
export class ReportColumnLayoutService {
  private key(reportMasterSid: number): string {
    return `${REPORT_COLUMN_LAYOUT_PREFIX}${reportMasterSid}`;
  }

  /** Load a saved layout, or null when none exists / is unreadable. */
  load(reportMasterSid: number): ReportColumnLayout | null {
    try {
      const raw = localStorage.getItem(this.key(reportMasterSid));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const order = Array.isArray(parsed?.order) ? parsed.order.map(String) : [];
      const hidden = Array.isArray(parsed?.hidden) ? parsed.hidden.map(String) : [];
      return { order, hidden };
    } catch {
      return null;
    }
  }

  /** Save the layout for a report. */
  save(reportMasterSid: number, layout: ReportColumnLayout): void {
    try {
      localStorage.setItem(this.key(reportMasterSid), JSON.stringify(layout));
    } catch (error) {
      console.warn('Failed to save report column layout:', error);
    }
  }

  /** Remove any saved layout (revert to defaults). */
  reset(reportMasterSid: number): void {
    try {
      localStorage.removeItem(this.key(reportMasterSid));
    } catch (error) {
      console.warn('Failed to reset report column layout:', error);
    }
  }
}
