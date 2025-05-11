import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-service-level',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './service-level.component.html',
  styleUrl: './service-level.component.scss'
})
export class ServiceLevelComponent {
    modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
