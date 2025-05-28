import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-imco-list',
	standalone: true,
	imports: [FeatherModule, RouterModule, FormsModule, CommonModule, NgbPaginationModule],
	templateUrl: './imco-list.component.html',
	styleUrl: './imco-list.component.scss'
})
export class ImcoListComponent {

	searchType: string = "ImcoClass";
	filterValue: any;
	searchPerformed: boolean;
	imcoList: any[];
	searchResults: any[];

	// Pagination Data
	page = 1;
	pageSize = 10;
	totalAmountOfCollection: number;

	constructor(
		private masterService: MasterService,
		private appSettingService: AppSettingsService,
		private matdial: MatDialog,
		private route: Router
	) { }

	onSearch() {
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
								this.onSearch();
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
	}

	report() {

	}
}
