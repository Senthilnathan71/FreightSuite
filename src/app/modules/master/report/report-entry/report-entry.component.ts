import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-report-entry',
  standalone: true,
  imports: [NgbNavModule,CommonModule],
  templateUrl: './report-entry.component.html',
  styleUrl: './report-entry.component.scss'
})
export class ReportEntryComponent {
  active=1;
}
