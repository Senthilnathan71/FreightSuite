import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-dashboard1',
  standalone: true,
  imports: [CommonModule,FeatherModule],
  templateUrl: './dashboard1.component.html',
  styleUrl: './dashboard1.component.scss'
})
export class Dashboard1Component {

   activeTab: string = 'pts'; // default tab

   projects = [
    {
      id: 1,
      stage: 'Opportunities',
      count: 66,
      actionLabel: 'Action'
    },
    {
      id: 2,
      stage: 'Leads',
      count: 34,
      actionLabel: 'Review'
    },
    {
      id: 3,
      stage: 'Prospects',
      count: 21,
      actionLabel: 'Follow Up'
    },
    {
      id: 4,
      stage: 'Negotiation',
      count: 12,
      actionLabel: 'Check'
    }
  ];
}
