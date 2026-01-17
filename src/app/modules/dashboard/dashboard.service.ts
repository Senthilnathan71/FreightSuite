import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  DashboardData,
  DashboardMetrics,
  SalesMetrics,
  CustomerServiceMetrics,
  ClientMeeting,
  MeetingWithFollowup,
  RateRequest,
  TodaysActivity,
  ApprovedQuotation,
  BookingListItem,
  Salesperson,
  DashboardFilters
} from './interfaces/dashboard.interfaces';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private salespeople: Salesperson[] = [];

  private clientMeetings: ClientMeeting[] = [];

  private meetingsWithFollowup: MeetingWithFollowup[] = [];

  private rateRequests: RateRequest[] = [];

  // Customer Service Data
  private todaysActivities: TodaysActivity[] = [];

  private approvedQuotations: ApprovedQuotation[] = [];

  private bookingList: BookingListItem[] = [];

  constructor() { }

  getDashboardData(filters?: DashboardFilters): Observable<DashboardData> {
    let filteredData = this.applyFilters(filters);

    const metrics: DashboardMetrics = {
      leadsWithoutSchedule: 0,
      meetingsScheduled: {
        overdue: 0,
        today: 0,
        future: 0
      },
      meetingsConductedNotConverted: 0,
      customersWithoutQuoteOrBooking: 0,
      quotesWithoutBooking: 0
    };

    const salesMetrics: SalesMetrics = {
      newClientCreated: 0,
      salesCall: 0,
      salesCallClosed: 0,
      quotationCreated: 0,
      quotationApproved: 0,
      bookingQuotation: 0
    };

    const customerServiceMetrics: CustomerServiceMetrics = {
      documentsVerified: 0,
      customsClearances: 0,
      shipmentsInTransit: 0,
      deliveriesCompleted: 0,
      pendingActions: 0,
      customerQueries: 0
    };

    const dashboardData: DashboardData = {
      metrics,
      salesMetrics,
      customerServiceMetrics,
      clientMeetings: filteredData.clientMeetings,
      meetingsWithFollowup: filteredData.meetingsWithFollowup,
      rateRequests: filteredData.rateRequests,
      todaysActivities: filteredData.todaysActivities,
      approvedQuotations: filteredData.approvedQuotations,
      bookingList: filteredData.bookingList,
      salespeople: this.salespeople
    };

    return of(dashboardData).pipe(delay(500));
  }

  getSalespeople(): Observable<Salesperson[]> {
    return of(this.salespeople);
  }

  private applyFilters(filters?: DashboardFilters) {
    let filteredClientMeetings = this.clientMeetings;
    let filteredMeetingsWithFollowup = this.meetingsWithFollowup;
    let filteredRateRequests = this.rateRequests;
    let filteredTodaysActivities = this.todaysActivities;
    let filteredApprovedQuotations = this.approvedQuotations;
    let filteredBookingList = this.bookingList;

    if (filters) {
      if (filters.salesperson) {
        filteredClientMeetings = filteredClientMeetings.filter(
          meeting => meeting.salesperson === filters.salesperson
        );
        filteredMeetingsWithFollowup = filteredMeetingsWithFollowup.filter(
          meeting => meeting.salesperson === filters.salesperson
        );
        filteredRateRequests = filteredRateRequests.filter(
          request => request.salesperson === filters.salesperson
        );
      }

      if (filters.dateFrom) {
        filteredClientMeetings = filteredClientMeetings.filter(
          meeting => meeting.date >= filters.dateFrom!
        );
        filteredMeetingsWithFollowup = filteredMeetingsWithFollowup.filter(
          meeting => meeting.meetingDate >= filters.dateFrom!
        );
        filteredRateRequests = filteredRateRequests.filter(
          request => request.date >= filters.dateFrom!
        );
      }

      if (filters.dateTo) {
        filteredClientMeetings = filteredClientMeetings.filter(
          meeting => meeting.date <= filters.dateTo!
        );
        filteredMeetingsWithFollowup = filteredMeetingsWithFollowup.filter(
          meeting => meeting.meetingDate <= filters.dateTo!
        );
        filteredRateRequests = filteredRateRequests.filter(
          request => request.date <= filters.dateTo!
        );
      }
    }

    return {
      clientMeetings: filteredClientMeetings,
      meetingsWithFollowup: filteredMeetingsWithFollowup,
      rateRequests: filteredRateRequests,
      todaysActivities: filteredTodaysActivities,
      approvedQuotations: filteredApprovedQuotations,
      bookingList: filteredBookingList
    };
  }
}
