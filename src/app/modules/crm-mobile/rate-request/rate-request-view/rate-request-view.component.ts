
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { LeadService } from '../../Services/lead.service';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-rate-request-view',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule
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
      },
      (error) => {
        this.errorMessage = error.message;  // On error, store the error message
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
          enq.EnquiryNumber?.toLowerCase().includes(searchQuery)
        );
      });
    }


    this.totalLengthOfCollection = this.enquiryItems.length;
  }



  createNew() {
    this.route.navigate(['crm/rate-request'])
  }

  editEnquiry(id) {
    console.log(id)
    this.route.navigate(['crm/rate-request'])
  }
}
