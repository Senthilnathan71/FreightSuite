import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-inco',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './inco.component.html',
  styleUrl: './inco.component.scss'
})
export class IncoComponent {
   modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
