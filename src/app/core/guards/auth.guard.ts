import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { StorageMap } from '@ngx-pwa/local-storage';
import { Observable, of } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { AppSettingsService } from '../services/app-settings.service';
import { SessionService } from '../services/session.service';

@Injectable({
 providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(
        private router: Router,
        private localStorage: StorageMap,
        private appSettingsService: AppSettingsService,
        private sessionService: SessionService,
    ) { }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

        return new Promise((resolve, reject) => {
            this.localStorage.get(this.appSettingsService.tokenName).pipe(
                mergeMap((token: any) => {
                    console.log('TOKEN::', token);
                    if (token) {
                        return this.appSettingsService.getUserByToken();
                    }
                    return of(null);
                }),
                map((userData: any) => {
                    console.log('userData', userData, next.data);
                    if (userData) {
                        // Start heartbeat if not already running (handles page refresh)
                        this.sessionService.startHeartbeat();

                        if (next.data['type'] === 'BlankComponent') {
                            let landingPage = 'crm/dashboard';
                            this.router.navigate([landingPage], { queryParams: {} });
                            return resolve(false);
                        }
                        return resolve(true);
                    } else {

                        if (next.data['type'] === 'BlankComponent') {
                            return resolve(true);
                        }
                        this.router.navigate(['/auth'], { queryParams: {} });
                        return resolve(false);
                    }
                })
            ).subscribe();

        });
    }

}





// import { Injectable } from '@angular/core';
// import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
// import { StorageMap } from '@ngx-pwa/local-storage';
// import { Observable, of } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { AppSettingsService } from '../services/app-settings.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthGuard implements CanActivate {
//   constructor(
//     private router: Router,
//     private localStorage: StorageMap,
//     private appSettingsService: AppSettingsService
//   ) {}

//   canActivate(
//     next: ActivatedRouteSnapshot,
//     state: RouterStateSnapshot
//   ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
//     return new Observable<boolean>((observer) => {
//       // First, check if the token exists in local storage
//       this.localStorage.get(this.appSettingsService.tokenName).pipe(
//         map((token: any) => {
//           if (token) {
//             // If token exists, check if user data is available in AppSettingsService
//             this.appSettingsService.userSetting$.pipe(
//               map((userData: any) => {
//                 if (userData) {
//                   // If user data exists, allow access
//                   if (next.data['type'] === 'BlankComponent') {
//                     let landingPage = 'crm/dashboard'; // You can customize landingPage logic based on roles, etc.
//                     this.router.navigate([landingPage], { queryParams: {} });
//                     observer.next(false);
//                   } else {
//                     observer.next(true);
//                   }
//                 } else {
//                   // If no user data, redirect to login
//                   if (next.data['type'] === 'BlankComponent') {
//                     observer.next(true);
//                   } else {
//                     this.router.navigate(['/auth'], { queryParams: {} });
//                     observer.next(false);
//                   }
//                 }
//               })
//             ).subscribe();
//           } else {
//             // If no token, redirect to login
//             this.router.navigate(['/auth'], { queryParams: {} });
//             observer.next(false);
//           }
//         })
//       ).subscribe();
//     });
//   }
// }

