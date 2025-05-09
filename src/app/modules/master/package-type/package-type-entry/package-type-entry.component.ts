import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-package-type-entry',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './package-type-entry.component.html',
  styleUrl: './package-type-entry.component.scss'
})
export class PackageTypeEntryComponent {
  modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
