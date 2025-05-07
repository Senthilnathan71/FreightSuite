import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-currency-entry',
  standalone: true,
  imports: [
    FeatherModule
  ],
  templateUrl: './currency-entry.component.html',
  styleUrl: './currency-entry.component.scss'
})
export class CurrencyEntryComponent {

}
