import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-generation-entry',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './generation-entry.component.html',
  styleUrl: './generation-entry.component.scss'
})
export class GenerationEntryComponent {
    navigateBack() {
    history.back();
  }

  
  modeOfStatus = [
    { id: '1', name: 'Free 1' },
    { id: '2', name: 'Free 2' },
  ];

   modeOfReceivedFrom = [
    { id: '1', name: 'Received From 1' },
    { id: '2', name: 'Received From 2' },
  ];
}
