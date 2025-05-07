import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-vessel-list',
  standalone: true,
  imports: [
    FeatherModule
  ],
  templateUrl: './vessel-list.component.html',
  styleUrl: './vessel-list.component.scss'
})
export class VesselListComponent {

}
