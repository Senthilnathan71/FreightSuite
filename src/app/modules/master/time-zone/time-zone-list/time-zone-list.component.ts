import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-time-zone-list',
  standalone: true,
  imports: [FeatherModule,RouterModule],
  templateUrl: './time-zone-list.component.html',
  styleUrl: './time-zone-list.component.scss'
})
export class TimeZoneListComponent {
  constructor( private router: Router) {}
  navigateTocreateTimeZone(){
    this.router.navigate(['master/time-zone/entry'])
  }
}
