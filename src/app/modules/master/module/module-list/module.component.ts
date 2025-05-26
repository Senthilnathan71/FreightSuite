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
	selector: 'app-module',
	standalone: true,
	imports: [FeatherModule,RouterModule,FormsModule,CommonModule,NgbPaginationModule],
	templateUrl: './module.component.html',
	styleUrl: './module.component.scss'
})
export class ModuleComponent {

	searchType:string="ModuleName";
	filterValue:any;
	searchPerformed : boolean;
	moduleList : any[];
	searchResults : any[];

	// Pagination Data
	page = 1;
	pageSize = 10;
	totalAmountOfCollection : number; 

	constructor(
		private masterService:MasterService,
		private appSettingService:AppSettingsService,
		private matdial : MatDialog,
		private route: Router
	) { }

	onSearch(){
		const payload = {
			searchType : this.searchType,
			filterValue : this.filterValue
		}
		this.searchPerformed = true;
		this.masterService.searchModule(payload).subscribe(
			(resp:any)=>{
				if(resp.status){
					this.searchResults= resp.data;
					this.updatePaginationData();
					this.totalAmountOfCollection = this.searchResults.length;
				}
			}
		)
	}

	updatePaginationData(){
		let start = (this.page - 1) * this.pageSize;
		let end = start + this.pageSize;
		this.moduleList = this.searchResults.slice(start,end);
	}

	deleteModuleById(ModuleMasterSid:number){
		const matRef = this.matdial.open(DeleteWarningComponent);
		matRef.afterClosed().subscribe(
			(result)=>{
				if(result){
					this.masterService.deleteModuleById(ModuleMasterSid).subscribe(
						(resp:any)=>{
							if(resp.status){
								this.appSettingService.showSuccess('Module Deleted');
								this.onSearch();
							} else {
								this.appSettingService.showError('Error Deleting Module');
							}
						},
						(error)=>{
							console.error('Error Deleting Module',error);
						}
					)
				}
			}
		)
	}


	navigateToCreate() {
		this.route.navigate(['master/module/entry']);
	}

	reset(){
		this.searchPerformed = false;
		this.moduleList = [];
		this.totalAmountOfCollection = 0;
	}

	report(){

	}
}
