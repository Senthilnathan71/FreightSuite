import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { NgbNavModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { LeadService } from '../../Services/lead.service';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { DateFormatPipe } from 'src/app/core/pipes/date-format.pipe';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';

@Component({
  selector: 'app-quotation-view',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule,
    NgbNavModule,
    CustomDatePipe
  ],
  templateUrl: './quotation-view.component.html',
  styleUrl: './quotation-view.component.scss'
})
export class QuotationViewComponent {
  active = 1;
  @ViewChild('nav', { static: true }) nav!: NgbNavModule;
  errorMessage: string = '';  // To store any error messages
  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;
  page1 = 1;
  pageSize1 = 5;
  totalLengthOfCollection1: number;
  searchText: string = '';
  quoteItems: any[] = [];
  isMobile: boolean = false;
  quoteData: any
  enquiryItems: any[] = [];
  enquiryData: any
  ports: any
  constructor(private leadService: LeadService, private route: Router, private appService: AppService) { }

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice()
    this.loadPorts()
    this.loadEnquiries()
    this.loadQuotes();
  }

  // Method to load the leads
  loadQuotes(): void {
    this.leadService.getAllQuotes().subscribe(
      (resp: any[]) => {
        console.log(resp)
        this.quoteData = resp['data'];  // On success, store the leads data in the component

        this.quoteItems = [...this.quoteData]
        this.updatePaginatedData();  // Update paginated data

        this.totalLengthOfCollection = this.quoteData.length || 0;
      },
      (error) => {
        this.errorMessage = error.message;  // On error, store the error message
        console.error('Error loading enquiry:', error);  // Optionally log the error
      }
    );
  }
  searchEnquiry(): void {
    const searchQuery = this.searchText?.toLowerCase().trim(); // Trim spaces and handle null/undefined

    if (!searchQuery) {
      this.quoteItems = [...this.quoteData]; // Reset to original leads when search is empty
    } else {
      this.quoteItems = this.quoteData.filter((enq) => {
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


    this.totalLengthOfCollection = this.quoteItems.length;
  }



  loadEnquiries(): void {
    this.leadService.getAllEnquiries().subscribe(
      (resp: any[]) => {
        console.log(resp)
        this.enquiryData = resp['data'];  // On success, store the leads data in the component

        this.enquiryItems = [...this.enquiryData]
        this.totalLengthOfCollection1 = this.enquiryData.length || 0;
        this.updateEnquiryPaginatedData();  // Update paginated data
        this.mapPortsToEnquiries();

      },
      (error) => {
        this.errorMessage = error.message;  // On error, store the error message
        console.error('Error loading enquiry:', error);  // Optionally log the error
      }
    );
  }

  loadPorts(): void {
    this.leadService.getAllPorts().subscribe(
      (resp: any) => {
        this.ports = resp
      });
  }


  mapPortsToEnquiries(): void {
    if (!this.ports || !this.enquiryItems) return;

    this.enquiryItems = this.enquiryItems.map((enq) => {
      return {
        ...enq,
        POLCode: this.getPortCode(enq.enquiryRoute['0'].POLSid), // Get PortCode for POLSid
        PODCode: this.getPortCode(enq.enquiryRoute['0'].PODSid), // Get PortCode for PODSid
      };
    });
    console.log(this.enquiryItems, 'enquiryItems')
  }

  getPortCode(portMasterSid: number): string | null {
    const port = this.ports.find((p) => p.PortMasterSid === portMasterSid);
    console.log(port)
    return port ? port.PortCode : null;
  }

  updateEnquiryPaginatedData(): void {
    const startIndex = (this.page1 - 1) * this.pageSize1;
    const endIndex = startIndex + this.pageSize1;
    this.enquiryItems = this.enquiryData.slice(startIndex, endIndex);
    this.mapPortsToEnquiries()
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.quoteItems = this.quoteData.slice(startIndex, endIndex);
  }

  createNew() {
    this.route.navigate(['crm/quotation'])
  }

  editEnquiry(id) {
    this.route.navigate(['crm/quotation', id])
  }

  createQuotation(enq: any) {
    console.log(enq);

    const polList = enq.enquiryRoute.map(route => route.POLSid);
    const podList = enq.enquiryRoute.map(route => route.PODSid);

    // Extract cargo types from both root-level enquiryCargo and nested enquiryCargo inside enquiryRoute
    let cargoTypeList: string[] = [];

    // Extract from root-level enquiryCargo
    if (Array.isArray(enq.enquiryCargo)) {
      cargoTypeList.push(...enq.enquiryCargo.map(cargo => cargo.CargoType));
    }

    // Extract from nested enquiryCargo inside enquiryRoute
    enq.enquiryRoute.forEach(route => {
      if (Array.isArray(route.enquiryCargo)) {
        cargoTypeList.push(...route.enquiryCargo.map(cargo => cargo.CargoType));
      }
    });

    // Remove duplicates (optional)
    cargoTypeList = [...new Set(cargoTypeList)];
    this.leadService.clearQuotationData();  // <-- Add this line to clear previous data

    this.leadService.setQuotationData({
      customerId: enq.CustomerMasterSid,
      departmentId: enq.DepartmentMasterSid,
      polList: polList,  // Sending as an array
      podList: podList,  // Sending as an array
      cargoTypeList: cargoTypeList,  // Merging from both possible sources
      rateRequest: true,
      active: 2
    });

    this.route.navigate(['crm/quotation/view']);
  }

    findEnquiryName(EnquiryId : number){
      if(!EnquiryId) return;
      return (this.enquiryData.find(data => data.EnquiryHeaderSid === EnquiryId )).EnquiryNumber;
    }
  

}
