import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs";
import { RouteInfo } from "src/app/shared/vertical-sidebar/vertical-sidebar.metadata";

 @Injectable({
   providedIn: 'root',
 })
 export class SettingsService {
  
   constructor(private http: HttpClient) { }
 
 
 //menu master
 getAllMenu(){
    return this.http.get<{data:any[]}>('menu').pipe(
      map((resp)=>{
        let response = resp.data;
        return response;
      })
    )
  }


  getSubMenuList(ModuleMasterSid: number) {
  return this.http.get<{ data: any[] }>(`menu/sub-menu/list/${ModuleMasterSid}`).pipe(
    map((resp) => {
      let response = resp.data;
        return response;
    })
  );
}
  

  createMenu(payload: any){
    return this.http.post<{data:any}>('menu/create',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  getMenuById(MenuMasterSid: number) {
  return this.http.get<{ data: any }>(`menu/fetch/${MenuMasterSid}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}


  updateMenuById(MenuMasterSid: number, payload: any){
    return this.http.patch<{data:any}>(`menu/update/${MenuMasterSid}`,payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  deleteMenuById(MenuMasterSid: number){
    return this.http.delete<{data:any}>(`menu/delete/${MenuMasterSid}`).pipe(
      map((resp)=>{
        let response = resp.data;
        return response;
      })
    )
  }

  searchMenuList(payload: any) {
  return this.http.post("menu/search-list", payload).pipe(
    map((res: any) => {
      return res;
    })
  );
}

  getMenuByModuleId(ModuleMasterSid){
    return this.http.get<{data:any[]}>(`menu/fetchByModule/${ModuleMasterSid}`).pipe(
      map((res:any)=>{
        return res.data;
      })
    )
  }

  getMenusByModuleIds(moduleIds: number[]) {
  return this.http.post<{data: any[]}>(`menu/fetchByModules`, { moduleIds }).pipe(
    map((res: any) => {
      return res.data;
    })
  );
}

  getMenuPermissions(MenuMasterSid){
    
    return this.http.get<{data:any[]}>(`menu/fetch/menu-permissions/${MenuMasterSid}`).pipe(
      map((res:any)=>{
        return res.data;
      })
    )
  }



  // MODULE MASTER
  getAllModule() {
    return this.http.get<{ data: any[] }>('module').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

   getAllModules(UserCompanyMasterSid?: number) {
     const params: any = {};
     if (UserCompanyMasterSid) {
       params.UserCompanyMasterSid = UserCompanyMasterSid;
     }
     return this.http.get<{ data: RouteInfo[] }>('module/navigation-list', { params }).pipe(
       map(resp => {
         return resp;
       })
     );
   }


  

  getModuleById(ModuleMasterSid) {
    return this.http.get<{ data: any }>(`module/fetch/${ModuleMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createNewModule(payload) {
    return this.http.post<{ data: any }>('module/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateModuleById(ModuleMasterSid: number, payload) {
    return this.http.patch<{ data: any }>(`module/update/${ModuleMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteModuleById(ModuleMasterSid: number) {
    return this.http.delete<{ data: any }>(`module/delete/${ModuleMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchModule(payload) {
    return this.http.post<{ data: any[] }>('module/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }
  // ROLE MASTER

  getAllRole(CompanyMasterSid: number) {
    return this.http.post<{ data: any[] }>('role',{CompanyMasterSid}).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getRoleById(RoleMasterSid) {
    return this.http.get<{ data: any }>(`role/fetch/${RoleMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createNewRole(payload) {
    return this.http.post<{ data: any }>('role/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateRoleById(RoleMasterSid: number, payload) {
    return this.http.patch<{ data: any }>(`role/update/${RoleMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteRoleById(RoleMasterSid: number) {
    return this.http.delete<{ data: any }>(`role/delete/${RoleMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchRole(payload) {
    return this.http.post<{ data: any[] }>('role/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }
  // ROLEMENU MASTER

  getAllRoleMenu() {
    return this.http.get<{ data: any[] }>('role-menu').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getRoleMenuById(CompanyMasterSid: number, RoleMenuMasterSid: number) {
    return this.http.get<{ data: any }>(`role-menu/fetch/${CompanyMasterSid}/${RoleMenuMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createNewRoleMenu(payload) {
    return this.http.post<{ data: any }>('role-menu/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateRoleMenu(payload) {
    return this.http.patch<{ data: any }>(`role-menu/update`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllModulesWithMenus(){
    return this.http.get<{ data: any[] }>('role-menu/menu-with-modules').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteRoleMenuById(RoleMenuMasterSid: number) {
    return this.http.delete<{ data: any }>(`role-menu/delete/${RoleMenuMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchRoleMenu(payload) {
    return this.http.post<{ data: any[] }>('role-menu/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getRoleMenuPrintPermissions(companyId: number, roleMenuDetailSid: number) {
    return this.http.get<{ data: any[] }>(`role-menu/print-permissions/${companyId}/${roleMenuDetailSid}`).pipe(
      map((resp) => resp)
    );
  }

  saveRoleMenuPrintPermissions(payload: any) {
    return this.http.post<{ data: any }>('role-menu/save-print-permissions', payload).pipe(
      map((resp) => resp)
    );
  }

  getRoleMenuReportPermissions(companyId: number, roleMenuDetailSid: number) {
    return this.http.get<{ data: any[] }>(`role-menu/report-permissions/${companyId}/${roleMenuDetailSid}`).pipe(
      map((resp) => resp)
    );
  }

  saveRoleMenuReportPermissions(payload: any) {
    return this.http.post<{ data: any }>('role-menu/save-report-permissions', payload).pipe(
      map((resp) => resp)
    );
  }


  goSpecialSearch(payload){
    return this.http.post<{data:any[]}>('role-menu/special-search',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  getTandCByCondition(payload){
    return this.http.post<{data : any[]}>('terms-and-conditions/fetchByCondition',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  getRoleMenuPermissions(menuId: number, roleId: number) {
  return this.http.get<{ data: any }>(`role-menu/permissions/${menuId}/${roleId}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

  // Email log
  createNewEmailLog(payload){
    return this.http.post<{data : any[]}>('emailLog/createWithAttachment',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  // ============= NUMBER SERIES CONFIGURATION =============

  /**
   * Get all number series configurations for a branch
   */
  getNumberSeriesConfigs(CompanyMasterSid: number, BranchMasterSid: number) {
    return this.http.get<{ status: boolean; data: any[] }>(
      `number-series/configs?CompanyMasterSid=${CompanyMasterSid}&BranchMasterSid=${BranchMasterSid}`
    ).pipe(
      map((resp) => resp)
    );
  }

  /**
   * Get number series configuration for a specific menu
   */
  getNumberSeriesConfig(CompanyMasterSid: number, BranchMasterSid: number, MenuMasterSid: number) {
    return this.http.get<{ status: boolean; data: any }>(
      `number-series/config/${MenuMasterSid}?CompanyMasterSid=${CompanyMasterSid}&BranchMasterSid=${BranchMasterSid}`
    ).pipe(
      map((resp) => resp)
    );
  }

  /**
   * Save (create or update) number series configuration
   */
  saveNumberSeriesConfig(payload: any) {
    return this.http.post<{ status: boolean; data: any; message: string }>(
      'number-series/config',
      payload
    ).pipe(
      map((resp) => resp)
    );
  }

  /**
   * Preview next number without incrementing counter
   */
  previewNumberSeries(payload: any) {
    return this.http.post<{ status: boolean; data: { preview: string; nextNumber: number } }>(
      'number-series/preview',
      payload
    ).pipe(
      map((resp) => resp)
    );
  }

  /**
   * Generate next document number (increments counter)
   */
  generateNextNumber(payload: any) {
    return this.http.post<{ status: boolean; data: string }>(
      'number-series/generate',
      payload
    ).pipe(
      map((resp) => resp)
    );
  }

  /**
   * Delete number series configuration (soft delete)
   */
  deleteNumberSeriesConfig(id: number, UpdatedBy: string) {
    return this.http.delete<{ status: boolean; data: any; message: string }>(
      `number-series/config/${id}`,
      { body: { UpdatedBy } }
    ).pipe(
      map((resp) => resp)
    );
  }

  /**
   * Get current financial year for a company
   */
  getCurrentFinancialYear(CompanyMasterSid: number) {
    return this.http.get<{ status: boolean; data: any }>(
      `number-series/financial-year?CompanyMasterSid=${CompanyMasterSid}`
    ).pipe(
      map((resp) => resp)
    );
  }

  /**
   * Get all counters for a configuration (for debugging/reporting)
   */
  getNumberSeriesCounters(configId: number) {
    return this.http.get<{ status: boolean; data: any[] }>(
      `number-series/counters/${configId}`
    ).pipe(
      map((resp) => resp)
    );
  }

  /**
   * Get menus that are document types (Enquiry, Quotation, Booking, etc.)
   * Returns menus with status 'A' (Active) or 'S' (Suspended)
   */
  getDocumentMenus() {
    return this.http.get<{ data: any[] }>('menu/document-menus').pipe(
      map((resp) => resp.data || [])
    );
  }

  // ─── Menu User Config ────────────────────────────────────────

  getMenuUserConfig(branchId?: number, companyId?: number) {
    return this.http.post<{ status: boolean; data: any[] }>(
      'menu-user-config/get',
      { companyId, branchId }
    ).pipe(
      map((resp) => resp.data || [])
    );
  }

  saveMenuUserConfig(configs: any[], CompanyMasterSid?: number) {
    return this.http.post<{ status: boolean; data: any; message: string }>(
      'menu-user-config',
      { configs, CompanyMasterSid }
    ).pipe(
      map((resp) => resp)
    );
  }

}
