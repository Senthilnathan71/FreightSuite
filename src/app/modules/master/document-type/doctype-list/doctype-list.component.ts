import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-doctype-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './doctype-list.component.html',
  styleUrl: './doctype-list.component.scss'
})
export class DoctypeListComponent {
   constructor( private router: Router) {}
  
    nagivateTocreateYear(){
       this.router.navigate(['master/doctype/entry'])
    }
}
