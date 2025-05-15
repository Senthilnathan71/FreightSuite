import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';

import { MasterService } from 'src/app/modules/master/master.service';
@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [FeatherModule, FormsModule, CommonModule],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss',
})
export class CompanyListComponent {
  searchType = 'departmentName';
  filterValue = '';
  results: any[] = [];
  departmentList: any[] = [];
  searchPerformed = false;

  constructor(private masterService: MasterService) {}
 
   search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue,
    }
    this.masterService.searchDepartmentList(payload).subscribe((res: any) => {
      this.results = res;
      this.searchPerformed = true;
    });
     console.log("DATA:",this.results)
  }
 

}
