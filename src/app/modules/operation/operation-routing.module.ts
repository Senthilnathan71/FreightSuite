import { Routes } from '@angular/router';
import { BookingListComponent } from './booking/booking-list/booking-list.component';
import { BookingEntryComponent } from './booking/booking-entry/booking-entry.component';
import { MasterJobEntryComponent } from './master-job/master-job-entry/master-job-entry.component';
import { UnsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';
import { ReportComponent } from './report/report/report.component';
import { MasterJobListComponent } from './master-job/master-job-list/master-job-list.component';
import { ReportEntryComponent } from './report/report-entry/report-entry.component';
import { ProfitabilityReportListComponent } from './profitability-report/profitability-report-list/profitability-report-list.component';
import { ProfitabilityReportEntryComponent } from './profitability-report/profitability-report-entry/profitability-report-entry.component';
import { InvoiceListComponent } from './Invoice/invoice-list/invoice-list.component';
import { InvoiceEntryComponent } from './Invoice/invoice-entry/invoice-entry.component';
import { InvoiceNewComponent } from './Invoice/invoice-new/invoice-new.component';
import { LoadingPlanEntryComponent } from './loading-plan/loading-plan-entry/loading-plan-entry.component';
import { SplitBookingEntryComponent } from './Split-Booking/split-booking-entry/split-booking-entry.component';
import { MergeBookingComponent } from './merge-booking/merge-booking/merge-booking.component';
import { ShipmentInstructionComponent } from './shipment-instruction/shipment-instruction/shipment-instruction.component';
import { HouseJobEntryComponent } from './house-job/house-job-entry/house-job-entry.component';
import { OperationReportComponent } from './operation-report/operation-report/operation-report.component';
import { CargoReceiptEntryComponent } from './cargo-receipt/cargo-receipt-entry/cargo-receipt-entry.component';
import { CargoReceiptListComponent } from './cargo-receipt/cargo-receipt-list/cargo-receipt-list.component';
import { VendorInvoiceEntryComponent } from './vendor-invoice/vendor-invoice-entry/vendor-invoice-entry.component';
import { VendorInvoiceListComponent } from './vendor-invoice/vendor-invoice-list/vendor-invoice-list.component';
import { CreditRequestListComponent } from './credit-request/credit-request-list/credit-request-list.component';
import { CreditRequestEntryComponent } from './credit-request/credit-request-entry/credit-request-entry.component';
import { ServiceJobListComponent } from './service-job/service-job-list/service-job-list.component';
import { ServiceJobEntryComponent } from './service-job/service-job-entry/service-job-entry.component';
import { ReportMasterComponent } from './report-master/report-master.component';
import { MawbillListComponent } from './Master-air-waybill/mawbill-list/mawbill-list.component';
import { MawbillEntryComponent } from './Master-air-waybill/mawbill-entry/mawbill-entry.component';
import { CreditNoteEntryComponent } from './credit-note/credit-note-entry/credit-note-entry.component';
import { CreditNoteListComponent } from './credit-note/credit-note-list/credit-note-list.component';
import { OperationReportsComponent } from '../../operation/components/operation-reports/operation-reports.component';
import { VendorCreditNoteListComponent } from './vendor-credit-note/vendor-credit-note-list/vendor-credit-note-list.component';
import { VendorCreditNoteEntryComponent } from './vendor-credit-note/vendor-credit-note-entry/vendor-credit-note-entry.component';
import { DocReferenceComponent } from './doc-reference/doc-reference.component';
import { DocReferenceListComponent } from './doc-reference/doc-reference-list/doc-reference-list.component';
import { HouseJobListComponent } from './house-job/house-job-list/house-job-list.component';
import { HawbBillListComponent } from './house-job/hawb-bill-list/hawb-bill-list.component';
import { JobCloseListComponent } from './job-close/job-close-list/job-close-list.component';
import { JobCloseComponent } from './job-close/job-close.component';
import { VoucherCorrectionListComponent } from './voucher-correction/voucher-correction-list/voucher-correction-list.component';
import { title } from 'process';
import { AgentMasterAirWaybillListComponent } from './agent-master-air-waybill/agent-master-air-waybill-list/agent-master-air-waybill-list.component';
import { AgentMasterAirWaybillEntryComponent } from './agent-master-air-waybill/agent-master-air-waybill-entry/agent-master-air-waybill-entry.component';


export const OperationRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'booking/list',
        component: BookingListComponent,
        data: {
          title: 'Booking',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Booking' }],
        },
      },
      {
        path: 'booking/entry',
        component: BookingEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Booking',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Booking' }],
        },
      },
      {
        path: 'booking/entry/:id',
        component: BookingEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Booking',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Booking' }],
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
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Master Job',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Master Job' }],
        },
      },
       {
        path: 'master-job/entry/:id',
        component: MasterJobEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Master Job',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Master Job' }],
        },
      },
      {
        path: 'job-close/list',
        component: JobCloseListComponent,
        data: {
          title: 'Job Close',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Job Close' }],
        },
      },
      {
        path: 'job-close/:id',
        component: JobCloseComponent,
        data: {
          title: 'Job Close',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Job Close' }],
        },
      },
      {
        path: 'mawbill/entry',
        component: MawbillEntryComponent,
        data: {
          title: 'Master Air Waybill',
          urls: [{ title: 'operation', url: '/operation' }, { title: 'Master Air Waybill' }],
        },
      },
      {
        path: 'mawbill/entry/:id',
        component: MawbillEntryComponent,
        data: {
          title: 'Master Air Waybill',
          urls: [{ title: 'operation', url: '/operation' }, { title: 'Master Air Waybill' }],
        },
      },

      {
        path: 'mawbill/list',
        component: MawbillListComponent,
        data: {
          title: 'Master Air Waybill',
          urls: [{ title: 'operation', url: '/operation' }, { title: 'Master Air Waybill' }],
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
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Invoice',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Invoice' }],
        },
      },
      {
        path: 'invoice/entry/:id',
        component: InvoiceEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Invoice',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Invoice' }],
        },
      },
      {
        path: 'invoice/new',
        component: InvoiceNewComponent,
        data: {
          title: 'Generate Invoice',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Generate Invoice' }],
        },
      },
      {
        path: 'credit-note/list',
        component: CreditNoteListComponent,
        data: {
          title: 'Credit Note',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Credit Note' }],
        },
      },
      {
        path: 'credit-note/entry',
        component: CreditNoteEntryComponent,
        data: {
          title: 'Credit Note',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Credit Note' }],
        },
      },
      {
        path: 'credit-note/entry/:id',
        component: CreditNoteEntryComponent,
        data: {
          title: 'Credit Note',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Credit Note' }],
        },
      },
      {
        path: 'vendor-credit-note/list',
        component: VendorCreditNoteListComponent,
        data: {
          title: 'Vendor Credit Note',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Vendor Credit Note' }],
        },
      },
      {
        path: 'vendor-credit-note/entry',
        component: VendorCreditNoteEntryComponent,
        data: {
          title: 'Vendor Credit Note',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Vendor Credit Note' }],
        },
      },
      {
        path: 'vendor-credit-note/entry/:id',
        component: VendorCreditNoteEntryComponent,
        data: {
          title: 'Vendor Credit Note',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Vendor Credit Note' }],
        },
      },
      {
        path: 'vendor-credit-note/view/:id',
        component: VendorCreditNoteEntryComponent,
        data: {
          title: 'Vendor Credit Note',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Vendor Credit Note' }],
          viewMode: true
        },
      },
        {
        path: 'cargo-receipt/entry',
        component: CargoReceiptEntryComponent,
        data: {
          title: 'Cargo Receipt',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Cargo Receipt' }],
        },
      },
       {
        path: 'cargo-receipt/list',
        component: CargoReceiptListComponent,
        data: {
          title: 'Cargo Receipt',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Cargo Receipt' }],
        },
      },
      {
        path: 'cargo-receipt/entry/:BookingHeaderSid',
        component: CargoReceiptEntryComponent,
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
      {
        path:'house-job/list',
        component: HouseJobListComponent,
        data: {
          title: 'House Job',
          urls: [{ title: 'Master', url: '/master' }, { title: 'House Job' }],
        },
      },
      {
        path:'hawb-bill/list',
        component: HawbBillListComponent,
        data: {
          title: 'House AirwayBill',
          urls: [{ title: 'Master', url: '/operation' }, { title: 'House AirwayBill' }],
        },
      },
      {
        path: 'house-job/entry',
        component: HouseJobEntryComponent,
        data: {
          title: 'House Job',
          urls: [{ title: 'Master', url: '/master' }, { title: 'House Job' }],
        },
      },
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
      
       {
        path: 'vendor-invoice/list',
        component: VendorInvoiceListComponent,
        data: {
          title: 'Vendor Invoice',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Vendor Invoice' }],
        },
      },
       {
        path: 'vendor-invoice/entry',
        component: VendorInvoiceEntryComponent,
        data: {
          title: 'Vendor Invoice',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Vendor Invoice' }],
        },
      },
      {
        path: 'vendor-invoice/entry/:id',
        component: VendorInvoiceEntryComponent,
        data: {
          title: 'Edit Vendor Invoice',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Vendor Invoice' }],
        },
      },
      {
        path: 'vendor-invoice/view/:id',
        component: VendorInvoiceEntryComponent,
        data: {
          title: 'View Vendor Invoice',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Vendor Invoice' }],
          viewMode: true
        },
      },
      {
        path: 'credit-request/list',
        component: CreditRequestListComponent,
        data: {
          title: 'Credit Request',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Credit Request' }],
        }
      },
      {
        path: 'credit-request/entry',
        component: CreditRequestEntryComponent,
        data: {
          title: 'Credit Request',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Credit Request' }],
        }
      },
      {
        path: 'credit-request/entry/:CustomerMasterSid',
        component: CreditRequestEntryComponent,
        data: {
          title: 'Credit Request',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Credit Request' }],
        }
      },
     {
       path: 'report-master/entry',
       component: ReportMasterComponent ,
       data:{
          title: 'Report Master',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Report Master' }],
          viewMode: false
       }
      },
      {
        path: 'service-job/list',
        component: ServiceJobListComponent,
        data: {
          title: 'Service Job',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Service Job' }],
        }
      },
      {
        path: 'service-job/entry',
        component: ServiceJobEntryComponent,
        data: {
          title: 'Service Job',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Service Job' }],
        }
      },
      {
        path: 'service-job/entry/:id',
        component: ServiceJobEntryComponent,
        data: {
          title: 'Service Job',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Service Job' }],
        }
      },
      {
        path: 'reports',
        component: OperationReportsComponent,
        data: {
          title: 'Operation Reports',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Reports' }],
        }
      },
      {
        path: 'doc-reference',
        redirectTo: 'doc-reference/list',
        pathMatch: 'full',
      },
      {
        path: 'doc-reference/list',
        component: DocReferenceListComponent,
        data: {
          title: 'Document Reference',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Document Reference' }],
        },
      },
      {
        path: 'doc-reference/add',
        component: DocReferenceComponent,
        data: {
          title: 'Document Reference',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Document Reference' }],
        },
      },
      {
        path: 'doc-reference/edit/:id',
        component: DocReferenceComponent,
        data: {
          title: 'Document Reference',
          urls: [{ title: 'Operation', url: '/operation' }, { title: 'Document Reference' }],
        },
      },
      {
        path: "voucher-correction/list",
        component: VoucherCorrectionListComponent,
        data: {
          title: "Voucher-Correction",
          urls: [
            { title: 'Operation', url: '/operation'},
            { title: 'Voucher-Correction'},
          ],
        },
      },
      {
        path: 'agent-master-air-waybill/entry',
        component: AgentMasterAirWaybillEntryComponent,
        data: {
          title: 'Agent Master Air Waybill',
          urls: [{ title: 'operation', url: '/operation' }, { title: 'Agent Master Air Waybill' }],
        },
      },
      {
         path: 'agent-master-air-waybill/entry/:id',
         component: AgentMasterAirWaybillEntryComponent,
         data: {
           title: 'Agent Master Air Waybill',
           urls: [{ title: 'operation', url: '/operation' }, { title: 'Agent Master Air Waybill' }],
         },
      },
      {
        path: 'agent-master-air-waybill/list',
        component: AgentMasterAirWaybillListComponent,
        data: {
          title: 'Agent Master Air Waybill',
          urls: [{ title: 'operation', url: '/operation' }, { title: 'Agent Master Air Waybill' }],
        },
      },
    ],
  },

]