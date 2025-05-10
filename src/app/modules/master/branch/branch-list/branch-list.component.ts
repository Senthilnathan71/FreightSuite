import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './branch-list.component.html',
  styleUrl: './branch-list.component.scss'
})
export class BranchListComponent {

}
