import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { RouteInfo } from './vertical-sidebar.metadata';
import { VerticalSidebarService } from './vertical-sidebar.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AppService } from 'src/app/service/app.service';
import {SettingsService} from 'src/app/modules/settings/settings.service'


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
    private settingsService:SettingsService,
    private router: Router, private appService:AppService) {
  }


  ngOnInit() {

    this.isMobile = this.appService.getDevice()

    this.getModules();

    // Subscribe to menu state
    this.menuServise.items$.subscribe(menuItems => {
      this.sidebarnavItems = menuItems;

      // Detect current active menu
      this.sidebarnavItems.forEach(m => {
        m.submenu.forEach(s => {
          if (s.path === this.router.url) {
            this.path = m.title;
          }
        });
      });

      this.addExpandClass(this.path);
    });
  }

  getModules() {
    this.settingsService.getAllModules().subscribe((resp) => {
      console.log(resp.data, 'respOfMenu');
      this.menuServise.updateMenuItems(resp.data || []);
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
    localStorage.setItem('currentMenuId', element.id);
    if (element.title === this.showSubMenu) {
      this.showSubMenu = '0';
    } else {
      this.showSubMenu = element.title;
    }
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
    const path = element.path;
    const screenName = element.title;
    this.menuServise.addToRecent({ path, screenName }).subscribe(
      (resp:any)=>{
        if(resp.status){
          console.log(`${screenName} add to recent activities`)
        }
      }
    );
  }
  
  handleNotify() {
    this.notify.emit(!this.showClass);
  }


}
