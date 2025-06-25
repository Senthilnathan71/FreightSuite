import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';

@Component({
  selector: 'app-charge-tax',
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
  templateUrl: './charge-tax.component.html',
  styleUrl: './charge-tax.component.scss',
  providers: [DatePipe]
})
export class ChargeTaxComponent implements OnInit {
  chargeTaxForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  ChargeTaxMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  chargeTaxList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: NgbModalRef;
  searchType = 'HSNCode';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  isLoading = false;
  userData:any;
  companyList: any[] = [];
  selectedCompanyId: number;
  chargeTaxData : any;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit(): void {
      this.appSettingService.getUser().subscribe(user => {
    if (user) {
      this.userData = user;
    }
  });
   this.loadCompanies();
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.ChargeTaxMasterSid = +params.get('id');
      if (this.ChargeTaxMasterSid) {
        this.isEditMode = true;
        this.loadChargeTaxData(this.ChargeTaxMasterSid);
      }
    });
  }
  loadCompanies(): void {
    this.masterService.getAllCompanies().subscribe({
      next: (res) => {
        this.companyList = res.data || res;
      },
      error: (err) => {
        console.error('Error loading companies', err);
        this.appSettingService.showError('Failed to load companies');
      }
    });
  }

  initForm() {
    this.chargeTaxForm = this.fb.group({
      HSNCode: ['', [Validators.required, Validators.maxLength(10)]],
      description: ['', [Validators.required, Validators.maxLength(100)]],
      TaxGroup: ['', [Validators.required, Validators.maxLength(10)]],
      TaxRate: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      Remarks: ['', [Validators.maxLength(100)]],
      status: [{value: 'Active', disabled: false}, Validators.required],
      CompanyMasterSid: ['', Validators.required]
    });
  }

  resetForm(): void {
    this.chargeTaxForm.get('status')?.disable();
    this.chargeTaxForm.reset({
      status: 'Active'
    });
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  editChargeTax(id: number, content: any) {
    this.isEditMode = true;
    this.ChargeTaxMasterSid = id;
    this.masterService.getChargeTaxById(id).pipe(take(1)).subscribe({
      next: (response: any) => {
        const chargeTax = response.data; 
        this.chargeTaxData = chargeTax;
        this.chargeTaxForm.get('status')?.enable();
        this.chargeTaxForm.patchValue({
          HSNCode: chargeTax.HSNCode,
          description: chargeTax.description,
          TaxGroup: chargeTax.TaxGroup,
          TaxRate: chargeTax.TaxRate,
          Remarks: chargeTax.Remarks || '',
          status: chargeTax.Status === 'A' ? 'Active' : 'Suspended',
          CompanyMasterSid: chargeTax.CompanyMasterSid
        });
        this.modalRef = this.modalService.open(content, {centered: true, size: 'lg', backdrop: 'static'});
      },
      error: (err) => {
        console.error('Error fetching Charge Tax', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  loadChargeTaxData(id: number) {
    this.masterService.getChargeTaxById(id).subscribe(
      (response: any) => {
        const data = response.data;
        this.chargeTaxForm.patchValue({
          HSNCode: data.HSNCode,
          description: data.description,
          TaxGroup: data.TaxGroup,
          TaxRate: data.TaxRate,
          Remarks: data.Remarks,
          status: data.Status === 'A' ? 'Active' : 'Suspended',
          CompanyMasterSid: data.CompanyMasterSid
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  onSubmit() {
  if (this.chargeTaxForm.get('status')?.disabled) {
    this.chargeTaxForm.get('status')?.enable();
  }
  
  if (this.chargeTaxForm.invalid) {
    this.chargeTaxForm.markAllAsTouched();
    this.chargeTaxForm.updateValueAndValidity();
    this.appSettingService.showWarning('Please fill all required fields correctly.');
    return;
  }

  const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
  const formValue = this.chargeTaxForm.value;

  // Prepare the payload
  const payload: any = {
    HSNCode: formValue.HSNCode,
    description: formValue.description,
    TaxGroup: formValue.TaxGroup,
    TaxRate: parseFloat(formValue.TaxRate),
    Remarks: formValue.Remarks || '',
    Status: formValue.status === "Active" ? "A" : "S",
    CompanyMasterSid: formValue.CompanyMasterSid,
    ...(this.isEditMode ? {UpdatedBy : currentUserEmail} : {CreatedBy : currentUserEmail})
  };


  if (this.isEditMode) {
    this.masterService.updateChargeTaxById(this.ChargeTaxMasterSid, payload).subscribe(
      (resp: any) => {
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
        console.error('Error updating:', error);
        this.appSettingService.showError('Failed to update Charge Tax');
      }
    );
  } else {
    this.masterService.createNewChargeTax(payload).subscribe(
      (resp: any) => {
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
        console.error('Error creating:', error);
        this.appSettingService.showError('Failed to create Charge Tax');
      }
    );
  }
}

onSearch(event: { type: string, value: string }) {
  this.searchType = event.type;
  this.filterValue = event.value;
  console.log('Searching with:', this.searchType, this.filterValue);
  this.search();
}
  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'S'
        : this.filterValue
    };

    this.masterService.searchChargeTax(payload).subscribe((res: any) => {
      this.results = res.data || res;
      this.searchPerformed = true;
      this.updatePaginationData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.chargeTaxList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteChargeTaxById(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deleteChargeTaxById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          this.search();
        });
      }
    });
  }

  resetPage(): void {
    this.chargeTaxList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'HSNCode';
  }

  report(): void {
   const formattedData = this.chargeTaxList.map(item => ({
    ...item,
    Status: item.Status === 'A' ? 'Active' : 'Suspended'
  }));

  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'HSNCode', label: 'HSN Code' },
        { key: 'description', label: 'Description' },
        { key: 'TaxGroup', label: 'Tax Group' },
        { key: 'TaxRate', label: 'Tax Rate (%)' },
        { key: 'Status', label: 'Status' },
        { key: 'Remarks', label: 'Remarks' }
    ],
  fileName: 'Charge-tax-Report', 
    title: companyName
  });
}

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  showInfo() {
    if(!this.chargeTaxData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.chargeTaxData;
    modalRef.componentInstance.idLabel = 'ChargeTax Id';
    modalRef.componentInstance.idValue = this.chargeTaxData?.ChargeTaxMasterSid;
  }

}