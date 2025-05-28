import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-time-zone',
  standalone: true,
  imports: [NgSelectModule,FeatherModule],
  templateUrl: './time-zone.component.html',
  styleUrl: './time-zone.component.scss'
})
export class TimeZoneComponent {
   modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
   navigateBack() {
    history.back();
  }
}
