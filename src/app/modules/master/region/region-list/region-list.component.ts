import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';

@Component({
  selector: 'app-region-list',
  standalone: true,
  imports: [FeatherModule,RouterModule],
  templateUrl: './region-list.component.html',
  styleUrl: './region-list.component.scss'
})
export class RegionListComponent {
  constructor( private masterServ: MasterService,private router: Router) {}
  navigateTocreateRegion() {
    this.router.navigate(['master/region/entry']);
  }
}
