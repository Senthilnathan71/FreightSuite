import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-company-entry',
  standalone: true,
  imports: [NgbNavModule,CommonModule],
  templateUrl: './company-entry.component.html',
  styleUrl: './company-entry.component.scss'
})
export class CompanyEntryComponent {
  active = 1;
}
