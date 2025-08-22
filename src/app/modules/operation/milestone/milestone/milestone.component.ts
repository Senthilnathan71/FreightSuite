import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../operation.service';

@Component({
  selector: 'app-milestone',
  standalone: true,
  imports: [NgSelectModule ,NgbDatepickerModule, FeatherModule, CustomDatePipe, CommonModule,ReactiveFormsModule],
  templateUrl: './milestone.component.html',
  styleUrl: './milestone.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter},
  ],
})
export class MilestoneComponent implements OnInit {
  page1 = 1;
  pageSize1 = 5;
  currentMilestoneIndex: number;
  milestoneDataLength: number;
  milestoneFormArray: FormArray;
  slicedMilestoneFormArr: any[];
  currentBranch: any;
  currentCompany: any;
  filterOption: any;
  MilestoneMasterSid: any;
  selectedMode: string;
  milestoneForm !: FormGroup;
  allMilestones: any[] = []; 
  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];

  @Input() screenName: string;
   private _shipmentNo: string;
   @Input()
  get shipmentNo(): string {
    return this._shipmentNo;
  }
  set shipmentNo(value: string) {
    this._shipmentNo = value;
    if (value) {
      this.loadShipmentMilestones(this._shipmentNo);
    }
  }
 

  @Output() dataEmitter = new EventEmitter<any[]>()
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentCompany?.BranchMasterSid,
    }
    console.log("This is the screen", this.screenName)
    this.loadAllMilestones();
    this.milestoneFormArray = this.fb.array([])
  }

  loadAllMilestones() {
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };

    this.operationService.getAllMilestones(payload).subscribe({
      next: (milestones) => {
        console.log('Loaded all master milestones', milestones);
        this.allMilestones = milestones;
      },
      error: (err) => {
        console.error('Failed to load all milestones', err);
        this.appSettingService.showError('Could not load master milestone list.');
      },
    });
  }


  loadShipmentMilestones(shipmentNo: string) {
  const payload = {
    ShipmentNo: shipmentNo,
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid
  };

  this.operationService.getShipmentMilestones(payload).subscribe({
    next: (milestones) => {
      console.log("Fetched shipment milestones", milestones);
      this.patchValues(milestones || []);   // populate formArray
    },
    error: (err) => {
      console.error("Failed to fetch shipment milestones", err);
      this.appSettingService.showError("Could not load shipment milestones.");
    }
  });
}

  initMilestoneForm() {
    this.milestoneForm = this.fb.group({
      ShipmentMilestoneSid: [null],
      ShipmentNo: [{ value: '', disabled: true }],
      MilestoneMasterSid: [null],
      MilestoneName: [''],
      MilestoneDate: [''],
      AutoCaptured: [false],
      Remarks: [''],
      Status: ['Active']
    })
  }

  patchValues(items: any[]) {
    console.log(items);
    for (const item of items) {
      const formGroupWithData = this.createShipmentMilestone(item);
      this.milestoneFormArray.push(formGroupWithData);
    }
    this.milestoneDataLength = items.length;
    this.milestoneFormArray.updateValueAndValidity();
    this.updateMilestonePagination();
  }

  createShipmentMilestone(data?:any): FormGroup {
    console.log(data);
    const milestoneForm = this.fb.group({
      ShipmentMilestoneSid: [data?.ShipmentMilestoneSid || null],
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      ShipmentNo: [data?.ShipmentNo || this.shipmentNo],
      MilestoneMasterSid: [data?.MilestoneMasterSid || null],
      MilestoneName: [data?.MilestoneName || null],
      MilestoneDate: [data?.MilestoneDate ? new Date(data.MilestoneDate) : ''],
      AutoCaptured: [data?.AutoCaptured || null],
      Remarks: [data?.Remarks || null],
      Status: [data.Status ? (data.Status === "A" ? "Active" : "Suspended") : "Active"]
    })
    return milestoneForm;
  }

  openMilestoneModal(content: TemplateRef<any>, data?:any, milestoneIndex?: number) {
    this.initMilestoneForm();
    this.selectedMode = '';
    if(data) {
      this.currentMilestoneIndex = milestoneIndex;
      this.selectedMode = data.Mode;
      this.milestoneForm.patchValue({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        ShipmentMilestoneSid: data.ShipmentMilestoneSid,
        ShipmentNo: data.ShipmentNo,
        MilestoneMasterSid: data.MilestoneMasterSid,
        MilestoneDate: data?.MilestoneDate ? new Date(data.MilestoneDate) : null,
        AutoCaptured: data.AutoCaptured,
        Remarks: data.Remarks,
        Status: data.Status
      })
    } else {
      this.currentMilestoneIndex = -1;
    }

    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  onMilestoneSubmit() {
    if(this.milestoneForm.invalid){
      this.milestoneForm.markAllAsTouched();
      this.milestoneForm.updateValueAndValidity();
      this.appSettingService.showWarning("Please fill all the required fields correctly.")
      return;
    }
    const milestoneFormValue = this.milestoneForm.getRawValue();
    if(this.currentMilestoneIndex !== -1){
      const existingForm = this.milestoneFormArray.at(this.currentMilestoneIndex) as FormGroup;
      existingForm.patchValue({
        ...milestoneFormValue
      })
    } else {
      this.milestoneFormArray.push(this.milestoneForm);
    }
    this.milestoneDataLength = this.milestoneFormArray.length;
    this.milestoneFormArray.updateValueAndValidity();
    this.updateMilestonePagination();
    this.syncDataWithParentComponent();
    this.modalService.dismissAll();
  }

    onMilestoneChange(milestone: any) {
      console.log(milestone)
    if (!milestone) {
      // Reset fields if milestone is cleared
      this.milestoneForm.patchValue({
        MilestoneName: '',
        MilestoneDate: '',
        AutoCaptured: false,
        Remarks: ''
      });
      return;
    }

    // Patch milestone values when selected
    this.milestoneForm.patchValue({
      MilestoneName: milestone.MilestoneName,
      // leave date empty so user can choose
      AutoCaptured: milestone.AutoCapture === 'Y' ? true : false || false,

      Remarks: milestone.Remarks || ''
    });
  }



  syncDataWithParentComponent() {
    const formValue : any[] = this.milestoneFormArray.getRawValue() || [];
    this.dataEmitter.emit(formValue);
  }

  adjustMilestonePageAfterDelete() {
    const totalPages = Math.ceil(this.milestoneDataLength / this.pageSize1);
    if (this.page1 > totalPages && totalPages > 0) {
      this.page1 = totalPages;
    } else if (this.milestoneDataLength === 0) {
      this.page1 = 1;
    }
  }

  updateMilestonePagination() {
    const start = (this.page1 - 1) * this.pageSize1;
    const end = start + this.pageSize1;
    this.slicedMilestoneFormArr = this.milestoneFormArray.getRawValue().slice(start, end);
    console.log("error",this.slicedMilestoneFormArr);
  }
}
