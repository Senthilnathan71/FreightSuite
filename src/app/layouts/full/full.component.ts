import { CommonModule } from '@angular/common';
import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  NgbCollapseModule,
  NgbDropdownModule,
  NgbNavModule,
} from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { VerticalNavigationComponent } from '../../shared/vertical-header/vertical-navigation.component';
import { VerticalSidebarComponent } from '../../shared/vertical-sidebar/vertical-sidebar.component';
import { HorizontalNavigationComponent } from '../../shared/horizontal-header/horizontal-navigation.component';
import { HorizontalSidebarComponent } from '../../shared/horizontal-sidebar/horizontal-sidebar.component';
import { AppService } from 'src/app/service/app.service';
import { LogoService } from 'src/app/core/services/logo.service';

@Component({
  selector: 'app-full-layout',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    NgbDropdownModule,
    NgScrollbarModule,
    FeatherModule,
    NgbNavModule,
    FormsModule,
    BreadcrumbComponent,
    VerticalNavigationComponent,
    VerticalSidebarComponent,
    HorizontalNavigationComponent,
    HorizontalSidebarComponent,
    NgbCollapseModule,
  ],
  templateUrl: './full.component.html',
  styleUrls: ['./full.component.scss'],
})
export class FullComponent implements OnInit {
  active = 1;

  isMobile: boolean = false;

  constructor(public router: Router, private appService:AppService, public logoService : LogoService) {}

  tabStatus = 'justified';

  public isCollapsed = false;

  public innerWidth: any;
  public defaultSidebar: any;
  public showSettings = false;
  public showMobileMenu = false;
  public expandLogo = false;

  options = {
    theme: 'light', // two possible values: light, dark
    dir: 'ltr', // two possible values: ltr, rtl
    layout: 'vertical', // fixed value. shouldn't be changed.
    sidebartype: 'mini-sidebar', // four possible values: full, iconbar, overlay, mini-sidebar
    sidebarpos: 'fixed', // two possible values: fixed, absolute
    headerpos: 'fixed', // two possible values: fixed, absolute
    boxed: 'full', // two possible values: full, boxed
    navbarbg: 'skin6', // six possible values: skin(1/2/3/4/5/6)
    sidebarbg: 'skin1', // six possible values: skin(1/2/3/4/5/6)
    logobg: 'skin6', // six possible values: skin(1/2/3/4/5/6)
  };

  Logo() {
    this.expandLogo = !this.expandLogo;
  }

  ngOnInit() {
    if (this.router.url === '/') {
      this.router.navigate(['/dashboard/classic']);
    }
    this.defaultSidebar = this.options.sidebartype;
    this.handleSidebar();

    this.isMobile = this.appService.getDevice()
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: string) {
    this.handleSidebar();
  }

  handleSidebar() {
    this.innerWidth = window.innerWidth;
    switch (this.defaultSidebar) {
      case 'full':
      case 'iconbar':
        if (this.innerWidth < 1170) {
          this.options.sidebartype = 'mini-sidebar';
        } else {
          this.options.sidebartype = this.defaultSidebar;
        }
        break;

      case 'overlay':
        if (this.innerWidth < 767) {
          this.options.sidebartype = 'mini-sidebar';
        } else {
          this.options.sidebartype = this.defaultSidebar;
        }
        break;

      default:
    }
  }

  toggleSidebarType() {
    switch (this.options.sidebartype) {
      case 'full':
      case 'iconbar':
        this.options.sidebartype = 'mini-sidebar';
        break;

      case 'overlay':
        this.showMobileMenu = !this.showMobileMenu;
        break;

      case 'mini-sidebar':
        if (this.defaultSidebar === 'mini-sidebar') {
          this.options.sidebartype = 'full';
        } else {
          this.options.sidebartype = this.defaultSidebar;
        }
        break;

      default:
    }
  }

  handleClick(event: boolean) {
    this.showMobileMenu = event;
  }
}
