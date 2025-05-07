import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-tarrif-list',
  standalone: true,
  imports: [
    FeatherModule
  ],
  templateUrl: './tarrif-list.component.html',
  styleUrl: './tarrif-list.component.scss'
})
export class TarrifListComponent {

}
