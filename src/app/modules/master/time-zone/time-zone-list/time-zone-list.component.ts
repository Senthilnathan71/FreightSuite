import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-time-zone-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './time-zone-list.component.html',
  styleUrl: './time-zone-list.component.scss'
})
export class TimeZoneListComponent {

}
