import { Component, ViewChild, TemplateRef, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../operation.service';
import { CommonModule } from '@angular/common';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';

@Component({
  selector: 'app-connection',
  standalone: true,
  imports: [
    NgSelectModule,
    NgbDatepickerModule,
    FeatherModule,
    CustomDatePipe,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './connection.component.html',
  styleUrl: './connection.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
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
  connectionForm !: FormGroup;

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
    if (value && value.length > 0) {
      this._dataItems = value;
      this.patchValues(this._dataItems);
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

  @Output() dataEmitter = new EventEmitter<any[]>()

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
  ) { }

  ngOnInit(): void {
    console.log("This is the screen", this.screenName)
    console.log("This is the data", this.dataItems)
    this.connectionFormArray = this.fb.array([]);
    if (this.dataItems.length !== 0) {
      this.patchValues(this.dataItems);
    }
  }

  initConnectionForm() {
    this.connectionForm = this.fb.group({
      BookingConnectionSid: [null],
      Mode: [null],
      VesselName: [null],
      VoyageNo: [null],
      POL: [null],
      POD: [null],
      ETD: [{ value: '', disabled: true }],
      ETA: [{ value: '', disabled: true }],
      ATD: [''],
      ATA: [''],
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
  }

  createBookingConnectionGroup(data?: any): FormGroup {
    console.log(data);
    const connectionForm = this.fb.group({
      BookingConnectionSid: [data?.BookingConnectionSid || null],
      Mode : [data?.Mode || null],
      VesselName: [data?.VesselName || null],
      VoyageNo: [data?.VoyageNo || null],
      POL: [data?.POL || null],
      POD: [data?.POD || null],
      ETD: [data?.ETD ? new Date(data.ETD) : ''],
      ETA: [data?.ETA ? new Date(data.ETA) : ''],
      ATD: [data?.ATD ? new Date(data.ATD) : ''],
      ATA: [data?.ATA ? new Date(data.ATA) : ''],
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
        BookingConnectionSid: data.BookingConnectionSid,
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

    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  onConnectionSubmit() {
    if(this.connectionForm.invalid){
      this.connectionForm.markAllAsTouched();
      this.connectionForm.updateValueAndValidity();
      this.appSettingService.showWarning("Please fill all the required fields correctly.")
      return;
    }
    this.connectionFormArray.push(this.connectionForm);
    this.connectionDataLength = this.connectionFormArray.length;
    this.updateConnectionPagination();
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
    const polETD = polDetail?.ETD || null;


    const podDetail = details.find(d => d.POLSid === PODSid);
    const podETD = podDetail?.ETD || null;

    this.c['ETA'].setValue(new Date(polETD));
    this.c['ETD'].setValue(new Date(podETD));
  }



  deleteBookingConnection(connectionIndex: number, BookingConnectionSid?: number) {
    const connectionToDelete = this.slicedConnectionFormArr[connectionIndex];
    const realIndex = this.connectionFormArray.controls.indexOf(connectionToDelete);

    if (BookingConnectionSid) {
      this.operationService.deleteBookingConnection(BookingConnectionSid).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.connectionFormArray.removeAt(realIndex);
            this.connectionDataLength = this.connectionFormArray.length;
            this.appSettingService.showSuccess('Connection Deleted Successfully');
            this.adjustConnectionPageAfterDelete();
            this.updateConnectionPagination();
          } else {
            this.appSettingService.showError("Error deleting Connection.");
          }
        })
    } else {
      this.connectionFormArray.removeAt(realIndex);
      this.connectionDataLength = this.connectionFormArray.length;
      this.adjustConnectionPageAfterDelete();
    }
    this.connectionFormArray.updateValueAndValidity();
    this.updateConnectionPagination();
    this.syncDataWithParentComponent();
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

}
