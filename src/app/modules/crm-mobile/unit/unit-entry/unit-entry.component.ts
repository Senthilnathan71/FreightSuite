import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-unit-entry',
  standalone: true,
  imports: [
    FeatherModule
  ],
  templateUrl: './unit-entry.component.html',
  styleUrl: './unit-entry.component.scss'
})
export class UnitEntryComponent {

}
