import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-tax-group',
  standalone: true,
  imports: [FeatherModule,NgSelectModule],
  templateUrl: './tax-group.component.html',
  styleUrl: './tax-group.component.scss'
})
export class TaxGroupComponent {
    modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
