import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-country-entry',
  standalone: true,
  imports: [
    FeatherModule
  ],
  templateUrl: './country-entry.component.html',
  styleUrl: './country-entry.component.scss'
})
export class CountryEntryComponent {

}
