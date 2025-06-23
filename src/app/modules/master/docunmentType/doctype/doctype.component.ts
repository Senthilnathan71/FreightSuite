import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-doctype',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './doctype.component.html',
  styleUrl: './doctype.component.scss'
})
export class DoctypeComponent {


    navigateBack() {
    history.back();
  }
    modeOfStatus = [
    { id: '1', name: 'Active' },
    { id: '2', name: 'Suspended' },
  ];
   modeOfSeparator = [
    { id: '1', name: 'separator 1' },
    { id: '2', name: 'separator 2' },
  ];
    modeOfSerialNo = [
    { id: '1', name: 'serial 1' },
    { id: '2', name: 'serial 2' },
  ];
     modeOfResetValue = [
    { id: '1', name: 'Reset 1' },
    { id: '2', name: 'Reset 1' },
  ];
}
