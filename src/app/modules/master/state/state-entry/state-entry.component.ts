import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-state-entry',
  standalone: true,
  imports: [
    FeatherModule,
    NgSelectModule
  ],
  templateUrl: './state-entry.component.html',
  styleUrl: './state-entry.component.scss'
})
export class StateEntryComponent {
  modeOfStatus = [
    { id: 'Active',  name: 'Active' },
    { id: 'Invalid',  name: 'Invalid' },
    { id: 'Block',  name: 'Block' }
];
}
