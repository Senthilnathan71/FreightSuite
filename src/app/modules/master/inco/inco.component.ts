import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-inco',
  standalone: true,
  imports: [NgSelectModule,FeatherModule],
  templateUrl: './inco.component.html',
  styleUrl: './inco.component.scss'
})
export class IncoComponent {
   modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Suspended",name:"Suspended"},
  ]
    navigateBack() {
    history.back();
  }
}
