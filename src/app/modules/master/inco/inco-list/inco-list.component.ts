import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-inco-list',
  standalone: true,
  imports: [FeatherModule,RouterModule],
  templateUrl: './inco-list.component.html',
  styleUrl: './inco-list.component.scss'
})
export class IncoListComponent {
  constructor( private router: Router) {}
  navigateTocreateInco(){
    this.router.navigate(['master/inco/entry'])
  }
}
