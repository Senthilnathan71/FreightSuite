import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [FeatherModule,RouterModule],
  templateUrl: './report-list.component.html',
  styleUrl: './report-list.component.scss'
})
export class ReportListComponent {
   constructor(private router: Router) {}
  navigateTocreateReport(){
    this.router.navigate(['master/report/entry']);
  }
}
