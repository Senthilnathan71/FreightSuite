import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { RouteInfo } from './vertical-sidebar.metadata';
import { VerticalSidebarService } from './vertical-sidebar.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AppService } from 'src/app/service/app.service';


@Component({
  selector: 'app-vertical-sidebar',
  standalone: true,
  imports: [TranslateModule, RouterModule, CommonModule, FeatherModule, NgbDropdownModule],
  templateUrl: './vertical-sidebar.component.html'
})
export class VerticalSidebarComponent implements OnInit {
  @Input() showClass: boolean = false;
  @Output() notify: EventEmitter<boolean> = new EventEmitter<boolean>();
  showMenu = '';
  showSubMenu = '';
  public sidebarnavItems: RouteInfo[] = [];
  path = '';

  isMobile: boolean = false;

  constructor(
    private menuServise: VerticalSidebarService, 
    private router: Router, private appService:AppService) {
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
      this.showMenu = '0';
    } else {
      this.showMenu = element;
    }
  }

  addActiveClass(element: any) {
    if (element === this.showSubMenu) {
      this.showSubMenu = '0';
    } else {
      this.showSubMenu = element;
    }
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }
  
  handleNotify() {
    this.notify.emit(!this.showClass);
  }

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice()
  }

}
