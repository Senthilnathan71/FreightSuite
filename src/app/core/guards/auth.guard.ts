import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppSettingsService } from '../services/app-settings.service';
import { SessionService } from '../services/session.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private appSettingsService: AppSettingsService,
    private sessionService: SessionService,
  ) { }

  canActivate(next: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return this.appSettingsService.getUserByToken().pipe(
      map((userData: any) => {
        if (userData) {
          this.sessionService.startHeartbeat();
          return true;
        }
        return this.router.createUrlTree(['/auth']);
      }),
      catchError(() => {
        return of(this.router.createUrlTree(['/auth']));
      }),
    );
  }
}
