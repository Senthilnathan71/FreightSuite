import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FeatherModule,RouterModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent {
  constructor( private router: Router) {}
  navigateTocreateProduct(){
    this.router.navigate(["master/product/entry"])
  }
}
