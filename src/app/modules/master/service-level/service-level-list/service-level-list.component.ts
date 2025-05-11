import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-service-level-list',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './service-level-list.component.html',
  styleUrl: './service-level-list.component.scss'
})
export class ServiceLevelListComponent {

}
