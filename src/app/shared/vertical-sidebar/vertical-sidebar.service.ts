import { Injectable } from '@angular/core';
import { BehaviorSubject, map, take } from 'rxjs';
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
   private leafMenus : RouteInfo[] = []; // only menus with no children
  private itemsSubject = new BehaviorSubject<RouteInfo[]>([]);
  public items$ = this.itemsSubject.asObservable();

  constructor(private http:HttpClient) {}

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

  addToRecent(payload){
    return this.http.post<{data:any}>('recent-screen/create',payload).pipe(
      map((resp)=>{
        let response  = resp;
        return response;
      })
    )
  }

  getLeafMenus(items) : RouteInfo[] {
    const leafNodes: RouteInfo[] = [];
    const collectLeaves = (nodes: RouteInfo[] | undefined) => {
      if (!nodes || nodes.length === 0) return;

      for (const node of nodes) {
        const children = node.submenu || [];
        const isLeaf = children.length === 0;

        // Collect only leaves that have extralink === false
        if (isLeaf) {
          leafNodes.push(node);
        } else {
          // not a leaf -> traverse children
          collectLeaves(children);
        }
      }
    };

    collectLeaves(items);
    return leafNodes;
  }

  syncMenuIdBeforeSubmit(menuName: string) : number | null {
    const leafNodes = this.getLeafMenus(this.MENUITEMS);
    const menu = leafNodes.find(m => m.title.trim().toLowerCase() === menuName.trim().toLowerCase());
    if (menu) {
      return (menu as any).id;
    }
    return null;
  }


}
