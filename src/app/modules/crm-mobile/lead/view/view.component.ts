import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
// import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { LeadService } from '../../Services/lead.service';
import { Lead } from '../../Interfaces/lead.interface';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-view',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule
  ],
  templateUrl: './view.component.html',
  styleUrl: './view.component.scss'
})
export class ViewComponent implements OnInit {
  leads: Lead[] = [];        // Array to store the leads
  errorMessage: string = '';  // To store any error messages
  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;
  searchText: string = '';
  filteredLeads: Lead[] = [];
  isMobile: boolean = false;

  constructor(private leadService: LeadService, private route: Router, private appService: AppService) { }

  ngOnInit(): void {
    this.loadLeads();
    this.isMobile = this.appService.getDevice()
  }

  // Method to load the leads
  loadLeads(): void {
    this.leadService.getAllLeads().subscribe(
      (resp: Lead[]) => {
        this.leads = resp['data'];  // On success, store the leads data in the component
        this.filteredLeads = [...this.leads]; // Ensure filteredLeads starts with all data
        this.totalLengthOfCollection = this.leads.length || 0;
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
      this.filteredLeads = [...this.leads]; // Reset to original leads when search is empty
    } else {
      this.filteredLeads = this.leads.filter((lead) => {
        return (
          lead.preCustomerName?.toLowerCase().includes(searchQuery) ||
          lead.preCustomerAddress1?.toLowerCase().includes(searchQuery) ||
          lead.contactPerson?.toLowerCase().includes(searchQuery) ||
          String(lead.phone).includes(searchQuery) || // Convert number to string
          (lead.status === 'A' ? 'Active' : 'Cancelled').toLowerCase().includes(searchQuery)
        );
      });
    }

    this.totalLengthOfCollection = this.filteredLeads.length;
  }



  createNew() {
    this.route.navigate(['crm/lead'])
  }
  viewLead(id) {
    this.route.navigate(['crm/lead', id])
  }

}
