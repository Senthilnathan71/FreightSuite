import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { data, error } from 'jquery';
import { NgSelectModule } from '@ng-select/ng-select';
import { ContainerType } from 'src/app/modules/crm-mobile/Interfaces/container-type.interface';

@Component({
  selector: 'app-container-type-entry',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
  ],
  templateUrl: './container-type-entry.component.html',
  styleUrl: './container-type-entry.component.scss'
})
export class ContainerTypeEntryComponent {
  containertypeForm!: FormGroup;
  isEditMode = false;
  containertypes: ContainerType[] = [];
  errorMessage: string = '';
  btnDisable: boolean = false;
  ContainerTypeMasterSid: number;

   modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Inactive",name:"Inactive"},
  ]

  checkboxes = [
  { id: 'active', label: 'Active', value: 'active' },
  { id: 'inactive', label: 'Inactive', value: 'inactive' }
]



  status: any
  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router
  ){ }

  ngOnInit(): void {
    this.initForm();
    this.route.paramMap.subscribe(params =>{
      this.ContainerTypeMasterSid = +params.get('id');
      if(this.ContainerTypeMasterSid){
        this.isEditMode = true;
        this.loadContainerData(this.ContainerTypeMasterSid);
      }
    });
  }
  
  initForm() {
    this.containertypeForm = this.fb.group({
      containerName: ['',[Validators.required]],
      containerCode: ['',[Validators.required]],
      grossWeight: ['',[Validators.required]],
      tareWeight: ['',[Validators.required]],
      maxVolume: ['',[Validators.required]],
      shippingMode: ['',[Validators.required]],
      iataRateClass: ['',[Validators.required]],
      handlingRateClass: ['',[Validators.required]],
      freightRateClass: ['',[Validators.required]],
      
      status: ['', Validators.required]
    });
  }

  loadContainerData(id: number) {
    this.masterService.getContainerTypeById(id).subscribe(
      (data)=>{
        this.status = data.status;
        const displayStatus = this.status[data.status] || '';
        this.containertypeForm.patchValue({
          ...data,
          status: displayStatus
        });
      },
      (error)=> {
        this.appSettingService.showError('Failed to load container data.');
        console.error('Error loading container:', error);
      }
    );
  }

  onSubmit() {
    if (this.containertypeForm.invalid) {
     this.containertypeForm.markAllAsTouched();
     this.appSettingService.showWarning('Please fill all required fields.');
     return; 
    }

    const formValue = this.containertypeForm.value;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const payload = {
      ...formValue,
      status: formValue.status === 'Active' ? 'A' : 'C',
      ...(this.isEditMode ? {updatedBy: userEmail} : {createdBy:userEmail})
    };

    if (this.isEditMode) {
      this.masterService.updateContainerTypeById(this.ContainerTypeMasterSid,payload).subscribe(
        (resp: any)=>{
          if(resp.status){
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['master/container-type/list']);
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error)=> {
          this.errorMessage = error.message;
          console.error('Update error:',error);
        }
      ); 
    } else {
      this.masterService.createNewContainerType(payload).subscribe(
        (resp: any) => {
          if (resp.status){
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['master/container-type/list']);
          }
        },
        (error)=> {
          this.errorMessage = error.message;
          console.error('Creation error:', error);
        }
      );
    }
  }

  reset() {
    this.containertypeForm.reset();
  }

  goBack() {
    this.router.navigate(['master/container-type/list']);
  }
}
