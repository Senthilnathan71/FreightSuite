import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';

import { MasterService } from 'src/app/modules/master/master.service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [FeatherModule, FormsModule, CommonModule,RouterModule, ListpageComponent,NgbPaginationModule,FavoriteStarComponent],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss',
})
export class CompanyListComponent implements OnInit {
  searchType = 'companyName';
  filterValue = '';
  results: any[] = [];
  searchResults :any[] = []
  companyList: any[] = []
  searchPerformed = false;
  userData : any;
  sortColumn: string = 'companyName'; 
  sortDirection: string = 'asc';

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number;
  isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 
  
  constructor(private masterService: MasterService, private router: Router,
    private appSettingService: AppSettingsService, private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService
  ) { }
  ngOnInit() {
    this.appSettingService.getUser().subscribe(
      user => {
        if (user) {
          this.userData = user;
        }
      }
    )
    this.masterService.getAllCompaniesSearch().subscribe(
      (resp: any) => {
        console.log(resp);
        this.results = resp.flatMap(item => {
          if (!item.branchMaster || item.branchMaster.length === 0) {
            return ({
              CompanyMasterSid : item.CompanyMasterSid,
              companyName: item.companyName,
              companyCode: item.companyCode,
              branchName: '',
              city: '',
              state: '',
              country: '',
              gst: '',
              status: item.status === 'A' ? 'Active' : 'Suspended'
            })
          }
          return item.branchMaster.map(branch => ({
            CompanyMasterSid: item.CompanyMasterSid,
            companyName: item.companyName,
            companyCode: item.companyCode,
            branchName: branch.branchName,
            city: branch.cityMaster?.cityName || '',
            state: branch.stateMaster?.stateName || '',
            country: branch.countryMaster?.countryName || '',
            gst: branch.taxRegistrationNo,
            status: branch.status === 'A' ? 'Active' : 'Suspended'
          }))
        })
        console.log(this.results);
      }
    )
    
   }

   onSearch(event: { type: string, value: string }) {
  this.searchType = event.type;
  this.filterValue = event.value;
  console.log('Searching with:', this.searchType, this.filterValue);
  this.search();
}

  search() {
    console.log('Entered search');
    if (!this.filterValue) {
      this.searchResults = this.results;
      this.searchPerformed = true;
      this.applySorting();
      this.updatePaginatedData();
      this.totalLengthOfCollection = this.searchResults.length;
      console.log('if', this.companyList);
      return;
    }

    const filterValue = this.filterValue.toLowerCase();

    this.searchResults = this.results.filter(item => {
      return (
        (item.companyName && item.companyName.toLowerCase().includes(filterValue)) ||
        (item.companyCode && item.companyCode.toLowerCase().includes(filterValue)) ||
        (item.branchName && item.branchName.toLowerCase().includes(filterValue)) ||
        (item.city && item.city.toLowerCase().includes(filterValue)) ||
        (item.state && item.state.toLowerCase().includes(filterValue)) ||
        (item.country && item.country.toLowerCase().includes(filterValue)) ||
        (item.gst && item.gst.toLowerCase().includes(filterValue)) ||
        (item.status && item.status.toLowerCase().includes(filterValue))
      );
    });
    this.applySorting();
    this.updatePaginatedData();
    this.searchPerformed = true;
    this.totalLengthOfCollection = this.searchResults.length;
  }
  sort(column: string) {
  if (this.sortColumn === column) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }
  
  this.applySorting();
  this.updatePaginatedData();
}

applySorting() {
  console.log('Entered Sorting')
  this.searchResults.sort((a, b) => {
    // For company-level sorting
    if (['companyName', 'companyCode'].includes(this.sortColumn)) {
      return this.compareValues(a[this.sortColumn], b[this.sortColumn]);
    }
    // For branch-level sorting
    else {
      const branchA = a.branchMaster?.[0] || {};
      const branchB = b.branchMaster?.[0] || {};
      
      switch(this.sortColumn) {
        case 'branchName':
          return this.compareValues(branchA.branchName, branchB.branchName);
        case 'city':
          return this.compareValues(branchA.cityMaster?.cityName, branchB.cityMaster?.cityName);
        case 'state':
          return this.compareValues(branchA.stateMaster?.stateName, branchB.stateMaster?.stateName);
        case 'country':
          return this.compareValues(branchA.countryMaster?.countryName, branchB.countryMaster?.countryName);
        case 'gst':
          return this.compareValues(branchA.taxRegistrationNo, branchB.taxRegistrationNo);
        default:
          return 0;
      }
    }
  });
}

private compareValues(valueA: any, valueB: any): number {
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
}



  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.companyList = this.searchResults.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteCompany(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteCompanyById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.search();
        });
      }
    });
  }

  navigateToCreateDepartment() {
    this.router.navigate(['master/company/entry'])
  }

  resetPage() {
    this.companyList = [];
    this.totalLengthOfCollection = 0;
    this.filterValue = '';
    this.searchType = 'companyName';
    this.page = 1;
    this.searchPerformed = false;
    this.sortColumn = 'companyName';
    this.sortDirection = 'asc';
  }

  report(): void {
    const formattedData = this.companyList;
    // const formattedData = this.companyList.flatMap(item => {
    //   if (!item.branchMaster || item.branchMaster.length === 0) {
    //     return ({
    //       companyName : item.companyName,
    //       companyCode : item.companyCode,
    //       branchName : '',
    //       city : '',
    //       state : '',
    //       country : '',
    //       gst : '',
    //       status: item.status === 'A' ? 'Active' : 'Suspended'
    //   })
    //   }
    //   return item.branchMaster.map(branch=>({
    //     companyName : item.companyName,
    //       companyCode : item.companyCode,
    //       branchName : branch.branchName,
    //       city : branch.cityMaster?.cityName || '',
    //       state : branch.stateMaster?.stateName || '',
    //       country : branch.countryMaster?.countryName || '',
    //       gst : branch.taxRegistrationNo,
    //       status: branch.status === 'A' ? 'Active' : 'Suspended'
    //   }))
    // });

        const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'companyName', label: 'Company Name' },
                { key: 'companyCode', label: 'Company Code' },
                { key: 'branchName', label: 'Branch Name' },
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'country', label: 'Country' },
                { key: 'gst', label: 'Vat/GST No' },
                { key: 'status', label: 'Status' },
            ],
            fileName: 'Company-Report', 
            title: companyName
        });
    }
    clearFilterValue(){
      this.filterValue = '';
    }
}
