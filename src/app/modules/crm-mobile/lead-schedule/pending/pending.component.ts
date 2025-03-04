import { Router } from '@angular/router';
import { LeadService } from './../../Services/lead.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule
  ],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.scss'
})
export class PendingComponent {
  //   pendingSchedule = [
  //     {
  //       "companyName": "Dubai Marine Shipping",
  //       "City": "Dubai",
  //       "ContactName": "Ahmed Khalid",
  //       "Phone": "+971 50 123 4567",
  //       "ScheduleDate": "2025-02-20"
  //     },
  //     {
  //       "companyName": "Emirates Cargo Logistics",
  //       "City": "Dubai",
  //       "ContactName": "Fatima Noor",
  //       "Phone": "+971 52 987 6543",
  //       "ScheduleDate": "2025-02-21"
  //     },
  //     {
  //       "companyName": "Ocean Wave Shipping",
  //       "City": "Dubai",
  //       "ContactName": "Omar Hussain",
  //       "Phone": "+971 55 234 5678",
  //       "ScheduleDate": "2025-02-22"
  //     },
  //     {
  //       "companyName": "Gulf Star Shipping",
  //       "City": "Dubai",
  //       "ContactName": "Aisha Karim",
  //       "Phone": "+971 50 876 5432",
  //       "ScheduleDate": "2025-02-23"
  //     },
  //     {
  //       "companyName": "Blue Horizon Freight",
  //       "City": "Dubai",
  //       "ContactName": "Salman Rashid",
  //       "Phone": "+971 56 789 0123",
  //       "ScheduleDate": "2025-02-24"
  //     },
  //     {
  //       "companyName": "Arabian Sea Transport",
  //       "City": "Dubai",
  //       "ContactName": "Zara Al-Farsi",
  //       "Phone": "+971 51 345 6789",
  //       "ScheduleDate": "2025-02-25"
  //     },
  //     {
  //       "companyName": "Desert Pearl Shipping",
  //       "City": "Dubai",
  //       "ContactName": "Hassan Jamil",
  //       "Phone": "+971 58 123 4560",
  //       "ScheduleDate": "2025-02-26"
  //     },
  //     {
  //       "companyName": "Falcon Global Logistics",
  //       "City": "Dubai",
  //       "ContactName": "Layla Mohammad",
  //       "Phone": "+971 54 987 6501",
  //       "ScheduleDate": "2025-02-27"
  //     },
  //     {
  //       "companyName": "Swift Sail Cargo",
  //       "City": "Dubai",
  //       "ContactName": "Mohammed Zayed",
  //       "Phone": "+971 57 654 3210",
  //       "ScheduleDate": "2025-02-28"
  //     },
  //     {
  //       "companyName": "Al Noor Maritime",
  //       "City": "Dubai",
  //       "ContactName": "Yasmine Ali",
  //       "Phone": "+971 53 789 4567",
  //       "ScheduleDate": "2025-03-01"
  //     }
  // ];

  constructor(private leadService: LeadService, private router: Router) { }
  pendingSchedule: any[] = []

  ngOnInit() {
    this.getAllLeadPendingMeetings()
  }

  getAllLeadPendingMeetings() {
    this.leadService.getAllPendingMeetings().subscribe(
      (resp: any[]) => {
        console.log(resp)
        this.pendingSchedule = resp['data'];  // On success, store the leads data in the component
      }
    );
  }


  createMeeting(PreCustomerMasterSid: number) {
    this.router.navigate([`/crm/lead-schedule-meeting/${PreCustomerMasterSid}`]);
  }

}
