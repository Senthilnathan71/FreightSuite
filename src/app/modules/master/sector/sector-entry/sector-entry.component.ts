import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-sector-entry',
  standalone: true,
  imports: [NgSelectModule,FeatherModule],
  templateUrl: './sector-entry.component.html',
  styleUrl: './sector-entry.component.scss'
})
export class SectorEntryComponent {
 modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
