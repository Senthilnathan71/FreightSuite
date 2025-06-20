import { Component, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { NgSelectModule } from '@ng-select/ng-select';
import { Division } from 'src/app/modules/crm-mobile/Interfaces/division.interface';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';

@Component({
  selector: 'app-department-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective,
    DatePipe
  ],
  templateUrl: './department-entry.component.html',
  styleUrl: './department-entry.component.scss'
})
export class DepartmentEntryComponent {
  departmentForm!: FormGroup;
  isEditMode = false; // Flag for edit mode
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  DepartmentMasterSid: number;
  divisionList : Division[];
  departmentData : any;

  countryList: any
  stateList: any
  statusList = ["Active", "Suspended"]
  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService : NgbModal
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.getAllDivisions();
    // Subscribe to route params and load lead if ID exists
    this.route.paramMap.subscribe(params => {
      this.DepartmentMasterSid = +params.get('id');
      if (this.DepartmentMasterSid) {
        this.isEditMode = true;
        this.loadDepartmentData(this.DepartmentMasterSid);
      }
    });
  }


  // Initialize the Form
  initForm() {
    this.departmentForm = this.fb.group({
      departmentName: ['', [Validators.required]],
      departmentCode: ['', [Validators.required]],
      departmentType: ['', [Validators.required]],
      ExportImport: ['', [Validators.required]],
      FCLLCL: ['', [Validators.required]],
      Division : [''],
      Remarks : [''],
      Status: ['Active']
    });
  }

  onSubmit() {
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched(); // Force validation messages to show
      this.departmentForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.departmentForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        ...updatedBy,
        Status: formValue.Status === "Active" ? "A" : "S"
      } : {
        ...formValue,
        ...createdBy,
        Status: formValue.Status === "Active" ? "A" : "S"
      };


      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateDepartmentById(this.DepartmentMasterSid, payload).subscribe(
          (resp: any) => {

            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/department/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading country:', error);
          }
        );
      } else {

        this.masterService.createDepartment(payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/department/list']);

            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading country:', error);
          }
        );
      }
    }
  }

  // Mapping for API status values
  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended',
    
  };

  getAllDivisions(){
    this.masterService.getAllDivisions().subscribe(
      (resp:any)=>{
        this.divisionList=resp;
      }
    )
  }

  // Fetch lead data and patch the form
  loadDepartmentData(deptId: number) {
    this.masterService.getDepartmentById(deptId).subscribe(
      (deptData: any) => {
        this.departmentData = deptData;
        this.departmentForm.patchValue({
          ...deptData,
          Status: deptData.Status === 'A' ? 'Active' : 'Suspended'
        },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading lead data.');
      }
    );
  }


  reset() {
    this.departmentForm.reset();
  }
  goBack() {
    history.back()
  }

  showInfo() {
    if(!this.departmentData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.departmentData;
    modalRef.componentInstance.idLabel = 'Department Id';
    modalRef.componentInstance.idValue = this.departmentData?.DepartmentMasterSid;
  }
}
