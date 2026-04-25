import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ScoreboardRow } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-reminder-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sm-reminder-modal.component.html',
  styleUrls: ['./sm-reminder-modal.component.scss']
})
export class SmReminderModalComponent {
  @Input() salesperson!: ScoreboardRow;

  reminderType: 'overdue-meetings' | 'idle-leads' | 'pending-followups' = 'overdue-meetings';
  customMessage = '';

  reminderTypes: { value: 'overdue-meetings' | 'idle-leads' | 'pending-followups'; label: string; icon: string; desc: string }[] = [
    { value: 'overdue-meetings', label: 'Overdue Meetings', icon: 'fas fa-calendar-times', desc: 'Remind about meetings past their scheduled date' },
    { value: 'idle-leads', label: 'Idle Leads', icon: 'fas fa-user-clock', desc: 'Remind about leads with no meeting scheduled' },
    { value: 'pending-followups', label: 'Pending Follow-ups', icon: 'fas fa-phone-slash', desc: 'Remind about overdue follow-up calls' },
  ];

  constructor(public activeModal: NgbActiveModal) {}

  getInitials(name: string): string {
    return name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '';
  }

  onSubmit() {
    this.activeModal.close({
      salespersonId: this.salesperson.UserMasterSid,
      reminderType: this.reminderType,
      customMessage: this.customMessage,
    });
  }
}
