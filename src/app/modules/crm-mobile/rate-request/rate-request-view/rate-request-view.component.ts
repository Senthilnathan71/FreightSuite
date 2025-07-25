
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { LeadService } from '../../Services/lead.service';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { DateFormatPipe } from 'src/app/core/pipes/date-format.pipe';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-rate-request-view',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    DateFormatPipe,
    FavoriteStarComponent
  ],
  templateUrl: './rate-request-view.component.html',
  styleUrl: './rate-request-view.component.scss'
})
export class RateRequestViewComponent {


  errorMessage: string = '';  // To store any error messages
  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;
  searchText: string = '';
  enquiryItems: any[] = [];
  isMobile: boolean = false;
  isDataLoaded: boolean = false;
  enquiryData: any
  constructor(private leadService: LeadService, private route: Router, private appService: AppService) { }

  ngOnInit(): void {
    this.loadEnquiries();
    this.isMobile = this.appService.getDevice()
  }

  // Method to load the leads
  loadEnquiries(): void {
    this.leadService.getAllEnquiries().subscribe(
      (resp: any[]) => {
        console.log(resp)
        this.enquiryData = resp['data'];  // On success, store the leads data in the component

        this.enquiryItems = [...this.enquiryData]
        this.totalLengthOfCollection = this.enquiryData.length || 0;
        this.updatePaginatedData();  // Update paginated data
        this.isDataLoaded = true; // Enable buttons after load
      },
      (error) => {
        this.errorMessage = error.message;  // On error, store the error message
         this.isDataLoaded = false; // Keep buttons disabled on error
        console.error('Error loading enquiry:', error);  // Optionally log the error
      }
    );
  }


  getEnquiryCargo(enquiry: any): any[] {
    return enquiry.enquiryRoute?.flatMap(route => route.enquiryCargo) || [];
  }
  searchEnquiry(): void {
    const searchQuery = this.searchText?.toLowerCase().trim(); // Trim spaces and handle null/undefined

    if (!searchQuery) {
      this.enquiryItems = [...this.enquiryData]; // Reset to original leads when search is empty
    } else {
      this.enquiryItems = this.enquiryData.filter((enq) => {
        // Convert date to a standardized format (YYYY-MM-DD)
        const formattedDate = enq.ShipmentExpectedDate
          ? new Date(enq.ShipmentExpectedDate).toISOString().split('T')[0]
          : '';

        return (
          enq.CustomerName?.toLowerCase().includes(searchQuery) ||
          formattedDate.includes(searchQuery) ||  // Date search
          enq.ShipmentType?.toLowerCase().includes(searchQuery) ||
          enq.EnquiryNumber?.toLowerCase().includes(searchQuery) ||
          (enq.status === "A" ? "active" : "inactive").toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }


    this.totalLengthOfCollection = this.enquiryItems.length;
  }


  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.enquiryItems = this.enquiryData.slice(startIndex, endIndex);
  }



  createNew() {
    this.route.navigate(['crm/rate-request'])
  }

  editEnquiry(id) {
    this.route.navigate(['crm/rate-request', id])
  }

    resetFilters(): void {
    this.searchText = '';
    this.enquiryItems = [...this.enquiryData];
    this.totalLengthOfCollection = this.enquiryItems.length;
    this.page = 1;
    this.updatePaginatedData();
  }
}
