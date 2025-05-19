import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-container-type-entry',
  standalone: true,
  imports: [NgSelectModule,FeatherModule],
  templateUrl: './container-type-entry.component.html',
  styleUrl: './container-type-entry.component.scss'
})
export class ContainerTypeEntryComponent {
    modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
