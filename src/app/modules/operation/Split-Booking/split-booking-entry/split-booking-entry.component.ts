import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-split-booking-entry',
  standalone: true,
  imports: [FeatherModule, NgSelectModule],
  templateUrl: './split-booking-entry.component.html',
  styleUrl: './split-booking-entry.component.scss',
})
export class SplitBookingEntryComponent {
  modeofpart = [
    { id: 1, name: 'Full' },
    { id: 2, name: 'Part' },
  ];

  selectedIndex: number | null = null;  

  onSelectRow(index: number) {
   
    if (this.selectedIndex === index) {
      this.selectedIndex = null;
    } else {
      this.selectedIndex = index;
    }
  }
}
