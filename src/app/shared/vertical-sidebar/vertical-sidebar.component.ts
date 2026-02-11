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
import { AppSettingsService } from 'src/app/core/services/app-settings.service';


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
  currentCompany : any;
  userData : any;

  isMobile: boolean = false;

  constructor(
    private menuServise: VerticalSidebarService, 
    private settingsService:SettingsService,
    private appSettingService : AppSettingsService,
    private router: Router, private appService:AppService) {
  }


  ngOnInit() {

    this.isMobile = this.appService.getDevice()
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
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
    const currentCompanyId = this.currentCompany?.CompanyMasterSid;
    const isAdmin = this.userData?.userTypeId === 1;

    let userCompanyId: number | undefined = undefined;
    let userCompanyEntry : any;

    // Non-admin users must have a companyId and mapped userCompanyEntry
    if (!isAdmin) {
      if (!currentCompanyId) {
        console.error("❌ Current CompanyMasterSid not found for non-admin user");
        return;
      }

      userCompanyEntry = (this.userData?.userCompanyMaster || [])
        .find(c => c.CompanyMasterSid === currentCompanyId);
      console.log("Fetch Modules", {
        userData :this.userData,
        currentCompanyId,
      });

      if(!userCompanyEntry){
        console.error("❌ UserCompanyMasterSid not found for current company (non-admin)");
        return;
      }

      userCompanyId = userCompanyEntry?.UserCompanyMasterSid;

      if (!userCompanyId) {
        console.error("❌ UserCompanyMasterSid not found for current company (non-admin)");
        return;
      }
    }

    // Debug log
    console.group("🔍 Module Fetch Debug");
    console.table([{
      isAdmin,
      currentCompanyId: currentCompanyId || "N/A (Admin)",
      userCompanyId: userCompanyId || "N/A (Admin)",
      roleInvolved: userCompanyEntry
    }]);
    console.groupEnd();

    // Admin calls endpoint without params
    this.settingsService.getAllModules(isAdmin ? undefined : userCompanyId)
      .subscribe((resp) => {
        console.log("📌 Modules Response:", resp.data);
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
    sessionStorage.setItem('currentMenuId', element.id);
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
    
    const newlyVisited = {
      MenuMasterSid : element.id,
      path: element.path,
      screenName: element.title,
      createdOn: new Date()
    };

    let recentlyVisited = JSON.parse(localStorage.getItem('recentlyVisited')) || [];
    const existingIndex = recentlyVisited.findIndex(item => item.path === newlyVisited.path);

    if (existingIndex !== -1) {
      recentlyVisited.splice(existingIndex, 1);
    }

    recentlyVisited.unshift(newlyVisited);

    if (recentlyVisited.length > 10) {
      recentlyVisited.pop();
    }

    localStorage.setItem('recentlyVisited', JSON.stringify(recentlyVisited));
  }
  
  handleNotify() {
    this.notify.emit(!this.showClass);
  }


}
