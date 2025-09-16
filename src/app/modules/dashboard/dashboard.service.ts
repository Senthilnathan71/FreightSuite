import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  DashboardData,
  DashboardMetrics,
  SalesMetrics,
  ClientMeeting,
  MeetingWithFollowup,
  RateRequest,
  Salesperson,
  DashboardFilters
} from './interfaces/dashboard.interfaces';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private salespeople: Salesperson[] = [
    { id: '1', name: 'Sarah Kim', email: 'sarah.kim@company.com', department: 'Sales' },
    { id: '2', name: 'Mark Rivera', email: 'mark.rivera@company.com', department: 'Sales' },
    { id: '3', name: 'Anita Desai', email: 'anita.desai@company.com', department: 'Sales' },
    { id: '4', name: 'James O\'Neil', email: 'james.oneil@company.com', department: 'Sales' },
    { id: '5', name: 'Linda Gomez', email: 'linda.gomez@company.com', department: 'Sales' }
  ];

  private clientMeetings: ClientMeeting[] = [
    {
      id: '1',
      client: 'Global Freight Ltd',
      agenda: 'Virtual Meeting',
      meetingType: 'Virtual Meeting',
      salesperson: 'Sarah Kim',
      date: new Date('2025-09-13'),
      status: 'Pending'
    },
    {
      id: '2',
      client: 'Oceanic Shippers',
      agenda: 'On-site Visit',
      meetingType: 'On-site Visit',
      salesperson: 'Mark Rivera',
      date: new Date('2025-09-12'),
      status: 'Pending'
    },
    {
      id: '3',
      client: 'TransWorld Cargo',
      agenda: 'Introductory Call',
      meetingType: 'Introductory Call',
      salesperson: 'Anita Desai',
      date: new Date('2025-09-15'),
      status: 'Scheduled Today'
    },
    {
      id: '4',
      client: 'Swift Logistics',
      agenda: 'Proposal Discussion',
      meetingType: 'Proposal Discussion',
      salesperson: 'James O\'Neil',
      date: new Date('2025-09-15'),
      status: 'Scheduled Today'
    },
    {
      id: '5',
      client: 'AirSea Movers',
      agenda: 'Contract Finalization',
      meetingType: 'Contract Finalization',
      salesperson: 'Linda Gomez',
      date: new Date('2025-09-15'),
      status: 'Scheduled Today'
    }
  ];

  private meetingsWithFollowup: MeetingWithFollowup[] = [
    {
      id: '1',
      client: 'Global Freight Ltd',
      salesperson: 'Sarah Kim',
      meetingType: 'Virtual Meeting',
      meetingDate: new Date('2025-09-10'),
      followupType: 'Email Recap',
      followupDate: new Date('2025-09-12')
    },
    {
      id: '2',
      client: 'Oceanic Shippers',
      salesperson: 'Mark Rivera',
      meetingType: 'On-site Meeting',
      meetingDate: new Date('2025-09-08'),
      followupType: 'Call Follow-up',
      followupDate: new Date('2025-09-10')
    },
    {
      id: '3',
      client: 'TransWorld Cargo',
      salesperson: 'Anita Desai',
      meetingType: 'Phone Call',
      meetingDate: new Date('2025-09-07'),
      followupType: 'Demo Scheduled',
      followupDate: new Date('2025-09-14')
    },
    {
      id: '4',
      client: 'Swift Logistics',
      salesperson: 'James O\'Neil',
      meetingType: 'Virtual Meeting',
      meetingDate: new Date('2025-09-05'),
      followupType: 'Proposal Sent',
      followupDate: new Date('2025-09-06')
    },
    {
      id: '5',
      client: 'AirSea Movers',
      salesperson: 'Linda Gomez',
      meetingType: 'Conference Call',
      meetingDate: new Date('2025-09-09'),
      followupType: 'Contract Review',
      followupDate: new Date('2025-09-16')
    }
  ];

  private rateRequests: RateRequest[] = [
    {
      id: '1',
      rateRequestNumber: 'RRQ-20250901-01',
      date: new Date('2025-09-01'),
      quotationNumber: 'QTN-20250901-01',
      quoteDate: new Date('2025-09-01'),
      salesperson: 'Sarah Kim',
      status: 'Pending',
      client: 'Global Freight Ltd',
      amount: 15000
    },
    {
      id: '2',
      rateRequestNumber: 'RRQ-20250903-02',
      date: new Date('2025-09-03'),
      quotationNumber: 'QTN-20250903-02',
      quoteDate: new Date('2025-09-03'),
      salesperson: 'Mark Rivera',
      status: 'Approved',
      approvedBy: 'Linda Gomez',
      bookingNumber: 'BKG-20250905-15',
      client: 'Oceanic Shippers',
      amount: 22000
    },
    {
      id: '3',
      rateRequestNumber: 'RRQ-20250904-03',
      date: new Date('2025-09-04'),
      quotationNumber: 'QTN-20250904-03',
      quoteDate: new Date('2025-09-04'),
      salesperson: 'Anita Desai',
      status: 'Rejected',
      approvedBy: 'James O\'Neil',
      client: 'TransWorld Cargo',
      amount: 8500
    },
    {
      id: '4',
      rateRequestNumber: 'RRQ-20250905-04',
      date: new Date('2025-09-06'),
      quotationNumber: 'QTN-20250906-04',
      quoteDate: new Date('2025-09-06'),
      salesperson: 'James O\'Neil',
      status: 'Approved',
      approvedBy: 'Sarah Kim',
      bookingNumber: 'BKG-20250907-22',
      client: 'Swift Logistics',
      amount: 18750
    },
    {
      id: '5',
      rateRequestNumber: 'RRQ-20250907-05',
      date: new Date('2025-09-07'),
      quotationNumber: 'QTN-20250907-05',
      quoteDate: new Date('2025-09-07'),
      salesperson: 'Linda Gomez',
      status: 'Approved',
      approvedBy: 'Mark Rivera',
      client: 'AirSea Movers',
      amount: 31200
    }
  ];

  constructor() { }

  getDashboardData(filters?: DashboardFilters): Observable<DashboardData> {
    let filteredData = this.applyFilters(filters);

    const metrics: DashboardMetrics = {
      leadsWithoutSchedule: 15,
      meetingsScheduled: {
        overdue: 3,
        today: 8,
        future: 12
      },
      meetingsConductedNotConverted: 7,
      customersWithoutQuoteOrBooking: 5,
      quotesWithoutBooking: 9
    };

    const salesMetrics: SalesMetrics = {
      newClientCreated: 2,
      salesCall: 1,
      salesCallClosed: 0,
      quotationCreated: 0,
      quotationApproved: 0,
      bookingQuotation: 1
    };

    const dashboardData: DashboardData = {
      metrics,
      salesMetrics,
      clientMeetings: filteredData.clientMeetings,
      meetingsWithFollowup: filteredData.meetingsWithFollowup,
      rateRequests: filteredData.rateRequests,
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
      rateRequests: filteredRateRequests
    };
  }
}
