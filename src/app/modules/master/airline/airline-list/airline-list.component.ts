import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-airline-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './airline-list.component.html',
  styleUrl: './airline-list.component.scss'
})
export class AirlineListComponent {

}
