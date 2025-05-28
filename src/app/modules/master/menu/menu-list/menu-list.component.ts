import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';


@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [FeatherModule, RouterModule],
  templateUrl: './menu-list.component.html',
  styleUrl: './menu-list.component.scss',
})
export class MenuListComponent {
  constructor( private router: Router) {}
  navigateTocreateMenu() {
    this.router.navigate(['master/menu/entry']);
  }
}
