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
  selector: 'app-module-entry',
  standalone: true,
  imports: [FeatherModule,OnlyTextDirective,OnlyNumbersDirective,TextWithNumbersDirective,NgSelectModule,ReactiveFormsModule],
  templateUrl: './module-entry.component.html',
  styleUrl: './module-entry.component.scss'
})
export class ModuleEntryComponent implements OnInit {

    ModuleMasterSid : number;
    isEditMode:boolean;
    moduleForm : FormGroup;

    modeOfStatus =[
        { value:'Active',name:'Active'},
        { value:'Invalid',name:'Invalid'},
        { value:'Block',name:'Block'},
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
        this.initModuleForm();
        this.currRoute.paramMap.subscribe(
            (param)=>{
                this.ModuleMasterSid = +param.get('id');
                if(this.ModuleMasterSid){
                    this.isEditMode= true;
                    this.loadModule(this.ModuleMasterSid);
                }
            }
        )
    }

    initModuleForm(){
        this.moduleForm = this.fb.group({
            ModuleName:['',[Validators.required]],
            ModuleCode : ['',[Validators.required]],
            status : ['Active',[Validators.required]],
            Remarks : ['',[Validators.required]]
        })
    }

    onSubmit(){
        if(this.moduleForm.invalid){
            this.moduleForm.markAllAsTouched();
            this.moduleForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields')
            return;
        } else {
            const formValue = this.moduleForm.value;
            const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
            const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
            const payload = {
                ...formValue,
                status : formValue.status ==='Active' ? 'A':'I',
                ...(this.isEditMode ? {updatedBy:updatedBy}: {createdBy:createdBy})
            }

            if(this.isEditMode){
                this.masterService.updateModuleById(this.ModuleMasterSid,payload).subscribe(
                    (resp:any)=>{
                        if(resp.status){
                            this.appSettingService.showSuccess('Module Updated Successfully');
                            this.route.navigate(['master/module/list']);
                        } else {
                            this.appSettingService.showWarning('Problem Updating Module');
                        }
                    },
                    (error)=>{
                        console.error('Error Updating Module',error);
                    }
                )
            } else {
                this.masterService.createNewModule(payload).subscribe(
                    (resp:any)=>{
                        if(resp.status){
                            this.appSettingService.showSuccess('New Module Created');
                            this.route.navigate(['master/module/list']);
                        } else {
                            this.appSettingService.showWarning('Problem Creating Module');
                        }
                    },
                    (error)=>{
                        console.error('Error Creating Module',error);
                    }
                )
            }

        }
    }

    loadModule(ModuleMasterSid){
        this.masterService.getModuleById(ModuleMasterSid).subscribe(
            (resp:any)=>{
                if(resp.status){
                    this.moduleForm.patchValue({
                        ...resp.data,
                        status : resp.data.status === 'A' ? 'Active' : 'Invalid',
                    })
                }
            },
            (error)=>{
                this.appSettingService.showError('Error Loading Module');
                console.error('Error Loading Module',error);
            }
        )
    }

    goBack(){
        history.back();
    }

    resetForm(){
        this.moduleForm.reset();
    }

}
