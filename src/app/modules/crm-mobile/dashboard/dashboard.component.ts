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
    { name: 'Customer', badge: null, link: '/crm/customer/list', category: 'nav-customer-master' },
    { name: 'Country', badge: null, link: '/crm/country/list', category: 'nav-country-list' },
    { name: 'State', badge: null, link: '/crm/state/list', category: 'nav-state-list' },
    { name: 'Unit', badge: null, link: '/crm/unit/list', category: 'nav-unit-list' },
    { name: 'Vessel', badge: null, link: '/crm/vessel/list', category: 'nav-vessel-list' },
    { name: 'Zone', badge: null, link: '/crm/zone/list', category: 'nav-zone-list' },
    { name: 'Tarrif', badge: null, link: '/crm/tarrif/list', category: 'nav-tarrif-list' },

    { name: 'City', badge: null, link: '/crm/city/list', category: 'nav-city-list' },
    { name: 'Department', badge: null, link: '/crm/department/list', category: 'nav-department-list' },
    { name: 'Currency', badge: null, link: '/crm/currency/list', category: 'nav-currency-list' },
    { name: 'Currency Exchange', badge: null, link: '/crm/currency-exchange/list', category: 'nav-currency-exchange-list' },
    { name: 'Sector', badge: null, link: '/crm/sector/list', category: 'nav-sector-list' },
    { name: 'Vessel', badge: null, link: '/crm/vessel/list', category: 'nav-vessel-list' },
    // { name: 'Lead', badge: 99, link: '/crm/lead/list', category: 'nav-lead' },
    // { name: 'Calendar', badge: null, link: '/crm/calendar', category: 'nav-calendar' },
    // { name: 'Customer', badge: null, link: '/crm/customer', category: 'nav-customer' },
    // { name: 'To Do', badge: null, link: '/crm/todo', category: 'nav-todo' },
    // { name: 'Rate Request', badge: null, link: '/crm/rate-request/view', category: 'nav-rate-request' },
    // { name: 'Sailing Schedule', badge: null, link: '', category: 'nav-sailing-schedule' },
    // { name: 'Quotation', badge: null, link: 'quotation', category: 'nav-quotation' },
    // { name: 'Dues', badge: null, link: '', category: 'nav-dues' },
    // { name: 'Lead Analysis', badge: null, link: '', category: 'nav-lead-analysis' },
    // { name: 'CRM', badge: null, link: '', category: 'nav-crm' },
    // { name: 'Lead Schedule Pending', badge: null, link: '', category: 'nav-lead-schedule' },
  ];
  i: any;

  constructor(private appService: AppService) { }

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice()
  }
}



