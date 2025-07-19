// import { Component } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
// import { NgSelectModule } from '@ng-select/ng-select';
// import { FeatherModule } from 'angular-feather';
// import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

// @Component({
//   selector: 'app-ledger-mapping',
//   standalone: true,
//   imports: [
//     FavoriteStarComponent,
//     NgbModalModule,
//     FeatherModule,
//     ReactiveFormsModule,
//     NgSelectModule
//   ],
//   templateUrl: './ledger-mapping.component.html',
//   styleUrl: './ledger-mapping.component.scss'
// })
// export class LedgerMappingComponent {
//   modalRef!: NgbModalRef;
//   ledgerForm!: FormGroup;

//   constructor(private modalService: NgbModal, private fb: FormBuilder) {}



//    modeOfStatus=[
//     {id:"Active",name:"Active"},
//     {id:"Suspended",name:"Suspended"},
//   ]
//   openModal(content: any): void {
//     this.initForm(); 
//     this.modalRef = this.modalService.open(content, {
//       centered: true,
//       size: 'lg',
//       backdrop: 'static'
//     });
//   }

//   initForm(): void {
//     this.ledgerForm = this.fb.group({
//       Name: ['', Validators.required],
//       Code: ['', Validators.required],
//       Remarks:['']
//     });
//   }

//   onSubmit() {
//     if (this.ledgerForm.invalid) {
//       this.ledgerForm.markAllAsTouched();
//       return;
//     }

//     console.log('Form Submitted:', this.ledgerForm.value);
//     this.modalRef.close();
//   }
// }


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
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';

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
    CustomDatePipe
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
  selectedId!: number;
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
  ledgerMappingData: any;
  errorMessage = '';
  userData: any;
  TandCList: any;
  currentMenuId: number;
  isLoading = false;
  ledgerList=[];
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private router: Router,
    private userService: authService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadLedgerMappings();
  }


 
  initForm(): void {
    this.ledgerForm = this.fb.group({
      ledgerName: ['', Validators.required],
      subledgerType: ['', Validators.required] 
    });
  }

 loadLedgerMappings(): void {
  this.isLoading = true;
  const params = {
    search: this.filterValue?.trim() || '',
    page: this.page,
    pageSize: this.pageSize
  };

  this.masterService.searchSubledgerMaster(params).subscribe({
    next: (response: any) => {
      if (response.data) {
        this.results = response.data.items || [];
        this.applySorting();
        // this.updatePaginationData();
        this.ledgerMappingList = [...this.results];
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
    }
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
    }
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



   modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Suspended",name:"Suspended"},
  ]

  modeOfSubledgerType=[
    {id:1,name:"Customer"},
    {id:2,name:"Charge"},
    {id:3,name:"Others"}
  ]


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
    this.masterService.fetchSubledgerMasterId(id).pipe(take(1)).subscribe({
      next: (data: any) => {
        this.ledgerMappingData = data;
        this.ledgerForm.patchValue({
          ledgerName: data.ledgerName,
          accountCode: data.accountCode,
          description: data.description,
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

    deleteLedgerMapping(id: number): void {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deleteSudledgerMaster(id).subscribe((resp: any) => {
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

    const formValue = this.ledgerForm.value;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const payload = {
      ...formValue,
      ...(this.isEditMode ? { UpdatedBy: userEmail } : { CreatedBy: userEmail }),
    };

    if (this.isEditMode) {
      this.masterService.updateSubledgerMasterById(this.selectedId, payload).subscribe({
        next: (res: any) => {
          this.appSettingService.showSuccess(res.message);
          this.closeModal();
        },
        error: (error) => {
          this.errorMessage = error.message;
        },
      });
    } else {
      this.masterService.createNewSubledgerMaster(payload).subscribe({
        next: (res: any) => {
          this.appSettingService.showSuccess(res.message);
          this.closeModal();
        },
        error: (error) => {
          this.errorMessage = error.message;
        },
      });
    }
  }

  resetForm(): void {
    this.ledgerForm.reset();
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
    this.loadLedgerMappings();
  }

  applySorting(): void {
    this.ledgerMappingList.sort((a, b) => {
      let valA = (a[this.sortColumn] || '').toString().toLowerCase();
      let valB = (b[this.sortColumn] || '').toString().toLowerCase();
      return this.sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }

  trackByIndex(index: number): number {
    return index;
  }

  clearFilterValue(): void {
    this.filterValue = '';
    this.loadLedgerMappings();
  }

  report(): void {
    const formattedData = this.ledgerMappingList.map(item => ({
      ...item
    }));
    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'ledgerName', label: 'Ledger Name' },
        { key: 'accountCode', label: 'Account Code' },
        { key: 'description', label: 'Description' }
      ],
      fileName: 'Ledger-Mapping-Report',
      title: companyName,
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
