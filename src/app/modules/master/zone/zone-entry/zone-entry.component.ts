import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-zone-entry',
  standalone: true,
  imports: [
    FeatherModule
  ],
  templateUrl: './zone-entry.component.html',
  styleUrl: './zone-entry.component.scss'
})
export class ZoneEntryComponent {

}
