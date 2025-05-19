import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-division-entry',
  standalone: true,
  imports: [NgSelectModule,FeatherModule],
  templateUrl: './division-entry.component.html',
  styleUrl: './division-entry.component.scss'
})
export class DivisionEntryComponent {
  modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
