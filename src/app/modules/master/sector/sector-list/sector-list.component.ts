import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
import { Zone } from 'src/app/modules/crm-mobile/Interfaces/zone.interface';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';


@Component({
  selector: 'app-sector',
  standalone: true,
  imports: [
    NgbModalModule,
    FeatherModule,
    NgSelectModule,
    CommonModule,
    ReactiveFormsModule,
    NgbPagination,
    RouterModule,
    FormsModule,
    DatePipe,
    ListpageComponent
  ],
  templateUrl: './sector-list.component.html',
  styleUrl: './sector-list.component.scss',
  providers: [DatePipe]
})
export class SectorComponent implements OnInit {
  sectorForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  SectorMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  sectorList: any[] = [];
  statusList = ["Active", "Suspended"];
  zones: Zone[] = [];
  filteredZones: Zone[] = [];
  modalRef!: NgbModalRef;
  searchType = 'sectorName';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  isLoading = false;
  userData : any;
  sectorData : any;
  isFavorite: boolean = false;
  sortColumn: string = 'sectorName'; 
  sortDirection: string = 'asc';

  toggleFavorite() {
     this.isFavorite = !this.isFavorite;
  } 
  
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private userService :authService,
    private excelReportService : ExcelExportService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadZones();
    this.appSettingService.getUser().subscribe(
      user => {
        if (user) {
          this.userData = user;
        }
      }
    )
    this.route.paramMap.subscribe(params => {
      this.SectorMasterSid = +params.get('id');
      if (this.SectorMasterSid) {
        this.isEditMode = true;
        this.loadSectorData(this.SectorMasterSid);
      }
    });
  }

  initForm() {
    this.sectorForm = this.fb.group({
      sectorName: ['', [Validators.required, Validators.maxLength(50)]],
      sectorCode: ['', [Validators.required, Validators.maxLength(10), 
                       this.alphaNumericValidator(), this.uppercaseValidator()]],
      RegionName: [null, [Validators.maxLength(50)]],
      RegionCode: [null, [Validators.maxLength(10)]],
      status: [{value: 'Active', disabled: !this.isEditMode}, Validators.required]
    });

    this.sectorForm.get('sectorCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.sectorForm.get('sectorCode')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });

    this.sectorForm.get('RegionName')?.valueChanges.subscribe(zoneName => {
      if (zoneName) {
        const selectedZone = this.zones.find(z => z.ZoneName === zoneName);
        if (selectedZone) {
          this.sectorForm.get('RegionCode')?.setValue(selectedZone.ZoneCode, { emitEvent: false });
        }
      } else {
        this.sectorForm.get('RegionCode')?.setValue(null);
      }
    });
  }

  private alphaNumericValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z0-9]+$/.test(control.value);
      return valid ? null : { invalidAlphaNumeric: true };
    };
  }

  private uppercaseValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      return control.value === control.value.toUpperCase() ? null : { notUppercase: true };
    };
  }

  loadZones() {
    this.isLoading = true;
    this.masterService.getAllZones().subscribe({
      next: (response: any) => {
        this.zones = response.data || response || [];
        this.filteredZones = [...this.zones];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading zones:', err);
        this.appSettingService.showError('Failed to load zone data');
        this.isLoading = false;
        this.filteredZones = [...this.zones];
      }
    });
  }

  resetForm(): void {
    this.sectorForm.reset({
      status: 'Active'
    });
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.sectorForm.get('status')?.disable();
  this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
}

  editSector(id: number, content: any) {
    this.isEditMode = true;
    this.SectorMasterSid = id;
    this.masterService.getSectorById(id).pipe(take(1)).subscribe({
      next: (sector: any) => {
        this.sectorData = sector;
        this.sectorForm.patchValue({
          sectorName: sector.sectorName,
          sectorCode: sector.sectorCode,
          RegionName: sector.RegionName || null,
          RegionCode: sector.RegionCode || null,
          status: sector.status === 'A' ? 'Active' : 'Suspended'
        });
          this.sectorForm.get('status')?.enable();
      this.modalRef = this.modalService.open(content, {centered: true, size: 'lg', backdrop: 'static'});
     },
      error: (err) => {
        console.error('Error fetching Sector', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadSectorData(id: number) {
    this.masterService.getSectorById(id).subscribe(
      (data) => {
        this.sectorForm.patchValue({
          ...data,
          status: data.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  onSubmit() {
    if (this.sectorForm.invalid) {
      this.sectorForm.markAllAsTouched();
      this.sectorForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.sectorForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        ...updatedBy,
        status: formValue.status === "Active" ? "A" : "S"
      } : {
        ...formValue,
        ...createdBy,
        status: formValue.status === "Active" ? "A" : "S"
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateSector(this.SectorMasterSid, payload).subscribe(
          (resp: any) => {
            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.search();
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      } else {
        this.masterService.createSector(payload).subscribe(
          (resp: any) => {
            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.search();
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      }
    }
  }

  onSearch(event: { type: string, value: string }) {
  this.searchType = event.type;
  this.filterValue = event.value;
  console.log('Searching with:', this.searchType, this.filterValue);
  this.search();
}
sort(column: string) {
  if (this.sortColumn === column) {
    // Reverse the sort direction if clicking the same column
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new sort column and default to ascending
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }
  
  this.applySorting();
  this.updatePaginationData();
}

applySorting() {
  this.results.sort((a, b) => {
    let valueA = a[this.sortColumn];
    let valueB = b[this.sortColumn];
    
    // Handle null/undefined values
    if (valueA == null) valueA = '';
    if (valueB == null) valueB = '';
    
    // Convert to string for case-insensitive comparison
    valueA = valueA.toString().toLowerCase();
    valueB = valueB.toString().toLowerCase();
  
    if (valueA < valueB) {
      return this.sortDirection === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return this.sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'S'
        : this.filterValue
    };

    this.masterService.searchSectors(payload).subscribe((res: any) => {
      this.results = res.data || res;
      this.applySorting();
      console.log(this.results)
      this.searchPerformed = true;
      this.updatePaginationData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.sectorList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  softDeleteSector(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deleteSector(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          this.search();
        });
      }
    });
  }

  resetPage(): void {
    this.sectorList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'sectorName';
    this.sortColumn = 'sectorName';
    this.sortDirection = 'asc';
  }

  report(): void {
    const formattedData = this.sectorList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

        const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'sectorName', label: 'Sector Name' },
                { key: 'sectorCode', label: 'Sector Code' },
                { key: 'RegionName', label: 'Region Name' },
                { key: 'RegionCode', label: 'Region Code' },
                { key: 'status', label: 'Status' },
            ],
            fileName: 'Sector-Report', 
            title: companyName
        });
    }

  showInfo() {
    if(!this.sectorData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.sectorData;
    modalRef.componentInstance.idLabel = 'Sector Id';
    modalRef.componentInstance.idValue = this.sectorData?.SectorMasterSid;
  }
}