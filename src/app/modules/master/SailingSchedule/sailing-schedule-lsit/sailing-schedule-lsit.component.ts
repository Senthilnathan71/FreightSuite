import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-sailing-schedule-lsit',
  standalone: true,
  imports: [FeatherModule,RouterModule],
  templateUrl: './sailing-schedule-lsit.component.html',
  styleUrl: './sailing-schedule-lsit.component.scss'
})
export class SailingScheduleLsitComponent {
   constructor( private router: Router) {}
  nagivateTocreateSailingSchedule(){
    this.router.navigate(['master/sailing-schedule/entry'])
  }
}
