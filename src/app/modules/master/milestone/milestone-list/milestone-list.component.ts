import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-milestone-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './milestone-list.component.html',
  styleUrl: './milestone-list.component.scss'
})
export class MilestoneListComponent {

}
