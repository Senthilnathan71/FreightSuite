import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-profitability-report-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './profitability-report-list.component.html',
  styleUrl: './profitability-report-list.component.scss'
})
export class ProfitabilityReportListComponent {

   constructor(private router: Router) {}
    TonavigateCreate() {
      this.router.navigate(['operation/profitability-report/entry']);
    }
}
