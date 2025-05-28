import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-tds-set-list',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './tds-set-list.component.html',
  styleUrl: './tds-set-list.component.scss'
})
export class TdsSetListComponent {
  constructor( private router: Router) {}
  navigateTocreatetdsSet(){
    this.router.navigate(['master/tds-set/entry'])
  }
}
