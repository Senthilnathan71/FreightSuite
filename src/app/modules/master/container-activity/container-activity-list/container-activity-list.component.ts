import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
@Component({
  selector: 'app-container-activity-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './container-activity-list.component.html',
  styleUrl: './container-activity-list.component.scss',
})
export class ContainerActivityListComponent {
  constructor(private router: Router) {}
  navigateToCreate() {
    this.router.navigate(['master/container-activity/entry']);
  }
}
