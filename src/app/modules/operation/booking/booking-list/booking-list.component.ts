import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { Router, RouterModule } from '@angular/router';
@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './booking-list.component.html',
  styleUrl: './booking-list.component.scss'
})
export class BookingListComponent {

  constructor( private router: Router) {}
  navigateToCreate(){
  this.router.navigate(['operation/booking/entry'])
  }
}
