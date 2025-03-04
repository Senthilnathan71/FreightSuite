import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { AppService } from 'src/app/service/app.service';
import { LeadService } from '../Services/lead.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule
  ],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.scss'
})
export class CustomerComponent {
  // customerItemsView = [
  //   {
  //     "Name": "John Smith",
  //     "Address": "123 Ocean St, Miami, FL 33101",
  //     "Phone": "(305) 555-1234",
  //     "lastMeet": "2024-12-10",
  //     "lastBooking": "2025-01-15"
  //   },
  //   {
  //     "Name": "Sarah Johnson",
  //     "Address": "456 River Rd, Atlanta, GA 30303",
  //     "Phone": "(404) 555-5678",
  //     "lastMeet": "2024-11-05",
  //     "lastBooking": "2025-01-10"
  //   },
  //   {
  //     "Name": "Michael Brown",
  //     "Address": "789 Harbor Blvd, San Francisco, CA 94105",
  //     "Phone": "(415) 555-7890",
  //     "lastMeet": "2024-10-22",
  //     "lastBooking": "2025-01-12"
  //   },
  //   {
  //     "Name": "Emma Davis",
  //     "Address": "101 Seaport Way, New York, NY 10038",
  //     "Phone": "(212) 555-3456",
  //     "lastMeet": "2024-12-01",
  //     "lastBooking": "2025-01-14"
  //   },
  //   {
  //     "Name": "James Wilson",
  //     "Address": "202 Bay St, Boston, MA 02101",
  //     "Phone": "(617) 555-6789",
  //     "lastMeet": "2024-09-15",
  //     "lastBooking": "2025-01-18"
  //   },
  //   {
  //     "Name": "Olivia Taylor",
  //     "Address": "303 Coast Ave, Seattle, WA 98101",
  //     "Phone": "(206) 555-2345",
  //     "lastMeet": "2024-08-30",
  //     "lastBooking": "2025-01-13"
  //   },
  //   {
  //     "Name": "David Martinez",
  //     "Address": "404 Dockside Dr, Chicago, IL 60601",
  //     "Phone": "(312) 555-4567",
  //     "lastMeet": "2024-12-18",
  //     "lastBooking": "2025-01-17"
  //   },
  //   {
  //     "Name": "Sophia Miller",
  //     "Address": "505 Shipyard Ln, Houston, TX 77001",
  //     "Phone": "(713) 555-8901",
  //     "lastMeet": "2024-10-10",
  //     "lastBooking": "2025-01-11"
  //   },
  //   {
  //     "Name": "Daniel Clark",
  //     "Address": "606 Marina Blvd, Los Angeles, CA 90001",
  //     "Phone": "(323) 555-1235",
  //     "lastMeet": "2024-11-20",
  //     "lastBooking": "2025-01-16"
  //   },
  //   {
  //     "Name": "Mia Anderson",
  //     "Address": "707 Pier Ave, San Diego, CA 92101",
  //     "Phone": "(858) 555-6780",
  //     "lastMeet": "2024-12-05",
  //     "lastBooking": "2025-01-09"
  //   }
  // ];


  errorMessage: string = '';  // To store any error messages
  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;
  searchText: string = '';
  customerItems: any[] = [];
  customerItemsView: any[] = []

  constructor(private appService: AppService, private leadService: LeadService) { }

  ngOnInit() {
    this.loadCustomers()
  }

  loadCustomers(): void {
    this.leadService.getAllCustomers().subscribe(
      (resp: any[]) => {
        this.customerItemsView = resp
        this.customerItems = [...this.customerItemsView]; // Ensure customerItems starts with all data

        console.log(this.customerItemsView)
        this.totalLengthOfCollection = this.customerItemsView.length || 0;
      },
      (error) => {
        this.errorMessage = error.message;  // On error, store the error message
        console.error('Error loading leads:', error);  // Optionally log the error
      }
    );
  }


  searchLeads(): void {
    const searchQuery = this.searchText?.toLowerCase().trim(); // Trim spaces and handle null/undefined

    if (!searchQuery) {
      this.customerItems = [...this.customerItemsView]; // Reset to original leads when search is empty
    } else {
      this.customerItems = this.customerItemsView.filter((lead) => {
        return (
          lead.CustomerName?.toLowerCase().includes(searchQuery) ||
          lead.PreCustomerAddress1?.toLowerCase().includes(searchQuery) ||
          lead.preCustomerMaster.phone?.toLowerCase().includes(searchQuery) ||
          String(lead.preCustomerMaster.phone).includes(searchQuery) || // Convert number to string
          lead.preCustomerMaster.preCustomerMeeting['0'].meetingDate?.toLowerCase().includes(searchQuery) ||
          String(lead.preCustomerMaster.preCustomerMeeting['0'].meetingDate).includes(searchQuery));
      });
    }

    this.totalLengthOfCollection = this.customerItems.length;
  }


}
