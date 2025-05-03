import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-vessel-entry',
  standalone: true,
  imports: [
    FeatherModule
  ],
  templateUrl: './vessel-entry.component.html',
  styleUrl: './vessel-entry.component.scss'
})
export class VesselEntryComponent {

}
