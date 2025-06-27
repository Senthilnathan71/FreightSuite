import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-tax-group-list',
  standalone: true,
  imports: [FeatherModule,CommonModule],
  templateUrl: './tax-group-list.component.html',
  styleUrl: './tax-group-list.component.scss'
})
export class TaxGroupListComponent {
   isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

    constructor(
      private router: Router,
    ) { }
    
    navigateToCreateTaxGroup() {
    this.router.navigate(['accounts/tax-group/entry']);
  }

}
