import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-city-entry',
  standalone: true,
  imports: [
    FeatherModule
  ],
  templateUrl: './city-entry.component.html',
  styleUrl: './city-entry.component.scss'
})
export class CityEntryComponent {

}
