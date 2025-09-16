import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DashboardService } from './dashboard.service';
import {
  DashboardData,
  DashboardFilters,
  ClientMeeting,
  MeetingWithFollowup,
  RateRequest
} from './interfaces/dashboard.interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  dashboardData: DashboardData | null = null;
  isLoading = false;

  filters: DashboardFilters = {};
  dateFromString = '';
  dateToString = '';

  filteredClientMeetings: ClientMeeting[] = [];
  filteredFollowups: MeetingWithFollowup[] = [];
  filteredRateRequests: RateRequest[] = [];

  meetingSearchTerm = '';
  followupSearchTerm = '';
  rateRequestSearchTerm = '';

  meetingSortField = '';
  meetingSortDirection: 'asc' | 'desc' = 'asc';
  followupSortField = '';
  followupSortDirection: 'asc' | 'desc' = 'asc';
  rateRequestSortField = '';
  rateRequestSortDirection: 'asc' | 'desc' = 'asc';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.dashboardService.getDashboardData(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.updateFilteredData();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
          this.isLoading = false;
        }
      });
  }

  updateFilteredData(): void {
    if (!this.dashboardData) return;

    this.filteredClientMeetings = [...this.dashboardData.clientMeetings];
    this.filteredFollowups = [...this.dashboardData.meetingsWithFollowup];
    this.filteredRateRequests = [...this.dashboardData.rateRequests];

    this.filterMeetings();
    this.filterFollowups();
    this.filterRateRequests();
  }

  onDateFromChange(event: any): void {
    const value = event.target.value;
    this.filters.dateFrom = value ? new Date(value) : undefined;
  }

  onDateToChange(event: any): void {
    const value = event.target.value;
    this.filters.dateTo = value ? new Date(value) : undefined;
  }

  applyFilters(): void {
    this.loadDashboardData();
  }

  resetFilters(): void {
    this.filters = {};
    this.dateFromString = '';
    this.dateToString = '';
    this.meetingSearchTerm = '';
    this.followupSearchTerm = '';
    this.rateRequestSearchTerm = '';
    this.loadDashboardData();
  }

  filterMeetings(): void {
    if (!this.dashboardData) return;

    this.filteredClientMeetings = this.dashboardData.clientMeetings.filter(meeting =>
      this.meetingSearchTerm === '' ||
      meeting.client.toLowerCase().includes(this.meetingSearchTerm.toLowerCase()) ||
      meeting.agenda.toLowerCase().includes(this.meetingSearchTerm.toLowerCase()) ||
      meeting.salesperson.toLowerCase().includes(this.meetingSearchTerm.toLowerCase()) ||
      meeting.status.toLowerCase().includes(this.meetingSearchTerm.toLowerCase())
    );

    if (this.meetingSortField) {
      this.applySortToMeetings();
    }
  }

  filterFollowups(): void {
    if (!this.dashboardData) return;

    this.filteredFollowups = this.dashboardData.meetingsWithFollowup.filter(followup =>
      this.followupSearchTerm === '' ||
      followup.client.toLowerCase().includes(this.followupSearchTerm.toLowerCase()) ||
      followup.salesperson.toLowerCase().includes(this.followupSearchTerm.toLowerCase()) ||
      followup.meetingType.toLowerCase().includes(this.followupSearchTerm.toLowerCase()) ||
      followup.followupType.toLowerCase().includes(this.followupSearchTerm.toLowerCase())
    );

    if (this.followupSortField) {
      this.applySortToFollowups();
    }
  }

  filterRateRequests(): void {
    if (!this.dashboardData) return;

    this.filteredRateRequests = this.dashboardData.rateRequests.filter(request =>
      this.rateRequestSearchTerm === '' ||
      request.rateRequestNumber.toLowerCase().includes(this.rateRequestSearchTerm.toLowerCase()) ||
      request.quotationNumber.toLowerCase().includes(this.rateRequestSearchTerm.toLowerCase()) ||
      request.salesperson.toLowerCase().includes(this.rateRequestSearchTerm.toLowerCase()) ||
      request.status.toLowerCase().includes(this.rateRequestSearchTerm.toLowerCase()) ||
      (request.approvedBy && request.approvedBy.toLowerCase().includes(this.rateRequestSearchTerm.toLowerCase())) ||
      (request.bookingNumber && request.bookingNumber.toLowerCase().includes(this.rateRequestSearchTerm.toLowerCase())) ||
      request.client.toLowerCase().includes(this.rateRequestSearchTerm.toLowerCase())
    );

    if (this.rateRequestSortField) {
      this.applySortToRateRequests();
    }
  }

  sortMeetings(field: keyof ClientMeeting): void {
    if (this.meetingSortField === field) {
      this.meetingSortDirection = this.meetingSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.meetingSortField = field;
      this.meetingSortDirection = 'asc';
    }
    this.applySortToMeetings();
  }

  sortFollowups(field: keyof MeetingWithFollowup): void {
    if (this.followupSortField === field) {
      this.followupSortDirection = this.followupSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.followupSortField = field;
      this.followupSortDirection = 'asc';
    }
    this.applySortToFollowups();
  }

  sortRateRequests(field: keyof RateRequest): void {
    if (this.rateRequestSortField === field) {
      this.rateRequestSortDirection = this.rateRequestSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.rateRequestSortField = field;
      this.rateRequestSortDirection = 'asc';
    }
    this.applySortToRateRequests();
  }

  private applySortToMeetings(): void {
    this.filteredClientMeetings.sort((a, b) => {
      const aValue = this.getNestedPropertyValue(a, this.meetingSortField);
      const bValue = this.getNestedPropertyValue(b, this.meetingSortField);

      if (aValue < bValue) {
        return this.meetingSortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.meetingSortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  private applySortToFollowups(): void {
    this.filteredFollowups.sort((a, b) => {
      const aValue = this.getNestedPropertyValue(a, this.followupSortField);
      const bValue = this.getNestedPropertyValue(b, this.followupSortField);

      if (aValue < bValue) {
        return this.followupSortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.followupSortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  private applySortToRateRequests(): void {
    this.filteredRateRequests.sort((a, b) => {
      const aValue = this.getNestedPropertyValue(a, this.rateRequestSortField);
      const bValue = this.getNestedPropertyValue(b, this.rateRequestSortField);

      if (aValue < bValue) {
        return this.rateRequestSortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.rateRequestSortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  private getNestedPropertyValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusCount(status: string): number {
    return this.filteredClientMeetings.filter(meeting => meeting.status === status).length;
  }

  getCircleProgress(value: number, max: number): string {
    const circumference = 2 * Math.PI * 25;
    const progress = (value / max) * circumference;
    return `${progress} ${circumference}`;
  }

  // Navigation methods for sales metrics
  navigateToClients(): void {
    console.log('Navigate to New Clients');
    // Add navigation logic here
  }

  navigateToSalesCalls(): void {
    console.log('Navigate to Sales Calls');
    // Add navigation logic here
  }

  navigateToClosedCalls(): void {
    console.log('Navigate to Closed Calls');
    // Add navigation logic here
  }

  navigateToQuotations(): void {
    console.log('Navigate to Quotations');
    // Add navigation logic here
  }

  navigateToApprovedQuotations(): void {
    console.log('Navigate to Approved Quotations');
    // Add navigation logic here
  }

  navigateToBookings(): void {
    console.log('Navigate to Bookings');
    // Add navigation logic here
  }
}
