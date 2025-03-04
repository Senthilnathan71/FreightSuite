import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'app-quotation',
  standalone: true,
  imports: [
    CommonModule,
    NgbDropdownModule,
    FeatherModule
  ],
  templateUrl: './quotation.component.html',
  styleUrl: './quotation.component.scss'
})
export class QuotationComponent implements OnInit {
  isMobile: boolean = false;

  constructor(private appService:AppService) {}

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice()
  }
}
