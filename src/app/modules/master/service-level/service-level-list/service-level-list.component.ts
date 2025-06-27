import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-service-level-list',
  standalone: true,
  imports: [FeatherModule,RouterModule,CommonModule],
  templateUrl: './service-level-list.component.html',
  styleUrl: './service-level-list.component.scss'
})
export class ServiceLevelListComponent {
  isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 

   constructor(private router: Router) {}
  navigateTocreateServiceLevel(){
    this.router.navigate(['master/service-level/entry'])
  }
}
