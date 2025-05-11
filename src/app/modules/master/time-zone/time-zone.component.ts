import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-time-zone',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './time-zone.component.html',
  styleUrl: './time-zone.component.scss'
})
export class TimeZoneComponent {
   modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
