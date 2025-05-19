import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-menu-entry',
  standalone: true,
  imports: [NgSelectModule,FeatherModule],
  templateUrl: './menu-entry.component.html',
  styleUrl: './menu-entry.component.scss'
})
export class MenuEntryComponent {
  modeOfType=[
    {id:"Type1",name:"Type1"},
    {id:"Type2",name:"Type2"},
    {id:"Type3",name:"Type3"}
  ]
}
