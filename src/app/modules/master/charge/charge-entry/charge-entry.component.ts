import { Component } from '@angular/core';
import {  NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-charge-entry',
  standalone: true,
  imports: [FeatherModule,NgSelectModule],
  templateUrl: './charge-entry.component.html',
  styleUrl: './charge-entry.component.scss'
})
export class ChargeEntryComponent {
    modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
