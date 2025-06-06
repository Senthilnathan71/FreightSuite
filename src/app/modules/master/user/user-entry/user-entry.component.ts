import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-user-entry',
  standalone: true,
  imports: [NgSelectModule,FeatherModule],
  templateUrl: './user-entry.component.html',
  styleUrl: './user-entry.component.scss'
})
export class UserEntryComponent {
    navigateBack() {
    history.back();
  }
   modeOfDept=[
    {id:"1",name:"dept1"},
    {id:"2",name:"dept2"},
    {id:"3",name:"dept3"}
  ]
}
