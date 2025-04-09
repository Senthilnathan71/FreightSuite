import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from 'src/app/service/app.service';
import { FeatherModule } from 'angular-feather';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-customer-view',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbNavModule
  ],
  templateUrl: './customer-view.component.html',
  styleUrl: './customer-view.component.scss'
})
export class CustomerViewComponent implements OnInit {
  isMobile: boolean = false;

  active = 1;


  customerItemsView = [
    {
      "Name": "John Logistics",
      "phone": "+1-555-1234",
      "type": "Freight",
      "schedule": "2025-02-10 10:00 AM",
      "notes": "Pickup from warehouse A"
    },
    {
      "Name": "Global Express",
      "phone": "+1-555-5678",
      "type": "Air Cargo",
      "schedule": "2025-02-12 3:00 PM",
      "notes": "Urgent delivery to New York"
    },
    {
      "Name": "Swift Movers",
      "phone": "+1-555-9876",
      "type": "Ground Transport",
      "schedule": "2025-02-08 8:00 AM",
      "notes": "Fragile goods, handle with care"
    },
    {
      "Name": "Oceanic Shippers",
      "phone": "+1-555-2468",
      "type": "Sea Freight",
      "schedule": "2025-02-15 5:30 PM",
      "notes": "Bulk shipment, port clearance needed"
    },
    {
      "Name": "Express Couriers",
      "phone": "+1-555-1357",
      "type": "Parcel Delivery",
      "schedule": "2025-02-09 11:00 AM",
      "notes": "Same-day delivery service"
    },
    {
      "Name": "Cargo Masters",
      "phone": "+1-555-8642",
      "type": "Heavy Equipment Transport",
      "schedule": "2025-02-14 2:00 PM",
      "notes": "Requires crane for unloading"
    },
    {
      "Name": "FastTrack Logistics",
      "phone": "+1-555-7894",
      "type": "Rail Freight",
      "schedule": "2025-02-11 9:00 AM",
      "notes": "Temperature-controlled container"
    },
    {
      "Name": "Skyline Air Cargo",
      "phone": "+1-555-4321",
      "type": "Air Freight",
      "schedule": "2025-02-13 6:00 AM",
      "notes": "Live animal transport, priority handling"
    },
    {
      "Name": "Maritime Express",
      "phone": "+1-555-9753",
      "type": "Container Shipping",
      "schedule": "2025-02-16 4:00 PM",
      "notes": "Customs paperwork required"
    },
    {
      "Name": "Green Transport",
      "phone": "+1-555-8520",
      "type": "Eco-Friendly Shipping",
      "schedule": "2025-02-17 1:00 PM",
      "notes": "Electric vehicle fleet, carbon neutral"
    }
  ];

  constructor(private appService:AppService) {}

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice()
  }


}
