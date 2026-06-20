import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OperationService } from '../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss'
})
export class AuditLogComponent implements OnInit, OnDestroy {
  @Input() tableName!: string;
  @Input() recordId!: string;
  @Input() screenName!: string;
  @Input() title: string = 'Logs';

  auditLogs: any[] = [];
  loading = false;
  loadingMore = false;

  // Pagination
  page = 0;
  pageSize = 50;
  hasMore = true;

  // Raw-scan cursor returned by the backend. The backend scans raw audit rows
  // in batches and filters out no-op saves, returning up to pageSize *real*
  // changes per call plus the raw offset to resume from. We echo this back on
  // "Load more" so the next call continues scanning where this one stopped.
  private nextRawOffset = 0;

  // Keyed group store so appended pages merge instead of duplicating
  // a group that straddles a page boundary.
  private groupStore = new Map<string, any>();

  // Track the in-flight fetch so we can cancel it on destroy — a subscription
  // that resolves after the modal closes does wasted merge/render work.
  private fetchSub?: Subscription;

  constructor(
    public activeModal: NgbActiveModal,
    private operationService: OperationService,
    private appSettingsService: AppSettingsService
  ) { }

  ngOnInit(): void {
    this.getAuditLog();
  }

  ngOnDestroy(): void {
    this.fetchSub?.unsubscribe();
  }

  // ---- trackBy (prevents full list re-render) ----
  trackByGroup = (_: number, g: any): string =>
    `${g.changedAt}-${g.changedBy}-${g.operation}`;

  trackBySection = (_: number, s: any): string => s.title;

  trackByLine = (_: number, line: string): string => line;

  private normalize(val: any): string {
    return val === null || val === undefined || val === '' ? '-' : String(val).trim();
  }

  /**
   * Raw-equality check used to decide whether a field actually changed.
   * This must NOT use normalize() — normalize() collapses null/undefined/''
   * all to '-', which would hide genuine changes like null -> '' and, worse,
   * make a section render empty so the whole group gets filtered out.
   */
  private valuesEqual(a: any, b: any): boolean {
    const aMissing = a === null || a === undefined;
    const bMissing = b === null || b === undefined;
    if (aMissing && bMissing) return true;       // null/undefined are interchangeable
    if (aMissing !== bMissing) return false;      // one set, one not -> changed
    // Compare by structural JSON so arrays/objects diff correctly, with a
    // trimmed-string fast path so '  x ' === 'x'.
    if (typeof a === 'string' && typeof b === 'string') return a.trim() === b.trim();
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private isActionOnlyOperation(operation: string): boolean {
    const op = (operation || '').toUpperCase();
    return ['PRINT', 'PDF', 'EMAIL'].includes(op);
  }

  /**
   * Resolve { logs, hasMore, nextRawOffset } from any of the response shapes the
   * stack can produce (bare array, single envelope, http+service double envelope).
   *
   * Strategy: walk down `.data` links looking for the *service envelope* — the
   * object that carries the `hasMore` flag alongside its own `.data` array.
   * Only if no such envelope is found do we fall back to the length heuristic,
   * which is unreliable here because no-op rows are filtered server-side.
   */
  private unwrapAuditResponse(res: any): { logs: any[]; hasMore: boolean; nextRawOffset: number | null } {
    // Bare array — no envelope, no server hasMore available.
    if (Array.isArray(res)) {
      return { logs: res, hasMore: res.length === this.pageSize, nextRawOffset: null };
    }

    // Walk up to two `.data` levels searching for the envelope that has a
    // boolean hasMore and an array data.
    let node: any = res;
    for (let i = 0; i < 3 && node && typeof node === 'object'; i++) {
      if (typeof node.hasMore === 'boolean' && Array.isArray(node.data)) {
        return {
          logs: node.data,
          hasMore: node.hasMore,
          nextRawOffset: typeof node.nextRawOffset === 'number' ? node.nextRawOffset : null,
        };
      }
      node = node.data;
    }

    // No envelope with hasMore found — dig out whatever array we can and fall
    // back to the length heuristic.
    let arr: any = res;
    for (let i = 0; i < 3 && arr && typeof arr === 'object' && !Array.isArray(arr); i++) {
      arr = arr.data;
    }
    const logs: any[] = Array.isArray(arr) ? arr : [];
    return { logs, hasMore: logs.length === this.pageSize, nextRawOffset: null };
  }

  private getBranchTimezoneOffset(): string {
    const branch = this.appSettingsService.getCurrentBranchInfo();
    return this.normalizeTimezoneOffset(branch?.timeZone);
  }

  private normalizeTimezoneOffset(offset?: string | null): string {
    if (!offset) return '+00:00';

    let value = String(offset).trim();
    if (!value) return '+00:00';

    if (!['+', '-'].includes(value[0])) {
      value = `+${value}`;
    }

    const match = value.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/);
    if (!match) return '+00:00';

    const sign = match[1];
    const hours = match[2].padStart(2, '0');
    const minutes = match[3] || '00';

    return `${sign}${hours}:${minutes}`;
  }

  private getOffsetMinutes(offset: string): number {
    const match = offset.match(/^([+-])(\d{2}):(\d{2})$/);
    if (!match) return 0;

    const sign = match[1] === '-' ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = Number(match[3]);

    return sign * ((hours * 60) + minutes);
  }

  /** Branch-offset-shifted Date (UTC fields then read as branch-local). */
  private toBranchShifted(value: string | Date): Date {
    const date = new Date(value);
    const offsetMinutes = this.getOffsetMinutes(this.getBranchTimezoneOffset());
    return new Date(date.getTime() + (offsetMinutes * 60 * 1000));
  }

  formatAuditDate(value: string | Date | null | undefined): string {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    const shifted = this.toBranchShifted(date);
    const pad = (num: number) => String(num).padStart(2, '0');

    const day = pad(shifted.getUTCDate());
    const month = pad(shifted.getUTCMonth() + 1);
    const year = shifted.getUTCFullYear();
    const hours24 = shifted.getUTCHours();
    const hours12 = hours24 % 12 || 12;
    const minutes = pad(shifted.getUTCMinutes());
    const meridian = hours24 >= 12 ? 'PM' : 'AM';

    return `${day}-${month}-${year} ${pad(hours12)}:${minutes} ${meridian}`;
  }

  /** Group key uses the SAME branch-shifted time as the display, rounded to the minute. */
  private buildGroupKey(log: any): string {
    const s = this.toBranchShifted(log.changedAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    const rounded =
      `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}` +
      `T${pad(s.getUTCHours())}:${pad(s.getUTCMinutes())}`;
    return `${rounded}-${log.changedBy}-${log.operation}`;
  }

  /**
   * Merge a batch of raw logs into the keyed group store.
   * Safe to call repeatedly for appended pages — existing groups/sections
   * accumulate instead of being duplicated.
   */
  private mergeLogs(logs: any[]): void {
    logs.forEach((log: any) => {
      const groupKey = this.buildGroupKey(log);

      let group = this.groupStore.get(groupKey);
      if (!group) {
        group = {
          changedAt: log.changedAt,
          changedBy: log.changedBy,
          operation: log.operation,
          isActionOnly: this.isActionOnlyOperation(log.operation),
          // Precompute display strings ONCE here, not in the template. Calling
          // formatAuditDate()/getOperationClass() from the template re-runs them
          // for every row on every change-detection cycle — and formatAuditDate
          // reaches into appSettingsService each time — which is what makes the
          // modal slow to interact with and slow to close once many rows load.
          changedAtDisplay: this.formatAuditDate(log.changedAt),
          operationClass: this.getOperationClass(log.operation),
          sections: {}
        };
        this.groupStore.set(groupKey, group);
      }

      const sectionName = log.sectionLabel || log.tableName || 'Details';
      const rowLabel = log.rowLabel ? String(log.rowLabel).trim() : null;
      const sectionTitle = rowLabel ? rowLabel : sectionName;

      if (!group.sections[sectionTitle]) {
        group.sections[sectionTitle] = {
          title: sectionTitle,
          oldValDisplay: [],
          newValDisplay: [],
          actionDisplay: []
        };
      }
      const section = group.sections[sectionTitle];

      const oldObj = log.oldVal || {};
      const newObj = log.newVal || {};
      const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

      allKeys.forEach((field) => {
        const rawOld = oldObj[field];
        const rawNew = newObj[field];

        // Decide "changed" from the RAW values, not the normalized display
        // strings — otherwise null -> '' (and similar) is silently swallowed,
        // emptying the section and dropping the whole group in rebuildView().
        if (this.valuesEqual(rawOld, rawNew)) return;

        let oldVal: string;
        let newVal: string;

        if (field === 'meetingDate' || field === 'followUpDate') {
          oldVal = rawOld ? this.formatAuditDate(rawOld) : '-';
          newVal = rawNew ? this.formatAuditDate(rawNew) : '-';
        } else {
          oldVal = this.normalize(rawOld);
          newVal = this.normalize(rawNew);
        }

        if (group.isActionOnly) {
          section.actionDisplay.push(`${field} : ${newVal}`);
        } else {
          // A field present on only one side (CREATE/DELETE) still renders,
          // because valuesEqual already confirmed it differs.
          section.oldValDisplay.push(`${field} : ${oldVal}`);
          section.newValDisplay.push(`${field} : ${newVal}`);
        }
      });
    });
  }

  /** Project the keyed store into the array the template renders. */
  private rebuildView(): void {
    this.auditLogs = Array.from(this.groupStore.values())
      .map((group: any) => ({
        ...group,
        sections: Object.values(group.sections).filter((section: any) =>
          group.isActionOnly
            ? section.actionDisplay.length > 0
            : section.oldValDisplay.length > 0 || section.newValDisplay.length > 0
        )
      }))
      .filter((group: any) => group.sections.length > 0)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }

  getAuditLog(append = false): void {
    if (!this.tableName || !this.recordId || !this.screenName) return;

    if (!append) {
      this.page = 0;
      this.nextRawOffset = 0;
      this.hasMore = true;
      this.groupStore.clear();
      this.auditLogs = [];
      this.loading = true;
    } else {
      this.loadingMore = true;
    }

    // Cancel any previous in-flight request before starting a new one.
    this.fetchSub?.unsubscribe();

    // Pass the raw-scan cursor as the 6th arg. The backend accumulates up to
    // pageSize *real* changes starting from this raw offset, so a page that is
    // mostly no-op saves still returns a full page of meaningful rows.
    this.fetchSub = this.operationService
      .getAuditLogs(
        this.tableName,
        this.recordId,
        this.screenName,
        this.page,
        this.pageSize,
        this.nextRawOffset,
      )
      .subscribe({
        next: (res: any) => {
          // The response can arrive in any of these shapes depending on whether
          // the HTTP interceptor / operationService unwraps layers:
          //   A) bare array:                         [ ...logs ]
          //   B) service envelope:                   { data: [...], hasMore, nextRawOffset }
          //   C) http + service envelope:            { status, data: { data: [...], hasMore, nextRawOffset }, message }
          const { logs, hasMore, nextRawOffset } = this.unwrapAuditResponse(res);

          this.hasMore = hasMore;
          if (nextRawOffset !== null) {
            this.nextRawOffset = nextRawOffset;
          }

          // TEMP DEBUG: uncomment to inspect exactly what the backend returns.
          // console.log('[audit] page', this.page, 'visible:', logs.length,
          //   'hasMore:', this.hasMore, 'nextRawOffset:', this.nextRawOffset, 'res:', res);

          this.mergeLogs(logs);
          this.rebuildView();
          this.loading = false;
          this.loadingMore = false;
        },
        error: (err) => {
          console.error('Error fetching audit logs:', err);
          if (!append) this.auditLogs = [];
          this.loading = false;
          this.loadingMore = false;
        }
      });
  }

  loadMore(): void {
    if (this.loadingMore || !this.hasMore) return;
    this.page++;
    // nextRawOffset already points at where the backend should resume scanning.
    this.getAuditLog(true);
  }

  getOperationClass(operation: string): string {
    const value = (operation || '').toUpperCase();

    switch (value) {
      case 'UPDATE':
        return 'audit-badge-update';
      case 'CREATE':
      case 'INSERT':
        return 'audit-badge-create';
      case 'DELETE':
        return 'audit-badge-delete';
      default:
        return 'audit-badge-default';
    }
  }
}