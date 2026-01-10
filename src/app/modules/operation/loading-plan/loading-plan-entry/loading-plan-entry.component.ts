import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { catchError, forkJoin, of, Subject } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../operation.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { Router, RouterModule } from '@angular/router';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
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
    NgbPaginationModule,
    SearchableDropdown,
    CustomDatePipe,
    NgxSpinnerModule,
    PreventMultiClickDirective,
    DecimalPrecisionDirective,

  ],
  templateUrl: './loading-plan-entry.component.html',
  styleUrl: './loading-plan-entry.component.scss',
  providers: [
    CustomDatePipe,
    NgbActiveModal
  ]
})
export class LoadingPlanEntryComponent {
  @ViewChild('loadingPlanPrint') loadingPlanPrint!: TemplateRef<any>;
  private destroy$ = new Subject<void>();

  @Input() screenName: string = "Loading Plan";
  @Input() masterJobFormValue = {
    hasValue: false,
    DepartmentMasterSid: null,
    POL: null,
    POD: null
  };
  @Input() exceptionalBookings: number[] = [];
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
  hssacList: any[] = [];
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
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  portLookupConfig = DROPDOWN_CONFIGS.PORT;
  vesselVoyageConfig = DROPDOWN_CONFIGS.VESSEL_VOYAGE;
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  hasMultipleVoyages: boolean = false;
  multipleVoyageList: any[] = [];

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
  slicedContainerArr: any[] = [];
  containerForm !: FormGroup;
  masterJobContainers: FormArray;
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number = 0;

  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;

  selectedDepartment: any;
  showButton: boolean = false;
  currentDate = new Date()
  userData: any;
  agentList: any;
  loadingPlanData: any[] = [];


  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private ngbModal: NgbModal,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
    private router: Router,
    public dropdownStore: DropdownStore,
    private datePipe: CustomDatePipe,
    private spinnerService: NgxSpinnerService,
    private spinner: NgxSpinnerService,
    private pdfService: PdfDownloadService,
    private appSettingsService: AppSettingsService,
    private masterService: MasterService,
    public logoService : LogoService



  ) {
    this.masterJobContainers = this.fb.array([]);
    // effect(()=>{
    //   const departments = this.dropdownStore.department();
    //   const ports = this.dropdownStore.ports();
    //   const carriers = this.dropdownStore.customerTypeData();
    //   const containerType = this.dropdownStore.containerTypes();
    //   const packageType = this.dropdownStore.uomsByType()


    //   this.departmentList = departments;
    //   this.portList = ports;
    //   this.carrierList = carriers;
    //   this.containerTypeList = containerType
    //   this.packageTypeList = packageType


    //   // Run setup only when all lists are loaded and not empty
    //   if (departments?.length && ports?.length) {
    //     this.setInitialConfig();
    //     if (this.masterJobFormValue.hasValue) {
    //       const dept = this.masterJobFormValue.DepartmentMasterSid;
    //       let selectedDept = this.departmentList.find(d => d.DepartmentMasterSid === dept);
    //       this.selectedPOL = this.portList.find(p => p.PortCode === this.masterJobFormValue.POL);
    //       this.selectedPOD = this.portList.find(p => p.PortCode === this.masterJobFormValue.POD);
    //       console.log(this.selectedPOL,this.selectedPOD);
    //       this.onDeptChange(selectedDept);
    //       this.loadingPlanForm.patchValue({
    //         dept: this.masterJobFormValue.DepartmentMasterSid,
    //         pol: this.masterJobFormValue.POL,
    //         pod: this.masterJobFormValue.POD
    //       })
    //       this.loadingPlanForm.get('dept')?.disable();
    //       this.loadingPlanForm.get('pol')?.disable();
    //       this.loadingPlanForm.get('pod')?.disable();
    //       this.fetchVesselForCondition();
    //       console.log(this.selectedPOL,this.selectedPOD);
    //     }
    //   }
    // })
  }

  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.onInitForm();
    this.loadAllLookups();
    this.loadHSSACLookups();
    this.branchDetails = this.appSettingsService.getCurrentBranchInfo();
    console.log(this.branchDetails, "BRANCH DETAILS");
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();

  }
  onInitForm() {
    this.loadingPlanForm = this.fb.group({
      dept: [null, Validators.required],
      pol: [null, Validators.required],
      pod: [null, Validators.required],
      vesselVoyage: [null],
      isVesselVoyage: [false],
      carrier: [null],
      ETA: [null],
      ETD: [null]
    });
  }

  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.loadingPlanForm.controls || {};
  }


  toggleInputType(mainCtrl: string, flagCtrl: string, event: MouseEvent): void {
    event.stopPropagation();
    const value = this.f[flagCtrl]?.value;
    this.f[flagCtrl]?.setValue(!value);
    this.loadingPlanForm.get(mainCtrl)?.reset();
  }

  loadCityName(): void {
    if (!this.currentBranchCityId) return;


    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {
        console.log("City API response:", response);

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
          console.log("Final City Name:", this.currentBranchCityName);
        }


      },
      error: (error) => {
        console.error("Failed to load city:", error);

      }
    });
  }
  loadAllLookups() {
    const activeCompanyId = this.currentCompany?.CompanyMasterSid;
    const activeBranchId = this.currentBranch?.BranchMasterSid;

    const filterOption = {
      CompanyMasterSid: activeCompanyId,
      BranchMasterSid: activeBranchId,
    };

    const payload = {
      CompanyMasterSid: activeCompanyId,
      types: ['carrier'],
    };

    forkJoin({
      departments: this.dropdownStore.loadDepartments({ CompanyMasterSid: activeCompanyId }),
      ports: this.dropdownStore.loadPorts(),
      carriers: this.dropdownStore.loadCustomerTypeData(payload),
      containerTypes: this.dropdownStore.loadContainerTypes(),
      uomsByType: this.dropdownStore.loadUOMsByType('P'),
    }).subscribe(
      ({ departments, ports, carriers, containerTypes, uomsByType }) => {
        this.departmentList = departments || [];
        this.portList = (ports || []).map(p => ({ ...p, Country: p.countryMaster?.countryName }));
        this.carrierList = carriers || [];
        this.containerTypeList = containerTypes || [];
        this.packageTypeList = uomsByType || [];

        // Proceed only when key lists are loaded
        if (this.departmentList.length && this.portList.length) {
          this.setInitialConfig();

          if (this.masterJobFormValue.hasValue) {
            const dept = this.masterJobFormValue.DepartmentMasterSid;
            const selectedDept = this.departmentList.find(
              (d) => d.DepartmentMasterSid === dept
            );

            this.selectedPOL = this.portList.find(
              (p) => p.PortCode === this.masterJobFormValue.POL
            );
            this.selectedPOD = this.portList.find(
              (p) => p.PortCode === this.masterJobFormValue.POD
            );

            console.log(this.selectedPOL, this.selectedPOD);

            this.onDeptChange(selectedDept);

            this.loadingPlanForm.patchValue({
              dept: this.masterJobFormValue.DepartmentMasterSid,
              pol: this.masterJobFormValue.POL,
              pod: this.masterJobFormValue.POD,
            });

            this.loadingPlanForm.get('dept')?.disable();
            this.loadingPlanForm.get('pol')?.disable();
            this.loadingPlanForm.get('pod')?.disable();

            this.fetchVesselForCondition();
          }
        }
      },
      (error) => {
        console.error('Error loading dropdowns:', error);
      }
    );
  }
  modalClose() {
    this.modalService.dismissAll(); // closes all open modals
  }

  setInitialConfig() {
    if (this.screenName === 'Loading Plan') {
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
    if (department) {
      this.selectedDepartment = department;
      this.filterPorts();
    }
  }

  onDeptChange(department: any) {
    this.selectedVoyage = null;
    this.filteredVesselsVoyage = [];
    this.availableBookings = [];
    this.bPage = 1;
    this.totalLengthOfAvailableBookings = 0;
    this.slicedAvailableBookings = [];
    this.selectedBookings = [];
    this.calculateTotal();
    this.fetchVesselForCondition();
    if (!department) {
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
      segment: 'Sea'  // As Loading Plan is only for LCL Import and Export
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
      this.loadingPlanForm.patchValue({
        ETA: null,
        ETD: null
      });
      return;
    }
    this.selectedVoyage = vesselVoyage;
    this.loadingPlanForm.patchValue({
      ETA: vesselVoyage.ETA ? new Date(vesselVoyage.ETA) : null,
      ETD: vesselVoyage.ETD ? new Date(vesselVoyage.ETD) : null
    });
  }

  getBookings() {
    if (this.masterJobFormValue.hasValue) {
      this.selectedPOL = this.portList.find(p => p.PortCode === this.masterJobFormValue.POL);
      this.selectedPOD = this.portList.find(p => p.PortCode === this.masterJobFormValue.POD);
    }

    const companyId = this.currentCompany?.CompanyMasterSid;
    const branchId = this.currentBranch?.BranchMasterSid;
    const departmentId = this.loadingPlanForm.get('dept')?.getRawValue();
    console.log(this.selectedPOL, this.selectedPOD);
    const polId = this.selectedPOL?.PortCode;
    const podId = this.selectedPOD?.PortCode;
    const isFreeText = this.loadingPlanForm.get('isVesselVoyage')?.value;

    let vesselName: string | null = null;
    let voyageNo: string | null = null;

    if (isFreeText) {
      // Free text entry
      vesselName = this.loadingPlanForm.get('vesselVoyage')?.value;
      voyageNo = null; 
    } else {
      // Dropdown selection
      vesselName = this.selectedVoyage?.VesselName || null;
      voyageNo = this.selectedVoyage?.VoyageNo || null;
    }

    console.log(departmentId, polId, podId);
    if (!departmentId || !polId || !podId) {
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
    this.showButton = false;
    this.operationService.getBookingForLoadingPlan(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          if (resp.data.length === 0) {
            this.appSettingService.showWarning('Bookings not found for selected conditions.');
            this.availableBookings = [];
            this.totalLengthOfAvailableBookings = 0;
            this.loadingPlanData = [];
          } else {
            this.availableBookings = (resp.data || []).filter(bk => !this.exceptionalBookings.includes(bk.BookingHeaderSid)).map(bk => {
              return {
                ...bk,
                ETADate: bk.ETA,
                ETDDate: bk.ETD,
                ETA: this.datePipe.transform(bk.ETA),
                ETD: this.datePipe.transform(bk.ETD)
              }
            });
            this.totalLengthOfAvailableBookings = this.availableBookings.length;
            this.loadingPlanData = this.availableBookings;
            console.log(this.loadingPlanData, "LOADING PLAN")
            this.showButton = true;
          }
          this.updateBookingList();
        } else {
          this.appSettingService.showError('Error fetching booking.');
          this.availableBookings = [];
          this.loadingPlanData = [];
          this.showButton = false;
        }
      }
    )
  }

  updateBookingList() {
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
    this.handleMultipleVoyages();
    this.calculateTotal();
  }

  handleMultipleVoyages() {
    const uniqueVoyages = new Map();
    this.selectedBookings.forEach(b => {
      if (b.VoyageMasterSid) {
        uniqueVoyages.set(b.VoyageMasterSid, b);
      }
    });

    this.multipleVoyageList = Array.from(uniqueVoyages.values());
    this.hasMultipleVoyages = this.multipleVoyageList.length > 1;

    // if the previously selected voyage is not in the new list of unique voyages, reset it
    if (this.selectedVoyage && !this.multipleVoyageList.some(v => v.VoyageMasterSid === this.selectedVoyage.VoyageMasterSid)) {
      this.selectedVoyage = null;
    }

    // If only one unique voyage remains, auto-select it.
    if (this.multipleVoyageList.length === 1) {
      this.selectedVoyage = this.multipleVoyageList[0];
    }
  }

  handleMultipleVesselChange(selectedVoyage: any) {
    if (!selectedVoyage) {
      this.selectedVoyage = null;
      this.loadingPlanForm.patchValue({
        ETA: null,
        ETD: null
      });
      return;
    }
    this.selectedVoyage = selectedVoyage;
    this.loadingPlanForm.patchValue({
      ETA: selectedVoyage.ETA ? new Date(selectedVoyage.ETA) : null,
      ETD: selectedVoyage.ETD ? new Date(selectedVoyage.ETD) : null
    });
    this.handleMultipleVoyages()
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
      ChargeableWeight: [0, [Validators.min(0)]],
    NoOfPkg: [{ value: 0, disabled: true }],
      GrossWeight: [{ value: 0, disabled: true }],
      NetWeight: [{ value: 0, disabled: true }],
      Volume: [{ value: 0, disabled: true }],
      IsSoc: [false]
    });
  }
formatContainerNumber(): void {
    const containerControl = this.containerForm.get('ContainerNumber');
    if (!containerControl?.value) return;

    // Convert to uppercase and remove all non-alphanumeric characters
    let containerNumber = containerControl.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Set the formatted value back to the control
    containerControl.setValue(containerNumber, { emitEvent: false });

    // Basic format validation: 4 letters + 6 digits + 1 check digit
    const containerRegex = /^[A-Z]{4}\d{6}\d?$/;

    // If we have 10 characters (4 letters + 6 digits), calculate check digit
    if (containerNumber.length === 10 && containerRegex.test(containerNumber + '0')) {
      // Calculate check digit and append it
      const validation = this.validateContainerNumber(containerNumber + '0'); // Temporary append
      if (validation.checkDigit !== undefined) {
        containerNumber = containerNumber.substring(0, 10) + validation.checkDigit.toString();
        containerControl.setValue(containerNumber);
      }
    }

    // Validate the complete container number (should be 11 characters now)
    if (containerNumber.length === 11) {
      const validation = this.validateContainerNumber(containerNumber);

      if (!validation.isValid) {
        containerControl.setErrors({ 'invalidContainerNumber': true });
        this.appSettingService.showError(`Invalid container number. Expected check digit: ${validation.checkDigit}`);
      } else {
        containerControl.setErrors(null);
        // Show success message
        setTimeout(() => {
          // This will trigger the success message in the template
          containerControl?.updateValueAndValidity({ onlySelf: true });
        }, 0);
      }
    } else if (containerNumber.length > 0) {
      containerControl.setErrors({ 'invalidFormat': true });
      this.appSettingService.showError('Container number must be 11 characters: 4 letters + 6 digits + 1 check digit');
    }
  }
  validateContainerNumber(containerNumber: string): { isValid: boolean, checkDigit?: number } {
    if (!containerNumber || containerNumber.length !== 11) {
      return { isValid: false };
    }

    // ISO 6346 character value mapping
    const charMap: { [key: string]: number } = {
      'A': 10, 'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17, 'H': 18, 'I': 19,
      'J': 20, 'K': 21, 'L': 23, 'M': 24, 'N': 25, 'O': 26, 'P': 27, 'Q': 28, 'R': 29,
      'S': 30, 'T': 31, 'U': 32, 'V': 34, 'W': 35, 'X': 36, 'Y': 37, 'Z': 38
    };

    // Remove any spaces and convert to uppercase
    const cleanNumber = containerNumber.toUpperCase().replace(/\s/g, '');

    if (cleanNumber.length !== 11) {
      return { isValid: false };
    }

    // Extract the base number (first 10 characters) and check digit (last character)
    const baseNumber = cleanNumber.substring(0, 10);
    const providedCheckDigit = parseInt(cleanNumber.substring(10, 11), 10);

    let sum = 0;

    // Calculate sum using ISO 6346 algorithm
    for (let i = 0; i < 10; i++) {
      const char = baseNumber[i];
      let value: number;

      // Check if character is a letter
      if (/[A-Z]/.test(char)) {
        value = charMap[char] || 0;
      } else if (/[0-9]/.test(char)) {
        value = parseInt(char, 10);
      } else {
        return { isValid: false };
      }

      // Weight factor: 2^i (power of 2)
      const weight = Math.pow(2, i);
      sum += value * weight;
    }

    // Calculate check digit
    const remainder = sum % 11;
    const calculatedCheckDigit = remainder === 10 ? 0 : remainder;

    return {
      isValid: calculatedCheckDigit === providedCheckDigit,
      checkDigit: calculatedCheckDigit
    };
  }

  // Getters for form arrays
  get connections(): FormArray {
    return this.containerForm.get('connections') as FormArray;
  }



  get costRevenueCharges(): FormArray {
    return this.containerForm.get('costRevenueCharges') as FormArray;
  }

  get containerActivities(): FormArray {
    return this.containerForm.get('containerActivities') as FormArray;
  }
   onContainerNumberInput(event: any): void {
    const input = event.target.value;
    // Auto-convert to uppercase as user types
    const upperValue = input.toUpperCase();
    if (input !== upperValue) {
      event.target.value = upperValue;
      this.containerForm.get('ContainerNumber')?.setValue(upperValue);
    }

    // Limit to 11 characters
    if (input.length > 11) {
      event.target.value = input.substring(0, 11);
      this.containerForm.get('ContainerNumber')?.setValue(input.substring(0, 11));
    }
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

  // loadContainerLookups() {
  //   forkJoin({
  //     containerTypes: this.operationService.getAllContainerTypes().pipe(catchError(err => of({ data: [] }))),
  //     pkgTypes : this.operationService.getUOMsByType('P').pipe(catchError(err => of({ data: [] })))
  //   }).subscribe(({ containerTypes , pkgTypes }) => {
  //     this.containerTypeList = containerTypes.data;
  //     this.packageTypeList = pkgTypes.data;
  //   })
  // }

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

  deleteContainer(containerIndex: number) {
    const realIndex = ((this.page - 1) * this.pageSize) + containerIndex;
    this.masterJobContainers.removeAt(realIndex);
    this.totalLengthOfCollection = this.masterJobContainers.length;
    this.updateContainerPagination();
  }

  onContainerSubmit() {
    if (this.containerForm.invalid) {
      this.containerForm.markAllAsTouched();
      this.containerForm.updateValueAndValidity();
      this.appSettingService.showWarning("Please fill all the required fields correctly.")
      return;
    }
    const formValue = this.containerForm.getRawValue();
    if (this.currentContainerIndex !== -1) {
      const realIndex = ((this.page - 1) * this.pageSize) + this.currentContainerIndex;
      const existingForm = this.masterJobContainers.at(realIndex) as FormGroup;
      existingForm.patchValue({
        ...formValue,
        IsSoc: formValue.IsSoc ? 'Y' : 'N'
      })
    } else {
      this.masterJobContainers.push(this.constructContainerForm(formValue));
    }
    this.masterJobContainers.updateValueAndValidity();
    this.totalLengthOfCollection = this.masterJobContainers.length;
    this.updateContainerPagination();
    this.modalService.dismissAll();
  }

  updateContainerPagination() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.slicedContainerArr = this.masterJobContainers.getRawValue().slice(start, end);
  }

  getContainerTypeName(ContainerTypeMasterSid: number): string {
    if (!ContainerTypeMasterSid || this.containerTypeList.length === 0) return '';
    const containerType = this.containerTypeList.find(ct => ct.ContainerTypeMasterSid === ContainerTypeMasterSid);
    return containerType ? containerType.ContainerName : 'Unknown';
  }

  getPackageTypeName(pkgTypeSid: number): string {
    if (!pkgTypeSid || this.packageTypeList.length === 0) return '';
    const ourPort = (this.packageTypeList.find(p => p.UOMMasterSid === pkgTypeSid));
    return ourPort ? ourPort.UOMName : 'Unknown';
  }

  toggleSOC(event: any) {
    console.log(event);
    const ctrl = this.containerForm.get('IsSoc');
    const element = event.target as HTMLInputElement;
    if (event instanceof KeyboardEvent) {
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
        BookingHeaderSid: booking.BookingHeaderSid,
        BookingNo: booking.BookingNo,
        BookingDateTime: booking.BookingDate,
        DepartmentMasterSid: booking.DepartmentMasterSid,
        HBLNo: booking.HBLNo || null,
        CustomerMasterSid: booking.CustomerMasterSid,
        CustomerName: booking.CustomerName,
        CustomerAddress: booking.CustomerAddress,
        JobType: booking.JobType,
        ShipperName: booking.ShipperName,
        ShipperAddress: booking.ShipperAddress,
        ConsigneeName: booking.ConsigneeName,
        ConsigneeAddress: booking.ConsigneeAddress,
        DestinationAgent: booking.DestinationAgent,
        MBLDate: booking.MBLDate || null,
        POL: booking.POL,
        POD: booking.POD,
        FreightTerms: booking.FreightTerms,
      }
    })

    const valueToPatchOnMasterJob = {
      // Header fields
      DepartmentMasterSid: formValue.dept,
      POL: formValue.pol,
      POD: formValue.pod,
      VoyageMasterSid: this.selectedVoyage?.VoyageMasterSid,
      VesselName: this.selectedVoyage?.VesselName,
      VoyageNo: this.selectedVoyage?.VoyageNo,
      CarrierName: formValue.carrier,
      CutOffDate: this.selectedVoyage?.PortCutoff,
      ETD: formValue.ETD,
      ETA: formValue.ETA,
      Haz: isHaz ? 'Y' : 'N',

      // Calculated fields
      NoofPkg: this.totalPkg,
      GrossWeight: this.totalGrossWeight,
      NetWeight: this.totalNetWeight,
      Volume: this.totalVolume,

      // Shipment part
      bookingList: bookings,

      masterJobContainers: containers,
    }

    this.operationService.setLoadingPlanData(valueToPatchOnMasterJob);
    this.router.navigate(['operation/master-job/entry']);
  }

  onClickGenerateJob() {
    if (this.selectedBookings.length === 0) {
      this.appSettingService.showWarning('Please select at least one booking.');
      return;
    }
    this.spinnerService.show()
    const formValue = this.loadingPlanForm.getRawValue();
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const isHaz = this.selectedBookings.map(booking => booking.CargoType).some(bk => bk === 'Haz');
    const containers = this.masterJobContainers.getRawValue();
    const shipmentList = this.selectedBookings.map(booking => {
      return {
        BookingHeaderSid: booking.BookingHeaderSid,
        HBLNo: booking.HBLNo,
        JobType: booking.JobType
      }
    });
    const payload = {
      CreatedBy: userEmail,
      MenuMasterSid: currentMenuId,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DepartmentMasterSid: formValue.dept,
      POL: formValue.pol,
      POD: formValue.pod,
      NoOfPkg: this.totalPkg,
      GrossWeight: this.totalGrossWeight,
      NetWeight: this.totalNetWeight,
      Volume: this.totalVolume,
      Haz: isHaz ? 'Y' : 'N',
      VoyageMasterSid: this.selectedVoyage?.VoyageMasterSid,
      VesselName: this.selectedVoyage?.VesselName,
      VoyageNo: this.selectedVoyage?.VoyageNo,
      CarrierName: formValue.carrier,
      CarrierMasterSid: formValue.CarrierMasterSid,
      ETD: formValue.ETD,
      ETA: formValue.ETA,
      CutOffDate: this.selectedVoyage?.PortCutoff,
      shipmentList,
      masterJobContainers: containers
    }
    console.log('Sending payload with ETA/ETD:', payload);
    this.operationService.createMasterJob(payload).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess('Master Job generated successfully');
          this.spinnerService.hide();
          if (resp.data) {
            this.router.navigate(['/operation/master-job/entry', resp.data?.newMasterJob?.MasterJobSid]);
          }
        } else {
          this.appSettingService.showError('Error generating master job');
          this.spinnerService.hide();
        }
      },
      error: (error) => {
        this.appSettingService.showError('Failed to generate master job');
        console.error('Error generating master job:', error);
        this.spinnerService.hide();
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

  attachToMasterJob() {
    if (this.selectedBookings.length === 0) {
      this.appSettingService.showWarning('Please select at least one booking.');
      return;
    }
    const allSelectedBookings = this.selectedBookings.map((booking) => {
      return {
        ...booking,
        BookingDateTime: booking.BookingDate ? new Date(booking.BookingDate) : null,
      }
    })
    this.onSubmit.emit(allSelectedBookings);
  }

  closeTemplate() {
    this.closeModal.emit(true);
  }

  getParseInteger(value: any): string {
  if (!value && value !== 0) return '0.000';
  const num = parseFloat(value);
  return isNaN(num) ? '0.000' : num.toFixed(3);
}
  getParseIntegerNoDecimal(value: any): string {
  if (!value && value !== 0) return '0';
  const num = parseFloat(value);
  return isNaN(num) ? '0' : num.toString();
}
 loadHSSACLookups() {
    this.operationService.getAllHssac().subscribe({
      next: (resp: any) => {
        this.hssacList = resp || [];

      },
      error: (err) => {
        console.error('Error loading HSSAC data:', err);
        this.hssacList = [];
      }
    });
  }
  existInSelected(item) {
    return this.selectedBookings.find(b => b.BookingHeaderSid === item.BookingHeaderSid);
  }

  getVesselVoy(booking: any) {
    const vessel = booking.VesselName;
    const voyage = booking.VoyageNo;
    if (vessel && voyage) {
      return `${vessel} / ${voyage}`;
    }
    return '';
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  ngOnDestroy(): void {
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
  }

  openPrint() {
    this.ngbModal.open(this.loadingPlanPrint, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      scrollable: true
    });
  }

    getPortName(portCode: string): string {
    if (!portCode || !this.portList || this.portList.length === 0) {
      return portCode || '';
    }
    
    const port = this.portList.find(p => p.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  }
  
  async downloadPDF() {
    this.showPrintLogo = false;
    this.showPdfLogo = true;

    setTimeout(async () => {
      this.spinner.show();
      try {
        await this.pdfService.downloadBalancedPDF(
          'printContent',
          ``,
          () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
          (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
        );
      } finally {
        this.spinner.hide();
      }
    }, 50);
  }

  async generatePDFBlob(): Promise<Blob | null> {
    const printContent = document.getElementById('printContent');
    if (!printContent) {
      return null;
    }

    try {
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      return null;
    }
  }

  get totalPackages(): number {
    return this.loadingPlanData?.reduce((sum, i) => sum + (+i.NoOfPackage || 0), 0) || 0;
  }

  get totalGrossWeight1(): number {
    return this.loadingPlanData?.reduce((sum, i) => sum + (+i.GrossWeight || 0), 0) || 0;
  }

  get totalVolume1(): number {
    return this.loadingPlanData?.reduce((sum, i) => sum + (+i.Volume || 0), 0) || 0;
  }

  getDestinationAgent(id: number): string {
    if (!id || !this.agentList?.length) return '';
    const agent = this.agentList.find(a => a.CustomerMasterSid === id);
    return agent ? agent.CustomerName : '';
  }


  // print
  printDiv(divId: string): void {
    this.showPrintLogo = true;
    this.showPdfLogo = false;

    setTimeout(() => {
      const printContents = document.getElementById(divId)?.innerHTML;
      if (!printContents) return;

      const popupWin = window.open('', '_blank', 'width=900,height=600');
      if (popupWin) {
        popupWin.document.open();
        popupWin.document.write(`
        <html>
          <head>
            <title>Print</title>
          </head>
          <body onload="window.print(); window.close();">
            ${printContents}
          </body>
        </html>
      `);
        popupWin.document.close();
      }
    }, 50); // small timeout so Angular updates DOM
  }


  // pdf download


}
