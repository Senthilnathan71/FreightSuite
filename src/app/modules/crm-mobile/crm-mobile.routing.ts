import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LeadComponent } from './lead/lead.component';
import { ViewComponent } from './lead/view/view.component';
import { CustomerComponent } from './customer/customer.component';
import { CustomerViewComponent } from './customer/customer-view/customer-view.component';
import { RateRequestComponent } from './rate-request/rate-request.component';
import { RateRequestViewComponent } from './rate-request/rate-request-view/rate-request-view.component';
import { QuotationComponent } from './quotation/quotation.component';
import { QuotationViewComponent } from './quotation/quotation-view/quotation-view.component';
import { FullcalendarComponent } from './fullcalendar/fullcalendar.component';
import { TodoComponent } from './todo/todo.component';
import { MeetingComponent } from './lead-schedule/meeting/meeting.component';
import { PendingComponent } from './lead-schedule/pending/pending.component';
import { PostMasterViewComponent } from './port-master/post-master-view/post-master-view.component';
import { PostMasterListComponent } from './port-master/post-master-list/post-master-list.component';
import { UOMMListComponent } from './UOM-Master/uomm-list/uomm-list.component';
import { UOMMViewComponent } from './UOM-Master/uomm-view/uomm-view.component';
import { CountryListComponent } from './country/country-list/country-list.component';
import { CountryEntryComponent } from './country/country-entry/country-entry.component';
import { StateListComponent } from './state/state-list/state-list.component';
import { StateEntryComponent } from './state/state-entry/state-entry.component';
import { UnitListComponent } from './unit/unit-list/unit-list.component';
import { UnitEntryComponent } from './unit/unit-entry/unit-entry.component';
import { ZoneListComponent } from './zone/zone-list/zone-list.component';
import { ZoneEntryComponent } from './zone/zone-entry/zone-entry.component';
import { VesselListComponent } from './vessel/vessel-list/vessel-list.component';
import { VesselEntryComponent } from './vessel/vessel-entry/vessel-entry.component';
import { TarrifListComponent } from './tarrif/tarrif-list/tarrif-list.component';
import { TarrifEntryComponent } from './tarrif/tarrif-entry/tarrif-entry.component';




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
                path: 'customer/list',
                component: CustomerComponent,
                data: {
                    title: 'Customer',
                    urls: [
                        { title: 'CRM', url: '/crm' },
                        { title: 'Customer' },
                    ],
                },
            },
            {
                path: 'customer/view',
                component: CustomerViewComponent,
                data: {
                    title: 'New Customer',
                    urls: [
                        { title: 'CRM', url: '/crm' },
                        { title: 'Customer', url: 'customer' },
                        { title: 'View' },
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
                path: "port-master/view",
                component: PostMasterViewComponent,
                data: {
                    title: "Port Master",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Port Master" },
                    ],
                },
            },
            {
                path: "port-master/list",
                component: PostMasterListComponent,
                data: {
                    title: "Port Master",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Port Master List" },
                    ],
                },
            },
            {
                path: "uom-master/list",
                component: UOMMListComponent,
                data: {
                    title: "UOM Master",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "UOM Master List" },
                    ],
                },
            },
            {
                path: "uom-master/view",
                component: UOMMViewComponent,
                data: {
                    title: "UOM Master List",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "UOM Master View" },
                    ],
                },
            },
            {
                path: "country/list",
                component: CountryListComponent,
                data: {
                    title: "Country",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Country List" },
                    ],
                },
            },
            {
                path: "country/entry",
                component: CountryEntryComponent,
                data: {
                    title: "Country",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Country Add" },
                    ],
                },
            },
            {
                path: "state/list",
                component: StateListComponent,
                data: {
                    title: "State",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "State List" },
                    ],
                },
            },
            {
                path: "state/entry",
                component: StateEntryComponent,
                data: {
                    title: "State",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "State Add" },
                    ],
                },
            },
            {
                path: "unit/list",
                component: UnitListComponent,
                data: {
                    title: "Unit",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Unit List" },
                    ],
                },
            },
            {
                path: "unit/entry",
                component: UnitEntryComponent,
                data: {
                    title: "Unit",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Unit Add" },
                    ],
                },
            },
            {
                path: "vessel/list",
                component: VesselListComponent,
                data: {
                    title: "Vessel",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Vessel List" },
                    ],
                },
            },
            {
                path: "vessel/entry",
                component: VesselEntryComponent,
                data: {
                    title: "Vessel",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Vessel Add" },
                    ],
                },
            },
            {
                path: "zone/list",
                component: ZoneListComponent,
                data: {
                    title: "Zone",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Zone List" },
                    ],
                },
            },
            {
                path: "zone/entry",
                component: ZoneEntryComponent,
                data: {
                    title: "Zone",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Zone Add" },
                    ],
                },
            },
            {
                path: "tarrif/list",
                component: TarrifListComponent,
                data: {
                    title: "Tarrif",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Tarrif" },
                    ],
                },
            },
            {
                path: "tarrif/entry",
                component: TarrifEntryComponent,
                data: {
                    title: "Add Tarrif",
                    urls: [
                        { title: "CRM", url: "/crm" },
                        { title: "Tarrif" },
                    ],
                },
            },
        ],
    },
];