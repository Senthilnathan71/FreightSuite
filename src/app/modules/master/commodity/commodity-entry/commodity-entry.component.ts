import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-commodity-entry',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './commodity-entry.component.html',
  styleUrl: './commodity-entry.component.scss'
})
export class CommodityEntryComponent {
  modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
