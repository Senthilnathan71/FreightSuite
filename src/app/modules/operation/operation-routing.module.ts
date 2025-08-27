import { Routes } from '@angular/router';
import { BookingListComponent } from './booking/booking-list/booking-list.component';
import { BookingEntryComponent } from './booking/booking-entry/booking-entry.component';
import { MasterJobEntryComponent } from './master-job/master-job-entry/master-job-entry.component';
import { ReportComponent } from './report/report/report.component';
import { MasterJobListComponent } from './master-job/master-job-list/master-job-list.component';
import { ReportEntryComponent } from './report/report-entry/report-entry.component';
import { ProfitabilityReportListComponent } from './profitability-report/profitability-report-list/profitability-report-list.component';
import { ProfitabilityReportEntryComponent } from './profitability-report/profitability-report-entry/profitability-report-entry.component';

export const OperationRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'booking/list',
        component: BookingListComponent,
        data: {
          title: 'Booking',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Booking' }],
        },
      },
      {
        path: 'booking/entry',
        component: BookingEntryComponent,
        data: {
          title: 'Booking',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Booking' }],
        },
      },
      {
        path: 'booking/entry/:id',
        component: BookingEntryComponent,
        data: {
          title: 'Booking',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Booking' }],
        },
      },
       {
        path: 'master-job/list',
        component: MasterJobListComponent,
        data: {
          title: 'Master Job',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Master Job' }],
        },
      },
      {
        path: 'master-job/entry',
        component: MasterJobEntryComponent,
        data: {
          title: 'Master Job',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Master Job' }],
        },
      },
      
      {
        path: 'report/list',
        component: ReportComponent,
        data: {
          title: 'Report',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Report' }],
        },
      },
       {
        path: 'report/entry',
        component: ReportEntryComponent,
        data: {
          title: 'Report',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Report' }],
        },
      },
       {
        path: 'profitability-report/list',
        component: ProfitabilityReportListComponent,
        data: {
          title: 'Profitability Report',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Profitability Report' }],
        },
      },
      {
        path: 'profitability-report/entry',
        component: ProfitabilityReportEntryComponent,
        data: {
          title: 'Profitability Report',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Profitability Report' }],
        },
      },
    ],
  },
];
