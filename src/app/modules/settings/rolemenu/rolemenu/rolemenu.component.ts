import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal, NgbModalRef, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { SettingsService } from '../../settings.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, forkJoin } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { TogglerComponent } from 'src/app/component/simple-toggler/toggle.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';

@Component({
  selector: 'app-rolemenu',
  standalone: true,
  imports: [
	FeatherModule,
	CommonModule,
	FormsModule,
	NgSelectModule,
	ReactiveFormsModule,
	TextWithNumbersDirective,
	NgbPaginationModule,
	TogglerComponent
],
  templateUrl: './rolemenu.component.html',
  styleUrl: './rolemenu.component.scss'
})
export class RolemenuComponent implements OnInit {

	searchType : any = "MenuMasterSid";
	filterValue = '';
	searchPerformed : boolean;
	userData : any;
	moduleName : any;
	RoleMasterSid : number;
	Remarks : any;
	isEditMode : boolean;

	moduleList : any[];
	menuList : any[];
	roleList : any[];
	results : any[];
    roleMenuList : any[];

    modalRef: NgbModalRef;
	roleMenuData : any;

	modeOfStatus = [
		{value : 'A',name: "Active"},
		{value : 'S',name: "Suspended"},
	]

	// Pagination related Data
	page = 1;
	pageSize = 10;
	totalAmountOfCollection : number;

	// Entry Page Related Variables
	roleMenuForm !:FormGroup;
	searchForm !:FormGroup;
	RoleMenuMasterSid : number;
	currentMenuId: number;
	TandCList: any;
    isFavorite: boolean = false;

	toggleFavorite() {
		this.isFavorite = !this.isFavorite;
	}
	
    constructor(
		private settingService : SettingsService,
		private appSettingService: AppSettingsService,
		private dialog : MatDialog,
    	private modalService: NgbModal,
		private excelReportService : ExcelExportService,
		private fb:FormBuilder,
    ) {}

	ngOnInit(): void {
		this.fetchAllData();
		this.initSearchForm();
		this.setupValueChanges();
		this.appSettingService.getUser().subscribe(
			(user)=>{
				this.userData = user;
			}
		)
	}

	onSearch(){
		const payload = {
			searchType : this.searchType,
			filterValue : this.filterValue
		}

		this.settingService.searchRoleMenu(payload).subscribe(
			(resp:any)=>{
				if(resp.status){
					this.results = resp.data;
					this.searchPerformed = true;
					this.totalAmountOfCollection = this.results.length;
					this.updatePaginationData();
				} else {
					this.appSettingService.showError('Error Searching Role Menu');
				}
			},
			(error)=>{
				console.error('Error Searching Role Menu',error);
			}
		)
	}

	deleteRoleMenuById(RoleMenuMasterSid : number){
		const dialogRef = this.dialog.open(DeleteWarningComponent);
		dialogRef.afterClosed().subscribe(
			(res)=>{
				if(res){
					this.settingService.deleteRoleMenuById(RoleMenuMasterSid).subscribe(
						(resp:any)=>{
							if(resp.status){
								this.appSettingService.showSuccess('Role Menu Deleted Successfully');
								this.onSearch();
							} else {
								this.appSettingService.showError('Error Deleting Role Menu');
							}
						},
						(error)=>{
							console.error('Error Deleting Role Menu',error);
						}
					)
				}
			}
		)
	}

	updatePaginationData(){
		let start = (this.page - 1) * this.pageSize;
		let end = start + this.pageSize;
		this.roleMenuList = this.results.slice(start,end);
	}

	reset(){
		this.results = [];
		this.roleMenuList = [];
		this.totalAmountOfCollection = 0;
		this.searchPerformed = false;
		this.searchType = 'MenuMasterSid';
		this.filterValue = '';
		this.searchForm.reset();
	}

	report(): void {
		const formattedData = this.roleMenuList.map(item => ({
			...item,
			status: item.status === 'A' ? 'Active' : 'Suspended',
			InsertRole : item.InsertRole === 'Y' ? 'Yes' : 'No',
			ViewRole : item.ViewRole === 'Y' ? 'Yes' : 'No',
			UpdateRole : item.UpdateRole === 'Y' ? 'Yes' : 'No',
			DeleteRole : item.DeleteRole === 'Y' ? 'Yes' :'No',
			menuName : item.menuMaster?.MenuName
		}));

		const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

		this.excelReportService.exportAsExcel({
			data: formattedData,
			headers: [
				{ key: 'menuName', label: 'Menu Name' },
				{ key: 'InsertRole', label: 'Insert Role' },
				{ key: 'UpdateRole', label: 'Update Role' },
				{ key: 'ViewRole', label: 'View Role' },
				{ key: 'DeleteRole', label: 'Delete Role' },
				{ key: 'status', label: 'Status' }
			],
			fileName: 'RoleMenu-Report',
			title: companyName
		});
	}

	fetchAllData(){
		forkJoin({
			modules : this.settingService.getAllModule(),
			roles : this.settingService.getAllRole()
		}).subscribe(({modules,roles})=>{
			this.moduleList = modules.data;
			this.roleList = roles.data;
		})
	}


	initSearchForm() {
    this.searchForm = this.fb.group({
      Module: [],
      RoleMasterSid: [],
      Remarks: [''],
    });
  }

	setupValueChanges() {
		this.searchForm.valueChanges.pipe(
		).subscribe(() => {
			if (this.searchForm.valid) {
				this.specialSearch();
			}
		});
	}

	specialSearch() {
		if (this.searchForm.valid) {
			const payload = {
				moduleName: this.searchForm.get('Module')?.value,
				role: this.searchForm.get('RoleMasterSid')?.value,
				remarks: this.searchForm.get('Remarks')?.value
			};

			this.settingService.goSpecialSearch(payload).subscribe(
				(resp) => {
					this.results = resp.data || [];
					this.totalAmountOfCollection = this.results.length;
					this.updatePaginationData();
				},
				(error) => {
					console.error('Search failed:', error);
				}
			);
		} else {
			console.log('Form is invalid, not performing search');
		}
	}


	//  ENTRY PAGE RELATED FUNCTIONS

	initRoleMenuForm(){
		this.roleMenuForm = this.fb.group({
			Module : [,[Validators.required]],
			MenuMasterSid : [,[Validators.required]],
			RoleMasterSid : [,[Validators.required]],
			Remarks : ['',[Validators.required]],
			status : ['Active'],
			InsertRole : [true],
			ViewRole : [true],
			UpdateRole : [true],
			DeleteRole : [false]
		})
	}
	

    openModal(content: TemplateRef<any>,data ?:any) {
		this.initRoleMenuForm();
		if(data){
			this.isEditMode = true;
			this.roleMenuData = data;
			const ourModule = this.moduleList.find(module => module.ModuleName === data.Module);
			this.filterMenuByModule(ourModule);
			this.roleMenuForm.patchValue({
				Module: data.Module,
				MenuMasterSid: data.MenuMasterSid,
				RoleMasterSid: data.RoleMasterSid,
				Remarks: data.Remarks,
				status: data.status === 'A' ? 'Active' : 'Suspended',
				InsertRole: data.InsertRole === 'Y' ? true : false,
				ViewRole: data.ViewRole === 'Y' ? true : false,
				UpdateRole: data.UpdateRole === 'Y' ? true : false,
				DeleteRole: data.DeleteRole === 'Y' ? true : false
			})
			if(data.RoleMenuMasterSid){
				this.RoleMenuMasterSid = data.RoleMenuMasterSid;
			}
		}
    	this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static'});
  	}

	filterMenuByModule(selectedModule){
		this.settingService.getMenuByModuleId(selectedModule.ModuleMasterSid).subscribe(
			(resp:any)=>{
				if(resp){
					this.menuList = resp;
				} else {
					this.appSettingService.showError('Error Loading Menus')
				}
			},
			(error)=>{
				console.error('Error Loading Menus',error);
			}
		)
	}

	onSubmit(){
		if(this.roleMenuForm.invalid){
			this.roleMenuForm.markAllAsTouched();
			this.roleMenuForm.updateValueAndValidity();
			this.appSettingService.showWarning('Please fill all the required fields')
		}
		const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
		const formValue = this.roleMenuForm.value;
		const payload = {
			...formValue,
			status : formValue.status === 'Active' ? 'A' : 'S',
			InsertRole: formValue.InsertRole ? 'Y' : 'N',
			ViewRole: formValue.ViewRole  ? 'Y' : 'N',
			UpdateRole: formValue.UpdateRole ? 'Y' : 'N',
			DeleteRole: formValue.DeleteRole ? 'Y' : 'N',
			...(this.isEditMode ? {updatedBy : currentUserEmail} : {createdBy : currentUserEmail})
		}

		if(this.isEditMode){
			this.settingService.updateRoleMenuById(this.RoleMenuMasterSid,payload).subscribe(
				(resp:any)=>{
					if(resp.status){
						this.appSettingService.showSuccess('Role Menu Updated Successfully');
						this.closeModal();
						this.onSearch();
					} else {
						this.appSettingService.showError('Error Updating Role Menu')
					}
				},
				(error)=>{
					console.error('Error Updating Role Menu',error);
				}
			)
		} else {
			this.settingService.createNewRoleMenu(payload).subscribe(
				(resp:any)=>{
					if(resp.status){
						this.appSettingService.showSuccess('Role Menu Created Successfully');
						this.closeModal();
						this.onSearch();
					} else {
						this.appSettingService.showError('Error Creating Role Menu');
					}
				},
				(error)=>{
					console.error('Error Creating Role Menu',error);
				}
			)
		}
	}

	get f() : { [key:string] : AbstractControl<any,any>} {
		return this.roleMenuForm.controls;
	}

	closeModal(){
		this.menuList = [];
		this.isEditMode = false;
		this.modalRef.close()
	}

	showInfo() {
    if(!this.roleMenuData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.roleMenuData;
    modalRef.componentInstance.idLabel = 'Role Menu Id';
    modalRef.componentInstance.idValue = this.roleMenuData?.RoleMenuMasterSid;
  }

	openTandC() {
		this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
		const payload = { MenuMasterSid: this.currentMenuId };
		this.settingService.getTandCByCondition(payload).subscribe(
			(resp: any) => {
				if (resp.status) {
					this.TandCList = resp.data;
					const modalRef = this.modalService.open(TermsAndConditionsComponent, {
						size: 'lg',
						backdrop: 'static',
						centered: true
					});
					modalRef.componentInstance.terms = this.TandCList;
					modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
					modalRef.componentInstance.DocumentSid = this.RoleMenuMasterSid;

				} else {
					this.appSettingService.showError('Error loading Terms and Conditions');
				}
			},
			(error) => {
				this.appSettingService.showError('Error loading Terms and Conditions', error);
			}
		);
	}

} 
