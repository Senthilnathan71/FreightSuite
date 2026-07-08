import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OperationService } from '../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditLogComponent implements OnInit {
  @Input() tableName!: string;
  @Input() recordId!: string;
  @Input() screenName!: string;
  @Input() title: string = 'Logs';

  auditLogs: any[] = [];
  loading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private operationService: OperationService,
    private appSettingsService: AppSettingsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.getAuditLog();
  }

  // Stable identities for *ngFor so Angular reuses DOM instead of re-rendering the
  // whole list on every change-detection pass. The list is built once and never
  // mutated afterwards, so index-based tracking is safe and cheapest.
  trackByIndex(index: number): number {
    return index;
  }

  private normalize(val: any): string {
    return val === null || val === undefined || val === '' ? '-' : String(val).trim();
  }

  // A numeric field that was never set (null / '') and one holding 0 mean the same
  // thing, so a null -> 0 transition is not a real change and must not be shown.
  // Booleans are excluded so `false` is never collapsed into zero.
  private isBlankOrZero(val: any): boolean {
    if (val === null || val === undefined) return true;
    if (typeof val === 'boolean') return false;
    if (typeof val === 'number') return val === 0;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '') return true;
      const num = Number(trimmed);
      return !Number.isNaN(num) && num === 0;
    }
    return false;
  }

  // True when the raw old/new values are equal for display purposes — either their
  // normalized display strings match, or both are blank/zero.
  private valuesEqual(rawOld: any, rawNew: any, displayOld: string, displayNew: string): boolean {
    if (this.isBlankOrZero(rawOld) && this.isBlankOrZero(rawNew)) return true;
    return displayOld === displayNew;
  }

  private isActionOnlyOperation(operation: string): boolean {
    const op = (operation || '').toUpperCase();
    return ['PRINT', 'PDF', 'EMAIL'].includes(op);
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

  formatAuditDate(value: string | Date | null | undefined): string {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    const offsetMinutes = this.getOffsetMinutes(this.getBranchTimezoneOffset());
    const shifted = new Date(date.getTime() + (offsetMinutes * 60 * 1000));
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

  getAuditLog() {
    if (!this.tableName || !this.recordId || !this.screenName) return;

    this.loading = true;

    this.operationService.getAuditLogs(this.tableName, this.recordId, this.screenName).subscribe({
      next: (logs: any[]) => {
        const groupedLogs: any = {};

        logs.forEach((log: any) => {
          const changedDate = new Date(log.changedAt);

          const roundedTime = new Date(
            changedDate.getFullYear(),
            changedDate.getMonth(),
            changedDate.getDate(),
            changedDate.getHours(),
            changedDate.getMinutes(),
            0,
            0
          ).toISOString();

          const groupKey = `${roundedTime}-${log.changedBy}-${log.operation}`;

          if (!groupedLogs[groupKey]) {
            groupedLogs[groupKey] = {
              changedAt: log.changedAt,
              // Precompute display values once here instead of calling these methods
              // from the template — under change detection a template method binding
              // re-runs for every card on every event, which is what froze the modal.
              changedAtDisplay: this.formatAuditDate(log.changedAt),
              changedBy: log.changedBy,
              operation: log.operation,
              operationClass: this.getOperationClass(log.operation),
              isActionOnly: this.isActionOnlyOperation(log.operation),
              sections: {}
            };
          }

          const sectionName = log.sectionLabel || log.tableName || 'Details';
          const rowLabel = log.rowLabel ? String(log.rowLabel).trim() : null;
          const sectionTitle = rowLabel ? rowLabel : sectionName;

          if (!groupedLogs[groupKey].sections[sectionTitle]) {
            groupedLogs[groupKey].sections[sectionTitle] = {
              title: sectionTitle,
              oldValDisplay: [],
              newValDisplay: [],
              actionDisplay: []
            };
          }

          const oldObj = log.oldVal || {};
          const newObj = log.newVal || {};
          const allKeys = new Set([
            ...Object.keys(oldObj),
            ...Object.keys(newObj)
          ]);

          allKeys.forEach((field) => {
            const rawOld = oldObj[field];
            const rawNew = newObj[field];

            let oldVal = this.normalize(rawOld);
            let newVal = this.normalize(rawNew);

            if (field === 'meetingDate' || field === 'followUpDate') {
              oldVal = rawOld
                ? this.formatAuditDate(rawOld)
                : '-';

              newVal = rawNew
                ? this.formatAuditDate(rawNew)
                : '-';
            }

            if (!this.valuesEqual(rawOld, rawNew, oldVal, newVal)) {
              if (groupedLogs[groupKey].isActionOnly) {
                groupedLogs[groupKey].sections[sectionTitle].actionDisplay.push(`${field} : ${newVal}`);
              } else {
                groupedLogs[groupKey].sections[sectionTitle].oldValDisplay.push(`${field} : ${oldVal}`);
                groupedLogs[groupKey].sections[sectionTitle].newValDisplay.push(`${field} : ${newVal}`);
              }
            }
          });
        });

        this.auditLogs = Object.values(groupedLogs)
          .map((group: any) => ({
            ...group,
            sections: Object.values(group.sections).filter((section: any) => {
              if (group.isActionOnly) {
                return section.actionDisplay.length > 0;
              }
              return section.oldValDisplay.length > 0 || section.newValDisplay.length > 0;
            })
          }))
          .filter((group: any) => group.sections.length > 0);

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching audit logs:', err);
        this.auditLogs = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
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