import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-receipt-entry',
  standalone: true,
  imports: [NgSelectComponent,NgbDatepickerModule,FeatherModule],
  templateUrl: './receipt-entry.component.html',
  styleUrl: './receipt-entry.component.scss'
})
export class ReceiptEntryComponent {

   constructor(private router: Router,private modalService: NgbModal) {}
    ModeofStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];
  ModeofSearch=[
    {id:1,name:"House No"},
    {id:2,name:"HBL No"},
    {id:3,name:"Master No"},
    {id:4,name:"MBL No"},
    {id:5,name:"HAWB"},
    {id:6,name:"MAWB"},
    {id:2,name:"Party"},
    {id:2,name:"Invoice"},
  ]

    openDubaiModal(content: any) {
    this.modalService.open(content, { centered: true, size: 'xl' });
  }
}
