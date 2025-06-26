import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { RouteInfo } from './vertical-sidebar.metadata';
import { ROUTES } from './vertical-menu-items';
import { HttpClient } from '@angular/common/http';
import { SettingsService } from 'src/app/modules/settings/settings.service';


@Injectable({
    providedIn: 'root'
})
export class VerticalSidebarService {

    public screenWidth: any;
    public collapseSidebar: boolean = false;
    public fullScreen: boolean = false;
    
  private currentMenuId : number;
   private MENUITEMS: RouteInfo[] = [];
  private itemsSubject = new BehaviorSubject<RouteInfo[]>([]);
  public items$ = this.itemsSubject.asObservable();

  constructor() {}

  setCurrentMenuId(menuId : number){
    this.currentMenuId = menuId;
  }

  getCurrentMenuId(){
    return this.currentMenuId
  }

  updateMenuItems(data: RouteInfo[]) {
    this.MENUITEMS = data || [];
    this.itemsSubject.next(this.MENUITEMS);
  }

}
