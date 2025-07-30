import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { CostCenter } from 'src/app/modules/crm-mobile/Interfaces/cost-center.interfaces';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MatDialog } from '@angular/material/dialog';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { take } from 'rxjs';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-cost-center',
  standalone: true,
  imports: [
    FeatherModule,
    NgSelectModule,
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbPagination,
    ListpageComponent,
    OnlyTextDirective,
    TextWithNumbersDirective,
    PreventMultiClickDirective,
    NgbModalModule,
    FavoriteStarComponent
  ],
  templateUrl: './cost-center.component.html',
  styleUrl: './cost-center.component.scss'
})
export class CostCenterComponent {
   costCenterForm!: FormGroup;
   isEditMode: boolean = false;
   costCenters: CostCenter[] =[];
   results: any[] = [];
   CostCenterMasterSid!: number;
   errorMessage: string = '';
   btnDisable: boolean = false;
   costCenterList: any[] =[];
   modalRef!: NgbModalRef;
   searchType = 'CostCenterName';
   filterValue = '';
   searchPerformed = false;
   page = 1;
   pageSize = 15;
   totalLengthOfCollection = 0;
   userData: any;
   costCenterData: any;
   currentMenuId: number;
   TandCList: any;
   sortColumn: string = 'CostCenterName';
   sortDirection: string = 'asc';
   isFavorite: boolean = false;
   loading = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 

  statusList = ["Active", "Suspended"];

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
      // this.loadCostCenter()
      this.initForm();
      this.appSettingService.getUser().subscribe(
        user => {
          if (user) {
            this.userData = user;
            this.checkPermissions();
          }
        }
      )
      this.route.paramMap.subscribe(params => {
        this.CostCenterMasterSid = +params.get('id');
        if (this.CostCenterMasterSid) {
          this.isEditMode = true;
          this.loadCostCenterData(this.CostCenterMasterSid);
        }
      });
      this.loadCostCenters();
    }
    loadCostCenters(): void {
  this.loading = true;
  
  const params = {
    search: this.filterValue?.trim() || '',
    page: this.page,
    pageSize: this.pageSize,
    sortColumn: this.sortColumn,
    sortDirection: this.sortDirection
  };

  this.masterService.searchCostCenter(params).subscribe({
    next: (response) => {
      if(response) {
        this.costCenterList = response.items;
        this.totalLengthOfCollection = response.totalCount;
        this.applySorting();
        this.searchPerformed = true;
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('Error fetching cost centers:', err);
      this.costCenterList = [];
      this.totalLengthOfCollection = 0;
      this.loading = false;
    }
  });
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
  
    // loadCostCenter(): void {
    //   this.masterService.getAllCostCenter().subscribe(
    //     (resp: CostCenter[]) => {
    //       console.log(resp, 'CostCenter')
    //       this.costCenters = resp['data'];
    //     },
    //     (error) => {
    //       this.errorMessage = error.message;
    //       console.error('Error loading:', error);
    //     }
    //   );
    // }
  
    initForm() {
      this.costCenterForm = this.fb.group({
        CostCenterCode: ['', [Validators.required]],
        CostCenterName: ['', [Validators.required]],
        Remarks: ['', [Validators.required]],
        Status: [{value: 'A', disabled: false}, Validators.required]
      });
    }
     resetForm(): void {
      this.costCenterForm.get('Status')?.disable();
      this.costCenterForm.reset({
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
      this.CostCenterMasterSid = id;
      this.getCostCenterById(id).add(() => {
      this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
    });
     }
  
     editCostCenter(id: number, content: any) {
      this.isEditMode = true;
      this.CostCenterMasterSid = id;
      this.masterService.getCostCenterById(id).pipe(take(1)).subscribe({
        next: (costCenter: any) => {
          this.costCenterData = costCenter;
          this.costCenterForm.get('Status')?.enable();
          this.costCenterForm.patchValue({
            CostCenterCode: costCenter.CostCenterCode,
            CostCenterName: costCenter.CostCenterName,
            Remarks: costCenter.Remarks,
            Status: costCenter.Status === 'A' ? 'Active' : 'Suspended'
          });
          this.modalRef = this.modalService.open(content, {centered: true, size: 'lg', backdrop: 'static'});
        },
        error: (err) => {
          console.error('Error fetching Cost-Center', err);
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
  
    getCostCenterById(id: number) {
      this.resetForm();
      return this.masterService.getCostCenterById(id).pipe(take(1)).subscribe(
        (costCenter: any) => {
          console.log('Cost-Center from backend:', costCenter);
          this.costCenterForm.patchValue({
            CostCenterCode: costCenter.CostCenterCode,
            CostCenterName: costCenter.CostCenterName,
            Remarks: costCenter.Remarks,
            Status: costCenter.Status === 'A' ? 'Active' : 'Suspended'
          });
        },
        (error) => {
          this.appSettingService.showError('Error  loading');
        }
      );
    }
  
    onSubmit() {
      if (this.costCenterForm.get('Status')?.disabled) {
        this.costCenterForm.get('Status')?.enable();
      }
      if (this.costCenterForm.invalid) {
        this.costCenterForm.markAllAsTouched();
        this.costCenterForm.updateValueAndValidity();
        this.appSettingService.showWarning('Please fill all required fields correctly.');
        return;
      } else {
        let CreatedBy = { CreatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
        let UpdatedBy = { UpdatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
        const formValue = this.costCenterForm.value;
        
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
          this.masterService.editCostCenter(this.CostCenterMasterSid, payload).subscribe(
            (resp: any) => {
              console.log(resp.message);
              if (resp.Status) {
                this.appSettingService.showSuccess(resp.message);
                this.closeModal();
                this.router.navigate(['master/cost-center']);
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
          this.masterService.createCostCenter(payload).subscribe(
            (resp: any) => {
              console.log(resp);
              if (resp.Status) {
                this.appSettingService.showSuccess(resp.message);
                this.closeModal();
                this.router.navigate(['master/cost-center']);
              } else {
                this.appSettingService.showSuccess(resp.message);
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
  
    loadCostCenterData(id: number) {
      this.masterService.getCostCenterById(id).subscribe(
        (data) => {
          this.costCenterForm.patchValue({
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
      this.loadCostCenters();
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
  clearFilterValue() {
  this.filterValue = '';
  this.loadCostCenters();
  }
  updatePaginationData(): void {
      const startIndex = (this.page - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      this.loadCostCenters();
    }
  
    trackByIndex(index: number, item: any): number {
      return index;
    }
  
    softDeleteCostCenter(id) {
      const dialogRef = this.dialog.open(DeleteWarningComponent);
      dialogRef.afterClosed().subscribe((result) => {
        if (result === true) {
          this.masterService.softDeleteCostCenter(id).subscribe((resp: any) => {
            this.appSettingService.showSuccess('Deleted!');
            this.router.navigate(['master/cost-center']);
            
          });
        }
      });
    }
  
    resetPage(): void {
      this.costCenterList = [];
      this.totalLengthOfCollection = 0;
      this.searchPerformed = false;
      this.filterValue = '';
      this.searchType = 'CostCenterName';
      this.page = 1;
      this.costCenters = [];
      this.sortColumn = 'CostCenterName';
      this.sortDirection = 'asc';
    }
  
    report(): void {
      const formattedData = this.costCenterList.map(item => ({
        ...item,
        Status: item.Status === 'A' ? 'Active' : 'Suspended'
      }));
       const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  
       this.excelReportService.exportAsExcel({
        data: formattedData,
        headers: [
          { key: 'CostCenterCode', label: 'Cost-Center Code' },
          { key: 'CostCenterName', label: 'Cost-Center Name' },
          { key: 'Remarks', label: 'Remarks' },
          { key: 'Status', label: 'Status' },
        ],
        fileName: 'Cost-Center-Report',
        title: companyName
       });
    }
  
    showInfo() {
      if(!this.costCenterData) return;
          const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
          modalRef.componentInstance.item = this.costCenterData;
          modalRef.componentInstance.idLabel = 'Cost-Center Id';
          modalRef.componentInstance.idValue = this.costCenterData?.CostCenterMasterSid;
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
              modalRef.componentInstance.DocumentSid = this.CostCenterMasterSid;
    
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
    if (!this.costCenterData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });
    modalRef.componentInstance.item = this.costCenterData;
    modalRef.componentInstance.idLabel = 'Cost-Center Id';
    modalRef.componentInstance.idValue = this.costCenterData?.CostCenterMasterSid;
  }
  
  openAuthority() {
    if (!this.costCenterData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });
    modalRef.componentInstance.item = this.costCenterData;
    modalRef.componentInstance.idLabel = 'Cost-Center Id';
    modalRef.componentInstance.idValue = this.costCenterData?.CostCenterMasterSid;
  }
  
  openEDoc() {
    if (!this.costCenterData) return;
    const modalRef = this.modalService.open(EdocComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });
    modalRef.componentInstance.item = this.costCenterData;
    modalRef.componentInstance.idLabel = 'Cost-Center Id';
    modalRef.componentInstance.idValue = this.costCenterData?.CostCenterMasterSid;
  }

}
