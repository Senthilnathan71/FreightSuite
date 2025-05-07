import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-currency-exchange-entry',
  standalone: true,
  imports: [
    FeatherModule
  ],
  templateUrl: './currency-exchange-entry.component.html',
  styleUrl: './currency-exchange-entry.component.scss'
})
export class CurrencyExchangeEntryComponent {

}
