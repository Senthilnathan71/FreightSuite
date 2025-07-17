import { CommonModule, DatePipe } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
import {
  FormsModule,
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import {
  NgbModalModule,
  NgbPagination,
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
import { Division } from 'src/app/modules/crm-mobile/Interfaces/division.interface';
import { NgSelectModule } from '@ng-select/ng-select';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { take } from 'rxjs';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-division',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPagination,
    RouterModule,
    NgbModalModule,
    NgSelectModule,
    ReactiveFormsModule,
    OnlyTextDirective,
    TextWithNumbersDirective,
    DatePipe,
    ListpageComponent,
    PreventMultiClickDirective,
    FavoriteStarComponent,
  ],
  templateUrl: './division.component.html',
  styleUrl: './division.component.scss',
})
export class DivisionComponent {
  divisionForm!: FormGroup;
  isEditMode: boolean = false;
  divisions: Division[] = [];
  results: any[] = [];
  DivisionMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  divisionList: any[] = [];
  statusList = ['Active', 'Suspended'];
  companyList: any[] = [];
  modalRef!: NgbModalRef;
  companyMap: { [id: number]: string } = {};
  searchType = 'DivisionName';
  filterValue = '';
  searched = false;
  page = 1;
  pageSize = 5;
  totalLengthOfCollection = 0;
  userData: any;
  divisionData: any;
  currentMenuId: number;
  TandCList: any;
  isFavorite: boolean = false;
  sortColumn: string = 'DivisionName';
  sortDirection: string = 'asc';
  permissions: string[] = [];
  currentMenuPermissions: any = {};
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
    private excelReportService: ExcelExportService
  ) {}

  ngOnInit(): void {
    this.appSettingService.getUser().subscribe((user) => {
      if (user) {
        this.userData = user;
        this.checkPermissions();
      }
    });
    this.getAllCompanies();
    this.loadCompanies();
    this.loadDivisions();
    this.initForm();
    this.route.paramMap.subscribe((params) => {
      this.DivisionMasterSid = +params.get('DivisionMasterSid');
      if (this.DivisionMasterSid) {
        this.isEditMode = true;
        this.loadDivisionData(this.DivisionMasterSid);
      }
    });
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId);
    console.log(userRole);
    if (currentMenuId && userRole) {
      this.masterService
        .getRoleMenuPermissions(currentMenuId, userRole)
        .subscribe({
          next: (response) => {
            this.currentMenuPermissions = response.data.MenuPermissions || {};
            this.permissions = Object.keys(this.currentMenuPermissions).filter(
              (key) => this.currentMenuPermissions[key] === 'isTrue'
            );
            console.log(this.permissions);
          },
        });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  loadDivisions(): void {
    const params = {
      search: this.filterValue ? this.filterValue.trim() : '',
      page: this.page,
      pageSize: this.pageSize,
    };

    this.masterService.searchDivisionList(params).subscribe({
      next: (response) => {
        if (response.data) {
          this.divisionList = response.data.items;
          this.results = [...this.divisionList];
          this.totalLengthOfCollection = response.data.totalCount;
          this.applySorting();
          this.searched = true;
        }
      },
      error: (err) => {
        console.error('Error fetching divisions:', err);
        this.divisionList = [];
        this.results = [];
        this.totalLengthOfCollection = 0;
      },
    });
  }

  initForm() {
    this.divisionForm = this.fb.group({
      DivisionName: ['', [Validators.required]],
      DivisionCode: ['', [Validators.required]],
      // address: ['', [Validators.required]],
      CompanyMasterSid: ['', [Validators.required]],
      Remarks: [''],
      status: [{ value: 'Active', disabled: false }, Validators.required],
    });
  }

  resetForm(): void {
    // Disable status field and set to 'Active' for create mode
    this.divisionForm.get('status')?.disable();
    this.divisionForm.reset({
      status: 'Active',
    });
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    });
  }

  openEditModal(content: any, DivisionMasterSid: number): void {
    this.isEditMode = true;
    this.DivisionMasterSid = DivisionMasterSid;
    this.getDivisionById(DivisionMasterSid).add(() => {
      this.modalRef = this.modalService.open(content, {
        centered: true,
        size: 'lg',
        backdrop: 'static',
      });
    });
  }

  updateDivisionById(DivisionMasterSid: number, content: any) {
    this.isEditMode = true;
    this.DivisionMasterSid = DivisionMasterSid;
    this.masterService
      .getDivisionById(DivisionMasterSid)
      .pipe(take(1))
      .subscribe({
        next: (division: any) => {
          this.divisionForm.get('status')?.enable();
          this.divisionData = division;
          this.divisionForm.patchValue({
            DivisionName: division.DivisionName,
            DivisionCode: division.DivisionCode,
            CompanyMasterSid: Number(division.CompanyMasterSid),
            Remarks: division.Remarks,
            status: division.status === 'A' ? 'Active' : 'Suspended',
          });
          this.modalRef = this.modalService.open(content, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
          });
        },
        error: (err) => {
          console.error('Error fetching', err);
          this.appSettingService.showError('Error fetching data for editing');
        },
      });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  getDivisionById(DivisionMasterSid: number) {
    this.resetForm();
    return this.masterService
      .getDivisionById(DivisionMasterSid)
      .pipe(take(1))
      .subscribe(
        (division: any) => {
          console.log('Division from backend:', division);
          this.divisionForm.patchValue({
            DivisionName: division.DivisionName,
            DivisionCode: division.DivisionCode,
            CompanyMasterSid: Number(division.CompanyMasterSid),
            Remarks: division.Remarks,
            status: division.status === 'A' ? 'Active' : 'Suspended',
          });
        },
        (error) => {
          this.appSettingService.showError('Error loading');
        }
      );
  }

  onSubmit() {
    if (this.btnDisable) return;
    if (this.divisionForm.get('status')?.disabled) {
      this.divisionForm.get('status')?.enable();
    }
    if (this.divisionForm.invalid) {
      this.divisionForm.markAllAsTouched();
      this.divisionForm.updateValueAndValidity();
      this.appSettingService.showWarning(
        'Please fill all required fields correctly.'
      );
      return;
    } else {
      this.btnDisable = true;
      let createdBy = {
        createdBy: this.appSettingService.userSettingSource.value['userEmail'],
      };
      let updatedBy = {
        updatedBy: this.appSettingService.userSettingSource.value['userEmail'],
      };
      const formValue = this.divisionForm.value;

      const payload = this.isEditMode
        ? {
            ...formValue,
            CompanyMasterSid: Number(formValue.CompanyMasterSid),
            ...updatedBy,
            status: formValue.status === 'Active' ? 'A' : 'I',
          }
        : {
            ...formValue,
            CompanyMasterSid: Number(formValue.CompanyMasterSid),
            ...createdBy,
            status: formValue.status === 'Active' ? 'A' : 'I',
          };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService
          .updateDivisionById(this.DivisionMasterSid, payload)
          .subscribe(
            (resp: any) => {
              if (resp.status) {
                this.appSettingService.showSuccess(resp.message);
                this.closeModal();
                this.router.navigate(['master/division']);
              } else {
                this.appSettingService.showError(resp.message);
              }
              this.btnDisable = false;
            },
            (error) => {
              this.errorMessage = error.message;
              console.error('Update Division Error:', error);
              this.btnDisable = false;
            }
          );
      } else {
        this.masterService.createNewDivision(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.router.navigate(['master/division']);
            } else {
              this.appSettingService.showError(resp.message);
            }
            this.btnDisable = false;
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Create Division Error:', error);
            this.btnDisable = false;
          }
        );
      }
    }
  }

  statusMap: { [key: string]: string } = {
    A: 'Active',
    IA: 'Suspended',
  };

  loadDivisionData(DivisionMasterSid: number) {
    this.masterService.getDivisionById(DivisionMasterSid).subscribe(
      (divisionData) => {
        this.divisionForm.patchValue({
          ...divisionData,
          status: divisionData.status === 'A' ? 'Active' : 'Suspended',
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
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
    this.updatePaginatedData();
  }

  applySorting() {
    this.results.sort((a, b) => {
      let valueA = a[this.sortColumn];
      let valueB = b[this.sortColumn];

      // Handle null/undefined values
      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      // Special handling for company names
      if (this.sortColumn === 'CompanyMasterSid') {
        valueA = this.companyMap[valueA] || '';
        valueB = this.companyMap[valueB] || '';
      }

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

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadDivisions();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteDivision(DivisionMasterSid) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService
          .deleteDivision(DivisionMasterSid)
          .subscribe((resp: any) => {
            this.appSettingService.showSuccess('Deleted!');
            this.router.navigate(['master/division/list']);
            this.loadDivisions();
          });
      }
    });
  }

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe((res) => {
      this.companyList = res;
    });
  }

  loadCompanies() {
    this.masterService.getAllCompanies().subscribe((companies: any[]) => {
      this.companyMap = {};
      companies.forEach((c) => {
        this.companyMap[c.CompanyMasterSid] = c.companyName;
      });
    });
  }

  resetPage(): void {
    this.filterValue = '';
    this.page = 1;
    this.divisions = [];
    this.divisionList = [];
    this.totalLengthOfCollection = 0;
    this.searched = false;
    this.sortColumn = 'DivisionName';
    this.sortDirection = 'asc';
  }

  report(): void {
    const formattedData = this.divisionList.map((item) => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended',
      CompanyName:
        this.companyMap[item.CompanyMasterSid] || item.CompanyMasterSid,
    }));

    const companyName =
      this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ??
      'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'DivisionName', label: 'Division Name' },
        { key: 'DivisionCode', label: 'Division Code' },
        { key: 'CompanyName', label: 'Company' },
        { key: 'Remarks', label: 'Remarks' },
        { key: 'status', label: 'Status' },
      ],
      fileName: 'Division-Report',
      title: companyName,
    });
  }

  showInfo() {
    if (!this.divisionData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.divisionData;
    modalRef.componentInstance.idLabel = 'Division Id';
    modalRef.componentInstance.idValue = this.divisionData?.DivisionMasterSid;
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
            centered: true,
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.DivisionMasterSid;
        } else {
          this.appSettingService.showError(
            'Error loading Terms and Conditions'
          );
        }
      },
      (error) => {
        this.appSettingService.showError(
          'Error loading Terms and Conditions',
          error
        );
      }
    );
  }
  openEmail() {
    if (!this.divisionData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
  }

  openAuthority() {
    if (!this.divisionData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.divisionData;
    modalRef.componentInstance.idLabel = 'Division Id';
    modalRef.componentInstance.idValue = this.divisionData?.DivisionMasterSid;
  }

  openEDoc() {
    if (!this.divisionData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.divisionData;
    modalRef.componentInstance.idLabel = 'BLClause Id';
    modalRef.componentInstance.idValue = this.divisionData?.DivisionMasterSid;
  }

  clearFilterValue() {
    this.filterValue = '';
  }
}
