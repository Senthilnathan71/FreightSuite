import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-product-entry',
  standalone: true,
  imports: [FeatherModule,NgSelectModule],
  templateUrl: './product-entry.component.html',
  styleUrl: './product-entry.component.scss',
})
export class ProductEntryComponent {
  modeOfUOM = [
    { id: '1', name: 'Days' },
    { id: '2', name: 'Shipment' },
    { id: '3', name: 'KG' },
    { id: '4', name: 'CBMS' },
    { id: '5', name: 'Per Unit' },
    { id: '6', name: 'Per MT' },
    { id: '7', name: 'Per Ton' },
    { id: '8', name: 'Per Cntr' },
    { id: '9', name: 'Teu' },
  ];
  modeOfProductType=[
    {id:"1",name:"General"},
    {id:"2",name:"Haz"},
    {id:"3",name:"Frozen"},
  ]


}
