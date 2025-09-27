import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-mawb-stock-list',
  standalone: true,
  imports: [FavoriteStarComponent,FeatherModule,NgSelectModule,RouterModule],
  templateUrl: './mawb-stock-list.component.html',
  styles: ``
})
export class MawbStockListComponent {
 constructor(  private router: Router){}
  create(){
     this.router.navigate(['master/mawb-stock/entry'])
  }
}


