import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OperationService } from '../operation.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss'
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
    private operationService: OperationService
  ) { }

  ngOnInit(): void {
    this.getAuditLog();
  }

  private normalize(val: any): string {
    return val === null || val === undefined || val === '' ? '-' : String(val).trim();
  }

  private isActionOnlyOperation(operation: string): boolean {
    const op = (operation || '').toUpperCase();
    return ['PRINT', 'PDF', 'EMAIL'].includes(op);
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
              changedBy: log.changedBy,
              operation: log.operation,
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
            const oldVal = this.normalize(oldObj[field]);
            const newVal = this.normalize(newObj[field]);

            if (oldVal !== newVal) {
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
      },
      error: (err) => {
        console.error('Error fetching audit logs:', err);
        this.auditLogs = [];
        this.loading = false;
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
