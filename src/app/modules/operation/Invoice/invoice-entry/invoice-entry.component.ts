import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-invoice-entry',
  standalone: true,
  imports: [NgSelectModule,FeatherModule,NgbDatepickerModule],
  templateUrl: './invoice-entry.component.html',
  styleUrl: './invoice-entry.component.scss'
})
export class InvoiceEntryComponent {
   constructor(private router: Router) {}
    goBack() {
      this.router.navigate(['operation/invoice/list']);
    }
}
