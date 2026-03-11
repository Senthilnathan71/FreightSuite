import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { DashboardService } from './dashboard.service';
import {
  DashboardData,
  DashboardFilters,
  ClientMeeting,
  MeetingWithFollowup,
  RateRequest,
  TodaysActivity,
  ApprovedQuotation,
  BookingListItem
} from './interfaces/dashboard.interfaces';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

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

  // User type to determine which dashboard to show
  userType: 'sales' | 'customer-service' = 'sales'; // Default to sales, should come from auth service

  filters: DashboardFilters = {};
  dateFromString = '';
  dateToString = '';

  // Sales dashboard data
  filteredClientMeetings: ClientMeeting[] = [];
  filteredFollowups: MeetingWithFollowup[] = [];
  filteredRateRequests: RateRequest[] = [];

  // Customer Service dashboard data
  filteredTodaysActivities: TodaysActivity[] = [];
  filteredApprovedQuotations: ApprovedQuotation[] = [];
  filteredBookingList: BookingListItem[] = [];

  // Sales dashboard search terms
  meetingSearchTerm = '';
  followupSearchTerm = '';
  rateRequestSearchTerm = '';

  // Customer Service dashboard search terms
  activitySearchTerm = '';
  quotationSearchTerm = '';
  bookingSearchTerm = '';

  // Sales dashboard sort fields
  meetingSortField = '';
  meetingSortDirection: 'asc' | 'desc' = 'asc';
  followupSortField = '';
  followupSortDirection: 'asc' | 'desc' = 'asc';
  rateRequestSortField = '';
  rateRequestSortDirection: 'asc' | 'desc' = 'asc';

  // Customer Service dashboard sort fields
  activitySortField = '';
  activitySortDirection: 'asc' | 'desc' = 'asc';
  quotationSortField = '';
  quotationSortDirection: 'asc' | 'desc' = 'asc';
  bookingSortField = '';
  bookingSortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private dashboardService: DashboardService,
    private appSettings: AppSettingsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const userProfile = this.appSettings.getDecryptedUserProfile();
    if (userProfile?.isSalesperson === '1') {
      this.router.navigate(['/dashboard/sales']);
      return;
    }

    // TODO: Get user type from authentication service
    // this.userType = this.authService.getUserType();
    this.filters.userType = this.userType;
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

    if (this.userType === 'sales') {
      this.filteredClientMeetings = [...this.dashboardData.clientMeetings];
      this.filteredFollowups = [...this.dashboardData.meetingsWithFollowup];
      this.filteredRateRequests = [...this.dashboardData.rateRequests];

      this.filterMeetings();
      this.filterFollowups();
      this.filterRateRequests();
    } else if (this.userType === 'customer-service') {
      this.filteredTodaysActivities = [...this.dashboardData.todaysActivities];
      this.filteredApprovedQuotations = [...this.dashboardData.approvedQuotations];
      this.filteredBookingList = [...this.dashboardData.bookingList];

      this.filterActivities();
      this.filterQuotations();
      this.filterBookings();
    }
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
    this.filters = { userType: this.userType };
    this.dateFromString = '';
    this.dateToString = '';

    // Reset sales search terms
    this.meetingSearchTerm = '';
    this.followupSearchTerm = '';
    this.rateRequestSearchTerm = '';

    // Reset customer service search terms
    this.activitySearchTerm = '';
    this.quotationSearchTerm = '';
    this.bookingSearchTerm = '';

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

  // Customer Service filtering methods
  filterActivities(): void {
    if (!this.dashboardData) return;

    this.filteredTodaysActivities = this.dashboardData.todaysActivities.filter(activity =>
      this.activitySearchTerm === '' ||
      activity.bookingNumber.toLowerCase().includes(this.activitySearchTerm.toLowerCase()) ||
      activity.jobNumber.toLowerCase().includes(this.activitySearchTerm.toLowerCase()) ||
      activity.activity.toLowerCase().includes(this.activitySearchTerm.toLowerCase()) ||
      activity.status.toLowerCase().includes(this.activitySearchTerm.toLowerCase())
    );

    if (this.activitySortField) {
      this.applySortToActivities();
    }
  }

  filterQuotations(): void {
    if (!this.dashboardData) return;

    this.filteredApprovedQuotations = this.dashboardData.approvedQuotations.filter(quotation =>
      this.quotationSearchTerm === '' ||
      quotation.quotationNumber.toLowerCase().includes(this.quotationSearchTerm.toLowerCase()) ||
      quotation.approvedBy.toLowerCase().includes(this.quotationSearchTerm.toLowerCase()) ||
      quotation.option.toLowerCase().includes(this.quotationSearchTerm.toLowerCase())
    );

    if (this.quotationSortField) {
      this.applySortToQuotations();
    }
  }

  filterBookings(): void {
    if (!this.dashboardData) return;

    this.filteredBookingList = this.dashboardData.bookingList.filter(booking =>
      this.bookingSearchTerm === '' ||
      booking.bookingNumber.toLowerCase().includes(this.bookingSearchTerm.toLowerCase()) ||
      booking.jobNumber.toLowerCase().includes(this.bookingSearchTerm.toLowerCase()) ||
      booking.shipmentStatus.toLowerCase().includes(this.bookingSearchTerm.toLowerCase()) ||
      booking.pol.toLowerCase().includes(this.bookingSearchTerm.toLowerCase()) ||
      booking.pod.toLowerCase().includes(this.bookingSearchTerm.toLowerCase()) ||
      booking.salesperson.toLowerCase().includes(this.bookingSearchTerm.toLowerCase()) ||
      booking.assignedTo.toLowerCase().includes(this.bookingSearchTerm.toLowerCase())
    );

    if (this.bookingSortField) {
      this.applySortToBookings();
    }
  }

  // Customer Service sorting methods
  sortActivities(field: keyof TodaysActivity): void {
    if (this.activitySortField === field) {
      this.activitySortDirection = this.activitySortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.activitySortField = field;
      this.activitySortDirection = 'asc';
    }
    this.applySortToActivities();
  }

  sortQuotations(field: keyof ApprovedQuotation): void {
    if (this.quotationSortField === field) {
      this.quotationSortDirection = this.quotationSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.quotationSortField = field;
      this.quotationSortDirection = 'asc';
    }
    this.applySortToQuotations();
  }

  sortBookings(field: keyof BookingListItem): void {
    if (this.bookingSortField === field) {
      this.bookingSortDirection = this.bookingSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.bookingSortField = field;
      this.bookingSortDirection = 'asc';
    }
    this.applySortToBookings();
  }

  private applySortToActivities(): void {
    this.filteredTodaysActivities.sort((a, b) => {
      const aValue = this.getNestedPropertyValue(a, this.activitySortField);
      const bValue = this.getNestedPropertyValue(b, this.activitySortField);

      if (aValue < bValue) {
        return this.activitySortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.activitySortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  private applySortToQuotations(): void {
    this.filteredApprovedQuotations.sort((a, b) => {
      const aValue = this.getNestedPropertyValue(a, this.quotationSortField);
      const bValue = this.getNestedPropertyValue(b, this.quotationSortField);

      if (aValue < bValue) {
        return this.quotationSortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.quotationSortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  private applySortToBookings(): void {
    this.filteredBookingList.sort((a, b) => {
      const aValue = this.getNestedPropertyValue(a, this.bookingSortField);
      const bValue = this.getNestedPropertyValue(b, this.bookingSortField);

      if (aValue < bValue) {
        return this.bookingSortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.bookingSortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Customer Service navigation methods
  navigateToDocuments(): void {
    console.log('Navigate to Documents');
    // Add navigation logic here
  }

  navigateToCustomsClearance(): void {
    console.log('Navigate to Customs Clearance');
    // Add navigation logic here
  }

  navigateToShipments(): void {
    console.log('Navigate to Shipments');
    // Add navigation logic here
  }

  navigateToDeliveries(): void {
    console.log('Navigate to Deliveries');
    // Add navigation logic here
  }

  navigateToPendingActions(): void {
    console.log('Navigate to Pending Actions');
    // Add navigation logic here
  }

  navigateToCustomerQueries(): void {
    console.log('Navigate to Customer Queries');
    // Add navigation logic here
  }

  // Switch dashboard type (for testing purposes)
  switchDashboard(type: 'sales' | 'customer-service'): void {
    this.userType = type;
    this.filters.userType = type;
    this.resetFilters();
  }

  // Helper methods for template expressions
  getCompletedActivitiesCount(): number {
    return this.filteredTodaysActivities.filter(a => a.status === 'Completed').length;
  }

  getPendingActivitiesCount(): number {
    return this.filteredTodaysActivities.filter(a => a.status === 'Pending').length;
  }

  getInProgressActivitiesCount(): number {
    return this.filteredTodaysActivities.filter(a => a.status === 'In Progress').length;
  }
}
