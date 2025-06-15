import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs";

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

  createMenu(payload: any){
    return this.http.post<{data:any}>('menu/create',payload).pipe(
      map((resp)=>{
        let response = resp.data;
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
        let response = resp.data;
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
      return res.data;
    })
  );
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

  getAllRole() {
    return this.http.get<{ data: any[] }>('role').pipe(
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

}
