import { Routes } from '@angular/router';
import { BookingListComponent } from './booking/booking-list/booking-list.component';
import { BookingEntryComponent } from './booking/booking-entry/booking-entry.component';
import { MasterJobEntryComponent } from './master-job/master-job-entry/master-job-entry.component';
import { ReportComponent } from './report/report/report.component';
import { MasterJobListComponent } from './master-job/master-job-list/master-job-list.component';
import { ReportEntryComponent } from './report/report-entry/report-entry.component';
import { ProfitabilityReportListComponent } from './profitability-report/profitability-report-list/profitability-report-list.component';
import { ProfitabilityReportEntryComponent } from './profitability-report/profitability-report-entry/profitability-report-entry.component';
import { InvoiceListComponent } from './Invoice/invoice-list/invoice-list.component';
import { InvoiceEntryComponent } from './Invoice/invoice-entry/invoice-entry.component';
import { CragoReceiptEntryComponent } from './cargo-receipt/crago-receipt-entry/crago-receipt-entry.component';
import { CragoReceiptListComponent } from './cargo-receipt/crago-receipt-list/crago-receipt-list.component';
import { LoadingPlanEntryComponent } from './loading-plan/loading-plan-entry/loading-plan-entry.component';
import { SplitBookingEntryComponent } from './Split-Booking/split-booking-entry/split-booking-entry.component';
import { MergeBookingComponent } from './merge-booking/merge-booking/merge-booking.component';
import { ShipmentInstructionComponent } from './shipment-instruction/shipment-instruction/shipment-instruction.component';
import { HouseJobEntryComponent } from './house-job/house-job-entry/house-job-entry.component';
import { OperationReportComponent } from './operation-report/operation-report/operation-report.component';

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
        path: 'master-job/entry/:id',
        component: MasterJobEntryComponent,
        data: {
          title: 'Master Job',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Master Job' }],
        },
      },
      
      {
        path: 'booking-report/list',
        component: ReportComponent,
        data: {
          title: 'Booking Report',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Booking Report' }],
        },
      },
       {
        path: 'booking-report/entry',
        component: ReportEntryComponent,
        data: {
          title: 'Booking Report',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Booking Report' }],
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
       {
        path: 'invoice/list',
        component: InvoiceListComponent,
        data: {
          title: 'Invoice',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Invoice' }],
        },
      },
       {
        path: 'invoice/entry',
        component: InvoiceEntryComponent,
        data: {
          title: 'Invoice',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Invoice' }],
        },
      },
      {
        path: 'invoice/entry/:id',
        component: InvoiceEntryComponent,
        data: {
          title: 'Invoice',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Invoice' }],
        },
      },
        {
        path: 'cargo-receipt/entry',
        component: CragoReceiptEntryComponent,
        data: {
          title: 'Cargo Receipt',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Cargo Receipt' }],
        },
      },
       {
        path: 'cargo-receipt/list',
        component: CragoReceiptListComponent,
        data: {
          title: 'Cargo Receipt',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Cargo Receipt' }],
        },
      },
      {
        path: 'cargo-receipt/entry/:BookingHeaderSid',
        component: CragoReceiptEntryComponent,
        data: {
          title: 'Cargo Receipt',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Cargo Receipt' }],
        },
      },
       {
        path: 'loading-plan/entry',
        component: LoadingPlanEntryComponent,
        data: {
          title: 'Loading Plan',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Loading Plan' }],
        },
      },
       {
        path: 'split-booking/entry',
        component: SplitBookingEntryComponent,
        data: {
          title: 'Split Booking',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Split Booking' }],
        },
      },
       {
        path: 'merge-booking/entry',
        component: MergeBookingComponent,
        data: {
          title: 'Merge Booking',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Merge Booking' }],
        },
      },
       {
        path: 'shipment-instruction',
        component: ShipmentInstructionComponent,
        data: {
          title: 'Shipment Instruction',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Shipment Instruction' }],
        },
      },
      // {
      //   path: 'house-job',
      //   component: HouseJobEntryComponent,
      //   data: {
      //     title: 'House Job',
      //     urls: [{ title: 'Master', url: '/master' }, { title: 'House Job' }],
      //   },
      // },
      {
        path: 'house-job/entry/:id',
        component: HouseJobEntryComponent,
        data: {
          title: 'House Job',
          urls: [{ title: 'Master', url: '/master' }, { title: 'House Job' }],
        }
      },
      {
        path: 'operation-report',
        component: OperationReportComponent,
        data: {
          title: 'Operation Report',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Operation Report' }],
        },
      },
    ],
  },
  
];
