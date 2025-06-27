import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';


@Component({
  selector: 'app-year-list',
  standalone: true,
  imports: [FeatherModule,CommonModule],
  templateUrl: './year-list.component.html',
  styleUrl: './year-list.component.scss'
})
export class YearListComponent {
 isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  constructor( private router: Router) {}

  nagivateTocreateYear(){
     this.router.navigate(['master/year/entry'])
  }
}
