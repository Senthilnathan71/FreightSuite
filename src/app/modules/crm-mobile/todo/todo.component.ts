import { LeadService } from './../Services/lead.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild, OnInit, inject, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbNavModule, NgbTooltip, ModalDismissReasons, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppService } from 'src/app/service/app.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [
    NgbNavModule,
    NgbDropdownModule,
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbTooltip,
    NgxSpinnerModule,
    CustomDatePipe
  ],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.scss',
  providers: [CustomDatePipe]
})
export class TodoComponent implements OnInit {
  active = 1;
  @ViewChild('nav', { static: true }) nav!: NgbNavModule;

  isMobile: boolean = false;
  currentCompany:any;
  currentBranch:any;

  toDoList = [
    { id: 1, status: 'Not Meet', text: 'Follow up on outstanding payment from "BlueWave Shipping" client', isChecked: false },
    { id: 2, status: 'To Meet', text: 'Send reminder for overdue invoice to "Oceanic Logistics"', isChecked: false },
    { id: 3, status: 'Never Meet', text: 'Confirm payment receipt for "SwiftSail Cargo" shipment', isChecked: false },
    { id: 4, status: 'Not Meet', text: 'Check payment status from "GlobalMaritime Shipping"', isChecked: false },
    { id: 5, status: 'To Meet', text: 'Follow up on pending payment for "Horizon Express"', isChecked: false },
    { id: 6, status: 'Never Meet', text: 'Verify payment processing for "TideLine Transport"', isChecked: false },
    { id: 7, status: 'To Meet', text: 'Send payment reminder to "SeaLink Freight" customer', isChecked: false },
    { id: 8, status: 'Never Meet', text: 'Review payment for "CoastalCargo Logistics" services', isChecked: false },
  ];

  toggleActive(todo: any) {
    todo.isChecked = !todo.isChecked;
  }

  private modalService = inject(NgbModal);
  closeResult = '';

  open(content: TemplateRef<any>) {
    this.modalService.open(content, { scrollable: true, size: 'lg', centered: true, windowClass: 'todo-modal' }).result.then();
  }

  constructor(private appService: AppService, private leadService: LeadService, private datePipe: CustomDatePipe, private appSettingService: AppSettingsService, private spinner: NgxSpinnerService) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.getAllLeadPendingMeetings()
    this.getAllTodo()
    this.isMobile = this.appService.getDevice()
  }

  searchDays: number // Holds user input

  pendingSchedule: any

  getAllLeadPendingMeetings() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    this.leadService.getAllPendingMeetings(CompanyMasterSid,BranchMasterSid).subscribe(
      (resp: any[]) => {
        console.log(resp)
        this.todoNeverMet = resp['data'].map(meeting => ({
          ...meeting,
          createdOn: this.datePipe.transform(meeting?.createdOn)
        }));
      }
    );
  }
  todoNotMet: any
  todoNeverMet: any
  todoInActive: any
  getAllTodo() {
    this.spinner.show();
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    this.leadService.getAllTodo(CompanyMasterSid,BranchMasterSid).subscribe(
      (resp: any[]) => {
        this.todoNotMet = resp['data'].notMet.map(meeting => ({
          ...meeting,
          meetingDate: this.datePipe.transform(meeting?.meetingDate)
        }));
        this.pendingSchedule = resp['data'].toMeet;
        console.log(resp['data'], this.pendingSchedule)
        this.todoInActive = resp['data'].inActive.map(meeting => ({
          ...meeting,
          createdOn: this.datePipe.transform(meeting?.createdOn)
        }));
        this.spinner.hide();
        console.log(this.todoNotMet)
      }
    );
  }







  filteredNotMetList = []

  generateNotMetList() {
    const today = new Date();
    this.filteredNotMetList = this.todoNotMet
      .filter((ps) => {
        const meetingDate = new Date(ps.meetingDate);
        const diffDays = Math.floor((today.getTime() - meetingDate.getTime()) / (1000 * 3600 * 24));

        console.log("Meeting Date:", ps.meetingDate, "Difference in Days:", diffDays);

        // Ensure meetingDate is in the past & within searchDays
        return diffDays >= 0 && diffDays <= this.searchDays;
      })
      .map((ps) => ({
        preCustomerName: ps.preCustomerMaster.preCustomerName,
        meetingDate: ps.meetingDate,
      }));
  }


  clearFilters() {
    this.filteredNotMetList = []; // Clear the filtered list
    this.searchDays = null;  // Clear the search input
  }




}
