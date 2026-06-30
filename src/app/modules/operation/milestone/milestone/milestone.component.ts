import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../operation.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-milestone',
  standalone: true,
  imports: [NgSelectModule ,NgbDatepickerModule, FeatherModule, CustomDatePipe, CommonModule,ReactiveFormsModule,NgbPagination,DatePipe],
  templateUrl: './milestone.component.html',
  styleUrl: './milestone.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter},
    CustomDatePipe
  ],
})
export class MilestoneComponent implements OnInit {
  page1 = 1;
  pageSize1 = 5;
  totalPages = 0;
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
  isEditMode: boolean;
  userData : any;
  allMilestones: any[] = []; 
  modeOfStatus = [
  { id: 'Active', name: 'Active' },
  { id: 'Suspended', name: 'Suspended' },
];


  @Input() screenName: string;
  @Input() hblNo: string;
  @Input() isFormDisabled: boolean = false;
   private _shipmentNo: string;
   @Input()
  get shipmentNo(): string {
    return this._shipmentNo;
  }
  set shipmentNo(value: string) {
    this._shipmentNo = value;
    this.scheduleShipmentMilestoneReload();
  }

  // Identifiers used to fetch this shipment's saved milestones. The backend fetch is
  // keyed by HouseJobSid / BookingHeaderSid / ShipmentNo (OR), so the parent passes
  // whichever it has: Booking screen -> bookingHeaderSid; House/Service -> houseJobSid.
  private _houseJobSid: any;
  @Input()
  get houseJobSid(): any {
    return this._houseJobSid;
  }
  set houseJobSid(value: any) {
    this._houseJobSid = value;
    this.scheduleShipmentMilestoneReload();
  }

  private _bookingHeaderSid: any;
  @Input()
  get bookingHeaderSid(): any {
    return this._bookingHeaderSid;
  }
  set bookingHeaderSid(value: any) {
    this._bookingHeaderSid = value;
    this.scheduleShipmentMilestoneReload();
  }

  // ShipmentNo and the two IDs typically bind together in one change-detection pass.
  // Coalesce them into a single fetch on the next microtask so the request reads the
  // final values regardless of binding order.
  private _milestoneReloadScheduled = false;
  private scheduleShipmentMilestoneReload(): void {
    if (this._milestoneReloadScheduled) {
      return;
    }
    this._milestoneReloadScheduled = true;
    Promise.resolve().then(() => {
      this._milestoneReloadScheduled = false;
      this.loadShipmentMilestones();
    });
  }

  // Current job's department. Passed by the parent screen so the milestone dropdown
  // is filtered (server-side) to milestones configured for this department. The
  // backend matches on either the name or the SID, so we forward both. Changing the
  // department after init reloads the dropdown. Screens that don't bind a department
  // get the full list (backward compatible).
  private _initialized = false;
  private _reloadScheduled = false;
  private _departmentName: string;
  @Input()
  get departmentName(): string {
    return this._departmentName;
  }
  set departmentName(value: string) {
    if (this._departmentName === value) {
      return;
    }
    this._departmentName = value;
    this.scheduleMilestoneReload();
  }

  private _departmentSid: any;
  @Input()
  get departmentSid(): any {
    return this._departmentSid;
  }
  set departmentSid(value: any) {
    if (this._departmentSid === value) {
      return;
    }
    this._departmentSid = value;
    this.scheduleMilestoneReload();
  }

  // departmentName and departmentSid often change together in one change-detection
  // pass. Coalesce them into a single reload on the next microtask so the request
  // always reads the final values regardless of input-binding order, and never
  // fires before ngOnInit's initial load.
  private scheduleMilestoneReload(): void {
    if (!this._initialized || this._reloadScheduled) {
      return;
    }
    this._reloadScheduled = true;
    Promise.resolve().then(() => {
      this._reloadScheduled = false;
      this.loadAllMilestones();
    });
  }

  private prevValue;
  @Input()
  set resetTrigger(value: boolean) {
    if (value !== this.prevValue) {
      this.prevValue = value;
      this.milestoneFormArray.clear();
      this.milestoneDataLength = 0;
      this.slicedMilestoneFormArr = [];
    }
  }
 

  @Output() dataEmitter = new EventEmitter<any[]>()
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
    private excelExportService : ExcelExportService,
    private datePipe : CustomDatePipe
  ) { }

  ngOnInit(): void {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentCompany?.BranchMasterSid,
    }
    this.loadAllMilestones();
    this._initialized = true;
    this.milestoneFormArray = this.fb.array([])
  }

  loadAllMilestones() {
     const currUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DepartmentName: this._departmentName,
      DepartmentMasterSid: this._departmentSid,
      ...(this.isEditMode ? { updatedBy: currUserEmail } : { createdBy: currUserEmail })
    };

    this.operationService.getAllMilestones(payload).subscribe({
      next: (milestones) => {
        this.allMilestones = milestones;
      },
      error: (err) => {
        console.error('Failed to load all milestones', err);
        this.appSettingService.showError('Could not load master milestone list.');
      },
    });
  }


  loadShipmentMilestones(shipmentNo?: string) {
  if (shipmentNo !== undefined) {
    this._shipmentNo = shipmentNo;
  }

  // Need at least one identifier to fetch by.
  const hasKey = !!this._shipmentNo || this._houseJobSid != null || this._bookingHeaderSid != null;
  if (!hasKey) {
    return;
  }

  const payload = {
    ShipmentNo: this._shipmentNo,
    HouseJobSid: this._houseJobSid ?? null,
    BookingHeaderSid: this._bookingHeaderSid ?? null,
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid
  };

  this.operationService.getShipmentMilestones(payload).subscribe({
    next: (milestones) => {
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
      Status: [{ value: 'Active', disabled: true }],
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      CreatedBy: this.userData['userEmail'],
      UpdatedBy: this.userData['userEmail']
      
    })
  }

  patchValues(items: any[]) {
    this.milestoneFormArray.clear();
    for (const item of items) {
      const formGroupWithData = this.createShipmentMilestone(item);
      this.milestoneFormArray.push(formGroupWithData);
    }
    this.milestoneDataLength = items.length;
    this.milestoneFormArray.updateValueAndValidity();
    this.updateMilestonePagination();
    this.syncDataWithParentComponent();
  }

  createShipmentMilestone(data?:any): FormGroup {
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
      Status: [data.Status ? (data.Status === "A" ? "Active" : "Suspended") : "Active"],
      CreatedBy: this.userData['userEmail'],
      UpdatedBy: this.userData['userEmail']
    })
    return milestoneForm;
  }

  openMilestoneModal(content: TemplateRef<any>, data?:any, milestoneIndex?: number) {
    if (this.isFormDisabled) {
      return;
    }
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
        MilestoneName : data.MilestoneName,
        MilestoneDate: data?.MilestoneDate ? new Date(data.MilestoneDate) : null,
        AutoCaptured: data.AutoCaptured,
        Remarks: data.Remarks,
        Status: data.Status,
        CreatedBy: this.userData['userEmail'],  
        UpdatedBy: this.userData['userEmail']
      });
      this.milestoneForm.get('Status')?.enable();
    } else {
      this.currentMilestoneIndex = -1;
      this.milestoneForm.patchValue({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      ShipmentMilestoneSid: null,
      ShipmentNo: '',
      MilestoneMasterSid: null,
      MilestoneDate: null,
      AutoCaptured: false,
      Remarks: '',
      Status: 'Active'
    });

    // Disable status in add mode
    this.milestoneForm.get('Status')?.disable();
    }

    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  onMilestoneSubmit() {
    if (this.isFormDisabled) {
      return;
    }
    if(this.milestoneForm.invalid){
      this.milestoneForm.markAllAsTouched();
      this.milestoneForm.updateValueAndValidity();
      this.appSettingService.showWarning("Please fill all the required fields correctly.")
      return;
    }
    const milestoneFormValue = this.milestoneForm.getRawValue();

    // Prevent the same milestone being added twice. Match by milestone code (the
    // business identity) when available, else by MilestoneMasterSid. The row being
    // edited is excluded from the check.
    if (this.isDuplicateMilestone(milestoneFormValue.MilestoneMasterSid, this.currentMilestoneIndex)) {
      this.appSettingService.showWarning('This milestone is already added.');
      return;
    }

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

  /** Resolve a milestone master's code (lowercased) from the loaded dropdown list. */
  private getMilestoneCode(milestoneMasterSid: any): string {
    if (milestoneMasterSid === null || milestoneMasterSid === undefined) {
      return '';
    }
    const master = this.allMilestones?.find((m) => m.MilestoneMasterSid === milestoneMasterSid);
    return master?.MilestoneCode ? String(master.MilestoneCode).trim().toLowerCase() : '';
  }

  /** True when the selected milestone is already present in the list (by code, else by master Sid). */
  private isDuplicateMilestone(milestoneMasterSid: any, excludeIndex: number): boolean {
    if (milestoneMasterSid === null || milestoneMasterSid === undefined) {
      return false;
    }
    const newCode = this.getMilestoneCode(milestoneMasterSid);
    const rows = this.milestoneFormArray.getRawValue();
    return rows.some((row, index) => {
      if (excludeIndex !== -1 && index === excludeIndex) {
        return false;
      }
      const rowCode = this.getMilestoneCode(row.MilestoneMasterSid);
      if (newCode && rowCode) {
        return newCode === rowCode;
      }
      return row.MilestoneMasterSid != null && row.MilestoneMasterSid === milestoneMasterSid;
    });
  }

    onMilestoneChange(milestone: any) {
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

    // Patch milestone values when selected. A milestone entered manually here is NOT a
    // system auto-capture, so AutoCaptured is always unticked ('N'/false) regardless of
    // the master's AutoCapture setting.
    this.milestoneForm.patchValue({
      MilestoneName: milestone.MilestoneName,
      // leave date empty so user can choose
      AutoCaptured: false,
      Remarks: milestone.Remarks || ''
    });
  }



  syncDataWithParentComponent() {
    const formValue : any[] = (this.milestoneFormArray.getRawValue() || []).map(
      m => ({...m, AutoCaptured : m.AutoCaptured ? 'Y' : 'N'})
    );
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
  }

  reportMilestones(): void {
    const allMilestones = this.slicedMilestoneFormArr;
    
    const formattedData = allMilestones.map((milestone, index) => ({
        SerialNo: index + 1,
        MilestoneName: milestone.MilestoneName || '',
        MilestoneDate: this.datePipe.transform(milestone.MilestoneDate) || '',
        AutoCaptured: (milestone.AutoCaptured === true || milestone.AutoCaptured === 'Y') ? 'Yes' : 'No',
        Remarks: milestone.Remarks || ''
    }));

    const companyName = this.currentCompany?.companyName ?? 'Company';
    
    this.excelExportService.exportAsExcel({
        data: formattedData,
        headers: [
            { key: 'SerialNo', label: 'S.No' },
            { key: 'MilestoneName', label: 'Milestone' },
            { key: 'MilestoneDate', label: 'Date & Time' },
            { key: 'AutoCaptured', label: 'Auto Captured' },
            { key: 'Remarks', label: 'Remarks' }
        ],
        fileName: 'Booking-Milestone-Report',
        title: companyName
    });
}

isHBLNoValid(): boolean {
    // Only apply this validation for Booking screen
    if (this.screenName !== 'Booking') {
      return true;
    }
    
    // Return true (enable button) when HBLNo is null/undefined/empty string
    // Return false (disable button) when HBLNo has any value
    return !this.hblNo || this.hblNo.trim() === '';
  }
  
}
