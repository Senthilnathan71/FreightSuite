import { CommonModule } from '@angular/common';
import { Component,TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbModal, NgbModalModule, NgbModalRef, NgbPagination, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { Inco } from 'src/app/modules/crm-mobile/Interfaces/inco.intefaces';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
@Component({
  selector: 'app-inco',
  standalone: true,
  imports: [
    FeatherModule,
    RouterModule,
    CommonModule,
    NgSelectModule,
    ReactiveFormsModule,
    FormsModule,
    NgbPagination,
    ListpageComponent,
    OnlyTextDirective,
    TextWithNumbersDirective,
    PreventMultiClickDirective,
    NgbModalModule,
    FavoriteStarComponent,
    NgxSpinnerModule
  ],
  templateUrl: './inco.component.html',
  styleUrl: './inco.component.scss'
})
export class IncoComponent{
  incoForm!: FormGroup;
  isEditMode: boolean = false;
  incos: Inco[] [];
  results: any[] = [];
  IncoMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  incoList: any[] = [] ;
  modalRef!: NgbModalRef;
  searchType = 'IncoName';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 15;
  totalLengthOfCollection = 0;
	userData : any;
  incoData: any;
  currentMenuId: number;
  TandCList: any;
  sortColumn: string = 'IncoName';
  sortDirection: string = 'asc';
  isFavorite: boolean = false;
  loading = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
    // Company
  currentCompany : any;
  currentBranch : any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 

  statusList = ["Active", "Suspended"];

  incoTypeOptions = [
    { id: 'Sea' , name: 'Sea'},
    { id: 'All' , name: 'All'}
  ];

  oceanFreightOptions = [
    { id: 'Prepaid' , name: 'Prepaid'},
    { id: 'Collect' , name: 'Collect'}
  ];

  constructor( 
    private router: Router,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService
  ) {  }

  ngOnInit(): void {
    // this.loadInco()
    this.initForm();
    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //        this.checkPermissions();
    //     }
    //   }
    // )
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
    this.route.paramMap.subscribe(params => {
      this.IncoMasterSid = +params.get('id');
      if (this.IncoMasterSid) {
        this.isEditMode = true;
        this.loadIncoData(this.IncoMasterSid);
      }
    });
    this.loadIncos();
  }

      checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId)
    console.log(userRole)
    if (currentMenuId && userRole) {
     this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
  next: (response) => {
    this.currentMenuPermissions = response.data.MenuPermissions || {};
    this.permissions = Object.keys(this.currentMenuPermissions)
      .filter(key => this.currentMenuPermissions[key] === 'isTrue');
      console.log(this.permissions)
  }
});
    }
  }
 
  hasPermission(permission: string): boolean {
  return this.permissions.includes(permission);
}

  loadIncos(): void {
  this.spinner.show();
  this.loading = true;
  
  const params = {
    search: this.filterValue?.trim() || '',
    page: this.page,
    pageSize: this.pageSize,
    sortColumn: this.sortColumn,
    sortDirection: this.sortDirection
  };

  this.masterService.searchInco(params).subscribe({
    next: (response) => {
      if(response.status) {
        this.incoList = response.data.items;
        this.totalLengthOfCollection = response.data.totalCount;
        this.applySorting();
        this.searchPerformed = true;
      }else {
        this.appSettingService.showError(response.message);
      }
      this.spinner.hide();
      this.loading = false;
    },
    error: (err) => {
      console.error('Error fetching incos:', err);
      this.incoList = [];
      this.totalLengthOfCollection = 0;
      this.loading = false;
    }
  });
}

  // loadInco(): void {
  //   this.masterService.getAllInco().subscribe(
  //     (resp: Inco[]) => {
  //       console.log(resp, 'Inco')
  //       this.incos = resp['data'];
  //     },
  //     (error) => {
  //       this.errorMessage = error.message;
  //       console.error('Error loading:', error);
  //     }
  //   );
  // }

  initForm() {
    this.incoForm = this.fb.group({
      IncoCode: ['', [Validators.required]],
      IncoName: ['', [Validators.required]],
      IncoType: ['', [Validators.required]],
      OceanFreight: ['', [Validators.required]],
      Remarks : [''],
      IncoDescription : [''],
      Status: [{value: 'A', disabled: false}, Validators.required]
    });
  }
   resetForm(): void {
    this.incoForm.get('Status')?.disable();
    this.incoForm.reset({
      Status: 'Active'
    });
   }

   openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
   }

   openEditModal(content: any, id: number): void {
    this.isEditMode = true;
    this.IncoMasterSid = id;
    this.getIncoById(id).add(() => {
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  });
   }

   editInco(id: number, content: any) {
    this.isEditMode = true;
    this.IncoMasterSid = id;
    this.masterService.getIncoById(id).pipe(take(1)).subscribe({
      next: (inco: any) => {
        this.incoData = inco;
        this.incoForm.get('Status')?.enable();
        this.incoForm.patchValue({
          IncoCode: inco.IncoCode,
          IncoName: inco.IncoName,
          IncoType: inco.IncoType,
          OceanFreight: inco.OceanFreight,
          Remarks : inco.Remarks,
          IncoDescription : inco.IncoDescription,
          Status: inco.Status === 'A' ? 'Active' : 'Suspended'
        });
        this.modalRef = this.modalService.open(content, {centered: true, size: 'lg', backdrop: 'static'});
      },
      error: (err) => {
        console.error('Error fetching Inco', err);
        this.appSettingService.showError('Error fetching data for edting');
      }
    });
   }

   closeModal(): void {
    if (this.modalRef && typeof this.modalRef.close === 'function') {
      this.modalRef.close();
      this.modalRef = null!;
    }
  }

  getIncoById(id: number) {
    this.resetForm();
    return this.masterService.getIncoById(id).pipe(take(1)).subscribe(
      (inco: any) => {
        console.log('Inco from backend:', inco);
        this.incoForm.patchValue({
          IncoCode: inco.IncoCode,
          IncoName: inco.IncoName,
          IncoType: inco.IncoType,
          OceanFreight: inco.OceanFreight,
          Remarks : inco.Remarks,
          IncoDescription : inco.IncoDescription,
          Status: inco.Status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error  loading');
      }
    );
  }

  onSubmit() {
    if (this.incoForm.get('Status')?.disabled) {
      this.incoForm.get('Status')?.enable();
    }
    if (this.incoForm.invalid) {
      this.incoForm.markAllAsTouched();
      this.incoForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let CreatedBy = { CreatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let UpdatedBy = { UpdatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.incoForm.value;
      
      const payload = (this.isEditMode) ? {
        ...formValue,
        ...UpdatedBy,
        Status: formValue.Status === "Active" ? "A" : "S"
      } : {
        ...formValue,
        ...CreatedBy,
        Status: formValue.Status === "Active" ? "A" : "S"
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.editInco(this.IncoMasterSid, payload).subscribe(
          (resp: any) => {
            console.log(resp.message);
            if (resp.Status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.router.navigate(['master/inco']);
              this.loadIncos();
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
        this.masterService.createInco(payload).subscribe(
          (resp: any) => {
            console.log(resp);
            if (resp.Status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.router.navigate(['master/inco']);
              this.loadIncos();
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

  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended'
  };

  loadIncoData(id: number) {
    this.masterService.getIncoById(id).subscribe(
      (data) => {
        this.incoForm.patchValue({
          ...data,
          Status: data.Status === 'A' ? 'Active' : 'Suspended'
        },
      );
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  
  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadIncos();
  }

  applySorting() {
  this.incoList.sort((a, b) => {
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
updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadIncos();
  }

   clearFilterValue() {
    this.filterValue = '';
   this.loadIncos();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  softDeleteInco(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.softDeleteInco(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          this.router.navigate(['master/inco']);
          this.loadIncos();
          
        });
      }
    });
  }

  resetPage(): void {
    this.incoList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'IncoName';
    this.page = 1;
    this.incos = [];
    this.sortColumn = 'IncoName';
    this.sortDirection = 'asc';
    this.loadIncos();
  }

  report(): void {
    const formattedData = this.incoList.map(item => ({
      ...item,
      Status: item.Status === 'A' ? 'Active' : 'Suspended'
    }));
    //  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
    const companyName = this.currentCompany?.companyName ?? 'Company';
     this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'IncoCode', label: 'Inco Code' },
        { key: 'IncoName', label: 'Inco Name' },
        { key: 'IncoType', label: 'Inco Type' },
        { key: 'OceanFreight', label: 'Ocean Freight' },
        { key: 'Status', label: 'Status' },
      ],
      fileName: 'Inco-Report',
      title: companyName
     });
  }

  showInfo() {
    if(!this.incoData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.incoData;
        modalRef.componentInstance.idLabel = 'Inco Id';
        modalRef.componentInstance.idValue = this.incoData?.IncoMasterSid;
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
              centered: true
            });
            modalRef.componentInstance.terms = this.TandCList;
            modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
            modalRef.componentInstance.DocumentSid = this.IncoMasterSid;
  
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
      if (!this.incoData) return;
      const modalRef = this.modalService.open(EmailEntryComponent, {
        size: 'lg',
        centered: true,
        backdrop: 'static'
      });
    }

openAuthority() {
  if (!this.incoData) return;
  const modalRef = this.modalService.open(AuthorityEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.incoData;
  modalRef.componentInstance.idLabel = 'Inco Id';
  modalRef.componentInstance.idValue = this.incoData?.IncoMasterSid;
}

openEDoc() {
  if (!this.incoData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.incoData;
  modalRef.componentInstance.idLabel = 'Inco Id';
  modalRef.componentInstance.idValue = this.incoData?.IncoMasterSid;
}
 openAuditLogs(modal: TemplateRef<any>) {
  if (!this.IncoMasterSid) return;

  this.masterService.getAuditLogs('IncoMaster', this.IncoMasterSid.toString()).subscribe({
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
}
