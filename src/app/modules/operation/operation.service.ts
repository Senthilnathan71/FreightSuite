import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs";
import { RouteInfo } from "src/app/shared/vertical-sidebar/vertical-sidebar.metadata";

 @Injectable({
   providedIn: 'root',
 })
 export class OperationService {
  
   constructor(private http: HttpClient) { }


}
