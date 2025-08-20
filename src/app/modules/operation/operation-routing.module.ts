import { Routes } from '@angular/router';
import { BookingListComponent } from './booking/booking-list/booking-list.component';
import { BookingEntryComponent } from './booking/booking-entry/booking-entry.component';
import { MasterJobEntryComponent } from './master-job/master-job-entry/master-job-entry.component';
import { ReportComponent } from './report/report/report.component';

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
        path: 'master-job/entry',
        component: MasterJobEntryComponent,
        data: {
          title: 'Master Job',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Master Job' }],
        },
      },
      {
        path: 'report',
        component: ReportComponent,
        data: {
          title: 'Report',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Report' }],
        },
      },
    ],
  },
];
