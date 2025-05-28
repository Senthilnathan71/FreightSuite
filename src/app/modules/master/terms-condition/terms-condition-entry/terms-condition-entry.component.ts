import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-terms-condition-entry',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './terms-condition-entry.component.html',
  styleUrl: './terms-condition-entry.component.scss'
})
export class TermsConditionEntryComponent {
   navigateBack() {
    history.back();
  }
}
