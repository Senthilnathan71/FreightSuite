import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { NgbActiveModal, NgbNavModule, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { ExcelUploadService } from 'src/app/shared/services/excel-upload.service';
import { OperationService } from '../../../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-master-job-upload-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbNavModule,
    NgbAccordionModule
  ],
  templateUrl: './master-job-upload-modal.component.html',
  styleUrls: ['./master-job-upload-modal.component.scss']
})
export class MasterJobUploadModalComponent implements OnInit {
  @Input() currentCompany: any;
  @Input() currentBranch: any;
  @Input() userData: any;

  selectedFile: File | null = null;
  masterJobData: any = null;
  houseJobsData: any[] = [];
  containersData: any[] = [];
  voyagesData: any[] = [];
  connectionsData: any[] = [];
  othersData: any = null;
  errors: any[] = [];
  isProcessing = false;
  showPreview = false;

  masterJobForm!: FormGroup;
  houseJobsForm!: FormGroup;

  // Child data forms for Master Job
  containersForm!: FormGroup;
  voyagesForm!: FormGroup;
  masterConnectionsForm!: FormGroup;
  othersForm!: FormGroup;

  // Master Job table columns
  masterJobColumns: string[] = [];
  masterJobDisplayColumns: string[] = [];

  // House Jobs table columns
  houseJobColumns: string[] = [];
  houseJobDisplayColumns: string[] = [];

  // Active tab
  activeTab = 1;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private excelUploadService: ExcelUploadService,
    private operationService: OperationService,
    private appSettingsService: AppSettingsService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
  }

  initializeForms(): void {
    this.masterJobForm = this.fb.group({});
    this.houseJobsForm = this.fb.group({
      houseJobs: this.fb.array([])
    });

    // Initialize child data forms for Master Job
    this.containersForm = this.fb.group({
      containers: this.fb.array([])
    });
    this.voyagesForm = this.fb.group({
      voyages: this.fb.array([])
    });
    this.masterConnectionsForm = this.fb.group({
      connections: this.fb.array([])
    });
    this.othersForm = this.fb.group({});
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file
    const validation = this.excelUploadService.validateExcelStructure(file);
    if (!validation.valid) {
      this.appSettingsService.showError(validation.error || 'Invalid file');
      return;
    }

    this.selectedFile = file;
    this.parseExcelFile();
  }

  parseExcelFile(): void {
    if (!this.selectedFile) {
      return;
    }

    this.isProcessing = true;
    this.spinner.show();
    this.errors = [];

    this.excelUploadService.readExcelFile(this.selectedFile)
      .then(result => {
        if (result.errors && result.errors.length > 0) {
          this.errors = result.errors;
          this.appSettingsService.showError('Excel file has validation errors. Please review.');
          this.isProcessing = false;
          this.spinner.hide();
          return;
        }

        this.masterJobData = result.masterJob;
        this.houseJobsData = result.houseJobs;
        this.containersData = result.containers || [];
        this.voyagesData = result.voyages || [];
        this.connectionsData = result.connections || [];
        this.othersData = result.others || null;

        // Build forms with the data
        this.buildMasterJobForm();
        this.buildHouseJobsForm();
        this.buildContainersForm();
        this.buildVoyagesForm();
        this.buildMasterConnectionsForm();
        this.buildOthersForm();

        this.showPreview = true;
        this.isProcessing = false;
        this.spinner.hide();
        this.appSettingsService.showSuccess('Excel file parsed successfully');
      })
      .catch(error => {
        console.error('Error parsing Excel:', error);
        this.appSettingsService.showError('Error parsing Excel file');
        this.isProcessing = false;
        this.spinner.hide();
      });
  }

  buildMasterJobForm(): void {
    const formGroup: any = {};

    // Get all keys from master job data
    if (this.masterJobData) {
      Object.keys(this.masterJobData).forEach(key => {
        formGroup[key] = [this.masterJobData[key]];
      });

      this.masterJobForm = this.fb.group(formGroup);

      // Set columns for table display
      this.masterJobColumns = Object.keys(this.masterJobData);
      this.masterJobDisplayColumns = this.masterJobColumns.slice(0, 10); // Show first 10 columns
    }
  }

  buildHouseJobsForm(): void {
    const houseJobsArray = this.fb.array(
      this.houseJobsData.map(houseJob => {
        const houseJobGroup: any = {};

        // Build main house job fields (excluding nested arrays)
        Object.keys(houseJob).forEach(key => {
          if (key !== 'cargo' && key !== 'products' && key !== 'connections') {
            houseJobGroup[key] = [houseJob[key]];
          }
        });

        // Build nested cargo array
        const cargoArray = this.fb.array(
          (houseJob.cargo || []).map((cargo: any) => {
            const cargoGroup: any = {};
            Object.keys(cargo).forEach(key => {
              cargoGroup[key] = [cargo[key]];
            });
            return this.fb.group(cargoGroup);
          })
        );

        // Build nested products array
        const productsArray = this.fb.array(
          (houseJob.products || []).map((product: any) => {
            const productGroup: any = {};
            Object.keys(product).forEach(key => {
              productGroup[key] = [product[key]];
            });
            return this.fb.group(productGroup);
          })
        );

        // Build nested connections array
        const connectionsArray = this.fb.array(
          (houseJob.connections || []).map((connection: any) => {
            const connectionGroup: any = {};
            Object.keys(connection).forEach(key => {
              connectionGroup[key] = [connection[key]];
            });
            return this.fb.group(connectionGroup);
          })
        );

        houseJobGroup['cargo'] = cargoArray;
        houseJobGroup['products'] = productsArray;
        houseJobGroup['connections'] = connectionsArray;

        return this.fb.group(houseJobGroup);
      })
    );

    this.houseJobsForm = this.fb.group({
      houseJobs: houseJobsArray
    });

    // Set columns for table display (exclude nested arrays)
    if (this.houseJobsData.length > 0) {
      this.houseJobColumns = Object.keys(this.houseJobsData[0]).filter(
        key => key !== 'cargo' && key !== 'products' && key !== 'connections'
      );
      this.houseJobDisplayColumns = this.houseJobColumns.slice(0, 8); // Show first 8 columns
    }
  }

  buildContainersForm(): void {
    const containersArray = this.fb.array(
      this.containersData.map(container => {
        const containerGroup: any = {};
        Object.keys(container).forEach(key => {
          containerGroup[key] = [container[key]];
        });
        return this.fb.group(containerGroup);
      })
    );

    this.containersForm = this.fb.group({
      containers: containersArray
    });
  }

  buildVoyagesForm(): void {
    const voyagesArray = this.fb.array(
      this.voyagesData.map(voyage => {
        const voyageGroup: any = {};
        Object.keys(voyage).forEach(key => {
          voyageGroup[key] = [voyage[key]];
        });
        return this.fb.group(voyageGroup);
      })
    );

    this.voyagesForm = this.fb.group({
      voyages: voyagesArray
    });
  }

  buildMasterConnectionsForm(): void {
    const connectionsArray = this.fb.array(
      this.connectionsData.map(connection => {
        const connectionGroup: any = {};
        Object.keys(connection).forEach(key => {
          connectionGroup[key] = [connection[key]];
        });
        return this.fb.group(connectionGroup);
      })
    );

    this.masterConnectionsForm = this.fb.group({
      connections: connectionsArray
    });
  }

  buildOthersForm(): void {
    const formGroup: any = {};

    if (this.othersData) {
      Object.keys(this.othersData).forEach(key => {
        formGroup[key] = [this.othersData[key]];
      });
    }

    this.othersForm = this.fb.group(formGroup);
  }

  get houseJobsArray(): FormArray {
    return this.houseJobsForm.get('houseJobs') as FormArray;
  }

  get containersArray(): FormArray {
    return this.containersForm.get('containers') as FormArray;
  }

  get voyagesArray(): FormArray {
    return this.voyagesForm.get('voyages') as FormArray;
  }

  get masterConnectionsArray(): FormArray {
    return this.masterConnectionsForm.get('connections') as FormArray;
  }

  // Helper methods to get house job child arrays
  getHouseJobCargoArray(houseJobIndex: number): FormArray {
    return this.houseJobsArray.at(houseJobIndex).get('cargo') as FormArray;
  }

  getHouseJobProductsArray(houseJobIndex: number): FormArray {
    return this.houseJobsArray.at(houseJobIndex).get('products') as FormArray;
  }

  getHouseJobConnectionsArray(houseJobIndex: number): FormArray {
    return this.houseJobsArray.at(houseJobIndex).get('connections') as FormArray;
  }

  // Add/Remove methods for Master Job child data
  addContainer(): void {
    const containerGroup = this.fb.group({
      ContainerNumber: [''],
      ContainerType: [''],
      LineSeal: [''],
      CustomsSeal: [''],
      HsCode: [''],
      CommodityDescription: [''],
      PkgType: [''],
      NoOfPkg: [0],
      GrossWeight: [0],
      NetWeight: [0],
      ChargeableWeight: [0],
      Volume: [0],
      IsSoc: ['']
    });
    this.containersArray.push(containerGroup);
  }

  removeContainer(index: number): void {
    this.containersArray.removeAt(index);
  }

  addVoyage(): void {
    const voyageGroup = this.fb.group({
      VesselName: [''],
      VoyageNo: [''],
      ETD: [''],
      ETA: [''],
      ATA: [''],
      ATD: [''],
      DestinationATA: [''],
      CarrierName: ['']
    });
    this.voyagesArray.push(voyageGroup);
  }

  removeVoyage(index: number): void {
    this.voyagesArray.removeAt(index);
  }

  addMasterConnection(): void {
    const connectionGroup = this.fb.group({
      Mode: [''],
      POL: [''],
      POD: [''],
      VesselName: [''],
      VoyageNo: [''],
      ETD: [''],
      ETA: [''],
      Remarks: ['']
    });
    this.masterConnectionsArray.push(connectionGroup);
  }

  removeMasterConnection(index: number): void {
    this.masterConnectionsArray.removeAt(index);
  }

  // Add/Remove methods for House Job child data
  addHouseJobCargo(houseJobIndex: number): void {
    const cargoGroup = this.fb.group({
      CargoType: [''],
      ContainerType: [''],
      GrossWeight: [0],
      NetWeight: [0],
      Volume: [0],
      ChargeableWeight: [0],
      PackageType: [''],
      NoOfPackage: [0],
      FreightAmount: [0],
      ShipmentTerms: [''],
      FreightTerms: [''],
      ModeOfTransport: [''],
      MovementType: [''],
      NoofContainers: [0],
      Qty: [0],
      StuffingAt: [''],
      CommodityDescription: [''],
      MarksAndNumber: ['']
    });
    this.getHouseJobCargoArray(houseJobIndex).push(cargoGroup);
  }

  removeHouseJobCargo(houseJobIndex: number, cargoIndex: number): void {
    this.getHouseJobCargoArray(houseJobIndex).removeAt(cargoIndex);
  }

  addHouseJobProduct(houseJobIndex: number): void {
    const productGroup = this.fb.group({
      ProductName: [''],
      ProductDescription: [''],
      ShippingBillNo: [''],
      ShippingBillDate: [''],
      ExternaPkg: [''],
      ExternlQty: [''],
      GrossWeight: [0],
      NetWeight: [0],
      Volume: [0],
      CargoRecDate: [''],
      CFS: [''],
      Height: [0],
      ImcoClass: [''],
      IsHaz: ['N'],
      Length: [0],
      PkgGroup: [''],
      UnNo: [''],
      Width: [0],
      MarksAndNumber: ['']
    });
    this.getHouseJobProductsArray(houseJobIndex).push(productGroup);
  }

  removeHouseJobProduct(houseJobIndex: number, productIndex: number): void {
    this.getHouseJobProductsArray(houseJobIndex).removeAt(productIndex);
  }

  addHouseJobConnection(houseJobIndex: number): void {
    const connectionGroup = this.fb.group({
      Mode: [''],
      POL: [''],
      POD: [''],
      VesselName: [''],
      VoyageNo: [''],
      ETD: [''],
      ETA: [''],
      Remarks: ['']
    });
    this.getHouseJobConnectionsArray(houseJobIndex).push(connectionGroup);
  }

  removeHouseJobConnection(houseJobIndex: number, connectionIndex: number): void {
    this.getHouseJobConnectionsArray(houseJobIndex).removeAt(connectionIndex);
  }

  onProceed(): void {
    if (!this.masterJobForm || !this.houseJobsForm) {
      this.appSettingsService.showError('No data to process');
      return;
    }

    // Get form values
    const masterJob = this.masterJobForm.value;
    const houseJobs = this.houseJobsArray.value;
    const {
  POO,
  POL,
  POD,
  FPD,
  ETD,
  ETA
} = masterJob;

    // Get child data from forms
    const containers = this.containersArray.value;
    const voyages = this.voyagesArray.value;
    const connections = this.masterConnectionsArray.value;
    const others = this.othersForm.value;

    // Validate required fields
    if (!this.currentCompany?.CompanyMasterSid) {
      this.appSettingsService.showError('Company information missing');
      return;
    }

    if (!this.currentBranch?.BranchMasterSid) {
      this.appSettingsService.showError('Branch information missing');
      return;
    }

    if (!this.userData?.userEmail) {
      this.appSettingsService.showError('User information missing');
      return;
    }
   const menuMasterSid = Number(localStorage.getItem('currentMenuId'));
   
    // Prepare payload
    const payload = {
      masterJob: {
        ...masterJob,
        CompanyMasterSid: this.currentCompany.CompanyMasterSid,
        BranchMasterSid: this.currentBranch.BranchMasterSid,
        DepartmentMasterSid: masterJob.DepartmentMasterSid || 1, // Default department
        CreatedBy: this.userData.userEmail,
        MenuMasterSid: menuMasterSid
      },
      containers: containers || [],
      voyages: voyages || [],
      connections: connections || [],
      others: others || null,
      houseJobs: houseJobs.map((hj: any) => ({
        ...hj,   
  POO,
  POL,
  POD,
  FPD,
  ETD,
  ETA,
        CompanyMasterSid: this.currentCompany.CompanyMasterSid,
        BranchMasterSid: this.currentBranch.BranchMasterSid,
        DepartmentMasterSid: hj.DepartmentMasterSid || masterJob.DepartmentMasterSid || 1,
        CreatedBy: this.userData.userEmail,
        menuMasterSid: menuMasterSid
        // cargo, products, and connections are already included in hj from the form value
      })),
      companyMasterSid: this.currentCompany.CompanyMasterSid,
      branchMasterSid: this.currentBranch.BranchMasterSid,
      createdBy: this.userData.userEmail
    };

    this.isProcessing = true;
    this.spinner.show();

    this.operationService.processBulkUpload(payload).subscribe({
      next: (response) => {
        this.spinner.hide();
        this.isProcessing = false;

        if (response.status) {
          this.appSettingsService.showSuccess(response.message || 'Master Job and House Jobs created successfully');
          this.activeModal.close({ success: true, data: response.data });
        } else {
          if (response.data?.errors) {
            this.errors = response.data.errors;
          }
          this.appSettingsService.showError(response.message || 'Error creating jobs');
        }
      },
      error: (error) => {
        console.error('Error processing bulk upload:', error);
        this.spinner.hide();
        this.isProcessing = false;
        this.appSettingsService.showError('Error processing bulk upload');
      }
    });
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  onReUpload(): void {
    this.selectedFile = null;
    this.masterJobData = null;
    this.houseJobsData = [];
    this.containersData = [];
    this.voyagesData = [];
    this.connectionsData = [];
    this.othersData = null;
    this.errors = [];
    this.showPreview = false;
    this.initializeForms();
  }

  getErrorsForSheet(sheetName: string): any[] {
    return this.errors.filter(e => e.sheet === sheetName);
  }

  hasErrors(): boolean {
    return this.errors && this.errors.length > 0;
  }

  // Helper method to get form control for house job
  getHouseJobControl(index: number, fieldName: string): any {
    return this.houseJobsArray.at(index).get(fieldName);
  }

  // Helper method to check if field has error
  hasFieldError(field: string, sheet: string, row?: number): boolean {
    return this.errors.some(e =>
      e.field === field &&
      e.sheet === sheet &&
      (row === undefined || e.row === row)
    );
  }

  // Helper method to get error message for field
  getFieldError(field: string, sheet: string, row?: number): string {
    const error = this.errors.find(e =>
      e.field === field &&
      e.sheet === sheet &&
      (row === undefined || e.row === row)
    );
    return error ? error.message : '';
  }
}
