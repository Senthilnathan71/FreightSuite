import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-airline-entry',
  standalone: true,
  imports: [NgSelectModule,FeatherModule],
  templateUrl: './airline-entry.component.html',
  styleUrl: './airline-entry.component.scss'
})
export class AirlineEntryComponent {
  modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
   navigateBack() {
    history.back();
  }
}
