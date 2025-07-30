import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
	selector: 'app-imco-list',
	standalone: true,
	imports: [FeatherModule, RouterModule, FormsModule, CommonModule, NgbPaginationModule, ListpageComponent,FavoriteStarComponent],
	templateUrl: './imco-list.component.html',
	styleUrl: './imco-list.component.scss'
})
export class ImcoListComponent implements OnInit{

	searchType: string = "ImcoClass";
	filterValue: any;
	searchPerformed: boolean;
	imcoList: any[];
	searchResults: any[];
	userData : any;
	sortColumn: string = 'ImcoClass'; 
  sortDirection: string = 'asc';
	loading = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
	// Pagination Data
	page = 1;
	pageSize = 15;
	totalAmountOfCollection: number;
	isFavorite: boolean = false;

	toggleFavorite() {
		this.isFavorite = !this.isFavorite;
	} 
	
	constructor(
		private masterService: MasterService,
		private appSettingService: AppSettingsService,
		private matdial: MatDialog,
		private route: Router,
		private userService : authService,
        private excelReportService : ExcelExportService
	) { }

	ngOnInit(): void {
        this.appSettingService.getUser().subscribe(
            user=>{
                if(user){
                    this.userData = user;
                     this.checkPermissions();
                }
            }
        );
		 this.loadImcos();
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


	loadImcos(): void {
    this.loading = true;
    
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    this.masterService.searchIMCO(params).subscribe({
      next: (response: any) => {
        if(response.data) {
          this.imcoList = response.data.items;
          this.totalAmountOfCollection = response.data.totalCount || response.data.length;
          this.applySorting();
          this.searchPerformed = true;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching IMCOs:', err);
        this.imcoList = [];
        this.totalAmountOfCollection = 0;
        this.loading = false;
      }
    });
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
  this.loadImcos();
  
}

applySorting() {
  if (!this.imcoList) return;
  
  this.imcoList.sort((a, b) => {
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

	updatePaginationData() {
		let start = (this.page - 1) * this.pageSize;
		let end = start + this.pageSize;
		this.loadImcos();
	}
	 clearFilterValue() {
    this.filterValue = '';
	this.loadImcos();
  }

	deleteIMCOById(IMCOMasterSid: number) {
		const matRef = this.matdial.open(DeleteWarningComponent);
		matRef.afterClosed().subscribe(
			(result) => {
				if (result) {
					this.masterService.deleteIMCOById(IMCOMasterSid).subscribe(
						(resp: any) => {
							if (resp.status) {
								this.appSettingService.showSuccess('IMCO Deleted');
								
							} else {
								this.appSettingService.showError('Error Deleting IMCO');
							}
						},
						(error) => {
							console.error('Error Deleting IMCO', error);
						}
					)
				}
			}
		)
	}


	navigateToCreate() {
		this.route.navigate(['master/imco/entry']);
	}

	reset() {
		this.searchPerformed = false;
		this.imcoList = [];
		this.totalAmountOfCollection = 0;
		this.filterValue = '';
		this.searchType = 'ImcoClass';
		this.page = 1;
		this.sortColumn = 'ImcoClass';
        this.sortDirection = 'asc';
	}

	report(): void {
        const formattedData = this.imcoList.map(item => ({
            ...item,
			status : item.status === 'A' ? 'Active':'Suspended'
        }));

        const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'ImcoClass', label: 'Imco Class' },
                { key: 'ImcoUn', label: 'UN No' },
                { key: 'PackingGroup', label: 'Packing Group' },
                { key: 'status', label: 'Status' },
            ],
            fileName: 'Imco-Report', 
            title: companyName
        });
    }
}
