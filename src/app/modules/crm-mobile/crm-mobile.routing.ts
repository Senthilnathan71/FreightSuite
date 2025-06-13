import { Routes } from '@angular/router';
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
import { MeetingUpdateListComponent } from './Meeting-Update/meeting-update-list/meeting-update-list.component';


export const CrmMobileRoutes: Routes = [
    {
        path: '',
        children: [

            {
                path: 'lead/list',
                component: ViewComponent,
                data: {
                    title: 'Lead Generation',
                    backOption: [
                        { title: 'Back', url: '/crm' },
                    ],
                    // urls: [
                    //     { title: 'CRM', url: '/crm' },
                    //     { title: 'Lead', url: 'crm/lead' },
                    //     { title: 'List' }
                    // ],
                },
            },
            {
                path: 'lead',
                component: LeadComponent,
                data: {
                    title: 'Lead Generation',
                    backOption: [
                        { title: 'Back', url: '/crm/lead/list' },
                    ],
                    // urls: [
                    //     { title: 'CRM', url: 'crm' },
                    //     { title: 'Leads' },
                    // ],
                },
            },
            {
                path: 'lead/:id',
                component: LeadComponent,
                data: {
                    title: 'Lead Generation',
                    backOption: [
                        { title: 'Back', url: '/crm/lead/list' },
                    ],
                    // urls: [
                    //     { title: 'CRM', url: 'crm' },
                    //     { title: 'Leads' },
                    // ],
                },
            },
            {
                path: 'rate-request/list',
                component: RateRequestViewComponent,
                data: {
                    title: 'Rate Request',
                    backOption: [
                        { title: 'Back', url: '/crm' },
                    ],
                    // urls: [
                    //     { title: 'CRM', url: '/crm' },
                    //     { title: 'Rate Request', url: 'rate-request' },
                    //     { title: 'View' },
                    // ],
                },
            },
            {
                path: 'rate-request',
                component: RateRequestComponent,
                data: {
                    title: 'Rate Request',
                    backOption: [
                        { title: 'Back', url: '/crm/rate-request/list' },
                    ],
                    // urls: [
                    //     { title: 'CRM', url: '/crm' },
                    //     { title: 'Rate Request' },
                    // ],
                },
            }, {
                path: 'rate-request/:id',
                component: RateRequestComponent,
                data: {
                    title: 'Rate Request',
                    backOption: [
                        { title: 'Back', url: '/crm/rate-request/list' },
                    ],
                    // urls: [
                    //     { title: 'CRM', url: '/crm' },
                    //     { title: 'Rate Request' },
                    // ],
                },
            },
            {
                path: 'quotation/list',
                component: QuotationViewComponent,
                data: {
                    title: 'New Quotation',
                    backOption: [
                        { title: 'Back', url: '/crm' },
                    ],
                    // urls: [
                    //     { title: 'CRM', url: '/crm' },
                    //     { title: 'Quotation', url: '/quotation' },
                    //     { title: 'view' },
                    // ],
                },
            },


            {
                path: 'quotation',
                component: QuotationComponent,
                data: {
                    title: 'Quotation',
                    backOption: [
                        { title: 'Back', url: '/crm/quotation/list' },
                    ],
                    // urls: [
                    //     { title: 'CRM', url: '/crm' },
                    //     { title: 'Quotation' },
                    // ],
                },
            },
            {
                path: 'quotation/:id',
                component: QuotationComponent,
                data: {
                    title: 'Quotation',
                    backOption: [
                        { title: 'Back', url: '/crm/quotation/list' },
                    ],
                    // urls: [
                    //     { title: 'CRM', url: '/crm' },
                    //     { title: 'Quotation' },
                    // ],
                },
            },
            {
                path: "calendar",
                component: FullcalendarComponent,
                data: {
                    title: "Calendar",
                    backOption: [
                        { title: 'Back', url: '/crm' },
                    ],
                },
            },
            { path: 'calendar/update/:id', component: FullcalendarComponent },
            {
                path: "meeting-update",
                component: MeetingUpdateListComponent,
                data: {
                    title: "Meeting Update",
                    backOption: [
                        { title: 'Back', url: '/crm' },
                    ],
                },
            },
            {
                path: "calendar/update/:eventId",  
                component: FullcalendarComponent,  
                data: {
                    title: "Update Calendar Event",
                    backOption: [
                        { title: 'Back', url: '/crm/calendar' },
                    ],
                },
            },
            {
                path: "todo",
                component: TodoComponent,
                data: {
                    title: "To Do",
                    backOption: [
                        { title: 'Back', url: '/crm' },
                    ],
                    // urls: [
                    //     { title: "CRM", url: "/crm" },
                    //     { title: "Todo" },
                    // ],
                },
            },
            {
                path: "lead-schedule-pending",
                component: PendingComponent,
                data: {
                    title: "Lead Schedule",
                    backOption: [
                        { title: 'Back', url: '/crm' },
                    ],
                    // urls: [
                    //     { title: "CRM", url: "/crm" },
                    //     { title: "Lead Schedule (pending)" },
                    // ],
                },
            },
            {
                path: "lead-schedule-meeting/:PreCustomerMasterSid",
                component: MeetingComponent,
                data: {
                    title: "Lead Schedule",
                    backOption: [
                        { title: 'Back', url: '/crm/lead-schedule-pending' },
                    ],
                    // urls: [
                    //     { title: "CRM", url: "/crm" },
                    //     { title: "Lead Schedule (pending)" },
                    // ],
                },
            },
        ],
    },
];