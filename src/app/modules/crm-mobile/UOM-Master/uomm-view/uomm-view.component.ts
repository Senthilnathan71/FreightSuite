import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-uomm-view',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule, 
    FormsModule
  ],
  templateUrl: './uomm-view.component.html',
  styleUrl: './uomm-view.component.scss'
})
export class UOMMViewComponent {
  selectedShipmentType: number;

  shipmenttypes = [
    { id: 1,  name: 'FCL' },
    { id: 2,  name: 'LCL' },
    { id: 3,  name: 'Air' },
    { id: 4,  name: 'All' },
];
}
