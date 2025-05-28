import { Router } from '@angular/router';
import { LeadService } from './../../Services/lead.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { DeviceDetectorService } from 'ngx-device-detector';
import { AppService } from 'src/app/service/app.service';

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
export class PendingComponent implements OnInit {

  isMobile: boolean = false;

  constructor(private leadService: LeadService, private router: Router, private appService: AppService) { }

  pendingSchedule: any[] = []

  ngOnInit() {
    this.getAllLeadPendingMeetings();
    this.isMobile = this.appService.getDevice()
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
