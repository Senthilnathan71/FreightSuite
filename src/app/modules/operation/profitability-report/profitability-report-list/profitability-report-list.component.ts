import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { forkJoin } from 'rxjs';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
@Component({
  selector: 'app-profitability-report-list',
  standalone: true,
  imports: [FeatherModule, NgSelectModule, NgbDatepickerModule,MultiSelectComponent,CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './profitability-report-list.component.html',
  styleUrl: './profitability-report-list.component.scss'
})
export class ProfitabilityReportListComponent {

  ProfitabilityForm!:FormGroup;
  currentCompany: any;
  departmentList: any[];

  constructor(private router: Router,
    private appSettingService: AppSettingsService, private masterService: MasterService,private fb: FormBuilder,
  ) { }
  TonavigateCreate() {
    this.router.navigate(['operation/profitability-report/entry']);
  }

  ngOnInit() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.loadAllfields();
    this.initialForm()
  }

  initialForm(){
   this.ProfitabilityForm=this.fb.group({
    Dept:['',Validators.required],
    Branch:['',Validators.required],
    FromJobDate:['',Validators.required],
    ToJobDate:['',Validators.required]
   })
  }

  onSubmit(){
    this.initialForm()
  }

  loadAllfields() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin({
      departments: this.masterService.getAllDepartments(CompanyMasterSid),
    }).subscribe(({ departments }) => {
      this.departmentList = departments
      console.log(this.departmentList, "Dept")
    })
  }
}
