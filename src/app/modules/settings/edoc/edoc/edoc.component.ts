import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-edoc',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './edoc.component.html',
  styleUrl: './edoc.component.scss'
})
export class EdocComponent {

  modeOfType=[
    {id:"1",name:"Type 1"},
    {id:"2",name:"Type 2"}
  ]

   modeOfStatus=[
    {id:"1",name:"Active"},
    {id:"2",name:"Suspended"}
  ]
}
