import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss',
})
export class ReportComponent {
  constructor(private router: Router) {}
  navigateToCreate() {
    this.router.navigate(['operation/report/entry']);
  }
}
