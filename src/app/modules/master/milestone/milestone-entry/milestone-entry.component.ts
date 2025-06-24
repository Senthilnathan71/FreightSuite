import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-milestone-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule,
    DatePipe
  ],
  templateUrl: './milestone-entry.component.html',
  styleUrls: ['./milestone-entry.component.scss']
})
export class MilestoneEntryComponent implements OnInit {
  milestoneForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  milestoneId: number;
  departmentList: any[] = [];
  userData: any;
  milestoneData : any
  
  shipmentTypeOptions = [
    { value: 'Export', label: 'Export' },
    { value: 'Import', label: 'Import' },
    { value: 'Transshipment', label: 'Transshipment' }
  ];

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'I', name: 'Suspended' }
  ];

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private modalService : NgbModal
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.getAllDepartments();
    this.appSettingService.getUser().subscribe(user => {
      this.userData = user;
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.milestoneId = +params['id'];
        this.isEditMode = true;
        this.getMilestoneById(this.milestoneId);
        this.milestoneForm.get('status')?.enable();
      }
    });
  }

  initForm() {
    this.milestoneForm = this.fb.group({
      MilestoneName: ['', [Validators.required, Validators.maxLength(30)]],
      MilestoneCode: ['', [Validators.required, Validators.maxLength(30)]],
      DepartmentMasterSid: ['', Validators.required],
      ShipmentType: ['', Validators.required],
      SortBy: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      AutoCapture: ['N'],
      AutomailRequire: ['N'],
      status: [{value: 'A', disabled: true}, Validators.required],
      Remarks: ['', Validators.maxLength(500)],
      CompanyMasterSid: [null],
    BranchMasterSid: [null]
    });
  }

  getAllDepartments() {
    this.masterService.getAllDepartments().subscribe(
      (resp: any) => {
        this.departmentList = resp;
      }
    );
  }


  getMilestoneById(id: number) {
    this.milestoneForm.reset();
    this.masterService.getMilestoneById(id).subscribe({
      next: (milestone: any) => {
        this.milestoneData = milestone;
        this.milestoneForm.patchValue({
          MilestoneName: milestone.MilestoneName,
          MilestoneCode: milestone.MilestoneCode,
          DepartmentMasterSid: milestone.DepartmentMasterSid,
          ShipmentType: milestone.ShipmentType,
          SortBy: milestone.SortBy,
          AutoCapture: milestone.AutoCapture || 'N',
          AutomailRequire: milestone.AutomailRequire || 'N',
          status: milestone.status || 'A',
          Remarks: milestone.Remarks || ''
        });
        this.milestoneForm.get('status')?.enable();
      },
      error: (err) => {
        console.error('Error loading milestone:', err);
        this.appSettingService.showError('Failed to load milestone data');
      }
    });
  }

  onSubmit() {
    if (this.milestoneForm.invalid) {
      this.markFormGroupTouched(this.milestoneForm);
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }
  
    this.btnDisable = true;
    
    const formValue = this.milestoneForm.value;
    const createdBy = { createdBy: this.userData?.userEmail || 'system' };
    const updatedBy = { updatedBy: this.userData?.userEmail || 'system' };
    
    const payload = {
      ...formValue,
      DepartmentMasterSid: Number(formValue.DepartmentMasterSid),
      status: this.isEditMode ? formValue.status : 'A',
      ...(this.isEditMode ? updatedBy : createdBy)
    };
  
    const operation = this.isEditMode 
      ? this.masterService.updateMilestoneById(this.milestoneId, payload)
      : this.masterService.createMilestone(payload);
  
    operation.subscribe({
      next: (resp: any) => {
        this.btnDisable = false;
        const message = resp.message || 
          (this.isEditMode ? 'Milestone updated successfully!' : 'Milestone created successfully!');
        
        if (resp.status) {
          this.appSettingService.showSuccess(message);
          this.router.navigate(['/master/milestone/list']);
        } else {
          this.appSettingService.showError(resp.message || 'Operation failed');
        }
      },
      error: (err) => {
  console.error('Error:', err);
  this.btnDisable = false;
  const errorMessage = err.error?.message || 
    err.message || 
    `Error ${this.isEditMode ? 'updating' : 'creating'} milestone`;
  this.appSettingService.showError(errorMessage);
}
    });
  }

  resetForm() {
    if (this.isEditMode) {
      this.getMilestoneById(this.milestoneId);
    } else {
      this.milestoneForm.reset({
        MilestoneName: '',
        MilestoneCode: '',
        DepartmentMasterSid: '',
        ShipmentType: '',
        SortBy: '',
        AutoCapture: 'N',
        AutomailRequire: 'N',
        status: 'A',
        Remarks: ''
      });
      this.milestoneForm.get('status')?.disable();
    }
  }

  goBack() {
    this.router.navigate(['master/milestone/list']);
  }
  onAutoCaptureChange(event: any) {
  const isChecked = event.target.checked;
  this.milestoneForm.get('AutoCapture')?.setValue(isChecked ? 'Y' : 'N');
}

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  showInfo() {
    if (!this.milestoneData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.milestoneData;
    modalRef.componentInstance.idLabel = 'Milestone Id';
    modalRef.componentInstance.idValue = this.milestoneData?.MilestoneMasterSid;
  }
}