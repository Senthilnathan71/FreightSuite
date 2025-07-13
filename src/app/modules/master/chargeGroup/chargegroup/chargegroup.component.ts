import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-chargegroup',
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
    ListpageComponent,
    PreventMultiClickDirective,
    FavoriteStarComponent
  ],
  templateUrl: './chargegroup.component.html',
  styleUrl: './chargegroup.component.scss',
  providers: [DatePipe]
})
export class ChargegroupComponent implements OnInit {
  chargeGroupForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  ChargeGroupSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  chargeGroupList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: NgbModalRef;
  searchType = 'GroupName';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  isLoading = false;
  companyOptions: any[] = [];
  userData: any;
  chargeGroupData: any;
  currentMenuId: number;
  TandCList: any[] = [];
  isFavorite: boolean = false;
  sortColumn: string = 'GroupName';
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
    private userService: authService,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit(): void {
    this.appSettingService.getUser().subscribe(
      user => {
        if (user) {
          this.userData = user;
        }
      }
    );

    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.ChargeGroupSid = +params.get('id');
      if (this.ChargeGroupSid) {
        this.isEditMode = true;
        this.loadChargeGroupData(this.ChargeGroupSid);
      }
    });
    this.loadCompanies();
    this.loadChargeGroups();
  }

  loadChargeGroups(): void {
  const params = {
    search: this.filterValue?.trim() || '',
    page: this.page,
    pageSize: this.pageSize
  };

  this.masterService.searchChargeGroups(params).subscribe({
    next: (response: any) => {
      if (response?.data) {
        this.results = response.data.items || [];
        this.applySorting();
        this.updatePaginationData();
        this.chargeGroupList = [...this.results];
        this.totalLengthOfCollection = response.data.totalCount || 0;
        
      } else {
        this.results = [];
        this.chargeGroupList = [];
        this.totalLengthOfCollection = 0;
      }
      this.searchPerformed = true;
    },
    error: (err) => {
      console.error('Error loading charge groups:', err);
    }
  });
}

  loadCompanies(): void {
    this.masterService.getAllCompanies().subscribe({
      next: (companies) => {
        this.companyOptions = companies.data || companies;
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.appSettingService.showError('Failed to load companies');
      }
    });
  }

  initForm() {
    this.chargeGroupForm = this.fb.group({
      CompanyMasterSid: ['', Validators.required],
      GroupName: ['', [Validators.required, Validators.maxLength(100)]],
      Remarks: ['', [Validators.required, Validators.maxLength(100)]],
      status: [{ value: 'Active', disabled: false }, Validators.required]
    });
  }

  resetForm(): void {
    this.chargeGroupForm.get('status')?.disable();
    this.chargeGroupForm.reset({
      status: 'Active'
    });
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }
  trackByIndex(index: number, item: any): number {
  return index;
}

  editChargeGroup(id: number, content: any) {
    this.isEditMode = true;
    this.ChargeGroupSid = id;
    this.masterService.getChargeGroupById(id).pipe(take(1)).subscribe({
      next: (response: any) => {
        const chargeGroup = response.data;
        this.chargeGroupData = chargeGroup;
        this.chargeGroupForm.get('status')?.enable();
        this.chargeGroupForm.patchValue({
          CompanyMasterSid: chargeGroup.CompanyMasterSid,
          GroupName: chargeGroup.GroupName,
          Remarks: chargeGroup.Remarks || '',
          status: chargeGroup.status === 'A' ? 'Active' : 'Suspended'
        });
        this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
      },
      error: (err) => {
        console.error('Error fetching Charge Group', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadChargeGroupData(id: number) {
    this.masterService.getChargeGroupById(id).subscribe(
      (response: any) => {
        const data = response.data;
        this.chargeGroupForm.patchValue({
          CompanyMasterSid: data.CompanyMasterSid,
          GroupName: data.GroupName,
          Remarks: data.Remarks,
          status: data.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  clearFilterValue() {
    this.filterValue = '';
    this.loadChargeGroups();
  }

  onSubmit() {
    if (this.chargeGroupForm.get('status')?.disabled) {
      this.chargeGroupForm.get('status')?.enable();
    }
    if (this.chargeGroupForm.invalid) {
      this.chargeGroupForm.markAllAsTouched();
      this.chargeGroupForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    this.btnDisable = true;
    const formValue = this.chargeGroupForm.value;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];

    const payload = {
      ...formValue,
      status: formValue.status === "Active" ? "A" : "S",
      CompanyMasterSid: Number(formValue.CompanyMasterSid),
      ...(this.isEditMode ? { updatedBy: userEmail } : { createdBy: userEmail })
    };

    const operation = this.isEditMode
      ? this.masterService.updateChargeGroupById(this.ChargeGroupSid, payload)
      : this.masterService.createNewChargeGroup(payload);

    operation.subscribe({
      next: (resp: any) => {
        this.btnDisable = false;
        if (resp.status) {
          this.appSettingService.showSuccess(resp.message);
          this.closeModal();
          this.loadChargeGroups();
        } else {
          this.appSettingService.showError(resp.message);
        }
      },
      error: (err) => {
        this.btnDisable = false;
        this.errorMessage = err.message;
        console.error('Error:', err);
        this.appSettingService.showError('Operation failed');
      }
    });
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
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

      if (this.sortColumn === 'company') {
        valueA = a.companyMaster?.companyName;
        valueB = b.companyMaster?.companyName;
      }

      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

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

  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.chargeGroupList = this.results.slice(startIndex, endIndex);
  }

  onPageChange(page: number) {
    this.page = page;
    this.updatePaginationData();
  }

  deleteChargeGroupById(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deleteChargeGroupById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess('Deleted successfully!');
            this.loadChargeGroups();
          },
          error: (err) => {
            this.appSettingService.showError('Failed to delete');
          }
        });
      }
    });
  }

  resetPage(): void {
    this.filterValue = '';
    this.searchType = 'GroupName';
    this.page = 1;
    this.searchPerformed = false;
    this.results = [];
    this.chargeGroupList = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'GroupName';
    this.sortDirection = 'asc';
  }

  report(): void {
    const formattedData = this.chargeGroupList.map(item => ({
      ...item,
      company: item.companyMaster?.companyName,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'company', label: 'Company' },
        { key: 'GroupName', label: 'Group Name' },
        { key: 'Remarks', label: 'Remarks' },
        { key: 'status', label: 'Status' },
      ],
      fileName: 'Charge-Group-Report',
      title: companyName
    });
  }

  showInfo() {
    if (!this.chargeGroupData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.chargeGroupData;
    modalRef.componentInstance.idLabel = 'Charge Group Id';
    modalRef.componentInstance.idValue = this.chargeGroupData?.ChargeGroupSid;
  }

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.ChargeGroupSid;
        } else {
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
  }

  openEmail() {
    if (!this.chargeGroupData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    if (!this.chargeGroupData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.chargeGroupData;
    modalRef.componentInstance.idLabel = 'Charge Group Id';
    modalRef.componentInstance.idValue = this.chargeGroupData?.ChargeGroupSid;
  }

  openEDoc() {
    if (!this.chargeGroupData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.chargeGroupData;
    modalRef.componentInstance.idLabel = 'Charge Group Id';
    modalRef.componentInstance.idValue = this.chargeGroupData?.ChargeGroupSid;
  }
}