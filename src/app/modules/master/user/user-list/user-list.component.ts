import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent {
   constructor( private router: Router) {}
    nagivateTocreateUser(){
      this.router.navigate(['master/user/entry'])
    }
}
