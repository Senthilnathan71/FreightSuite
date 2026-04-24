import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import {
  NgbCollapseModule,
  NgbDropdownModule,
  NgbNavModule,
} from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { Subject, combineLatest, filter, map, startWith, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { VerticalNavigationComponent } from '../../shared/vertical-header/vertical-navigation.component';
import { VerticalSidebarComponent } from '../../shared/vertical-sidebar/vertical-sidebar.component';
import { HorizontalNavigationComponent } from '../../shared/horizontal-header/horizontal-navigation.component';
import { HorizontalSidebarComponent } from '../../shared/horizontal-sidebar/horizontal-sidebar.component';
import { AppService } from 'src/app/service/app.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { VerticalSidebarService } from '../../shared/vertical-sidebar/vertical-sidebar.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';

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
export class FullComponent implements OnInit, OnDestroy {
  active = 1;

  isMobile: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    public router: Router,
    private appService: AppService,
    public logoService: LogoService,
    private sidebarService: VerticalSidebarService,
    private mps: MenuPermissionService
  ) {}

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

    // Auto-sync currentMenuId whenever URL or menu items change
    const url$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: NavigationEnd) => event.urlAfterRedirects || event.url),
      startWith(this.router.url)
    );

    combineLatest([url$, this.sidebarService.items$]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([url, items]) => {
      if (items.length > 0) {
        this.syncMenuId(url);
        this.mps.init().subscribe();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  private syncMenuId(url: string) {
    const menuId = this.sidebarService.getMenuIdByPath(url);
    console.log(
      `%c[MenuSync] %cURL: %c${url} %c→ MenuId: %c${menuId ?? 'null'}`,
      'color: #fff; background: #6C3FC5; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      'color: #888;',
      'color: #2196F3; font-weight: bold;',
      'color: #888;',
      menuId ? 'color: #4CAF50; font-weight: bold;' : 'color: #F44336; font-weight: bold;'
    );
    sessionStorage.setItem('currentMenuId', menuId ? menuId.toString() : null);
  }

  handleClick(event: boolean) {
    this.showMobileMenu = event;
  }
}
