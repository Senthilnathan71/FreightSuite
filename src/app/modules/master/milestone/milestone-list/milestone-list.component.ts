import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { Router } from '@angular/router';
@Component({
  selector: 'app-milestone-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './milestone-list.component.html',
  styleUrl: './milestone-list.component.scss'
})
export class MilestoneListComponent {
  constructor( private router: Router) {}
      nagivateTocreateMilestone(){
        this.router.navigate(['master/milestone/entry'])
      }
}
