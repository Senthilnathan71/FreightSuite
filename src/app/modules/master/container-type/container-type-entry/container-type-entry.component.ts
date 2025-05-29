import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { ActivatedRoute, Router } from '@angular/router';
import { ContainerType } from 'src/app/modules/crm-mobile/Interfaces/container-type.interface';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';

@Component({
  selector: 'app-container-type-entry',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OnlyTextDirective,
    TextWithNumbersDirective
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
  companyList: any
  statusList = ["Active", "In Active"]


  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getAllCompanies()
    this.loadContainerTypes();
    this.initForm();

    this.route.paramMap.subscribe(params => {
      this.ContainerTypeMasterSid = +params.get('id');
      if(this.ContainerTypeMasterSid) {
        this.isEditMode = true;
        this.loadContainerData(this.ContainerTypeMasterSid);
      }
    });
  }

  loadContainerTypes(): void {
    this.masterService.getAllContainerTypes().subscribe(
      (resp: ContainerType[]) => {
        console.log(resp, 'Container-Type');
        this.containertypes = resp['data'];
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading container types:', error);
      }
    );
  }

  initForm() {
    this.containertypeForm = this.fb.group({
      CompanyMasterSid:['',[Validators.required]],
      ContainerCode: ['',[Validators.required]],
      ContainerSize: ['',[Validators.required]],
      ContainerIsoCode: ['',[Validators.required]],
      ContainerName: ['',[Validators.required]],
      ContainerCategory: ['',[Validators.required]],
      Length: ['',[Validators.required]],
      Width: ['',[Validators.required]],
      Height: ['',[Validators.required]],
      MaxVolume: ['',[Validators.required]],
      TareWeight: ['',[Validators.required]],
      GrossWeight: ['',[Validators.required]],
      NoOfTeu: ['',[Validators.required]],
      Remarks: ['',[Validators.required]],
      status:['Active']
    });
  }

  onSubmit() {
    if (this.containertypeForm.invalid) {
      this.containertypeForm.markAllAsTouched();
      this.containertypeForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail']};
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail']};
      const formValue = this.containertypeForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        CompanyMasterSid: Number(formValue.CompanyMasterSid),
        ...updatedBy,
        status: formValue.status === "Active" ? "A" : "C"
      } : {
        ...formValue,
        CompanyMasterSid: Number(formValue.CompanyMasterSid),
        ...createdBy,
        status: formValue.status === "Active" ? "A" : "C"
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.editContainerTypeById(this.ContainerTypeMasterSid, payload).subscribe(
          (resp: any) => {
            console.log(resp.message);
            if(resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/container-type/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      } else {
        this.masterService.addNewContainerType(payload).subscribe(
          (resp: any) => {
            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/container-type/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      }
    }
  }

  // Mapping for API status to display
  statusMap: { [key: string]: string } = {
    A: 'Active',
    IA: 'Inactive'
  };

  loadContainerData(id: number) {
    this.masterService.getContainerTypeById(id).subscribe(
      (data) => {
        this.containertypeForm.patchValue({
          ...data,
          CompanyMasterSid: data.CompanyMasterSid,
          status: data.status === 'A' ? 'Active' : 'Invalid'
        },
      );
      },
      (error) => {
        this.appSettingService.showError('Error loading container data.');
      }
    );
  }

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe((res) => {
      this.companyList = res;
    })
  }

  reset() {
    this.containertypeForm.reset();
  }

  goBack() {
    this.router.navigate(['master/container-type/list']);
  }

}
