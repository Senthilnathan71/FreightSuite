import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-authority-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './authority-list.component.html',
  styleUrl: './authority-list.component.scss'
})
export class AuthorityListComponent {
  constructor( private router: Router) {}

  nagivateTocreateAuhorizer(){
     this.router.navigate(['master/authority/entry'])
  }
}
