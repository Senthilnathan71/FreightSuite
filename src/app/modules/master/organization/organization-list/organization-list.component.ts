import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [FeatherModule,NgSelectModule],
  templateUrl: './organization-list.component.html',
  styleUrl: './organization-list.component.scss'
})
export class OrganizationListComponent {

  modeOfStatus=[
    {id:"Active",name:"Active"},
    {
      id:"Inactive",name:"Inactive"
    }
  ]
  modeOfARAP=[
    {id:"AR",name:"AR"},
    {
      id:"AP",name:"AP"
    }
  ]
}
