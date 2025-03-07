import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { RouterModule } from '@angular/router';
import { AppService } from 'src/app/service/app.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  isMobile: boolean = false;

  menuItems = [
    { name: 'Port Master', badge: null, link: '/crm/port-master/list', category: 'nav-port-master' },
    { name: 'UOM Master', badge: null, link: '/crm/uom-master/list', category: 'nav-uom-master' },
    { name: 'Lead', badge: 99, link: '/crm/lead/list', category: 'nav-lead' },
    { name: 'Calendar', badge: null, link: '/crm/calendar', category: 'nav-calendar' },
    { name: 'Customer', badge: null, link: '/crm/customer', category: 'nav-customer' },
    { name: 'To Do', badge: null, link: '/crm/todo', category: 'nav-todo' },
    { name: 'Rate Request', badge: null, link: '/crm/rate-request/view', category: 'nav-rate-request' },
    { name: 'Sailing Schedule', badge: null, link: '', category: 'nav-sailing-schedule' },
    { name: 'Quotation', badge: null, link: 'quotation', category: 'nav-quotation' },
    { name: 'Dues', badge: null, link: '', category: 'nav-dues' },
    { name: 'Lead Analysis', badge: null, link: '', category: 'nav-lead-analysis' },
    { name: 'CRM', badge: null, link: '', category: 'nav-crm' },
    { name: 'Lead Schedule Pending', badge: null, link: '', category: 'nav-lead-schedule' },
  ];
  i: any;

  constructor(private appService: AppService) { }

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice()
  }
}



