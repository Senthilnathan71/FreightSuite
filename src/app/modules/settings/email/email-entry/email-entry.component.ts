import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-email-entry',
  standalone: true,
  imports: [NgSelectModule,FeatherModule],
  templateUrl: './email-entry.component.html',
  styleUrl: './email-entry.component.scss'
})
export class EmailEntryComponent {

  constructor(private activeModal : NgbActiveModal) {
    
  }

    modeOfEmailType=[
    {id:"1",name:"Delivery Agent 1"},
    {id:"2",name:"Delivery Agent 2"}
  ]
  closeModal(){
    this.activeModal.close();
  }
}
