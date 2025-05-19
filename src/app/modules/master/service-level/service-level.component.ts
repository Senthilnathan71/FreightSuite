import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-service-level',
  standalone: true,
  imports: [NgSelectModule,FeatherModule],
  templateUrl: './service-level.component.html',
  styleUrl: './service-level.component.scss'
})
export class ServiceLevelComponent {
    modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
