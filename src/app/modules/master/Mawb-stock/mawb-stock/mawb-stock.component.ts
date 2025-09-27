import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
@Component({
  selector: 'app-mawb-stock',
  standalone: true,
  imports: [RouterModule,NgSelectModule,NgbDatepickerModule,FeatherModule],
  templateUrl: './mawb-stock.component.html',
  styles: ``
})
export class MawbStockComponent {

  constructor(  private router: Router){}
  navigateBack(){
     this.router.navigate(['master/mawb-stock/list'])
  }
}
