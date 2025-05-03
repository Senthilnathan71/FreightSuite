import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerComponent } from '../crm-mobile/customer/customer.component';
import { DepartmentListComponent } from '../crm-mobile/department/department-list/department-list.component';
import { DepartmentEntryComponent } from '../crm-mobile/department/department-entry/department-entry.component';

// const routes: Routes = [];


export  const Materroutes: Routes = [
  {
    path:'',
    children:[
      {
        path:'',
      component : CustomerComponent,
      },
      {
        path:'departmentList',
        component : DepartmentListComponent
      },
      {
        path:'departmentEntry',
        component: DepartmentEntryComponent
      }
    ]
  }

];

