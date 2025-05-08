import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LeadComponent } from './lead/lead.component';
import { ViewComponent } from './lead/view/view.component';
import { RateRequestComponent } from './rate-request/rate-request.component';
import { RateRequestViewComponent } from './rate-request/rate-request-view/rate-request-view.component';
import { QuotationComponent } from './quotation/quotation.component';
import { QuotationViewComponent } from './quotation/quotation-view/quotation-view.component';
import { FullcalendarComponent } from './fullcalendar/fullcalendar.component';
import { TodoComponent } from './todo/todo.component';
import { MeetingComponent } from './lead-schedule/meeting/meeting.component';
import { PendingComponent } from './lead-schedule/pending/pending.component';
import { PackageEntryComponent } from './package/package-entry/package-entry.component';
import { PackageListComponent } from './package/package-list/package-list.component';
import { CommodityEntryComponent } from './commodity/commodity-entry/commodity-entry.component';
import { CommodityListComponent } from './commodity/commodity-list/commodity-list.component';






export const CrmMobileRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: '',
                component: DashboardComponent,
                data: {
                    title: 'Dashboard',
                    urls: [
                        { title: 'CRM', url: '/crm' },
                        { title: 'Dashboard' },
                    ],
                },
            },
            {
                path: 'dashboard',
                component: DashboardComponent,
                data: {
                    title: 'Dashboard',
                    urls: [
                        { title: 'CRM', url: '/crm' },
                        { title: 'Dashboard' },
                    ],
                },
            },
            {
                path: 'lead/list',
                component: ViewComponent,
                data: {
                    title: 'Lead Generation',
                    urls: [
                        { title: 'CRM', url: '/crm' },
                        { title: 'Lead', url: 'crm/lead' },
                        { title: 'List' }
                    ],
                },
            },
            {
                path: 'lead',
                component: LeadComponent,
                data: {
                    title: 'Lead Generation',
                    urls: [
                        { title: 'CRM', url: 'crm' },
                        { title: 'Leads' },
                    ],
                },
            },
            {
                path: 'lead/:id',
                component: LeadComponent,
                data: {
                    title: 'Lead Generation',
                    urls: [
                        { title: 'CRM', url: 'crm' },
                        { title: 'Leads' },
                    ],
                },
            },
            {
                path: 'rate-request',
                component: RateRequestComponent,
                data: {
                    title: 'Rate Request',
                    urls: [
                        { title: 'CRM', url: '/crm' },
                        { title: 'Rate Request' },
                    ],
                },
            },
            {
                path: 'rate-request/view',
                component: RateRequestViewComponent,
                data: {
                    title: 'Rate Request',
                    urls: [
                        { title: 'CRM', url: '/crm' },
                        { title: 'Rate Request', url: 'rate-request' },
                        { title: 'View' },
                    ],
                },
            },
            {
                path: 'quotation',
                component: QuotationComponent,
                data: {
                    title: 'Quotation',
                    urls: [
                        { title: 'CRM', url: '/crm' },
                        { title: 'Quotation' },
                    ],
                },
            },
            {
                path: 'quotation/view',
                component: QuotationViewComponent,
                data: {
                    title: 'New Quotation',
                    urls: [
                        { title: 'CRM', url: '/crm' },
                        { title: 'Quotation', url: '/quotation' },
                        { title: 'view' },
                    ],
                },
            },
            {
                path: "calendar",
                component: FullcalendarComponent,
                data: {
                    title: "Calendar",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Calendar" },
                    ],
                },
            },
            {
                path: "todo",
                component: TodoComponent,
                data: {
                    title: "Todo",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Todo" },
                    ],
                },
            },
            {
                path: "lead-schedule-pending",
                component: PendingComponent,
                data: {
                    title: "Lead Schedule",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Lead Schedule (pending)" },
                    ],
                },
            },
            {
                path: "lead-schedule-meeting/:PreCustomerMasterSid",
                component: MeetingComponent,
                data: {
                    title: "Lead Schedule",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Lead Schedule (pending)" },
                    ],
                },
            }, 
            {
                path: "commodity/list",
                component: CommodityListComponent,
                data: {
                    title: "Commodity List",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Commodity" },
                    ],
                },
            },
            {
                path: "commodity/entry",
                component: CommodityEntryComponent,
                data: {
                    title: "Commodity Entry",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Commodity" },
                    ],
                },
            },
            {
                path: "package/list",
                component: PackageListComponent,
                data: {
                    title: "Package List",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Package" },
                    ],
                },
            },
            {
                path: "package/entry",
                component: PackageEntryComponent,
                data: {
                    title: "Package Entry",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Package" },
                    ],
                },
            },
        ],
    },
];