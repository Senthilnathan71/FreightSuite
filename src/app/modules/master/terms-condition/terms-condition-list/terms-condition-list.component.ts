import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';

@Component({
    selector: 'app-terms-condition-list',
    standalone: true,
    imports: [
        RouterModule,
        FormsModule,
        CommonModule,
        FeatherModule,
        NgbPaginationModule,
        ListpageComponent
    ],
    templateUrl: './terms-condition-list.component.html',
    styleUrl: './terms-condition-list.component.scss'
})
export class TermsConditionListComponent implements OnInit {

    searchType : string ='status';
    filterValue : any;
    TandCList : any[];
    slicedTandCList : any[];
    searchPerformed : boolean;
    userData : any;

    page = 1;
    pageSize = 10;
    totalAmountOfCollections : number;
    isFavorite: boolean = false;
    sortColumn: string = 'status'; 
sortDirection: string = 'asc';

    toggleFavorite() {
        this.isFavorite = !this.isFavorite;
    } 
    
    constructor(
        private router: Router,
        private masterService:MasterService,
        private appSettingService:AppSettingsService,
        private dialog:MatDialog,
        private userService : authService,
        private excelReportService : ExcelExportService
    ) { }

    ngOnInit(): void {
        this.appSettingService.getUser().subscribe(
            user=>{
                if(user){
                    this.userData = user;
                }
            }
        )
    }

    onSearch(event: { type: string, value: string }) {
  this.searchType = event.type;
  this.filterValue = event.value;
  console.log('Searching with:', this.searchType, this.filterValue);
  this.search();
}
    search(){
        const intFields=[
            "BranchMasterSid",
            "MenuMasterSid",
            "Carrier",
        ];
        const payload = {
            searchType : this.searchType,
            filterValue : intFields.includes(this.searchType) ? Number(this.filterValue) : this.filterValue
        }

        this.masterService.searchTandC(payload).subscribe(
            (resp:any)=>{
                if(resp.status){
                    this.searchPerformed = true;
                    this.TandCList = resp.data;
                    this.totalAmountOfCollections = this.TandCList.length;
                    this.updatePaginationData();
                    this.applySorting();
                }
                else{
                    this.appSettingService.showError('Error Searching Terms and Conditions');
                }
            },
            (error)=>{
                console.error('Error Searching Terms and Conditions',error);
            }
        )
    }

    deleteTandC(TermsAndConditionsMasterSid){
        const modalRef = this.dialog.open(DeleteWarningComponent);
        modalRef.afterClosed().subscribe(
            (res)=>{
                if(res){
                    this.masterService.deleteTandCById(TermsAndConditionsMasterSid).subscribe(
                        (resp:any)=>{
                            if(resp.status){
                                this.appSettingService.showSuccess('Terms and Conditions successfully deleted');
                                this.search();
                            } else {
                                this.appSettingService.showError('Error Deleting Terms and Conditions')
                            }
                        },
                        (error)=>{
                            console.error('Error Deleting Terms and Conditions',error);
                        }
                    )
                }
            }
        )
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
  this.TandCList.sort((a, b) => {
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

    updatePaginationData(){
        let start = (this.page - 1 ) * this.pageSize;
        let end = start + this.pageSize;
        this.slicedTandCList = this.TandCList.slice(start,end);
    }


    navigateTocreateTerms() {
        this.router.navigate(['master/terms-condition/entry'])
    }

    report(): void {
        const formattedData = this.TandCList.map(item => ({
            ...item,
            status: item.status === 'A' ? 'Active' : 'Suspended',
            menu : item.menu?.MenuName,
            branch : item.branch?.branchName
        }));

        const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'branch', label: 'Branch' },
                { key: 'menu', label: 'Menu' },
                { key: 'status', label: 'Status' }
            ],
            fileName: 'Terms-and-Condition-Report', 
            title: companyName
        });
    }
    reset(){
        this.slicedTandCList =[];
        this.totalAmountOfCollections = 0;
        this.searchPerformed = false;
        this.filterValue = '';
        this.searchType = 'status';
        this.page = 1;
        this.sortColumn = 'status';
  this.sortDirection = 'asc';
    }
}
