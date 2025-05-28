import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-terms-condition-list',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './terms-condition-list.component.html',
  styleUrl: './terms-condition-list.component.scss'
})
export class TermsConditionListComponent {
  constructor( private router: Router) {}
  navigateTocreateTerms(){
    this.router.navigate(['master/terms-condition/entry'])
  }
}
