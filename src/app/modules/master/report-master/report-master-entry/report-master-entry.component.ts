import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-report-master-entry',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './report-master-entry.component.html',
  styleUrl: './report-master-entry.component.scss'
})
export class ReportMasterEntryComponent {

  modeofreportFormat = [
    { id: 1, name: "XL" },
    { id: 2, name: "PDF" },
    { id: 3, name: "XML" }
  ]
}
