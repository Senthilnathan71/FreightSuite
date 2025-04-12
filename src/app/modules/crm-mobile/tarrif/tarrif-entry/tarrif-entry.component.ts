import { Component } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-tarrif-entry',
  standalone: true,
  imports: [
    FeatherModule,
    NgbTooltip
  ],
  templateUrl: './tarrif-entry.component.html',
  styleUrl: './tarrif-entry.component.scss'
})
export class TarrifEntryComponent {

}
