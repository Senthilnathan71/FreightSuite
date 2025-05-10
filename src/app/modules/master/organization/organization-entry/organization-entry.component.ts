import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-organization-entry',
  standalone: true,
  imports: [NgbNavModule,CommonModule,NgSelectModule,FeatherModule],
  templateUrl: './organization-entry.component.html',
  styleUrl: './organization-entry.component.scss'
})
export class OrganizationEntryComponent {
  active1=1;
  active2=1;
  modeOfStatus = [
    { id: 'Active',  name: 'Active' },
    { id: 'Invalid',  name: 'Invalid' },
    { id: 'Block',  name: 'Block' }
];
modeofPAN  =[
  {id:'PAN1',name:"PAN1"},
  {id:'PAN2',name:"PAN2"},
  {id:'PAN3',name:"PAN3"},
]
}
