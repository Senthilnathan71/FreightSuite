import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-zone-list',
  standalone: true,
  imports: [
    FeatherModule
  ],
  templateUrl: './zone-list.component.html',
  styleUrl: './zone-list.component.scss'
})
export class ZoneListComponent {

}
