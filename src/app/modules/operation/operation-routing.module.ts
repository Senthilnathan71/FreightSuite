import { Routes } from '@angular/router';
import { BookingListComponent } from './booking/booking-list/booking-list.component';
import { BookingEntryComponent } from './booking/booking-entry/booking-entry.component';

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
    ],
  },
];
