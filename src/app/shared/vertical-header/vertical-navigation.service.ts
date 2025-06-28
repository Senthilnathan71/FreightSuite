import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VerticalNavService {

    constructor(private http:HttpClient){}

    getAllRecentScreens(){
        return this.http.get<{data:any}>('recent-screen').pipe(
            map((resp:any)=>{
                let response = resp;
                return response;
            })
        )
    }

    getAllFavouriteScreens(){
        return this.http.get<{data:any}>('favourite-screen').pipe(
            map((resp:any)=>{
                let response = resp;
                return response;
            })
        )
    }

    deleteFavouriteScreen(path:string){
    return this.http.delete<{data:any}>(`favourite-screen/delete?path=${encodeURIComponent(path)}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

    searchMenu(payload) {
        return this.http.post<{ data: any }>('menu/search-list',payload).pipe(
            map((resp: any) => {
                let response = resp.data;
                return response;
            })
        )
    }

}