import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss'
})
export class InvoiceListComponent {
    constructor(private router: Router) {}
      TonavigateCreate() {
        this.router.navigate(['operation/invoice/entry']);
      }
}
