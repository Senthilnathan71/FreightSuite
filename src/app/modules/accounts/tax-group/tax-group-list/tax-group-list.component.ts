import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  NgbModal,
  NgbModalRef,
  NgbModalModule,
  NgbPagination,
  NgbDatepickerModule,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbCalendar,
} from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from 'src/app/modules/master/master.service';
import { take } from 'rxjs';
import { authService } from 'src/app/modules/authentication/auth.service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { MatDialog } from '@angular/material/dialog';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { ParseFlags } from '@angular/compiler';
import { CustomDatePipe } from "../../../../core/pipes/custom-date-format.pipe";

@Component({
  selector: 'app-tax-group-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    NgbPagination,
    NgbModalModule,
    FeatherModule,
    NgSelectModule,
    ListpageComponent,
    NgbDatepickerModule,
    FavoriteStarComponent,
    EmailEntryComponent,
    EdocComponent,
    TermsAndConditionsComponent,
    AuthorityEntryComponent,
    DetailsComponent,
    CustomDatePipe
],
  templateUrl: './tax-group-list.component.html',
  styleUrl: './tax-group-list.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class TaxGroupListComponent {
  taxGroupForm!: FormGroup;
  isEditMode = false;
  modalRef!: NgbModalRef;
  TaxMasterSid!: number;
  results: any[] = [];
  taxGroupList: any[] = [];
  page = 1;
  pageSize = 5;
  totalLengthOfCollection = 0;
  errorMessage = '';
  searchPerformed = false;
  searchType = 'TaxName';
  filterValue = '';
  sortColumn: string = 'TaxName';
  sortDirection: string = 'asc';
  selectedId!: number;
  isFavorite = false;
  taxGroupData: any;
  userData: any;
  TandCList: any;
  currentMenuId: number;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  searched = false;
  loading = true;
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private router: Router,
    private userService: authService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService,
    private calendar: NgbCalendar
  ) { }

  modeofTaxType = [
    { id: 1, name: 'Input' },
    { id: 2, name: 'Output' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.taxGroupForm.valueChanges.subscribe(() => { });
    this.loadTaxGroups();
  }

  loadTaxGroups(): void {
    this.loading = true;

    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    this.masterService.searchTaxGroup(params).subscribe({
      next: (response) => {
        if (response) {
          this.taxGroupList = response.items;
          this.totalLengthOfCollection = response.totalCount;
          this.applySorting();
          this.searchPerformed = true;
          this.searched = true;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching tax groups:', err);
        this.taxGroupList = [];
        this.totalLengthOfCollection = 0;
        this.loading = false;
      }
    });
  }

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  initForm(): void {
    this.taxGroupForm = this.fb.group({
      TaxName: ['', Validators.required],
      TaxCode: ['', Validators.required],
      TaxType: [null, Validators.required],
      EffectiveFrom: ['', Validators.required],
      TaxRate: [null, Validators.required],
      TaxExempt: [false],
      Remarks: [''],
    });
  }

  resetForm(): void {
    this.taxGroupForm.reset();
  }

  private formatDateForExport(date: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

  openModal(content: any): void {
    this.resetForm();
    this.isEditMode = false;
    this.modalRef = this.modalService.open(content, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    });
  }

  openEditModal(content: any, id: number): void {
    this.isEditMode = true;
    this.selectedId = id;

    this.masterService
      .fetchTaxById(id)
      .pipe(take(1))
      .subscribe({
        next: (taxGroup: any) => {
          this.taxGroupData = taxGroup;

          this.taxGroupForm.patchValue({
            TaxName: taxGroup.TaxName,
            TaxCode: taxGroup.TaxCode,
            TaxType: taxGroup.TaxType,
            EffectiveFrom: new Date(taxGroup.EffectiveFrom),
            TaxRate: taxGroup.TaxRate,
            TaxExempt: taxGroup.TaxExempt === 'Y' ? true : false,
            Remarks: taxGroup.Remarks,
          });

          this.modalRef = this.modalService.open(content, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
          });
        },
        error: () => {
          this.appSettingService.showError('Error loading data for editing.');
        },
      });
  }

  onSubmit(): void {
    if (this.taxGroupForm.get('Status')?.disabled) {
      this.taxGroupForm.get('Status')?.enable();
    }
    if (this.taxGroupForm.invalid) {
      this.taxGroupForm.markAllAsTouched();
      this.taxGroupForm.updateValueAndValidity();
      this.appSettingService.showWarning(
        'Please fill all required fields correctly.'
      );
      return;
    }
    const formValue = this.taxGroupForm.value;
    const CreatedBy = {
      CreatedBy: this.appSettingService.userSettingSource.value['userEmail'],
    };
    const UpdatedBy = {
      UpdatedBy: this.appSettingService.userSettingSource.value['userEmail'],
    };

    const payload = this.isEditMode
      ? {
        ...formValue,
        TaxRate: parseFloat(formValue.TaxRate),
        TaxExempt: formValue.TaxExempt ? 'Y' : 'N',
        ...UpdatedBy,
      }
      : {
        ...formValue,
        TaxRate: parseFloat(formValue.TaxRate),
        TaxExempt: formValue.TaxExempt ? 'Y' : 'N',
        ...CreatedBy,
      };

    console.log('payload', payload);

    if (this.isEditMode) {
      this.masterService.updateTaxById(this.selectedId, payload).subscribe(
        (res: any) => {
          if (res.status) {
            this.appSettingService.showSuccess(res.message);
            this.closeModal();
          } else {
            this.appSettingService.showError(res.message);
          }
        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Update failed:', error);
        }
      );
    } else {
      this.masterService.createNewTax(payload).subscribe(
        (res: any) => {
          if (res.status) {
            this.appSettingService.showSuccess(res.message);
            this.closeModal();
          } else {
            this.appSettingService.showError(res.message);
          }
        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Creation failed:', error);
        }
      );
    }
  }

  // loadTaxGroups(): void {
  //   this.masterService.getAllTax().subscribe({
  //     next: (res: any) => {
  //       this.results = res.data;
  //       console.log(this.results);

  //       this.searchPerformed = true;
  //       if (this.results.length > 0) {
  //         this.applySorting();
  //         this.updatePaginationData();
  //         this.totalLengthOfCollection = this.results.length;
  //       } else {
  //         this.taxGroupList = [];
  //         this.totalLengthOfCollection = 0;
  //       }
  //     },
  //     error: () =>
  //       this.appSettingService.showError('Error fetching Tax Groups'),
  //   });
  // }

  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadTaxGroups();
  }

  applySorting(): void {
    this.taxGroupList.sort((a, b) => {
      let valA = (a[this.sortColumn] || '').toString().toLowerCase();
      let valB = (b[this.sortColumn] || '').toString().toLowerCase();
      return this.sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }

  updatePaginationData(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.loadTaxGroups();
  }

  trackByIndex(index: number): number {
    return index;
  }
  clearFilterValue() {
    this.filterValue = '';
    this.loadTaxGroups();
  }

  // softDeleteTaxGroup(id: number): void {
  //   const dialogRef = this.dialog.open(DeleteWarningComponent);
  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result === true) {
  //       this.masterService.deleteTax(id).subscribe((resp: any) => {
  //         this.appSettingService.showSuccess('Deleted!');
  //         this.router.navigate(['accounts/tax-group/list']);

  //       });
  //     }
  //   });
  // }

  closeModal(): void {
    if (this.modalRef && typeof this.modalRef.close === 'function') {
      this.modalRef.close();
    }
  }



  resetPage(): void {
    this.taxGroupList = [];
    this.results = [];
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'TaxName';
    this.page = 1;
    this.sortColumn = 'TaxName';
    this.sortDirection = 'asc';
  }

  report(): void {
    const formattedData = this.taxGroupList.map((item) => ({
      ...item,
      Status: item.Status === 'A' ? 'Active' : 'Suspended',
      EffectiveFrom: this.formatDateForExport(item.EffectiveFrom),
    }));
    const companyName =
      this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ??
      'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'TaxName', label: 'Tax Name' },
        { key: 'TaxCode', label: 'Tax Code' },
        { key: 'TaxType', label: 'Tax Type' },
        { key: 'EffectiveFrom', label: 'Effective From' },
        { key: 'TaxRate', label: 'Tax Rate' },
        { key: 'Remarks', label: 'Tax Reason' },
      ],
      fileName: 'Tax-Report',
      title: companyName,
    });
  }

  showInfo() {
    if (!this.taxGroupData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.taxGroupData;
    modalRef.componentInstance.idLabel = 'Cost-Center Id';
    modalRef.componentInstance.idValue = this.taxGroupData?.TaxMasterSid;
  }

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.Status) {
          this.TandCList = resp.data;
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true,
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.TaxMasterSid;
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
    if (!this.taxGroupData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.taxGroupData;
    modalRef.componentInstance.idLabel = 'Cost-Center Id';
    modalRef.componentInstance.idValue = this.taxGroupData?.TaxMasterSid;
  }

  openAuthority() {
    if (!this.taxGroupData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.taxGroupData;
    modalRef.componentInstance.idLabel = 'Cost-Center Id';
    modalRef.componentInstance.idValue = this.taxGroupData?.TaxMasterSid;
  }

  openEDoc() {
    if (!this.taxGroupData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.taxGroupData;
    modalRef.componentInstance.idLabel = 'Cost-Center Id';
    modalRef.componentInstance.idValue = this.taxGroupData?.TaxMasterSid;
  }
}
