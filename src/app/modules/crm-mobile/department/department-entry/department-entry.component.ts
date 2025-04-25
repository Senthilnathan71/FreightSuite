import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-department-entry',
  standalone: true,
  imports: [
    FeatherModule
  ],
  templateUrl: './department-entry.component.html',
  styleUrl: './department-entry.component.scss'
})
export class DepartmentEntryComponent {

}
