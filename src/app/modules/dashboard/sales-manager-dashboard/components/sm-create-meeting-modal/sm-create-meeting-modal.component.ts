import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbDatepickerModule, NgbDateStruct, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { SalespersonInfo } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-create-meeting-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDatepickerModule, NgbTimepickerModule],
  templateUrl: './sm-create-meeting-modal.component.html',
  styleUrls: ['./sm-create-meeting-modal.component.scss']
})
export class SmCreateMeetingModalComponent {
  @Input() lead: any;
  @Input() salespersons: SalespersonInfo[] = [];

  selectedSalespersonId: number | null = null;
  meetingDate: NgbDateStruct | null = null;
  meetingTime = { hour: 10, minute: 0, second: 0 };
  meetingType = 'Physical';
  meetingNote = '';

  meetingTypes = ['Physical', 'Virtual', 'Phone'];

  constructor(public activeModal: NgbActiveModal) {}

  get isValid(): boolean {
    return !!this.selectedSalespersonId && !!this.meetingDate;
  }

  onSubmit() {
    if (!this.isValid || !this.meetingDate) return;

    const date = new Date(
      Date.UTC(
        this.meetingDate.year,
        this.meetingDate.month - 1,
        this.meetingDate.day,
        this.meetingTime.hour,
        this.meetingTime.minute
      )
    );

    this.activeModal.close({
      PreCustomerMasterSid: this.lead?.PreCustomerMasterSid || null,
      leadAssignTo: this.selectedSalespersonId,
      meetingDate: date.toISOString(),
      meetingType: this.meetingType,
      meetingNote: this.meetingNote,
    });
  }
}
