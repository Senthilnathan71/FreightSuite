import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { forkJoin } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-report',
  standalone: true,
  imports: [FeatherModule, NgSelectModule, NgbDatepickerModule, MultiSelectComponent, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss',
})
export class ReportComponent {
  BookingForm!: FormGroup;
  departmentList: any[];
  PODList: any[];
  SalesPersonList: any[];
  currentCompany: any;
  currentBranch: any;
  BranchList:any[];
  constructor(private router: Router, private appSettingService: AppSettingsService, private masterService: MasterService, private fb: FormBuilder,) { }
  navigateToCreate() {
    this.router.navigate(['operation/report/entry']);
  }

  ngOnInit() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.loadAllfields();
    this.intialForm();
  }

  loadAllfields() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin({
      departments: this.masterService.getAllDepartments(CompanyMasterSid),
      POD: this.masterService.getAllPorts(),
      salesperson: this.masterService.getAllSalesmans(CompanyMasterSid),
      branch : this.masterService.getBranchesByCompanyId(CompanyMasterSid)
    }).subscribe(({ departments, POD, salesperson,branch }) => {
      this.departmentList = departments;
      this.PODList = POD.data;
      this.SalesPersonList = salesperson;
      this.BranchList = branch;
    })
  }

 intialForm() {
  this.BookingForm = this.fb.group({
    Dept: ['', Validators.required],
    Branch: [this.currentBranch?.BranchMasterSid || '', Validators.required],
    FromBookingDate: ['', Validators.required],
    ToBookingDate: ['', Validators.required],
    SalesPerson: ['', Validators.required],
    POD: ['']
  });
}

}
