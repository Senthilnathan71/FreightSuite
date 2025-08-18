import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
@Component({
  selector: 'app-container-activity-entry',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './container-activity-entry.component.html',
  styleUrl: './container-activity-entry.component.scss',
})
export class ContainerActivityEntryComponent {
  modeOfStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];
  modeOfContainerMoveStatus = [
    { id: 1, name: 'Empty' },
    { id: 2, name: 'Full' },
  ];

  modeOfMoveType = [
    { id: 1, name: 'Inbound' },
    { id: 2, name: 'Outbound' },
  ];

  constructor(private router: Router) {}
  navigateToBack() {
    this.router.navigate(['master/container-activity/list']);
  }
}
