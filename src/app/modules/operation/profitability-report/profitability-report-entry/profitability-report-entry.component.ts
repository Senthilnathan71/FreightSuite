import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-profitability-report-entry',
  standalone: true,
  imports: [NgSelectModule,NgbDatepickerModule,FeatherModule],
  templateUrl: './profitability-report-entry.component.html',
  styleUrl: './profitability-report-entry.component.scss'
})
export class ProfitabilityReportEntryComponent {
 constructor(private router: Router) {}
  goBack() {
    this.router.navigate(['operation/profitability-report/list']);
  }
}
