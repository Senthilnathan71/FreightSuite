import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-commodity-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './commodity-list.component.html',
  styleUrl: './commodity-list.component.scss'
})
export class CommodityListComponent {

}
