import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-master-job-list',
  standalone: true,
  imports: [FavoriteStarComponent,FeatherModule],
  templateUrl: './master-job-list.component.html',
  styleUrl: './master-job-list.component.scss',
})
export class MasterJobListComponent {
  constructor(private router: Router) {}
  navigateToMasterJob() {
    this.router.navigate(['operation/master-job/entry']);
  }
}
