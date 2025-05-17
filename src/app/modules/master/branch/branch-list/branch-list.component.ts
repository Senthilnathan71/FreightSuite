import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { Branch } from 'src/app/modules/crm-mobile/Interfaces/branch.interface';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-branch-list',
	standalone: true,
	imports: [
		FeatherModule,
		CommonModule,
		FormsModule,
		RouterModule,
		NgbPaginationModule,
	],
	templateUrl: './branch-list.component.html',
	styleUrl: './branch-list.component.scss'
})
export class BranchListComponent {
	results: Branch[];
	branchList: Branch[];
	searchType: string = "branchName";
	filterValue: string;

	page = 1;
	pageSize = 10;
	totalAmountOfCollection: number;

	constructor(
		private masterServ: MasterService,
		private appSettingServ: AppSettingsService,
		private route: Router,
		private dialog: MatDialog,
	) { }


	onSearch() {
		const payload = {
			searchType: this.searchType,
			filterValue: this.filterValue
		}
		this.masterServ.searchBranch(payload).subscribe(
			(resp) => {
				this.results = resp;
				this.updatePaginationData();
				this.totalAmountOfCollection = this.results.length || 0;
			},
			(error) => {
				console.error('Error Searching Branch ', error);
			}
		)
	}

	updatePaginationData() {
		const start = (this.page - 1) * this.pageSize;
		const end = start + this.pageSize;
		this.branchList = this.results.slice(start, end);
	}

	trackByIndex(index: number, item: any): number {
		return index;
	}
	deleteBranch(BranchMasterSid: number) {
		const dialogRef = this.dialog.open(DeleteWarningComponent);
		dialogRef.afterClosed().subscribe(
			(res) => {
				if (res) {
					this.masterServ.deleteBranchById(BranchMasterSid).subscribe(
						(data: Branch) => {
							this.appSettingServ.showSuccess('Branch Deleted');
							this.onSearch();
						},
						(error) => {
							console.error('Branch Deletion Error', error);
						}
					)
				}
			}
		)
	}

	navigateToCreate() {
		this.route.navigate(['/master/branch/entry']);
	}

	report() { }

	reset() {
		this.branchList = [];
		this.totalAmountOfCollection = 0;
	}

}
