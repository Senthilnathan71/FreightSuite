import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-voucher-matching-entry',
  standalone: true,
  imports: [NgbDatepickerModule, FeatherModule, NgSelectModule],
  templateUrl: './voucher-matching-entry.component.html',
  styles: ``
})
export class VoucherMatchingEntryComponent {
 constructor(private router: Router) {}
  status = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];

  navigateToBack() {
    this.router.navigate(['accounts/journal-voucher/list']);
  }
}
