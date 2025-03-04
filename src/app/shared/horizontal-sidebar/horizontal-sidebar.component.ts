import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { RouteInfo } from './horizontal-sidebar.metadata';
import { HorizontalSidebarService } from './horizontal-sidebar.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-horizontal-sidebar',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    FeatherModule,RouterModule
  ],
  templateUrl: './horizontal-sidebar.component.html'
})
export class HorizontalSidebarComponent {
  showMenu = '';
  showSubMenu = '';
  public sidebarnavItems: RouteInfo[] = [];
  path = '';

  constructor(private menuServise: HorizontalSidebarService, private router: Router) {
    this.menuServise.items.subscribe(menuItems => {
      this.sidebarnavItems = menuItems;

      // Active menu 
      this.sidebarnavItems.filter(m => m.submenu.filter(
        (s) => {
          if (s.path === this.router.url) {
            this.path = m.title;
          }
        }
      ));
      this.addExpandClass(this.path);
    });
  }

  addExpandClass(element: any) {
    if (element === this.showMenu) {
      this.showMenu = element;
    } else {
      this.showMenu = element;
    }
  }

  addActiveClass(element: any) {
    if (element === this.showSubMenu) {
      this.showSubMenu = element;
    } else {
      this.showSubMenu = element;
    }
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }


}
