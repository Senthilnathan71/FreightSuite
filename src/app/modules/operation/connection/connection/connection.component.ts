import { Component, ViewChild, TemplateRef, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
import { Search } from 'angular-feather/icons';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';

@Component({
  selector: 'app-connection',
  standalone: true,
  imports: [
    NgSelectModule,
    NgbDatepickerModule,
    FeatherModule,
    CustomDatePipe,
    CommonModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    SearchableDropdown
  ],
  templateUrl: './connection.component.html',
  styleUrl: './connection.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class ConnectionComponent implements OnInit {

  page1 = 1;
  pageSize1 = 5;
  currentConnectIndex: number;
  connectionDataLength: number;
  connectionFormArray: FormArray;
  slicedConnectionFormArr: any[];

  selectedMode: string;
  filteredPorts: any[] = [];
  filteredPOL: any[] = [];
  filteredPOD: any[] = [];
  _vesselList: any[] = []; // to store data from parent
  filteredVesselList : any[] = []; // to store data which is shown on select
  voyageList: any[] = [];
  minDatesForConnections: Date[] = [];
  connectionForm !: FormGroup;
  currentCompany : any;
  currentBranch : any;
  portLookupConfig = DROPDOWN_CONFIGS.PORT;
  vesselVoyageConfig = DROPDOWN_CONFIGS.VESSEL_VOYAGE;

  typeofmodes = [
    { id: 1, name: 'Sea' },
    { id: 2, name: 'Air' },
    { id: 3, name: 'Road' },
  ];

  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];

  @Input() screenName: string;
  private _dataItems: any[] = [];
  public _portList: any[] = [];
  @Input()
  set dataItems(value: any[]) {
    console.log(value);
    if (value && value.length > 0) {
      this._dataItems = value;
      if(!this.disableAddBtn){
        this.connectionFormArray?.clear();
        this.connectionDataLength = 0;
        this.slicedConnectionFormArr = [];
        this.patchValues(this._dataItems);
      }
    } else {
      this._dataItems = [];
      this.connectionFormArray?.clear();
      this.connectionDataLength = 0;
      this.slicedConnectionFormArr = [];
    }
  }
  get dataItems(): any[] {
    return this._dataItems;
  }

  @Input()
  set portList(value: any[]) {
    if (value && value.length > 0) {
      this._portList = value;
    } else {
      this._portList = [];
    }
  }
  get portList(): any[] {
    return this._portList
  }

  @Input()
  set vesselList(value: any[]) {
    if (value && value.length > 0) {
      this._vesselList = value;
    } else {
      this._vesselList = [];
    }
  }
  get vesselList(): any[] {
    return this._vesselList
  }

  private prevValue;
  @Input()
  set resetTrigger(value: boolean) {
    if (value !== this.prevValue) {
      this.prevValue = value;
      this.connectionFormArray?.clear();
      this.connectionDataLength = 0;
      this.slicedConnectionFormArr = [];
    }
  }

  disableAddBtn : boolean;
  @Input()
  set disableAdd(value:boolean){
    this.disableAddBtn = value;
    if(value){
      this.connectionFormArray?.clear();
      this.connectionDataLength = 0;
      this.slicedConnectionFormArr = [];
    } else {
      this.patchValues(this._dataItems);
    }
  }

  minStartDate : any = new Date();
  @Input()
  set minDate(value:Date){
    this.minStartDate = value;
    console.log(this.minStartDate);
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
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.connectionFormArray = this.fb.array([]);
    if (this.dataItems.length !== 0) {
      this.patchValues(this.dataItems);
    }
  }

  initConnectionForm() {
    this.connectionForm = this.fb.group({
      // BookingConnectionSid: [null],
      TransactionSid: [null],
      Mode: [null],
      VesselName: [null],
      VoyageNo: [null],
      POL: [null],
      POD: [null],
      ETD: [{ value: null, disabled: true }],
      ETA: [{ value: null, disabled: true }],
      ATD: [null],
      ATA: [null],
      status: ['Active']
    })
  }

  get c(): { [key: string]: AbstractControl<any, any> } {
    return this.connectionForm.controls || {}
  }

  patchValues(items: any[]) {
    for (const item of items) {
      const formGroupWithData = this.createBookingConnectionGroup(item);
      this.connectionFormArray.push(formGroupWithData);
    }
    this.connectionDataLength = items.length;
    this.connectionFormArray.updateValueAndValidity();
    this.updateConnectionPagination();
    this.validateMinStartDate();
  }

  createBookingConnectionGroup(data?: any): FormGroup {
    console.log(data);
    const connectionForm = this.fb.group({
      // BookingConnectionSid: [data?.BookingConnectionSid || null],
     TransactionSid: [data?.TransactionSid || null],
      Mode : [data?.Mode || null],
      VesselName: [data?.VesselName || null],
      VoyageNo: [data?.VoyageNo || null],
      POL: [data?.POL || null],
      POD: [data?.POD || null],
      ETD: [data?.ETD ? new Date(data.ETD) : null],
      ETA: [data?.ETA ? new Date(data.ETA) : null],
      ATD: [data?.ATD ? new Date(data.ATD) : null],
      ATA: [data?.ATA ? new Date(data.ATA) : null],
      status: [data.status ? (data.status === "A" ? "Active" : "Suspended") : "Active"]
    })
    return connectionForm;
  }

  openConnectionModal(content: TemplateRef<any>, data?: any, connectionIndex?: number) {
    this.initConnectionForm();
    this.selectedMode = '';
    this.filteredPorts = [];
    this.filteredPOL = [];
    this.filteredPOD = [];
    this.filteredVesselList = [];
    this.voyageList = [];
    if (data) {
      this.currentConnectIndex = connectionIndex;
      this.selectedMode = data.Mode;
      this.connectionForm.patchValue({
        // BookingConnectionSid: data.BookingConnectionSid,
        TransactionSid: data?.TransactionSid ?? null,
        Mode : data.Mode,
        VesselName: data.VesselName,
        VoyageNo: data.VoyageNo,
        POL: data?.POL,
        POD: data?.POD,
        ETD: data?.ETD ? new Date(data.ETD) : null,
        ETA: data?.ETA ? new Date(data.ETA) : null,
        ATD: data?.ATD ? new Date(data.ATD) : null,
        ATA: data?.ATA ? new Date(data.ATA) : null,
        status: data.status
      })
      this.onRouteChange();
      this.getVesselBasedOnPorts();
    } else {
      this.currentConnectIndex = -1;
    }
    this.setMinDateForCurrentConnection();
    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  setMinDateForCurrentConnection() {
    if (this.currentConnectIndex === 0 || this.currentConnectIndex === -1) {
      this.minStartDate = new Date(this.minStartDate);
    } else {
      const connections = this.connectionFormArray.getRawValue();
      const previousConnection = connections[this.currentConnectIndex - 1];
      this.minStartDate = previousConnection?.ETA ? new Date(previousConnection.ETA) : this.minStartDate;
    }

    setTimeout(() => {
      this.validateDisabledFields();
    }, 100);
  }

  onConnectionSubmit() {
    this.validateDisabledFields();
    const hasETDError = this.c['ETD'].errors !== null;

    if(this.connectionForm.invalid || hasETDError){
      this.connectionForm.markAllAsTouched();
      this.connectionForm.updateValueAndValidity();
      this.appSettingService.showWarning("Please fill all the required fields correctly.")
      return;
    }
    const connectionFormValue = this.connectionForm.getRawValue();
    if(this.currentConnectIndex !== -1){
      const existingForm = this.connectionFormArray.at(this.currentConnectIndex) as FormGroup;
      existingForm.patchValue({
        ...connectionFormValue
      })
    } else {
      this.connectionFormArray.push(this.connectionForm);
    }
    this.connectionDataLength = this.connectionFormArray.length;
    this.connectionFormArray.updateValueAndValidity();
    this.updateConnectionPagination();
    this.validateMinStartDate(); 
    this.syncDataWithParentComponent();
    this.modalService.dismissAll();
  }

  syncDataWithParentComponent(){
    const formValue : any[] = this.connectionFormArray.getRawValue() || [];
    this.dataEmitter.emit(formValue);
  }

  /**
  |--------------------------------------------------
  |     HELPER FUNCTIONS
  |--------------------------------------------------
  */

  onModeChange(mode: any) {
    if (!mode) {
      this.selectedMode = '';
      this.filteredPorts = [];
      this.filteredPOL = [];
      this.filteredPOD = [];
      this.connectionForm.reset({
        status: 'Active'
      })
      return;
    }
    this.selectedMode = mode.name
    this.onRouteChange()
  }

  onRouteChange(): void {
    const polSid = this.c['POL']?.value;
    const podSid = this.c['POD']?.value;
    const segment = this.selectedMode

    this.filteredPorts = this.getFilteredPortsBySegment(segment);
    this.filteredPOL = this.filteredPorts.filter(port => port.PortMasterSid !== podSid);
    this.filteredPOD = this.filteredPorts.filter(port => port.PortMasterSid !== polSid);
    if (polSid && podSid && polSid === podSid) {
      this.c['POD']?.setErrors({ samePort: true });
      this.c['POL']?.setErrors({ samePort: true });
    } else {
      this.c['POD']?.setErrors(null);
      this.c['POL']?.setErrors(null);
    }
  }

  getFilteredPortsBySegment(segment: string): any[] {
    return this.portList.filter(port => port.PortType === segment) || [];
  }

  handlePOLChange(selectedPort: any) {
    if (!selectedPort) {
      this.filteredPOD = [...this.filteredPorts];
      this.c['VesselName']?.setValue(null);
      this.c['VoyageNo']?.setValue(null);
      this.c['ETA']?.setValue('');
      this.c['ETD']?.setValue('');
      return;
    }
    this.filteredPOD = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPort.PortMasterSid);
    this.c['ETA']?.setValue(new Date(selectedPort.ETA));
    this.getVesselBasedOnPorts();
  }

  handlePODChange(selectedPort: any) {
    if (!selectedPort) {
      this.filteredPOL = [...this.filteredPorts];
      this.c['VesselName']?.setValue(null);
      this.c['VoyageNo']?.setValue(null);
      this.c['ETA']?.setValue('');
      this.c['ETD']?.setValue('');
      return;
    }
    this.filteredPOL = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPort.PortMasterSid);
    this.c['ETD']?.setValue(new Date(selectedPort.ETD));
    this.c['FPD']?.setValue(selectedPort.PortName);
    this.getVesselBasedOnPorts();
  }

  getVesselBasedOnPorts() {
    const POL = this.c['POL']?.value;
    const POD = this.c['POD']?.value;
    const MovementType = this.selectedMode;
    const POLSid = (this.portList.find(port => port.PortName === POL)?.PortMasterSid);
    const PODSid = (this.portList.find(port => port.PortName === POD)?.PortMasterSid);
    if (!POLSid || !PODSid) return;
    const payload = { POL: POLSid, POD: PODSid, MovementType: MovementType };
    this.operationService.getVesselsBasedOnPorts(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.filteredVesselList = resp.data;
          this.getVoyageForPortsAndVessels();
          if (this.filteredVesselList.length === 0) {
            this.appSettingService.showWarning("No Vessel/Voyage has been scheduled for the requested route.")
          }
        } else {
          this.appSettingService.showError("Error loading Vessel")
        }
      }
    )
  }

  onVesselChange(vessel: any) {
    console.log(vessel);
    if (!vessel) {
      this.voyageList = [];
      this.c['VoyageNo']?.setValue(null);
      this.c['ETA'].setValue('');
      this.c['ETD'].setValue('');
      return;
    }
    this.getVoyageForPortsAndVessels();
  }

  getVoyageForPortsAndVessels() {
    const POL = this.c['POL']?.value;
    const POD = this.c['POD']?.value;
    const MovementType = this.selectedMode;
    const POLSid = (this.portList.find(port => port.PortName === POL)?.PortMasterSid);
    const PODSid = (this.portList.find(port => port.PortName === POD)?.PortMasterSid);
    const vessel = this.c['VesselName']?.value;
    const vesselId = (this.vesselList.find(vsl => vsl.VesselName === vessel)?.VesselMasterSid);
    console.log(POL,POD,vesselId);
    if (!POL || !POD || !vesselId) {
      return;
    }
    const payload = { VesselMasterSid: vesselId, POL: POLSid, POD: PODSid, MovementType: MovementType }
    this.operationService.getVoyagesBasedOnVesselAndPort(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.voyageList = resp.data;
        } else {
          this.appSettingService.showError("Error loading sailing schedules.")
        }
      }
    )
  }


  onVoyageChange(voyage: any) {
    if (!voyage) {
      this.c['ETA'].setValue('');
      this.c['ETD'].setValue('');
      return;
    }
    const POL = this.c['POL'].value;
    const POD = this.c['POD'].value;
    const POLSid = (this.portList.find(port => port.PortName === POL)?.PortMasterSid);
    const PODSid = (this.portList.find(port => port.PortName === POD)?.PortMasterSid);
    const details = voyage.Ports || [];

    const polDetail = details.find(d => d.POLSid === POLSid);
    const polETA = polDetail?.ETD || null;

    const podDetail = details.find(d => d.POLSid === PODSid);
    const podETD = podDetail?.ETA || null;


    this.c['ETD'].setValue(new Date(polETA));
    this.c['ETA'].setValue(new Date(podETD));
    this.validateDisabledFields();
  }

  validateDisabledFields() {
    const etdControl = this.c['ETD'];
    const etdValue = etdControl.value;

    if (etdValue && this.minStartDate) {
      const etdDate = new Date(etdValue);
      const minDate = new Date(this.minStartDate);

      etdDate.setHours(0, 0, 0, 0);
      minDate.setHours(0, 0, 0, 0);

      if (etdDate < minDate) {
        etdControl.setErrors({ minDate: true });
      } else {
        etdControl.setErrors(null);
      }
    }

    etdControl.markAsTouched();
  }


  deleteBookingConnection(connectionIndex: number, TransactionSid?: number) {
    const realIndex = ((this.page1 - 1 ) * this.pageSize1) + connectionIndex;
    if (TransactionSid) {
      this.operationService.deleteBookingConnection(TransactionSid).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.connectionFormArray.removeAt(realIndex);
            this.connectionDataLength = this.connectionFormArray.length;
            this.appSettingService.showSuccess('Connection Deleted Successfully');
            this.connectionFormArray.updateValueAndValidity();
            this.adjustConnectionPageAfterDelete();
            this.updateConnectionPagination();
            this.syncDataWithParentComponent();
          } else {
            this.appSettingService.showError("Error deleting Connection.");
          }
        });
    } else {
      this.connectionFormArray.removeAt(realIndex);
      this.connectionFormArray.updateValueAndValidity();
      this.connectionDataLength = this.connectionFormArray.length;
      this.adjustConnectionPageAfterDelete();
      this.updateConnectionPagination();
      this.syncDataWithParentComponent();
    }
  }


  adjustConnectionPageAfterDelete() {
    const totalPages = Math.ceil(this.connectionDataLength / this.pageSize1);
    if (this.page1 > totalPages && totalPages > 0) {
      this.page1 = totalPages;
    } else if (this.connectionDataLength === 0) {
      this.page1 = 1;
    }
  }

  updateConnectionPagination() {
    const start = (this.page1 - 1) * this.pageSize1;
    const end = start + this.pageSize1;
    this.slicedConnectionFormArr = this.connectionFormArray.getRawValue().slice(start, end);
  }



  validateMinStartDate() {
    this.minDatesForConnections = [];
    const connections = this.connectionFormArray.getRawValue();

    for (let i = 0; i < connections.length; i++) {
      if (i === 0) {
        this.minDatesForConnections.push(this.minStartDate);
      } else {
        const previousETA = connections[i - 1].ETA;
        this.minDatesForConnections.push(previousETA ? new Date(previousETA) : this.minStartDate);
      }
    }
  }

  toNgbDateStruct(date: Date | null): NgbDateStruct | null {
    if (!date) return null;
    const ngbDate = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
    return ngbDate;
  }

  reportConnections(): void {
    const allConnections = this.slicedConnectionFormArr;

    const formattedData = allConnections.map(connection => ({
      Mode: connection.Mode || '',
      VesselName: connection.VesselName || '',
      VoyageNo: connection.VoyageNo || '',
      POL: connection.POL || '',
      POD: connection.POD || '',
      ETD: this.datePipe.transform(connection.ETD) || '',
      ETA: this.datePipe.transform(connection.ETA) || '',
      ATD: this.datePipe.transform(connection.ATD) || '',
      ATA: this.datePipe.transform(connection.ATA) || '',
      Status: connection.status || ''
    }));

    const companyName = this.currentCompany?.companyName ?? 'Company';


    const headers = [
      { key: 'Mode', label: 'Mode' },
      { key: 'VesselName', label: 'Vessel' },
      { key: 'VoyageNo', label: 'Voyage' },
      { key: 'POL', label: 'POL' },
      { key: 'POD', label: 'POD' },
      { key: 'ETD', label: 'ETD' },
      { key: 'ETA', label: 'ETA' }
    ];


    if (this.screenName !== 'Booking') {
      headers.push(
        { key: 'ATD', label: 'ATD' },
        { key: 'ATA', label: 'ATA' }
      );
    }

    headers.push({ key: 'Status', label: 'Status' });

    this.excelExportService.exportAsExcel({
      data: formattedData,
      headers: headers,
      fileName: 'Booking-Connections-Report',
      title: companyName
    });
  }


}
