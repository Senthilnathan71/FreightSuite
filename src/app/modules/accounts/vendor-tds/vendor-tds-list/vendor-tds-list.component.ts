import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-vendor-tds-list',
  standalone: true,
  imports: [FeatherModule,FavoriteStarComponent],
  templateUrl: './vendor-tds-list.component.html',
  styleUrl: './vendor-tds-list.component.scss'
})
export class VendorTdsListComponent {

    constructor(
      private router: Router,
    ) { }

   navigateToCreateVendorTDS() {
    this.router.navigate(['accounts/vendor-tds/entry'])
  }
}
