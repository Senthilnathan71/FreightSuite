import { Router } from '@angular/router';
import { LeadService } from './../../Services/lead.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { DeviceDetectorService } from 'ngx-device-detector';
import { AppService } from 'src/app/service/app.service';import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';


@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgxSpinnerModule
  ],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.scss'
})
export class PendingComponent implements OnInit {

  isMobile: boolean = false;
  currentCompany:any;
  currentBranch:any;


  constructor(private leadService: LeadService, private router: Router, private appService: AppService, private appSettingService: AppSettingsService, private spinner: NgxSpinnerService) { }

  pendingSchedule: any[] = []

  ngOnInit() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.getAllLeadPendingMeetings();
    this.isMobile = this.appService.getDevice()
  }

  getAllLeadPendingMeetings() {
    this.spinner.show();
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    this.leadService.getAllPendingMeetings(CompanyMasterSid,BranchMasterSid).subscribe(
      (resp: any[]) => {
        console.log(resp)
        this.pendingSchedule = resp['data'];  // On success, store the leads data in the component
        this.spinner.hide();
      }
    );
    
  }


  createMeeting(PreCustomerMasterSid: number) {
    this.router.navigate([`/crm/lead-schedule-meeting/${PreCustomerMasterSid}`]);
  }

}
