import { Component } from '@angular/core';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
@Component({
  selector: 'app-vendor-invoice-entry',
  standalone: true,
  imports: [NgSelectModule,NgbDatepickerModule,FeatherModule],
  templateUrl: './vendor-invoice-entry.component.html',
  styles: ``
})
export class VendorInvoiceEntryComponent {

    modeofStatus=[
    {id:1,name:"Active"},
    {id:2,name:"Suspended"}
  ]

  modeOfSerachType=[
    {id:1,name:"Master Job"},
    {id:2,name:"House Job"},
    {id:3,name:"MBL No"},
    {id:4,name:"HBL No"},
    {id:5,name:"Container No"}
  ]
}
