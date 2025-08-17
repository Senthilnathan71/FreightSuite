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
} from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { TemplateRef } from '@angular/core';

@Component({
  selector: 'app-ledger-mapping',
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
    CustomDatePipe,
  ],
  templateUrl: './ledger-mapping.component.html',
  styleUrl: './ledger-mapping.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class LedgerMappingComponent {
  ledgerForm!: FormGroup;
  isEditMode = false;
  modalRef!: NgbModalRef;
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  ledgerMappingList: any[] = [];
  results: any[] = [];
  sortColumn = 'ledgerName';
  sortDirection = 'asc';
  isFavorite = false;
  filterValue = '';
  searchPerformed = false;
  searched = false;
  ledgerMappingData: any;
  errorMessage = '';
  userData: any;
  TandCList: any;
  currentMenuId: number;
  isLoading = false;
  ledgerList = [];
  LedgerMappingId!: number;
  ledgerNames: string[] = [];
  ledgerList1: any[] = [];
  selectedLedger: any = null;
  subledgerMappingOptions: any[] = [];
  subledgerMappingList: any[] = [];
  customerList: any[] = [];
  chargeList: any[] = [];

  
auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;



  // Company
  currentCompany : any;
  currentBranch : any;
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private userService: authService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.appSettingService.getUser().subscribe((user) => {
      if (user) this.userData = user;
    });

    this.initForm();
    this.loadLedgerMappings();
    this.getLedgerList();
    this.ledgerForm.get('subledgerType')?.valueChanges.subscribe((value) => {
      this.onSubledgerTypeChange(value);
    });

    this.route.paramMap.subscribe((params) => {
      this.LedgerMappingId = +params.get('id');
      if (this.LedgerMappingId) {
        this.isEditMode = true;
        this.loadLedgerMappingData(this.LedgerMappingId);
      }
    });
  }

  modeOfStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];

  modeOfSubledgerType = [
    { id: 1, name: 'Customer', value: 'customer' },
    { id: 2, name: 'Charge', value: 'charge' },
  ];

  initForm(): void {
    this.ledgerForm = this.fb.group({
      SubledgerName: ['', Validators.required],
      SubledgerType: ['', Validators.required],
      SubledgerMappingSid: ['', Validators.required],
      COAMasterSid: ['', Validators.required],
      Status: ['Active'],
      Remarks: [''],
    });
  }

  loadLedgerMappings(): void {
    this.isLoading = true;
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
    };

    this.masterService.searchSubledgerMaster(params).subscribe({
      next: (response: any) => {
        if (response.data) {
          this.results = response.data.items || [];
          this.applySorting();
          // this.updatePaginationData();
          this.ledgerMappingList = [...this.results];
          this.searched = true;
          this.totalLengthOfCollection = response.data.totalCount || 0;
        } else {
          this.results = [];
          this.ledgerMappingList = [];
          this.totalLengthOfCollection = 0;
        }
        this.searchPerformed = true;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading ledger mappings:', err);
        this.isLoading = false;
      },
    });
  }

  loadLedgers(): void {
    this.masterService.getAllSuledgermaster().subscribe({
      next: (res) => {
        this.ledgerList = res.data || res;
      },
      error: (err) => {
        console.error('Error loading ledgers', err);
        this.appSettingService.showError('Failed to load ledgers');
      },
    });
  }

  getLedgerList(): void {
    this.masterService.getAllCoa().subscribe({
      next: (data) => {
        this.ledgerList = data;
      },
      error: (err) => {
        console.error('Error fetching ledger list', err);
      },
    });
  }

  updatePaginationData(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.loadLedgerMappings();
  }

  onSubledgerTypeChange(selectedType: string): void {
    this.ledgerForm.get('SubledgerMappingSid')?.reset();

    if (selectedType === 'Customer') {
      this.masterService.getAllCustomers().subscribe((res: any) => {
        console.log('API Response:', res);

        const data = res?.data ?? res;

        if (Array.isArray(data)) {
          this.subledgerMappingOptions = data.map((item: any) => ({
            id: item.CustomerMasterSid,
            name: item.CustomerName,
          }));
          console.log('Mapped Options:', this.subledgerMappingOptions);
        } else {
          console.warn('Subledger data is not an array:', data);
        }
      });
    } else if (selectedType === 'Charge') {
      this.masterService.getAllCharges().subscribe((res: any) => {
        console.log('API Response:', res);

        const data = res?.data ?? res;

        if (Array.isArray(data)) {
          this.subledgerMappingOptions = data.map((item: any) => ({
            id: item.ChargeMasterSid,
            name: item.chargeName,
          }));
          console.log('Mapped Options:', this.subledgerMappingOptions);
        } else {
          console.warn('Subledger data is not an array:', data);
        }
      });
    }
  }

  
openAuditLogs(modal: TemplateRef<any>) {
  if (!this.LedgerMappingId) return;

  this.masterService.getAuditLogsSubledgerMaster('SubledgerMaster', this.LedgerMappingId.toString()).subscribe({
    next: (logs: any[]) => {
      const formatFields = (val: any) => {
        if (!val) return ['NA'];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        delete obj.updatedOn; // Remove updatedOn field
        // If no fields exist after deleting updatedOn
        if (Object.keys(obj).length === 0) return ['NA'];
        return Object.entries(obj).map(
          ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
        );
      };

      this.auditLogs = logs.map(log => ({
        ...log,
        oldValDisplay: formatFields(log.oldVal),
        newValDisplay: formatFields(log.newVal)
      }));

      this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
    },
    error: err => console.error('Error fetching audit logs:', err)
  });
}

  deleteSudledgerMaster(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deleteSudledgerMaster(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
        });
      }
    });
  }

  openModal(content: TemplateRef<any>, id?: number): void {
    this.modalRef = this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });

    if (id) {
      this.isEditMode = true;
      this.LedgerMappingId = id;
      this.loadLedgerMappingData(id);
      console.log(this.loadLedgerMappingData);
    } else {
      this.isEditMode = false;
      this.ledgerForm.reset();
    }
  }

  editLedgerMapping(id: number, content: any): void {
    this.isEditMode = true;
    this.LedgerMappingId = id;

    this.masterService.fetchSubledgerMasterId(id).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const data = res.data;
          this.onSubledgerTypeChange(data.SubledgerType);
          this.ledgerForm.patchValue({
            SubledgerName: data.SubledgerName,
            SubledgerType: data.SubledgerType,
            COAMasterSid: data.COAMasterSid,
            SubledgerMappingSid: data.SubledgerMappingSid,
            CompanyMasterSid: data.CompanyMasterSid,
            Status: data.Status === 'A' ? 'Active' : 'Suspended',
          });

          this.modalRef = this.modalService.open(content, {
            size: 'lg',
            centered: true,
            backdrop: 'static',
          });

          this.ledgerMappingData = data;
        }
      },
      error: () =>
        this.appSettingService.showError('Failed to load data for editing.'),
    });
  }

  loadLedgerMappingData(id: number): void {
    this.masterService.fetchSubledgerMasterId(id).subscribe({
      next: (res: any) => {
        const data = res.data;
        this.ledgerForm.patchValue({
          SubledgerName: data.SubledgerName,
          SubledgerType: data.SubledgerType,
          SubledgerMappingSid: data.SubledgerMappingSid,
          COAMasterSid: data.LedgerName,
          Remarks: data.Remarks,
          Status: data.Status === 'A' ? 'Active' : 'Suspended',
        });
        this.onSubledgerTypeChange(data.SubledgerType);
      },
      error: () =>
        this.appSettingService.showError('Error loading ledger mapping'),
    });
  }

  deleteLedgerMapping(id: number): void {
    const ref = this.dialog.open(DeleteWarningComponent);
    ref.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deleteSudledgerMaster(id).subscribe(() => {
          this.appSettingService.showSuccess('Deleted!');
          this.loadLedgerMappings();
        });
      }
    });
  }

  onSubmit(): void {
    if (this.ledgerForm.invalid) {
      this.ledgerForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all required fields.');
      return;
    }

    const form = this.ledgerForm.value;

    const mappedStatus = form.Status === 'Active' ? 'A' : 'S';
    const currentuseremail =
    this.appSettingService.userSettingSource.value['userEmail'];
    const payload = this.isEditMode
      ? {
          ...this.ledgerForm.value,
          Status: mappedStatus,
          UpdatedBy: currentuseremail,
        }
      : {
          ...this.ledgerForm.value,
          Status: mappedStatus,
          CreatedBy: currentuseremail,
        };

    if (this.isEditMode) {
      this.masterService
        .updateSubledgerMasterById(this.LedgerMappingId, payload)
        .subscribe({
          next: (res: any) => {
            this.appSettingService.showSuccess(res.message);
            this.closeModal();
            this.loadLedgerMappings();
          },
          error: () =>
            this.appSettingService.showError('Failed to update Ledger Mapping'),
        });
    } else {
      this.masterService.createNewSubledgerMaster(payload).subscribe({
        next: (res: any) => {
          this.appSettingService.showSuccess(res.message);
          this.closeModal();
          this.loadLedgerMappings();
        },
        error: () =>
          this.appSettingService.showError('Failed to create Ledger Mapping'),
      });
    }
  }

  resetForm(): void {
    this.ledgerList = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'ledgerName';
    this.sortDirection = 'asc';
    this.searched = false;
    this.filterValue = '';
  }

  closeModal(): void {
    if (this.modalRef && typeof this.modalRef.close === 'function') {
      this.modalRef.close();
    }
  }

 
  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  applySorting(): void {
    this.ledgerMappingList.sort((a, b) => {
      const valA = (this.getNestedValue(a, this.sortColumn) ?? '').toString().toLowerCase();
      const valB = (this.getNestedValue(b, this.sortColumn) ?? '').toString().toLowerCase();

      return this.sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }

  getNestedValue(item: any, column: string): any {
    switch (column) {
      case 'COAName':
        return item.CoaMaster?.LedgerName;
      case 'COACode':
        return item.CoaMaster?.LedgerCode;
      case 'Branch':
        return item.CoaMaster?.CompanyMaster?.branchMaster?.[0]?.branchName;
      case 'Currency':
        return item.CoaMaster?.CurrencyMaster?.currencyName;
      case 'Status':
        return item.Status === 'A' ? 'Active' : 'Suspended';
      default:
        return item[column];
    }
  }


  trackByIndex(index: number): number {
    return index;
  }

  clearFilterValue(): void {
    this.filterValue = '';
    this.loadLedgerMappings();
  }

report(): void {
  const formattedData = this.ledgerMappingList.map((item) => ({
    LedgerCode: item.CoaMaster?.LedgerCode || '',
    LedgerName: item.CoaMaster?.LedgerName || '',
    branchName: item.CoaMaster?.CompanyMaster?.branchMaster?.[0]?.branchName || '',
    currencyName: item.CoaMaster?.CurrencyMaster?.currencyName || '',
    Status: item.Status === 'A' ? 'Active' : 'Suspended'
  }));

  const companyName = this.currentCompany?.companyName ?? 'Company';

  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'LedgerName', label: 'COA Name' },
      { key: 'LedgerCode', label: 'COA code' },
      { key: 'branchName', label: 'Branch Name' },
      { key: 'currencyName', label: 'Currency' },
      { key: 'Status', label: 'Status' }
    ],
    fileName: 'Ledger-Mapping-Report',
    title: companyName
  });
}


  showInfo(): void {
    if (!this.ledgerMappingData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.ledgerMappingData;
    modalRef.componentInstance.idLabel = 'Ledger Mapping Id';
    modalRef.componentInstance.idValue = this.ledgerMappingData?.id;
  }

  openEmail(): void {
    if (!this.ledgerMappingData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.ledgerMappingData;
  }

  openAuthority(): void {
    if (!this.ledgerMappingData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.ledgerMappingData;
  }

  openEDoc(): void {
    if (!this.ledgerMappingData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.ledgerMappingData;
  }

  openTandC(): void {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe({
      next: (resp: any) => {
        this.TandCList = resp.data;
        const modalRef = this.modalService.open(TermsAndConditionsComponent, {
          size: 'lg',
          backdrop: 'static',
          centered: true,
        });
        modalRef.componentInstance.terms = this.TandCList;
        modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
        modalRef.componentInstance.DocumentSid = this.ledgerMappingData?.id;
      },
      error: () => {
        this.appSettingService.showError('Error loading Terms and Conditions');
      },
    });
  }
}
