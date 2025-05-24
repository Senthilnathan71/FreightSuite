import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { ActivatedRoute, Router } from '@angular/router';
import { ContainerType } from 'src/app/modules/crm-mobile/Interfaces/container-type.interface';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

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
export class ContainerTypeEntryComponent implements OnInit {

  containertypeForm!: FormGroup;
  isEditMode = false;
  containertypes: ContainerType[] = [];
  errorMessage: string = '';
  btnDisable: boolean = false;
  ContainerTypeMasterSid: number;

  modeOfStatus = [
    { id: 'A', name: 'Active' },
    { id: 'C', name: 'Inactive' }
  ];


  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadContainerTypes();
    this.initForm();

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.ContainerTypeMasterSid = +idParam;
        this.isEditMode = true;
        this.loadContainerData(this.ContainerTypeMasterSid);
      }
    });
  }

  loadContainerTypes(): void {
    this.masterService.getAllContainerType().subscribe(
      (resp: any) => {
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
      ContainerName: ['', [Validators.required]],
      ContainerCode: ['', [Validators.required]],
      GrossWeight: ['', [Validators.required]],
      TareWeight: ['', [Validators.required]],
      MaxVolume: ['', [Validators.required]],
      ContainerCategory: ['', [Validators.required]],
      // shippingMode: ['', [Validators.required]],
      // iataRateClass: ['', [Validators.required]],
      // handlingRateClass: ['', [Validators.required]],
      // freightRateClass: ['', [Validators.required]],
      // testing: ['', [Validators.required]],
      Length: ['', [Validators.required]],
      Width: ['', [Validators.required]],
      Height: ['', [Validators.required]],
      // portType: ['', [Validators.required]],
      // storageClass: ['', [Validators.required]],
      // cargoClass: ['', [Validators.required]],
      // usContainerCode: ['', [Validators.required]],
      // usContainerType: ['', [Validators.required]],
      ContainerIsoCode: ['', [Validators.required]],
      NoOfTEU: ['', [Validators.required]],
      status: ['']
    });
  }

  onSubmit() {
    if (this.containertypeForm.invalid) {
      this.containertypeForm.markAllAsTouched();
      this.containertypeForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    const formValue = this.containertypeForm.value;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];

    const payload = this.isEditMode
      ? {
        ...formValue,
        updatedBy: userEmail,
        status: formValue.status
      }
      : {
        ...formValue,
        createdBy: userEmail,
        status: formValue.status
      };

    if (this.isEditMode) {
      this.masterService.updateContainerTypeById(this.ContainerTypeMasterSid, payload).subscribe(
        (resp: any) => {
          if (resp.status !== false) {
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['master/container-type/list']);
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error updating container type:', error);
        }
      );
    } else {
      this.masterService.createNewContainerType(payload).subscribe(
        (resp: any) => {
          if (resp.status !== false) {
            this.appSettingService.showSuccess('Container Type created successfully');
            this.router.navigate(['master/container-type/list']);
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error creating container type:', error);
        }
      );
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
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading container data.');
        console.error('Error:', error);
      }
    );
  }

  reset() {
    this.containertypeForm.reset();
  }

  goBack() {
    this.router.navigate(['master/container-type/list']);
  }

}
