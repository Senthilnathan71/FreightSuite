import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-post-master-list',
  standalone: true,
  imports: [
    FeatherModule
  ],
  templateUrl: './post-master-list.component.html',
  styleUrl: './post-master-list.component.scss'
})
export class PostMasterListComponent {

}
