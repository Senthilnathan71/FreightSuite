import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-crago-receipt-entry',
  standalone: true,
  imports: [NgSelectModule,FeatherModule,NgbDatepickerModule],
  templateUrl: './crago-receipt-entry.component.html',
  styleUrl: './crago-receipt-entry.component.scss'
})
export class CragoReceiptEntryComponent {

   constructor(private router: Router) {}
      goBack() {
        this.router.navigate(['operation/cargo-receipt/list']);
      }
}
