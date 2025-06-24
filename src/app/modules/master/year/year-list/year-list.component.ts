import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-year-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './year-list.component.html',
  styleUrl: './year-list.component.scss'
})
export class YearListComponent {

  constructor( private router: Router) {}

  nagivateTocreateYear(){
     this.router.navigate(['master/year/entry'])
  }
}
