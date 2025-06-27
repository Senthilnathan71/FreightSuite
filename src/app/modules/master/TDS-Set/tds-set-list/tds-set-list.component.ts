import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-tds-set-list',
  standalone: true,
  imports: [RouterModule,CommonModule,FeatherModule],
  templateUrl: './tds-set-list.component.html',
  styleUrl: './tds-set-list.component.scss'
})
export class TdsSetListComponent {
   isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 
  constructor( private router: Router) {}
  navigateTocreatetdsSet(){
    this.router.navigate(['master/tds-set/entry'])
  }
}
