// container-activity.component.ts
import { Component, ViewChild, TemplateRef, Input, OnInit, Output, EventEmitter, SimpleChanges, OnChanges, ChangeDetectorRef } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../operation.service';
import { CommonModule } from '@angular/common';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';

@Component({
  selector: 'app-container-activity',
  standalone: true,
  imports: [
    NgSelectModule,
    NgbDatepickerModule,
    FeatherModule,
    CustomDatePipe,
    CommonModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    ElementStateGuardDirective,
    FormStateGuardDirective
  ],
  templateUrl: './container-activity.component.html',
  styleUrl: './container-activity.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class ContainerActivityComponent implements OnInit, OnChanges {

  page = 1;
  pageSize = 5;
  currentActivityIndex: number = -1;
  activityDataLength: number = 0;
  activityFormArray: FormArray;
  slicedActivityFormArr: any[] = [];
  activityForm!: FormGroup;

  containerList: any[] = [];
  filteredContainerList: any[] = [];
  activityMasterList: any[] = [];
  currentCompany: any;
  currentBranch: any;
  activityLocations: string[] = ['Yard', 'Depo', 'Shipper', 'Consignee', 'Dest Depo', 'Port'];
  fromOptions: string[] = [];
  toOptions: string[] = [];
  containerTypeList: any[] = [];

  @Input() screenName: string = '';
  private _dataItems: any[] = [];
  @Input() formData: any;
  @Input() JobMasterSid: number | null = null;
  @Input() isFormDisabled: boolean = false;
  
  // Input for master job containers (array)
  private _masterJobContainers: any[] = [];
  @Input()
  set masterJobContainers(value: any[]) {
    this._masterJobContainers = Array.isArray(value) ? value : [];
    this.loadContainerListFromInput();
  }
  get masterJobContainers(): any[] {
    return this._masterJobContainers;
  }

  @Input()
  set dataItems(value: any[]) {
    this._dataItems = Array.isArray(value) ? value : [];
    // If not disabled, patch form array immediately
    if (!this.disableAddBtn) {
      this.patchValues(this._dataItems);
    }
  }
  get dataItems(): any[] {
    return this._dataItems;
  }

  private prevReset: any;
  @Input()
  set resetTrigger(value: boolean) {
    if (value !== this.prevReset) {
      this.prevReset = value;
      // re-patch values (parent likely changed dataItems or containers)
      this.patchValues(this._dataItems);
      this.loadContainerListFromInput();
    }
  }

  disableAddBtn: boolean = false;
  @Input()
  set disableAdd(value: boolean) {
    this.disableAddBtn = !!value;
    if (this.disableAddBtn) {
      // clear UI when disabled
      this.activityFormArray?.clear();
      this.activityDataLength = 0;
      this.slicedActivityFormArr = [];
    } else {
      this.patchValues(this._dataItems);
    }
  }

  @Output() dataEmitter = new EventEmitter<any[]>();

  @ViewChild('activityModal') activityModal!: TemplateRef<any>;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
    private excelExportService: ExcelExportService,
    private datePipe: CustomDatePipe,
    private cdr: ChangeDetectorRef
  ) {
    this.activityFormArray = this.fb.array([]);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.activityFormArray = this.fb.array([]);
    this.loadContainerTypes();
    this.loadActivityMasterList();
    
    this.fromOptions = [...this.activityLocations];
    this.toOptions = [...this.activityLocations];
    
    // Initially patch if parent provided dataItems before init
    if (this._dataItems && this._dataItems.length > 0 && !this.disableAddBtn) {
      this.patchValues(this._dataItems);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Data items changed from parent
    if (changes['dataItems'] && !changes['dataItems'].isFirstChange()) {
      this.patchValues(this._dataItems);
    }

    // masterJobContainers changed - rebuild container dropdown
    if (changes['masterJobContainers'] && !changes['masterJobContainers'].isFirstChange()) {
      this.loadContainerListFromInput();
      // if activity modal open, ensure form control dropdown options updated
      this.cdr.detectChanges();
    }
  }

  loadContainerTypes() {
    this.operationService.getAllContainerTypes().subscribe(
      (resp: any) => {
        if (resp?.data) {
          this.containerTypeList = resp.data;
        }
      }
    );
  }

  loadActivityMasterList() {
    this.operationService.getAllContainerActivities().subscribe(
      (resp: any) => {
        if (resp.status) {
          this.activityMasterList = resp.data;
        }
      }
    );
  }

  // Transform master job containers --> dropdown
  loadContainerListFromInput() {
    if (this.masterJobContainers && this.masterJobContainers.length > 0) {
      this.containerList = this.masterJobContainers
        .filter(container => container && container.ContainerNumber)
        .map(container => ({
          ContainerNumber: container.ContainerNumber,
          ContainerType: container.ContainerType,
          displayText: `${container.ContainerNumber}${container.ContainerType ? ' - ' + container.ContainerType : ''}`
        }));
      this.filteredContainerList = [...this.containerList];
    } else {
      this.containerList = [];
      this.filteredContainerList = [];
    }
  }

  initActivityForm() {
    return this.fb.group({
      ContainerActivitySid: [null],
      ContainerNumber: [null, Validators.required],
      ContainerType: [null],
      ActivityCode: [null, Validators.required],
      ActivityName: [null],
      ActivityDate: [new Date(), Validators.required],
      ActivityFrom: [''],
      ActivityTo: [''],
      Remarks: ['']
    });
  }

  get c(): { [key: string]: AbstractControl<any, any> } {
    return this.activityForm?.controls || {}
  }

  patchValues(items: any[]) {
    // Always recreate the form array to avoid stale controls
    this.activityFormArray.clear();

    if (!Array.isArray(items) || items.length === 0) {
      this.activityDataLength = 0;
      this.slicedActivityFormArr = [];
      // still emit empty so parent knows
      this.syncDataWithParentComponent();
      return;
    }
    
    for (const item of items) {
      const formGroupWithData = this.createActivityGroup(item);
      this.activityFormArray.push(formGroupWithData);
    }
    
    this.activityDataLength = this.activityFormArray.length;
    this.activityFormArray.updateValueAndValidity();
    this.updateActivityPagination();
    this.syncDataWithParentComponent();
  }

  createActivityGroup(data?: any): FormGroup {
    return this.fb.group({
      ContainerActivitySid: [data?.ContainerActivitySid || null],
      ContainerNumber: [data?.ContainerNumber || null, Validators.required],
      ContainerType: [data?.ContainerType || null],
      ActivityCode: [data?.ActivityCode || null, Validators.required],
      ActivityName: [data?.ActivityName || null],
      ActivityDate: [data?.ActivityDate ? new Date(data.ActivityDate) : new Date(), Validators.required],
      ActivityFrom: [data?.ActivityFrom || ''],
      ActivityTo: [data?.ActivityTo || ''],
      Remarks: [data?.Remarks || '']
    });
  }

  openActivityModal(data?: any, activityIndex?: number) {
    if (this.isFormDisabled) {
      return;
    }

    this.activityForm = this.initActivityForm();
    
    if (data) {
      this.currentActivityIndex = activityIndex != null ? activityIndex : -1;
      this.activityForm.patchValue({
        ContainerActivitySid: data.ContainerActivitySid,
        ContainerNumber: data.ContainerNumber,
        ContainerType: data.ContainerType,
        ActivityCode: data.ActivityCode,
        ActivityName: data.ActivityName,
        ActivityDate: data.ActivityDate ? new Date(data.ActivityDate) : new Date(),
        ActivityFrom: data.ActivityFrom,
        ActivityTo: data.ActivityTo,
        Remarks: data.Remarks
      });
    } else {
      this.currentActivityIndex = -1;
    }

    this.modalService.open(this.activityModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  onContainerChange(containerNumber: string) {
    if (containerNumber) {
      const fullContainer = this.masterJobContainers.find(c => c.ContainerNumber === containerNumber);
      if (fullContainer) {
        const containerType = this.containerTypeList.find(type => type.ContainerName === fullContainer.ContainerType);
        if (containerType) {
          this.activityForm.patchValue({ ContainerType: containerType.ContainerTypeMasterSid });
        } else {
          this.activityForm.patchValue({ ContainerType: fullContainer.ContainerType });
        }
      }
    } else {
      this.activityForm.patchValue({ ContainerType: null });
    }
  }

  onFromChange(selectedFrom: string) {
    this.toOptions = this.activityLocations.filter(loc => loc !== selectedFrom);
  }

  onToChange(selectedTo: string) {
    this.fromOptions = this.activityLocations.filter(loc => loc !== selectedTo);
  }

  onActivityChange(activity: any) {
    if (activity) {
      this.activityForm.patchValue({ ActivityName: activity.ActivityName });
    } else {
      this.activityForm.patchValue({ ActivityName: null });
    }
  }

  onActivitySubmit() {
    if (this.isFormDisabled) {
      return;
    }

    const containerNumber = this.activityForm.get('ContainerNumber')?.value;
    const containerType = this.activityForm.get('ContainerType')?.value;

    // Auto fill ContainerType if not selected
    if (containerNumber && !containerType) {
      const fullContainer = this.masterJobContainers.find((c) => c.ContainerNumber === containerNumber);
      if (fullContainer) {
        const containerTypeObj = this.containerTypeList.find(type => type.ContainerName === fullContainer.ContainerType);
        if (containerTypeObj) {
          this.activityForm.patchValue({ ContainerType: containerTypeObj.ContainerTypeMasterSid });
        } else {
          this.activityForm.patchValue({ ContainerType: fullContainer.ContainerType });
        }
      }
    }

    if (this.activityForm.invalid) {
      this.activityForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all the required fields correctly.');
      return;
    }

    const activityFormValue = this.activityForm.getRawValue();

    if (this.currentActivityIndex !== -1 && this.activityFormArray.at(this.currentActivityIndex)) {
      const existingForm = this.activityFormArray.at(this.currentActivityIndex) as FormGroup;
      existingForm.patchValue(activityFormValue);
    } else {
      // push new record (create new FormGroup to avoid reference issues)
      const newGroup = this.createActivityGroup(activityFormValue);
      this.activityFormArray.push(newGroup);
    }

    this.activityDataLength = this.activityFormArray.length;
    this.activityFormArray.updateValueAndValidity();
    this.updateActivityPagination();
    this.syncDataWithParentComponent();
    this.modalService.dismissAll();
  }

  getContainerTypeName(typeId: any): string {
    if (!typeId) return '';
    if (typeof typeId === 'string') return typeId;
    const type = this.containerTypeList.find((ct) => ct.ContainerTypeMasterSid === typeId);
    return type ? type.ContainerName : typeId;
  }

  syncDataWithParentComponent() {
    const formValue: any[] = this.activityFormArray.getRawValue() || [];
    this.dataEmitter.emit(formValue);
  }

  deleteActivity(activityIndex: number, ContainerActivitySid?: number) {
    if (this.isFormDisabled) {
      return;
    }

    const realIndex = ((this.page - 1) * this.pageSize) + activityIndex;
    
    if (ContainerActivitySid) {
      // if you want to call API to delete, do here. For now just remove locally
      this.activityFormArray.removeAt(realIndex);
      this.appSettingService.showSuccess('Activity Deleted Successfully');
    } else {
      this.activityFormArray.removeAt(realIndex);
    }

    this.activityDataLength = this.activityFormArray.length;
    this.activityFormArray.updateValueAndValidity();
    this.adjustActivityPageAfterDelete();
    this.updateActivityPagination();
    this.syncDataWithParentComponent();
  }

  adjustActivityPageAfterDelete() {
    const totalPages = Math.ceil(this.activityDataLength / this.pageSize);
    if (this.page > totalPages && totalPages > 0) {
      this.page = totalPages;
    } else if (this.activityDataLength === 0) {
      this.page = 1;
    }
  }

  updateActivityPagination() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    const all = this.activityFormArray.getRawValue() || [];
    this.slicedActivityFormArr = all.slice(start, end);
  }

  reportActivities(): void {
    const allActivities = this.slicedActivityFormArr;
    const formattedData = allActivities.map(activity => ({
      ContainerNumber: activity.ContainerNumber || '',
      ContainerType: this.getContainerTypeName(activity.ContainerType) || '',
      ActivityName: activity.ActivityName || '',
      ActivityDate: this.datePipe.transform(activity.ActivityDate) || '',
      ActivityFrom: activity.ActivityFrom || '',
      ActivityTo: activity.ActivityTo || '',
      Remarks: activity.Remarks || ''
    }));

    const companyName = this.currentCompany?.companyName ?? 'Company';

    const headers = [
      { key: 'ContainerNumber', label: 'Container No' },
      { key: 'ContainerType', label: 'Container Type' },
      { key: 'ActivityName', label: 'Activity Name' },
      { key: 'ActivityDate', label: 'Date & Time' },
      { key: 'ActivityFrom', label: 'From' },
      { key: 'ActivityTo', label: 'To' },
      { key: 'Remarks', label: 'Remarks' }
    ];

    this.excelExportService.exportAsExcel({
      data: formattedData,
      headers: headers,
      fileName: 'Container-Activities-Report',
      title: companyName
    });
  }

  filterContainers(searchTerm: string) {
    if (!searchTerm) {
      this.filteredContainerList = [...this.containerList];
      return;
    }
    const term = searchTerm.toLowerCase();
    this.filteredContainerList = this.containerList.filter(container =>
      container.ContainerNumber?.toLowerCase().includes(term) ||
      (container.ContainerType && container.ContainerType.toString().toLowerCase().includes(term))
    );
  }
}
