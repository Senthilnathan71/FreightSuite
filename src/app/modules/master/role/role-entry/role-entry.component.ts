import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-role-entry',
  standalone: true,
  imports: [FeatherModule,OnlyTextDirective,OnlyNumbersDirective,TextWithNumbersDirective,NgSelectModule,ReactiveFormsModule],
  templateUrl: './role-entry.component.html',
  styleUrl: './role-entry.component.scss'
})
export class RoleEntryComponent implements OnInit {

    RoleMasterSid : number;
    isEditMode:boolean;
    roleForm : FormGroup;
    companyList : any[];

    modeOfStatus =[
        { value:'Active',name:'Active'},
        { value:'Suspended',name:'Suspended'},
    ]

    // Pagination Variables
    page = 1;
    pageSize= 10;
    totalAmountofCollection :number;

    constructor(
        private masterService:MasterService,
        private fb:FormBuilder,
        private route:Router,
        private currRoute:ActivatedRoute,
        private appSettingService:AppSettingsService,
    ){}

    ngOnInit(){
        this.initRoleForm();
        this.loadAllCompanies();
        this.currRoute.paramMap.subscribe(
            (param)=>{
                this.RoleMasterSid = +param.get('id');
                if(this.RoleMasterSid){
                    this.isEditMode= true;
                    this.loadRole(this.RoleMasterSid);
                }
            }
        )
    }

    initRoleForm(){
        this.roleForm = this.fb.group({
            UserRoleName:['',[Validators.required]],
            UserRoleCode : ['',[Validators.required]],
            CompanyMasterSid : ['',[Validators.required]],
            status : ['Active',[Validators.required]],
            Remarks : ['',[Validators.required]]
        })
    }

    onSubmit(){
        if(this.roleForm.invalid){
            this.roleForm.markAllAsTouched();
            this.roleForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields')
            return;
        } else {
            const formValue = this.roleForm.value;
            const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
            const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
            const payload = {
                ...formValue,
                status : formValue.status ==='Active' ? 'A':'S',
                ...(this.isEditMode ? {updatedBy:updatedBy}: {createdBy:createdBy})
            }

            if(this.isEditMode){
                this.masterService.updateRoleById(this.RoleMasterSid,payload).subscribe(
                    (resp:any)=>{
                        if(resp.status){
                            this.appSettingService.showSuccess('Role Updated Successfully');
                            this.route.navigate(['master/role/list']);
                        } else {
                            this.appSettingService.showWarning('Problem Updating Role');
                        }
                    },
                    (error)=>{
                        console.error('Error Updating Role',error);
                    }
                )
            } else {
                this.masterService.createNewRole(payload).subscribe(
                    (resp:any)=>{
                        if(resp.status){
                            this.appSettingService.showSuccess('New Role Created');
                            this.route.navigate(['master/role/list']);
                        } else {
                            this.appSettingService.showWarning('Problem Creating Role');
                        }
                    },
                    (error)=>{
                        console.error('Error Creating Role',error);
                    }
                )
            }

        }
    }

    loadRole(RoleMasterSid){
        this.masterService.getRoleById(RoleMasterSid).subscribe(
            (resp:any)=>{
                if(resp.status){
                    this.roleForm.patchValue({
                        ...resp.data,
                        status : resp.data.status === 'A' ? 'Active' : 'Suspended',
                    })
                }
            },
            (error)=>{
                this.appSettingService.showError('Error Loading Role');
                console.error('Error Loading Role',error);
            }
        )
    }

    loadAllCompanies(){
      this.masterService.getAllCompanies().subscribe(
        (resp)=>{
          this.companyList = resp;
        },
        (error)=>{
          console.error('Error loading Company',error);
        }
      )
    }

    goBack(){
        history.back();
    }

    resetForm(){
        this.roleForm.reset();
    }

}
