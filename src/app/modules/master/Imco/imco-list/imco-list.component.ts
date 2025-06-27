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

@Component({
	selector: 'app-imco-list',
	standalone: true,
	imports: [FeatherModule, RouterModule, FormsModule, CommonModule, NgbPaginationModule, ListpageComponent],
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

	// Pagination Data
	page = 1;
	pageSize = 10;
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
	search() {
		const payload = {
			searchType: this.searchType,
			filterValue: this.filterValue
		}
		this.searchPerformed = true;
		this.masterService.searchIMCO(payload).subscribe(
			(resp: any) => {
				if (resp.status) {
					this.searchResults = resp.data;
					this.updatePaginationData();
					this.totalAmountOfCollection = this.searchResults.length;
				}
			}
		)
	}

	updatePaginationData() {
		let start = (this.page - 1) * this.pageSize;
		let end = start + this.pageSize;
		this.imcoList = this.searchResults.slice(start, end);
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
								this.search();
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
		this.route.navigate(['master/Imco/entry']);
	}

	reset() {
		this.searchPerformed = false;
		this.imcoList = [];
		this.totalAmountOfCollection = 0;
		this.filterValue = '';
		this.searchType = 'ImcoClass';
		this.page = 1;
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
