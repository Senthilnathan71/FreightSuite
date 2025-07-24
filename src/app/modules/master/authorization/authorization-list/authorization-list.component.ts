import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-authorization-list',
  standalone: true,
  imports: [FavoriteStarComponent,FeatherModule],
  templateUrl: './authorization-list.component.html',
  styleUrl: './authorization-list.component.scss'
})
export class AuthorizationListComponent {

}
