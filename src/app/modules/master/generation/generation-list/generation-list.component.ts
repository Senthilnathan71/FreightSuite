import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-generation-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './generation-list.component.html',
  styleUrl: './generation-list.component.scss'
})
export class GenerationListComponent {
   constructor( private router: Router) {}
  
    nagivateTocreateGeneration(){
       this.router.navigate(['master/generation/entry'])
    }
}
