import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-report-entry',
  standalone: true,
  imports: [NgbNavModule,CommonModule,NgSelectModule,FeatherModule],
  templateUrl: './report-entry.component.html',
  styleUrl: './report-entry.component.scss'
})
export class ReportEntryComponent {
  active=1;
  modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]
}
