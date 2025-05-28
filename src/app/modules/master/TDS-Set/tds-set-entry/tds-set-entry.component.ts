import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-tds-set-entry',
  standalone: true,
  imports: [FeatherModule,NgSelectModule],
  templateUrl: './tds-set-entry.component.html',
  styleUrl: './tds-set-entry.component.scss'
})
export class TdsSetEntryComponent {
    modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
   navigateBack() {
    history.back();
  }
}
