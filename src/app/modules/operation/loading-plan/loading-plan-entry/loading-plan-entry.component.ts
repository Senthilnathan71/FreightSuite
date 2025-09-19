import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { catchError, forkJoin, of } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../operation.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { Router, RouterModule } from '@angular/router';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';

@Component({
  selector: 'app-loading-plan-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    FeatherModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    CustomDatePipe,
    RouterModule,
    TextWithNumbersDirective,
    NgbPaginationModule
  ],
  templateUrl: './loading-plan-entry.component.html',
  styleUrl: './loading-plan-entry.component.scss',
})
export class LoadingPlanEntryComponent {

  @Input() screenName: string = "Loading Plan";
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() onSubmit = new EventEmitter<any>();

  selectedTab = 'Container';
  selectTab(tab: string) {
    this.selectedTab = tab;
  }
  tabs = [{ name: 'Container', icon: 'fas fa-box' }];
  currentCompany: any;
  currentBranch: any;

  departmentList: any[] = [];
  filteredDepartments: any[] = [];
  portList: any[] = [];
  filteredPorts: any[] = [];
  selectedPOL: any;
  filteredPOL: any[] = [];
  selectedPOD: any;
  filteredPOD: any[] = [];
  carrierList: any[] = [];
  selectedVoyage: any;
  filteredVesselsVoyage: any[] = [];
  availableBookings: any[] = [];
  slicedAvailableBookings: any[] = [];
  bPage = 1;
  bPageSize = 10;
  totalLengthOfAvailableBookings: number = 0;
  selectedBookings: any[] = [];
  isLoadChecked = false;
  loadingPlanForm: FormGroup;

  // Details Related Variables
  totalPkg: any = '';
  totalGrossWeight: any = '';
  totalNetWeight: any = '';
  totalVolume: any = '';
  totalRevenue: any = '';
  totalCost: any = '';
  totalGrossProfit: any = '';
  totalGrossProfitPercentage: any = '';

  // Master Job Container Related Variables
  currentContainerIndex = -1;
  containerTypeList: any[] = [];
  packageTypeList: any[] = [];
  slicedContainerArr : any[] = [];
  containerForm !: FormGroup;
  masterJobContainers: FormArray;
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number = 0;

  selectedDepartment: any;
  

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
    private router : Router
  ) {
    this.masterJobContainers = this.fb.array([]);
  }

  ngOnInit() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.onInitForm();
    this.loadAllLookups();

  }
  onInitForm() {
    this.loadingPlanForm = this.fb.group({
      dept: [null, Validators.required],
      pol: [null, Validators.required],
      pod: [null, Validators.required],
      vesselVoyage: [null, Validators.required],
      carrier: [null],
    });
  }

  loadAllLookups() {
    const activeCompanyId = this.currentCompany?.CompanyMasterSid;
    const activeBranchId = this.currentBranch?.BranchMasterSid;
    const filterOption = {
      CompanyMasterSid: activeCompanyId,
      BranchMasterSid: activeBranchId,
    }
    forkJoin({
      departments: this.operationService.getAllDepartments(activeCompanyId).pipe(catchError(err => of({ data: [] }))),
      ports: this.operationService.getAllPorts().pipe(catchError(err => of({ data: [] }))),
      carriers: this.operationService.getAllCarriers(activeCompanyId).pipe(catchError(err => of({ data: [] }))),
    }).subscribe(({ departments, ports, carriers }) => {
      this.departmentList = departments.data;
      this.portList = ports.data;
      this.carrierList = carriers;
      this.loadContainerLookups();
      this.setInitialConfig();
    })
  }

  setInitialConfig(){
    if(this.screenName === 'Loading Plan'){
      this.filterDepartments();
      this.filteredDepartments = this.departmentList.filter(dept => dept.departmentType === 'Sea').filter(d => d.FCLLCL === 'LCL');
      this.selectedDepartment = this.filteredDepartments.find(dept => dept.departmentType === 'Sea' && dept.FCLLCL === 'LCL' && dept.ExportImport === 'Export');
      const lclExportId = this.selectedDepartment?.DepartmentMasterSid;
      if (lclExportId) {
        this.loadingPlanForm.get('dept')?.setValue(lclExportId);
      }
      this.filterPorts();
    } else {
      this.filteredDepartments = [...this.departmentList];

    }

  }

  filterDepartments() {
    this.loadingPlanForm.get('vesselVoyage')?.setValue(null);
    if (!this.departmentList) {
      this.filteredDepartments = [];
    }
    
  }
  
  handleDepartmentChange(department: any) {
    this.selectedVoyage = null;
    this.filteredVesselsVoyage = [];
    this.availableBookings = [];
    this.bPage = 1;
    this.totalLengthOfAvailableBookings = 0;
    this.slicedAvailableBookings = [];
    this.selectedBookings = [];
    this.calculateTotal();
    this.fetchVesselForCondition();
    this.loadingPlanForm.get('vesselVoyage')?.setValue(null);
    if(department){
      this.selectedDepartment = department;
      this.filterPorts();
    }
  }

  onDeptChange(department:any){
    this.selectedVoyage = null;
    this.filteredVesselsVoyage = [];
    this.availableBookings = [];
    this.bPage = 1;
    this.totalLengthOfAvailableBookings = 0;
    this.slicedAvailableBookings = [];
    this.selectedBookings = [];
    this.calculateTotal();
    this.fetchVesselForCondition();
    if(!department){
      this.selectedDepartment = null;
    } else {
      this.selectedDepartment = department;
      this.loadingPlanForm.get('pol')?.setValue(null);
      this.loadingPlanForm.get('pod')?.setValue(null);
      this.loadingPlanForm.get('vesselVoyage')?.setValue(null);
    }
    this.filterPorts();
  }

  filterPorts() {
    if (!this.portList) {
      this.filteredPorts = [];
      this.filteredPOL = [];
      this.filteredPOD = [];
      return;
    }
    const deptType = this.selectedDepartment?.departmentType;
    const selectedFCLLCL = deptType === "Sea" ? this.selectedDepartment?.FCLLCL.toUpperCase() : deptType.toUpperCase();
    if (selectedFCLLCL === 'LCL' || selectedFCLLCL === 'FCL') {
      this.filteredPorts = this.portList.filter(port => port.PortType === 'Sea');
      const pol = this.filteredPorts.find(port => port.PortCode === this.selectedDepartment?.POL);
      const pod = this.filteredPorts.find(port => port.PortCode === this.selectedDepartment?.POD);
      this.handlePOLChange(pol);
      this.handlePODChange(pod);
    } else {
      this.filteredPorts = this.portList.filter(port => port.PortType === 'Air');
      const pol = this.filteredPorts.find(port => port.PortCode === this.selectedDepartment?.POL);
      const pod = this.filteredPorts.find(port => port.PortCode === this.selectedDepartment?.POD);
      this.handlePOLChange(pol);
      this.handlePODChange(pod);
    }
  }

  handlePOLChange(selectedPort: any) {
    this.selectedVoyage = null;
    this.filteredVesselsVoyage = [];
    this.availableBookings = [];
    this.bPage = 1;
    this.totalLengthOfAvailableBookings = 0;
    this.slicedAvailableBookings = [];
    this.selectedBookings = [];
    this.calculateTotal();
    this.loadingPlanForm.get('vesselVoyage')?.setValue(null);
    if (!selectedPort) {
      this.selectedPOL = null;
      this.filteredPOD = [...this.filteredPorts];
      return;
    }
    this.selectedPOL = selectedPort;
    this.filteredPOD = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPort.PortMasterSid);
    this.fetchVesselForCondition();
  }

  handlePODChange(selectedPort: any) {
    this.filteredVesselsVoyage = [];
    this.selectedVoyage = null;
    this.availableBookings = [];
    this.bPage = 1;
    this.totalLengthOfAvailableBookings = 0;
    this.slicedAvailableBookings = [];
    this.selectedBookings = [];
    this.calculateTotal();
    this.loadingPlanForm.get('vesselVoyage')?.setValue(null);
    if (!selectedPort) {
      this.selectedPOD = null;
      this.filteredPOL = [...this.filteredPorts];
      return;
    }
    this.selectedPOD = selectedPort;
    this.filteredPOL = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPort.PortMasterSid);
    this.fetchVesselForCondition();
  }

  fetchVesselForCondition() {
    if (!this.selectedPOL || !this.selectedPOD) {
      this.filteredVesselsVoyage = [];
      return;
    }
    const payload = {
      POL: this.selectedPOL.PortMasterSid,
      POD: this.selectedPOD.PortMasterSid,
    }
    this.operationService.getVesselVoyageBasedOnPorts(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.filteredVesselsVoyage = resp.data;
        } else {
          this.appSettingService.showError('Error loading Vessel')
        }
      }
    )
  }

  onVesselVoyageChange(vesselVoyage: any) {
    this.availableBookings = [];
    this.bPage = 1;
    this.totalLengthOfAvailableBookings = 0;
    this.slicedAvailableBookings = [];
    this.selectedBookings = [];
    this.calculateTotal();
    if (!vesselVoyage) {
      this.selectedVoyage = null;
      return;
    }
    this.selectedVoyage = vesselVoyage;
  }

  getBookings() {
    const companyId = this.currentCompany?.CompanyMasterSid;
    const branchId = this.currentBranch?.BranchMasterSid;
    const departmentId = this.loadingPlanForm.get('dept')?.value;
    const polId = this.selectedPOL?.PortCode;
    const podId = this.selectedPOD?.PortCode;
    const vesselName = this.selectedVoyage?.VesselName;
    const voyageNo = this.selectedVoyage?.VoyageNo;
    if (!departmentId || !polId || !podId || !vesselName || !voyageNo) {
      this.loadingPlanForm.markAllAsTouched();
      this.loadingPlanForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all the required fields correctly.')
      return;
    }
    const payload = {
      CompanyMasterSid: companyId,
      BranchMasterSid: branchId,
      DepartmentMasterSid: departmentId,
      POL: polId,
      POD: podId,
      VesselName: vesselName,
      VoyageNo: voyageNo,
    }
    this.operationService.getBookingForLoadingPlan(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          if (resp.data.length === 0) {
            this.appSettingService.showWarning('Bookings not found for selected conditions.');
            this.availableBookings = [];
            this.totalLengthOfAvailableBookings = 0;
          } else {
            this.availableBookings = resp.data;
            this.totalLengthOfAvailableBookings = this.availableBookings.length;
          }
          this.updateBookingList();
        } else {
          this.appSettingService.showError('Error fetching booking.');
          this.availableBookings = [];
        }
      }
    )
  }

  updateBookingList(){
    const start = (this.bPage - 1) * this.bPageSize;
    const end = start + this.bPageSize;
    this.slicedAvailableBookings = this.availableBookings.slice(start, end);
  }

  toggleBooking(event, booking) {
    console.log(this.selectedBookings);
    const target = event.target as HTMLInputElement;
    if (event instanceof KeyboardEvent) {
      target.checked = !target.checked;
    }
    const currentState = target.checked;
    if (currentState) {
      this.selectedBookings.push(booking);
    } else {
      this.selectedBookings = this.selectedBookings.filter(b => b.BookingHeaderSid !== booking.BookingHeaderSid);
    }
    console.log(this.selectedBookings);
    this.calculateTotal();
  }

  calculateTotal() {
    if (this.selectedBookings.length === 0) {
      this.totalPkg = '';
      this.totalGrossWeight = '';
      this.totalNetWeight = '';
      this.totalVolume = '';
      this.totalRevenue = '';
      this.totalCost = '';
      this.totalGrossProfit = '';
      this.totalGrossProfitPercentage = '';
      return;
    }

    this.totalPkg = 0;
    this.totalGrossWeight = 0;
    this.totalNetWeight = 0;
    this.totalVolume = 0;
    this.totalRevenue = 0;
    this.totalCost = 0;
    this.totalGrossProfit = 0;
    this.totalGrossProfitPercentage = 0;

    this.selectedBookings.forEach(booking => {
      this.totalPkg += Number(booking.NoOfPackage || 0);
      this.totalGrossWeight += Number(booking.GrossWeight || 0);
      this.totalNetWeight += Number(booking.NetWeight || 0);
      this.totalVolume += Number(booking.Volume || 0);
      this.totalRevenue += Number(booking.totalRevenue || 0);
      this.totalCost += Number(booking.totalCost || 0);
    });

    if (this.totalRevenue > this.totalCost) {
      this.totalGrossProfit = (this.totalRevenue - this.totalCost).toFixed(2);
      this.totalGrossProfitPercentage = (((this.totalGrossProfit / this.totalRevenue) * 100) || 0).toFixed(2) || 0;
    } else {
      this.totalGrossProfit = (this.totalCost - this.totalRevenue).toFixed(2);
      this.totalGrossProfitPercentage = (((this.totalGrossProfit / this.totalCost) * 100) || 0).toFixed(2) || 0;
    }

    this.totalPkg = Number(this.totalPkg.toFixed(2));
    this.totalGrossWeight = Number(this.totalGrossWeight.toFixed(2));
    this.totalNetWeight = Number(this.totalNetWeight.toFixed(2));
    this.totalVolume = Number(this.totalVolume.toFixed(2));
    this.totalRevenue = Number(this.totalRevenue.toFixed(2));
    this.totalCost = Number(this.totalCost.toFixed(2));
  }

  initContainerForm(): void {
    this.containerForm = this.fb.group({
      MasterJobContainerSid: [null],
      ContainerType: [null, Validators.required],
      ContainerNumber: ['', [Validators.required, Validators.maxLength(11)]],
      LineSeal: ['', Validators.maxLength(10)],
      CustomsSeal: ['', Validators.maxLength(10)],
      HsCode: ['', Validators.maxLength(10)],
      CommodityDescription: ['', Validators.maxLength(500)],
      PkgType: [null],
      NoOfPkg: [0, [Validators.min(0)]],
      GrossWeight: [0, [Validators.min(0)]],
      NetWeight: [0, [Validators.min(0)]],
      ChargeableWeight: [0, [Validators.min(0)]],
      Volume: [0, [Validators.min(0)]],
      IsSoc: [false]
    });
  }

  constructContainerForm(data: any) {
    const containerForm = this.fb.group({
      MasterJobContainerSid: data?.MasterJobContainerSid || null,
      ContainerType: [data?.ContainerType || null, Validators.required],
      ContainerNumber: [data?.ContainerNumber || '', [Validators.required]],
      LineSeal: [data?.LineSeal || '', Validators.maxLength(10)],
      CustomsSeal: data?.CustomsSeal || '',
      HsCode: data?.HsCode || '',
      CommodityDescription: data?.CommodityDescription || '',
      PkgType: data?.PkgType || null,
      NoOfPkg: data?.NoOfPkg || 0,
      GrossWeight: data?.GrossWeight || 0,
      NetWeight: data?.NetWeight || 0,
      ChargeableWeight: data?.ChargeableWeight || 0,
      Volume: data?.Volume || 0,
      IsSoc: data?.IsSoc ? (data.IsSoc ? "Y" : "N") : "N"
    });
    return containerForm;
  }

  loadContainerLookups() {
    forkJoin({
      containerTypes: this.operationService.getAllContainerTypes().pipe(catchError(err => of({ data: [] }))),
      pkgTypes : this.operationService.getPackageTypeUOM().pipe(catchError(err => of({ data: [] }))),
    }).subscribe(({ containerTypes , pkgTypes }) => {
      this.containerTypeList = containerTypes.data;
      this.packageTypeList = pkgTypes.data;
    })
  }

  openContainerModal(content: TemplateRef<any>, data?: any, index?: number) {
    this.initContainerForm();
    this.currentContainerIndex = index !== undefined ? index : -1;
    if (data) {
      this.containerForm.patchValue({
        MasterJobContainerSid: null,
        ContainerType: data?.ContainerType || '',
        ContainerNumber: data?.ContainerNumber || '',
        LineSeal: data?.LineSeal || '',
        CustomsSeal: data?.CustomsSeal || '',
        HsCode: data?.HsCode || '',
        CommodityDescription: data?.CommodityDescription || '',
        PkgType: data?.PkgType || null,
        NoOfPkg: data?.NoOfPkg || 0,
        GrossWeight: data?.GrossWeight || 0,
        NetWeight: data?.NetWeight || 0,
        ChargeableWeight: data?.ChargeableWeight || 0,
        Volume: data?.Volume || 0,
        IsSoc: data?.IsSoc ? (data?.IsSoc === 'Y' ? true : false) : false
      });
    }
    this.modalService.open(content, { centered: true, backdrop: 'static', size: 'lg' });
  }

  deleteContainer(containerIndex:number){
    const realIndex = ((this.page - 1) * this.pageSize)+ containerIndex;
    this.masterJobContainers.removeAt(realIndex);
    this.totalLengthOfCollection = this.masterJobContainers.length;
    this.updateContainerPagination();
  }

  onContainerSubmit(){
    if(this.containerForm.invalid){
      this.containerForm.markAllAsTouched();
      this.containerForm.updateValueAndValidity();
      this.appSettingService.showWarning("Please fill all the required fields correctly.")
      return;
    }
    const formValue = this.containerForm.getRawValue();
    if(this.currentContainerIndex !== -1){
      const realIndex = ((this.page - 1) * this.pageSize)+ this.currentContainerIndex;
      const existingForm = this.masterJobContainers.at(realIndex) as FormGroup;
      existingForm.patchValue({
        ...formValue,
        IsSoc : formValue.IsSoc ? 'Y' : 'N'
      })
    } else {
      this.masterJobContainers.push(this.constructContainerForm(formValue));
    }
    this.masterJobContainers.updateValueAndValidity();
    this.totalLengthOfCollection = this.masterJobContainers.length;
    this.updateContainerPagination();
    this.modalService.dismissAll();
  }

  updateContainerPagination(){
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.slicedContainerArr = this.masterJobContainers.getRawValue().slice(start, end);
  }

  getContainerTypeName(ContainerTypeMasterSid: number): string {
    if(!ContainerTypeMasterSid || this.containerTypeList.length === 0) return '';
    const containerType = this.containerTypeList.find(ct => ct.ContainerTypeMasterSid === ContainerTypeMasterSid);
    return containerType ? containerType.ContainerName : 'Unknown';
  }

  getPackageTypeName(pkgTypeSid: number): string {
    if (!pkgTypeSid || this.packageTypeList.length === 0) return '';
    const ourPort = (this.packageTypeList.find(p => p.UOMMasterSid === pkgTypeSid));
    return ourPort ? ourPort.UOMName : 'Unknown';
  }

  toggleSOC(event:any){
    console.log(event);
    const ctrl = this.containerForm.get('IsSoc');
    const element = event.target as HTMLInputElement;
    if(event instanceof KeyboardEvent){
      element.checked = !element.checked;
    }
    ctrl?.setValue(element.checked);
  }

  onGenerateJob() {
    if (this.selectedBookings.length === 0) {
      this.appSettingService.showWarning('Please select at least one booking.');
      return;
    }
    const formValue = this.loadingPlanForm.getRawValue();
    const containers = this.masterJobContainers.getRawValue();
    const allCargos = this.selectedBookings.map(booking => booking.CargoType);
    console.log(allCargos);
    const isHaz = this.selectedBookings.some(bk => bk.CargoType === 'Haz');

    const bookings = this.selectedBookings.map(booking => {
      return {
        BookingHeaderSid : booking.BookingHeaderSid,
        BookingNo : booking.BookingNo,
        BookingDateTime : booking.BookingDate,
        DepartmentMasterSid : booking.DepartmentMasterSid,
        HBLNo : booking.HBLNo || null,
        CustomerMasterSid : booking.CustomerMasterSid,
        CustomerName : booking.CustomerName,
        CustomerAddress : booking.CustomerAddress,
        ShipperName : booking.ShipperName,
        ShipperAddress : booking.ShipperAddress,
        ConsigneeName : booking.ConsigneeName,
        ConsigneeAddress : booking.ConsigneeAddress,
        DestinationAgent : booking.DestinationAgent,
        MBLDate : booking.MBLDate || null,
        POL : booking.POL,
        POD : booking.POD,
        FreightTerms : booking.FreightTerms,
      }
    })

    const valueToPatchOnMasterJob = {
      // Header fields
      DepartmentMasterSid: formValue.dept,
      POL: formValue.pol,
      POD: formValue.pod,
      VoyageMasterSid : this.selectedVoyage?.VoyageMasterSid,
      VesselName: this.selectedVoyage?.VesselName,
      VoyageNo: this.selectedVoyage?.VoyageNo,
      CarrierName: formValue.carrier,
      CutOffDate : this.selectedVoyage?.PortCutoff,
      ETD : this.selectedVoyage?.ETD,
      ETA : this.selectedVoyage?.ETA,
      Haz : isHaz ? 'Y' : 'N',

      // Calculated fields
      NoofPkg : this.totalPkg,
      GrossWeight : this.totalGrossWeight,
      NetWeight : this.totalNetWeight,
      Volume : this.totalVolume,

      // Shipment part
      bookingList : bookings,

      masterJobContainers : containers, 
    }

    this.operationService.setLoadingPlanData(valueToPatchOnMasterJob);
    this.router.navigate(['operation/master-job/entry']);
  }

  onClickGenerateJob() {
    if (this.selectedBookings.length === 0) {
      this.appSettingService.showWarning('Please select at least one booking.');
      return;
    }
    const formValue = this.loadingPlanForm.getRawValue();
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const isHaz = this.selectedBookings.map(booking => booking.CargoType).some(bk => bk === 'Haz');
    const containers = this.masterJobContainers.getRawValue();
    const shipmentList = this.selectedBookings.map(booking => {
      return {
        BookingHeaderSid : booking.BookingHeaderSid,
        HBLNo : booking.HBLNo,
      }
    });
    const payload = {
      CreatedBy : userEmail,
      MenuMasterSid : currentMenuId,
      CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
      BranchMasterSid : this.currentBranch?.BranchMasterSid,
      DepartmentMasterSid : formValue.dept,
      POL : formValue.pol,
      POD : formValue.pod,
      NoOfPkg : this.totalPkg,
      GrossWeight : this.totalGrossWeight,
      NetWeight : this.totalNetWeight,
      Volume : this.totalVolume,
      Haz : isHaz ? 'Y' : 'N',
      VoyageMasterSid : this.selectedVoyage?.VoyageMasterSid,
      VesselName : this.selectedVoyage?.VesselName,
      VoyageNo : this.selectedVoyage?.VoyageNo,
      CarrierName : formValue.carrier,
      CarrierMasterSid : formValue.CarrierMasterSid,
      ETD : this.selectedVoyage?.ETD,
      ETA : this.selectedVoyage?.ETA,
      CutOffDate : this.selectedVoyage?.PortCutoff,
      shipmentList,
      masterJobContainers : containers
    }

    this.operationService.createMasterJob(payload).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess('Master Job generated successfully');
          if(resp.data){
            this.router.navigate(['/operation/master-job/entry', resp.data?.newMasterJob?.MasterJobSid]);
          }
        } else {
          this.appSettingService.showError('Error generating master job');
        }
      },
      error: (error) => {
        this.appSettingService.showError('Failed to generate master job');
        console.error('Error generating master job:', error);
      }
    });

  }

  onReset() {
    this.loadingPlanForm.reset();
    this.filterDepartments();
    this.handlePOLChange(null);
    this.handlePODChange(null);
    this.filteredVesselsVoyage = [];
    this.selectedBookings = [];
    this.availableBookings = [];
    this.bPage = 1;
    this.totalLengthOfAvailableBookings = 0;
    this.slicedAvailableBookings = [];
    this.totalPkg = '';
    this.totalGrossWeight = '';
    this.totalNetWeight = '';
    this.totalVolume = '';
    this.totalRevenue = '';
    this.totalCost = '';
    this.totalGrossProfit = '';
    this.totalGrossProfitPercentage = '';
    this.slicedContainerArr = [];
    this.page = 1;
    this.totalLengthOfCollection = 0;
    this.masterJobContainers.clear();
    this.isLoadChecked = false;
  }

  attachToMasterJob(){
    if(this.selectedBookings.length === 0){
      this.appSettingService.showWarning('Please select at least one booking.');
      return;
    }
    const allSelectedBookings = this.selectedBookings.map((booking)=>{
      return {
        ...booking,
        BookingDateTime : booking.BookingDate ? new Date(booking.BookingDate) : null,
      }
    })
    this.onSubmit.emit(allSelectedBookings);
  }

  closeTemplate(){
    this.closeModal.emit(true);
  }

}
