import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-region-entry',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './region-entry.component.html',
  styleUrl: './region-entry.component.scss'
})
export class RegionEntryComponent {
  modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
