import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-email-entry',
  standalone: true,
  imports: [NgSelectModule,FeatherModule],
  templateUrl: './email-entry.component.html',
  styleUrl: './email-entry.component.scss'
})
export class EmailEntryComponent {

    modeOfEmailType=[
    {id:"1",name:"Delivery Agent 1"},
    {id:"2",name:"Delivery Agent 2"}
  ]
}
