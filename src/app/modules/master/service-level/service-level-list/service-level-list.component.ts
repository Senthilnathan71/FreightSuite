import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-service-level-list',
  standalone: true,
  imports: [FeatherModule,RouterModule],
  templateUrl: './service-level-list.component.html',
  styleUrl: './service-level-list.component.scss'
})
export class ServiceLevelListComponent {
   constructor(private router: Router) {}
  navigateTocreateServiceLevel(){
    this.router.navigate(['master/service-level/entry'])
  }
}
