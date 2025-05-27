import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-imco-entry',
  standalone: true,
  imports: [FeatherModule,NgSelectModule],
  templateUrl: './imco-entry.component.html',
  styleUrl: './imco-entry.component.scss'
})
export class ImcoEntryComponent {
    modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
