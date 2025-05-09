import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-milestone-entry',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './milestone-entry.component.html',
  styleUrl: './milestone-entry.component.scss'
})
export class MilestoneEntryComponent {
  modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
  modeOfShipmentType=[
    {id:"Shipment1",name:"Shipment1"},
    {id:"Shipment2",name:"Shipment2"},
    {id:"Shipment3",name:"Shipment3"}

  ]

  modeOfDepartmentType=[
    {id:"Department1",name:"Department1"},
    {id:"Department2",name:"Department2"},
    {id:"Department3",name:"Department3"}
  ]
}
