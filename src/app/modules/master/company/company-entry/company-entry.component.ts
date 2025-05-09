import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
@Component({
  selector: 'app-company-entry',
  standalone: true,
  imports: [NgbNavModule,CommonModule,NgSelectModule,FeatherModule],
  templateUrl: './company-entry.component.html',
  styleUrl: './company-entry.component.scss'
})
export class CompanyEntryComponent {
  active = 1;
  modeOfStatus = [
    { id: 'Active',  name: 'Active' },
    { id: 'Invalid',  name: 'Invalid' },
    { id: 'Block',  name: 'Block' }
];
}
