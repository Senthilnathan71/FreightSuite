import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { MasterService } from '../../master.service';
import { ProfitCenter } from 'src/app/modules/crm-mobile/Interfaces/profit-center.interfaces';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-profit-center',
  standalone: true,
  imports: [FeatherModule,
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
  templateUrl: './profit-center.component.html',
  styleUrl: './profit-center.component.scss'
})
export class ProfitCenterComponent {
   profitCenterForm!: FormGroup;
      isEditMode: boolean = false;
      profitCenters: ProfitCenter[] =[];
      results: any[] = [];
      ProfitCenterMasterSid!: number;
      errorMessage: string = '';
      btnDisable: boolean = false;
      profitCenterList: any[] =[];
      modalRef!: NgbModalRef;
      searchType = 'ProfitCenterName';
      filterValue = '';
      searched = false;
      page = 1;
      pageSize = 15;
      totalLengthOfCollection = 0;
      userData: any;
      profitCenterData: any;
      currentMenuId: number;
      TandCList: any;
      sortColumn: string = 'ProfitCenterName';
      sortDirection: string = 'asc';
      isFavorite: boolean = false;
      permissions: string[] = [];
      currentMenuPermissions: any = {};
        // Company
  currentCompany : any;
  currentBranch : any;
     toggleFavorite() {
       this.isFavorite = !this.isFavorite;
     } 
   
     statusList = ["Active", "Suspended"];

     auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;

   
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
         this.loadProfitCenters()
         this.initForm();
        //  this.appSettingService.getUser().subscribe(
        //    user => {
        //      if (user) {
        //        this.userData = user;
        //         this.checkPermissions();
        //      }
        //    }
        //  )
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
        this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
         this.route.paramMap.subscribe(params => {
           this.ProfitCenterMasterSid = +params.get('id');
           if (this.ProfitCenterMasterSid) {
             this.isEditMode = true;
             this.loadProfitCenterData(this.ProfitCenterMasterSid);
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

     
       loadProfitCenters(): void {
         const params = {
          search: this.filterValue ? this.filterValue.trim() : '',
          page: this.page,
          pageSize: this.pageSize,
         };

         this.masterService.searchProfitCenterList(params).subscribe({
          next: (response) => {
            if(response.status) {
              this.profitCenterList = response.data.items;
              this.results = [...this.profitCenterList];
              this.totalLengthOfCollection = response.data.totalCount;
              this.applySorting();
              this.searched = true;
            }
            else {
        this.appSettingService.showError(response.message);
      }
          },
          error: (err) => {
            console.error('Error fetching profit-centers:', err);
            this.profitCenterList = [];
            this.results = [];
            this.totalLengthOfCollection = 0;
          },
         });
       }
     
       initForm() {
         this.profitCenterForm = this.fb.group({
           ProfitCenterCode: ['', [Validators.required]],
           ProfitCenterName: ['', [Validators.required]],
           Remarks: ['', [Validators.required]],
           Status: [{value: 'A', disabled: false}, Validators.required]
         });
       }
        resetForm(): void {
         this.profitCenterForm.get('Status')?.disable();
         this.profitCenterForm.reset({
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
         this.ProfitCenterMasterSid = id;
         this.getProfitCenterById(id).add(() => {
         this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
       });
        }
     
        editProfitCenter(id: number, content: any) {
         this.isEditMode = true;
         this.ProfitCenterMasterSid = id;
         this.masterService.getProfitCenterById(id).pipe(take(1)).subscribe({
           next: (profitCenter: any) => {
             this.profitCenterData = profitCenter;
             this.profitCenterForm.get('Status')?.enable();
             this.profitCenterForm.patchValue({
               ProfitCenterCode: profitCenter.ProfitCenterCode,
               ProfitCenterName: profitCenter.ProfitCenterName,
               Remarks: profitCenter.Remarks,
               Status: profitCenter.Status === 'A' ? 'Active' : 'Suspended'
             });
             this.modalRef = this.modalService.open(content, {centered: true, size: 'lg', backdrop: 'static'});
           },
           error: (err) => {
             console.error('Error fetching Profit-Center', err);
             this.appSettingService.showError('Error fetching data for edting');
           }
         });
        }
     
        openAuditLogs(modal: TemplateRef<any>) {
  if (!this.ProfitCenterMasterSid) return;

  this.masterService.getAuditLogsProfitCenter('ProfitCenterMaster', this.ProfitCenterMasterSid.toString()).subscribe({
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

        closeModal(): void {
         if (this.modalRef && typeof this.modalRef.close === 'function') {
           this.modalRef.close();
           this.modalRef = null!;
         }
       }
     
       getProfitCenterById(id: number) {
         this.resetForm();
         return this.masterService.getProfitCenterById(id).pipe(take(1)).subscribe(
           (profitCenter: any) => {
             console.log('Profit-Center from backend:', profitCenter);
             this.profitCenterForm.patchValue({
               ProfitCenterCode: profitCenter.ProfitCenterCode,
               ProfitCenterName: profitCenter.ProfitCenterName,
               Remarks: profitCenter.Remarks,
               Status: profitCenter.Status === 'A' ? 'Active' : 'Suspended'
             });
           },
           (error) => {
             this.appSettingService.showError('Error  loading');
           }
         );
       }
     
       onSubmit() {
         if (this.profitCenterForm.get('Status')?.disabled) {
           this.profitCenterForm.get('Status')?.enable();
         }
         if (this.profitCenterForm.invalid) {
           this.profitCenterForm.markAllAsTouched();
           this.profitCenterForm.updateValueAndValidity();
           this.appSettingService.showWarning('Please fill all required fields correctly.');
           return;
         } else {
           let CreatedBy = { CreatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
           let UpdatedBy = { UpdatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
           const formValue = this.profitCenterForm.value;
           
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
             this.masterService.editProfitCenter(this.ProfitCenterMasterSid, payload).subscribe(
               (resp: any) => {
                 console.log(resp.message);
                 if (resp.Status) {
                   this.appSettingService.showSuccess(resp.message);
                   this.closeModal();
                   this.loadProfitCenters()
                   this.router.navigate(['master/profit-center']);
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
             this.masterService.createProfitCenter(payload).subscribe(
               (resp: any) => {
                 console.log(resp);
                 if (resp.Status) {
                   this.appSettingService.showSuccess(resp.message);
                   this.closeModal();
                   this.loadProfitCenters()
                   this.router.navigate(['master/profit-center']);
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
     
       loadProfitCenterData(id: number) {
         this.masterService.getProfitCenterById(id).subscribe(
           (data) => {
             this.profitCenterForm.patchValue({
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
     
       onSearch(event: { type: string, value: string}) {
         this.searchType = event.type;
         this.filterValue = event.value;
         console.log('Searching with:', this.searchType, this.filterValue);
         this.search();
       }
     
       search() {
         const payload = {
           searchType: this.searchType,
           filterValue: this.filterValue,
         };
     
         this.masterService.searchProfitCenterList(payload).subscribe((res: any) => {
           this.results = res;
           console.log(this.results)
           this.searched = true;
           this.applySorting();
           this.updatePaginationData();
           this.totalLengthOfCollection = this.results.length || 0;
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
       this.profitCenterList = [...this.results];
     }
     updatePaginationData(): void {
         const startIndex = (this.page - 1) * this.pageSize;
         const endIndex = startIndex + this.pageSize;
         this.loadProfitCenters();
       }
     
       trackByIndex(index: number, item: any): number {
         return index;
       }
     
       softDeleteProfitCenter(id) {
         const dialogRef = this.dialog.open(DeleteWarningComponent);
         dialogRef.afterClosed().subscribe((result) => {
           if (result === true) {
             this.masterService.softDeleteProfitCenter(id).subscribe((resp: any) => {
               this.appSettingService.showSuccess('Deleted!');
               this.router.navigate(['master/profit-center']);
               this.loadProfitCenters();
             });
           }
         });
       }
     
       resetPage(): void {
         this.profitCenterList = [];
         this.totalLengthOfCollection = 0;
         this.searched = false;
         this.filterValue = '';
         this.searchType = 'ProfitCenterName';
         this.page = 1;
         this.profitCenters = [];
         this.sortColumn = 'ProfitCenterName';
         this.sortDirection = 'asc';
       }
     
       report(): void {
         const formattedData = this.profitCenterList.map(item => ({
           ...item,
           Status: item.Status === 'A' ? 'Active' : 'Suspended'
         }));
          // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
         const companyName = this.currentCompany?.companyName ?? 'Company';
          this.excelReportService.exportAsExcel({
           data: formattedData,
           headers: [
             { key: 'ProfitCenterCode', label: 'Profit-Center Code' },
             { key: 'ProfitCenterName', label: 'Profit-Center Name' },
             { key: 'Remarks', label: 'Remarks' },
             { key: 'Status', label: 'Status' },
           ],
           fileName: 'Profit-Center-Report',
           title: companyName
          });
       }
     
       showInfo() {
         if(!this.profitCenterData) return;
             const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
             modalRef.componentInstance.item = this.profitCenterData;
             modalRef.componentInstance.idLabel = 'Profit-Center Id';
             modalRef.componentInstance.idValue = this.profitCenterData?.ProfitCenterMasterSid;
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
                 modalRef.componentInstance.DocumentSid = this.ProfitCenterMasterSid;
       
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
       if (!this.profitCenterData) return;
       const modalRef = this.modalService.open(EmailEntryComponent, { 
         size: 'lg', 
         centered: true, 
         backdrop: 'static' 
       });
       modalRef.componentInstance.item = this.profitCenterData;
       modalRef.componentInstance.idLabel = 'Profit-Center Id';
       modalRef.componentInstance.idValue = this.profitCenterData?.ProfitCenterMasterSid;
     }
     
     openAuthority() {
       if (!this.profitCenterData) return;
       const modalRef = this.modalService.open(AuthorityEntryComponent, { 
         size: 'lg', 
         centered: true, 
         backdrop: 'static' 
       });
       modalRef.componentInstance.item = this.profitCenterData;
       modalRef.componentInstance.idLabel = 'Profit-Center Id';
       modalRef.componentInstance.idValue = this.profitCenterData?.ProfitCenterMasterSid;
     }
     
     openEDoc() {
       if (!this.profitCenterData) return;
       const modalRef = this.modalService.open(EdocComponent, { 
         size: 'lg', 
         centered: true, 
         backdrop: 'static' 
       });
       modalRef.componentInstance.item = this.profitCenterData;
       modalRef.componentInstance.idLabel = 'Profit-Center Id';
       modalRef.componentInstance.idValue = this.profitCenterData?.ProfitCenterMasterSid;
     }

     clearFilterValue(){
      this.filterValue = '';
    }
}
