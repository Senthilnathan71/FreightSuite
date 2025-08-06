import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';

@Component({
  selector: 'app-favorite-star',
  standalone: true,
  imports: [FeatherModule, CommonModule],
  template: `
    <div class="d-flex justify-content-end mb-2">
      <i
        [ngClass]="isFavorite ? 'fas fa-star fs-5 text-danger' : 'far fa-star fs-5 text-secondary'"
        (click)="toggleFavorite()"
        data-toggle="tooltip"
        data-placement="bottom"
        [title]="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
        style="cursor: pointer;">
      </i>
    </div>
  `,
  styles: []
})
export class FavoriteStarComponent implements OnInit {
  @Input() screenName: string = '';
  @Input() customPath: string = '';
  
  isFavorite = false;
  userData: any;
  currentPath: string = '';
  isProcessing = false; // Added processing state

  constructor(
    private router: Router,
    private masterService: MasterService,
    private appSettingService: AppSettingsService
  ) {}

  ngOnInit() {
    // this.appSettingService.getUser().subscribe(user => {
    //   this.userData = user;
    // });
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
		}
    this.currentPath = this.customPath || this.router.url;
    this.checkForFavoriteScreen(this.currentPath);
  }

  checkForFavoriteScreen(path: string) {
    this.masterService.isPathFav(path).subscribe({
      next: (resp: any) => this.isFavorite = resp.status,
      error: () => this.isFavorite = false
    });
  }

  toggleFavorite() {
    if (this.isProcessing || !this.screenName) return;
    
    this.isProcessing = true;
    const payload = {
      path: this.currentPath,
      screenName: this.screenName
    };

    const serviceCall = this.isFavorite
      ? this.masterService.deleteFavouriteScreen(payload.path)
      : this.masterService.createFavouriteScreen(payload);

    serviceCall.subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.isFavorite = !this.isFavorite;
        }
        this.isProcessing = false;
      },
      error: () => {
        this.appSettingService.showError(
          `Error ${this.isFavorite ? 'removing' : 'adding'} ${this.screenName} to Favorites`
        );
        this.isProcessing = false;
      }
    });
  }
}