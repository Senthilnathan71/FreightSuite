import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
@Component({
  selector: 'app-imco-list',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './imco-list.component.html',
  styleUrl: './imco-list.component.scss',
})
export class ImcoListComponent {
  constructor(private router: Router) {}
  navigateTocreateImco() {
    this.router.navigate(['master/Imco/entry']);
  }
}
