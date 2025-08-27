import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-report-entry',
  standalone: true,
  imports: [NgSelectModule,NgbDatepickerModule,FeatherModule],
  templateUrl: './report-entry.component.html',
  styleUrl: './report-entry.component.scss'
})
export class ReportEntryComponent {
 constructor(private router: Router) {}
  goBack() {
    this.router.navigate(['operation/report/list']);
  }
}
