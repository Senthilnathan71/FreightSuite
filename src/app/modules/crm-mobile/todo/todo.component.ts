import { CommonModule } from '@angular/common';
import { Component, ViewChild, OnInit, inject, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbNavModule, NgbTooltip, ModalDismissReasons, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [
    NgbNavModule,
    NgbDropdownModule,
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbTooltip
  ],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.scss'
})
export class TodoComponent implements OnInit {
  active = 1;
  @ViewChild('nav', { static: true }) nav!: NgbNavModule;

  isMobile: boolean = false;

  toDoList = [
    { id: 1, status:'Not Meet', text: 'Follow up on outstanding payment from "BlueWave Shipping" client', isChecked: false },
    { id: 2, status:'To Meet', text: 'Send reminder for overdue invoice to "Oceanic Logistics"', isChecked: false },
    { id: 3, status:'Never Meet', text: 'Confirm payment receipt for "SwiftSail Cargo" shipment', isChecked: false },
    { id: 4, status:'Not Meet', text: 'Check payment status from "GlobalMaritime Shipping"', isChecked: false },
    { id: 5, status:'To Meet', text: 'Follow up on pending payment for "Horizon Express"', isChecked: false },
    { id: 6, status:'Never Meet', text: 'Verify payment processing for "TideLine Transport"', isChecked: false },
    { id: 7, status:'To Meet', text: 'Send payment reminder to "SeaLink Freight" customer', isChecked: false },
    { id: 8, status:'Never Meet', text: 'Review payment for "CoastalCargo Logistics" services', isChecked: false },
  ];

  toggleActive(todo: any) {
    todo.isChecked = !todo.isChecked;
  }

  private modalService = inject(NgbModal);
	closeResult = '';

  open(content: TemplateRef<any>) {
		this.modalService.open(content, { scrollable: true, size: 'lg', centered: true,  windowClass: 'todo-modal' }).result.then();
	}

  constructor(private appService:AppService) {}

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice()
  }

}
