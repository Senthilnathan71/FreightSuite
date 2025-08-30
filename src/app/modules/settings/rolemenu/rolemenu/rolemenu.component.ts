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
import { EmailEntryComponent } from '../../email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from '../../edoc/edoc/edoc.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

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
	TogglerComponent,
	FavoriteStarComponent
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
	menuPermissionList : any[]=[];
	selectedPermission : any[]=[];

    modalRef: NgbModalRef;
	roleMenuData : any;
	sortColumn: string = 'menuName'; 
    sortDirection: string = 'asc';
	showLoading : boolean;

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
	menuPermissionsFetched : boolean;
	// Company
    currentCompany : any;
    currentBranch : any;
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
		this.onRoleMenuSearch();
		// this.appSettingService.getUser().subscribe(
		// 	(user)=>{
		// 		this.userData = user;
		// 	}
		// )
		this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
        this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
		const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
		}
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
  if (!this.roleMenuList) return;
  
  this.roleMenuList.sort((a, b) => {
    // Handle nested properties (like menuMaster.MenuName)
    let valueA = this.sortColumn.includes('.') 
      ? this.getNestedProperty(a, this.sortColumn)
      : a[this.sortColumn];
    let valueB = this.sortColumn.includes('.') 
      ? this.getNestedProperty(b, this.sortColumn)
      : b[this.sortColumn];
    
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

private getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((o, p) => o?.[p], obj);
}

onRoleMenuSearch(){
	const params = {
		search : this.filterValue?.trim() || '',
		page : this.page,
		pageSize : this.pageSize
	};
	this.settingService.searchRoleMenu(params).subscribe({
		next : (response:any) => {
			if(response.status){
				this.roleMenuList = response?.data.items.map((rolemenu : any)=>{
					return {
						...rolemenu,
						menuName : rolemenu?.menuMaster?.MenuName,
						roleName : rolemenu?.roleMaster?.UserRoleName,
						status : rolemenu.status
					}
				})
				this.totalAmountOfCollection = response.data?.totalCount;
				console.log(this.roleMenuList);
				console.log(this.totalAmountOfCollection);
				this.applySorting();
			} else {
				this.appSettingService.showError(response.message);
				this.roleMenuList = [];
				this.totalAmountOfCollection = 0;
			}
			this.searchPerformed = true;
		},
		error :(err)=>{
			console.error('Error loading Role menu',err);
		}
	})
}

clearFilterValue(){
	this.filterValue = '';
	this.onRoleMenuSearch();
}

	// onSearch(){
	// 	const payload = {
	// 		searchType : this.searchType,
	// 		filterValue : this.filterValue
	// 	}

	// 	this.settingService.searchRoleMenu(payload).subscribe(
	// 		(resp:any)=>{
	// 			if(resp.status){
	// 				this.results = resp.data || [];
	// 				this.applySorting();
	// 				this.searchPerformed = true;
	// 				this.totalAmountOfCollection = this.results.length;
	// 				this.updatePaginationData();
	// 			} else {
	// 				this.appSettingService.showError('Error Searching Role Menu');
	// 			}
	// 		},
	// 		(error)=>{
	// 			console.error('Error Searching Role Menu',error);
	// 		}
	// 	)
	// }

	deleteRoleMenuById(RoleMenuMasterSid : number){
		const dialogRef = this.dialog.open(DeleteWarningComponent);
		dialogRef.afterClosed().subscribe(
			(res)=>{
				if(res){
					this.settingService.deleteRoleMenuById(RoleMenuMasterSid).subscribe(
						(resp:any)=>{
							if(resp.status){
								this.appSettingService.showSuccess('Role Menu Deleted Successfully');
								this.onRoleMenuSearch()
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
		this.onRoleMenuSearch()
	}

	reset(){
		this.results = [];
		this.roleMenuList = [];
		this.totalAmountOfCollection = 0;
		this.searchPerformed = false;
		this.searchType = 'MenuMasterSid';
		this.filterValue = '';
		this.searchForm.reset();
		this.sortColumn = 'MenuMasterSid';
        this.sortDirection = 'asc';
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

		// const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
		const companyName = this.currentCompany?.companyName ?? 'Company';
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
		 const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
		forkJoin({
			modules : this.settingService.getAllModule(),
			roles : this.settingService.getAllRole(CompanyMasterSid)
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
			MenuPermissions : [{}],
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
			this.getMenuPermissions(data)
			let permissions = data.MenuPermissions;
			if(typeof permissions === 'string') {
				try {
					permissions = JSON.parse(permissions)
				} catch(e){
					console.error('Error parsing permissions:',e);
					permissions = {};
				}
			}
			this.roleMenuForm.patchValue({
				Module: data.Module,
				MenuMasterSid: data.MenuMasterSid,
				RoleMasterSid: data.RoleMasterSid,
				Remarks: data.Remarks,
				status: data.status === 'A' ? 'Active' : 'Suspended',
				
			})
			if(permissions){
			this.selectedPermission = Object.entries(permissions)
				.filter(([key, value]) => value === 'isTrue')
				.map(([key]) => key);
			}
			this.updatePermissionControl();
			if(data.RoleMenuMasterSid){
				this.RoleMenuMasterSid = data.RoleMenuMasterSid;
			}
		}
    	this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static'});
  	}

	filterMenuByModule(selectedModule){
		if(!selectedModule){
			this.roleMenuForm.get('MenuMasterSid').setValue('');
			this.menuList = [];
			this.selectedPermission = [];
			return;
		}
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

	getMenuPermissions(menu){
		this.showLoading =true;
		this.settingService.getMenuPermissions(menu.MenuMasterSid).subscribe(
			(resp:any)=>{
				if(resp){
					this.menuPermissionList = resp;
					this.showLoading = false;
					if(this.menuPermissionList.length > 0){
						this.menuPermissionsFetched = true;
					}
				} else {
					this.appSettingService.showError('Error loading menu permissions.')
				}
			}
		)
	}


	handlePermission(permissionName,event){
		const state = (event.target as HTMLInputElement).checked;
		if(state){
			this.selectedPermission.push(permissionName);
		} else {
			this.selectedPermission = this.selectedPermission.filter(p => p !== permissionName)
		}
		this.updatePermissionControl()
	}

	updatePermissionControl(){
		const result : any = {};
		this.menuPermissionList.forEach((permission)=>{
			const key = permission.permissionName;
			result[key]= this.selectedPermission.includes(permission.permissionName) ? 
			'isTrue' : 'isFalse';
		})
		this.roleMenuForm.get('MenuPermissions')?.setValue(result,{emitEvent:false});
	}

	onCheckboxKeydown(event: KeyboardEvent, permissionName: string) {
		if (event.key === 'Enter') {
			event.preventDefault();
			this.handlePermission(permissionName, { target: { checked: !this.selectedPermission.includes(permissionName) } } as any);
		}

		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
			event.preventDefault();
			const checkboxes = document.querySelectorAll<HTMLInputElement>('.form-check-input');
			const currentIndex = Array.from(checkboxes).findIndex(cb => cb === event.target);

			if (currentIndex >= 0) {
				let nextIndex = currentIndex;

				if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
					nextIndex = Math.min(currentIndex + 1, checkboxes.length - 1);
				} else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
					nextIndex = Math.max(currentIndex - 1, 0);
				}

				checkboxes[nextIndex]?.focus();
			}
		}
	}

	onSubmit(){
		if(this.roleMenuForm.invalid){
			this.roleMenuForm.markAllAsTouched();
			this.roleMenuForm.updateValueAndValidity();
			this.appSettingService.showWarning('Please fill all the required fields')
		}
		this.updatePermissionControl();
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
						this.appSettingService.showSuccess(resp.message);

						this.closeModal();
						this.onRoleMenuSearch();
					} else {
						this.appSettingService.showError(resp.message);

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
						this.appSettingService.showSuccess(resp.message)
						this.closeModal();
						this.onRoleMenuSearch();
					} else {
						this.appSettingService.showError(resp.message);
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
		this.selectedPermission = [];
		this.isEditMode = false;
		this.roleMenuForm.reset({
			status : 'Active'
		})
		this.menuPermissionsFetched = false;
		this.modalRef.close()
	}
	
	clearMenuPermissions(){
		this.menuPermissionsFetched = false;
		this.roleMenuForm.get('MenuPermissions').reset({});
		this.menuPermissionList = [];
		this.selectedPermission = [];
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

	openEmail() {
  if (!this.roleMenuData) return;
  const modalRef = this.modalService.open(EmailEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.roleMenuData;
  modalRef.componentInstance.idLabel = 'Role Menu Id';
  modalRef.componentInstance.idValue = this.roleMenuData?.RoleMenuMasterSid;
}

openAuthority() {
  if (!this.roleMenuData) return;
  const modalRef = this.modalService.open(AuthorityEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.roleMenuData;
  modalRef.componentInstance.idLabel = 'Role Menu Id';
  modalRef.componentInstance.idValue = this.roleMenuData?.RoleMenuMasterSid;
}

openEDoc() {
  if (!this.roleMenuData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.roleMenuData;
  modalRef.componentInstance.idLabel = 'Role Menu Id';
  modalRef.componentInstance.idValue = this.roleMenuData?.RoleMenuMasterSid;
}


} 
