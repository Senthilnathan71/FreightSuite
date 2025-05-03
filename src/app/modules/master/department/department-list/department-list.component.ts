import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MasterService } from 'src/app/modules/master/master.service';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './department-list.component.html',
  styleUrl: './department-list.component.scss'
})
export class DepartmentListComponent {
  departments: any
  searchText: string = ''
  filterDepartmentList: any[] = []
  totalLengthofCollection: number = 0
  constructor(private masterService: MasterService, private router: Router) { }
  ngOnInit() {
    this.departments = []
    this.filterDepartmentList = []
  }


  loadDepartments(searchQuery: string): void {
    this.masterService.getAllDepartments().subscribe((resp: any[]) => {
      this.departments = resp
      console.log(this.departments, 'departments')
      this.applySearch(searchQuery)
    })
  }

  searchDepartmentsData() {
    const searchQuery = this.searchText.toLowerCase().trim()
    if (!searchQuery) {
      this.departments = []
      this.filterDepartmentList = []
      this.totalLengthofCollection = 0
    } else {
      this.loadDepartments(searchQuery)
    }
  }

  applySearch(searchQuery: string): void {
    this.filterDepartmentList = this.departments.filter((department) => {
      return (
        department.departmentCode?.toLowerCase().includes(searchQuery) ||
        department.departmentName?.toLowerCase().includes(searchQuery) ||
        department.departmentType?.toLowerCase().includes(searchQuery)
      )
    })
    this.totalLengthofCollection = this.filterDepartmentList.length || 0
  }

  navigateToCreateDepartment() {
    this.router.navigate(['master/departmentEntry'])
  }

}
