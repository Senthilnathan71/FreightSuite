import { Routes } from '@angular/router';
import { LeadComponent } from './lead/lead.component';
import { ViewComponent } from './lead/view/view.component';
import { QuotationViewComponent } from './quotation/quotation-view/quotation-view.component';
import { FullcalendarComponent } from './fullcalendar/fullcalendar.component';
import { TodoComponent } from './todo/todo.component';
import { MeetingComponent } from './lead-schedule/meeting/meeting.component';
import { PendingComponent } from './lead-schedule/pending/pending.component';
import { MeetingUpdateListComponent } from './Meeting-Update/meeting-update-list/meeting-update-list.component';
import { EnquiryEntryComponent } from './enquiry/enquiry-entry/enquiry-entry.component';
import { EnquiryListComponent } from './enquiry/enquiry-list/enquiry-list.component';
import { QuotationEntryComponent } from './quotation/quotation-entry/quotation-entry.component';
import { ActivityAllocationComponent } from './activity-allocation/activity-allocation.component';
import { ActivityAllocationEntryComponent } from './activity-allocation/activity-allocation-entry/activity-allocation-entry.component';


export const CrmMobileRoutes: Routes = [
    {
        path: '',
        children: [

            {
                path: 'lead/list',
                component: ViewComponent,
                data: {
                    title: 'Lead',
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
                    title: 'Lead',
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
                    title: 'Lead',
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
                path: 'enquiry/list',
                component: EnquiryListComponent,
                data: {
                    title: 'Enquiry',
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
                path: 'enquiry/entry',
                component: EnquiryEntryComponent,
                data: {
                    title: 'Enquiry',
                    backOption: [
                        { title: 'Back', url: '/crm/enquiry/list' },
                    ],
                    // urls: [
                    //     { title: 'CRM', url: '/crm' },
                    //     { title: 'Rate Request' },
                    // ],
                },
            }, {
                path: 'enquiry/entry/:id',
                component: EnquiryEntryComponent,
                data: {
                    title: 'Enquiry',
                    backOption: [
                        { title: 'Back', url: '/crm/enquiry/list' },
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
                path: 'quotation/entry',
                component: QuotationEntryComponent,
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
                path: 'quotation/entry/:id',
                component: QuotationEntryComponent,
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
                    title: "Opportunity",
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
                    title: "Opportunity",
                    backOption: [
                        { title: 'Back', url: '/crm/lead-schedule-pending' },
                    ],
                    // urls: [
                    //     { title: "CRM", url: "/crm" },
                    //     { title: "Lead Schedule (pending)" },
                    // ],
                },
            },
          {
  path: 'activity-allocation',
  component: ActivityAllocationComponent,
  data: {
    title: 'Activity Allocation',
    backOption: [
      { title: 'Back', url: '/crm' },
    ],
  },
},
{
        path: 'activity-allocation/entry',          // <-- NEW
        component: ActivityAllocationEntryComponent,
        data: {
          title: 'Work Load Detail',
          backOption: [{ title: 'Back', url: '/crm/activity-allocation' }],
        },
      },

    
            
            
        ],
    },
];