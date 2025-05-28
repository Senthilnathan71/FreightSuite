import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-airline-list',
  standalone: true,
  imports: [FeatherModule,RouterModule],
  templateUrl: './airline-list.component.html',
  styleUrl: './airline-list.component.scss'
})
export class AirlineListComponent {
   constructor( private router: Router) {}
  navigateTocreateAirline(){
    this.router.navigate(['master/airline/entry']);
  }
}
