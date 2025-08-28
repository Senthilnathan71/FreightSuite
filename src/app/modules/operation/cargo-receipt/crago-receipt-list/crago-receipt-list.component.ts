import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-crago-receipt-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './crago-receipt-list.component.html',
  styleUrl: './crago-receipt-list.component.scss'
})
export class CragoReceiptListComponent {
   constructor(private router: Router) {}
        TonavigateCreate() {
          this.router.navigate(['operation/cargo-receipt/entry']);
        }
}
