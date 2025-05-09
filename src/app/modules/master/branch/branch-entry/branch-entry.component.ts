import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-branch-entry',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './branch-entry.component.html',
  styleUrl: './branch-entry.component.scss'
})
export class BranchEntryComponent {
  modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
