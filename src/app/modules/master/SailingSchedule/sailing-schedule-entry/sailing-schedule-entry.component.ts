import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-sailing-schedule-entry',
  standalone: true,
  imports: [NgSelectModule,FeatherModule],
  templateUrl: './sailing-schedule-entry.component.html',
  styleUrl: './sailing-schedule-entry.component.scss'
})
export class SailingScheduleEntryComponent {
   navigateBack() {
    history.back();
  }
   modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
  modeOfVoyageType=[
    {id:"1",name:"Sea"},
    {id:"2",name:"Air"},
    {id:"3",name:"Road"}
  ]
}

