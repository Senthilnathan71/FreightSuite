import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { Router } from '@angular/router';

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
		FavoriteStarComponent,
		NgxSpinnerModule,
		ReusableTableComponent,
		PageHeaderComponent,

	],
	templateUrl: './rolemenu.component.html',
	styleUrl: './rolemenu.component.scss'
})
export class RolemenuComponent extends BaseListComponent implements OnInit {
	@ViewChild('rolemenuTable') rolemenuTable!: ReusableTableComponent;
	@ViewChild('entrycontent') content: TemplateRef<any>;
	// Table configuration
	tableConfig: TableConfig = {
		columns: [],
		actions: [
			{
				icon: 'fas fa-eye',
				label: 'View',
				action: 'view',
				tooltip: 'View ',
				// condition: (row: any) => this.hasPermission('View')
			},
			{
				icon: 'fas fa-trash',
				label: 'Delete',
				action: 'delete',
				tooltip: 'Delete ',
				class: "text-danger",
				// condition: (row: any) => this.hasPermission('Delete')
			}
		],
		selectable: false,
		multiSelect: false,
		showColumnToggle: true,
		showFilters: true,
		showPagination: true,
		trackByKey: 'RoleMenuMasterSid',
		emptyMessage: 'No rolemenu found',
		dragAndDrop: true
	};

	tableLoading = false;
	headerActions: HeaderAction[] = [];

	protected config: ListComponentConfig = {
		storageKey: 'rolemenu-list-state',
		defaultPageSize: 10,
		defaultSortColumn: 'menuName',
		defaultSortDirection: 'desc',
		pageSizeOptions: [10, 20, 50, 100, 500],
		maxPagesToShow: 3
	};

	// Alias for compatibility with existing template
	get allRolemenu() { return this.allItems; }
	searchType: any = "MenuMasterSid";

	userData: any;
	moduleName: any;
	RoleMasterSid: number;
	Remarks: any;
	isEditMode: boolean;

	moduleList: any[];
	menuList: any[];
	roleList: any[];
	results: any[];
	roleMenuList: any[];
	menuPermissionList: any[] = [];
	selectedPermission: any[] = [];

	modalRef: NgbModalRef;
	roleMenuData: any;


	modeOfStatus = [
		{ value: 'A', name: "Active" },
		{ value: 'S', name: "Suspended" },
	]


	totalAmountOfCollection: number;

	// Entry Page Related Variables
	roleMenuForm !: FormGroup;
	searchForm !: FormGroup;
	RoleMenuMasterSid: number;
	currentMenuId: number;
	TandCList: any;
	isFavorite: boolean = false;
	menuPermissionsFetched: boolean;
	// Company
	currentCompany: any;
	currentBranch: any;
	toggleFavorite() {
		this.isFavorite = !this.isFavorite;
	}

	constructor(
		private settingService: SettingsService,
		private appSettingService: AppSettingsService,
		private dialog: MatDialog,
		private router: Router,
		private modalService: NgbModal,
		private excelReportService: ExcelExportService,
		private fb: FormBuilder,
		private spinner: NgxSpinnerService,
		paginationService: PaginationService
	) {
		super(paginationService);
	}

	override ngOnInit(): void {
		this.fetchAllData();
		this.initSearchForm();
		this.setupValueChanges();
		// this.onRoleMenuSearch();
		// this.appSettingService.getUser().subscribe(
		// 	(user)=>{
		// 		this.userData = user;
		// 	}
		// )
		this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
		this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
		const userProfile = this.appSettingService.getDecryptedUserProfile();
		if (userProfile) {
			this.userData = userProfile;
		}
		// Initialize table configuration
		this.initializeTableConfig();
		this.initializeHeaderActions();

		// Initialize base component
		super.ngOnInit();
	}

	// Implement abstract methods from BaseListComponent
	protected searchItems(): Observable<any> {
		this.tableLoading = true;
		this.spinner.show();
		return this.settingService.searchRoleMenu(this.getSearchParams());
	}

	protected getSearchParams(): SearchParams {
		return {
			search: this.filterValue.trim(),
			page: Number(this.page),
			pageSize: Number(this.pageSize),
			activeCompanyId: this.currentCompany?.CompanyMasterSid,
			activeBranchId: this.currentBranch?.BranchMasterSid,
			sortColumn: this.sortColumn,
			sortDirection: this.sortDirection
		};
	}

	protected processSearchResults(response: any): void {
		this.tableLoading = false;
		this.spinner.hide();

		try {
			if (response.status && response.data) {
				// ✅ Correctly extract from nested response structure
				const { data: items, totalCount } = response.data;
				console.log('RoleMenu Search Response:', items);

				this.allItems = items.map((item: any) => {
					// ✅ Handle missing or invalid menus gracefully
					const menus = Array.isArray(item.menus) ? item.menus : [];

					// ✅ Extract unique module names
					const modules = [
						...new Set(menus.map((m: any) => m.ModuleName).filter(Boolean)),
					];

					// ✅ Extract menu names
					const menuNames = menus.map((m: any) => m.MenuName).filter(Boolean);

					// ✅ Prepare short comma-separated display values
					const shortModules =
						modules.length > 10
							? `${modules.slice(0, 10).join(', ')}, ...`
							: modules.join(', ') || '-';

					const shortMenus =
						menuNames.length > 10
							? `${menuNames.slice(0, 10).join(', ')}, ...`
							: menuNames.join(', ') || '-';

					// ✅ Return flattened and display-ready record
					return {
						...item,
						UserRoleName: item.RoleName || '-', // role name for table display
						ModuleDisplay: shortModules, // ✅ matches your table key
						MenuDisplay: shortMenus, // ✅ matches your table key
						fullModuleTooltip: modules.join(', '), // ✅ tooltip data
						fullMenuTooltip: menuNames.join(', '), // ✅ tooltip data
						status: item.status === 'A' ? 'Active' : 'Suspended',
					};
				});

				this.totalLengthOfCollection = totalCount || 0;

				console.log('Processed RoleMenu Table Data:', this.allItems);

				// ✅ Maintain table sort & header states
				this.applySorting();
				this.updateHeaderActionState();
			} else {
				this.appSettingService.showError('Error fetching Role Menu list.');
				this.allItems = [];
				this.totalLengthOfCollection = 0;
			}
		} catch (error) {
			this.tableLoading = false;
			this.spinner.hide();
			this.appSettingService.showError('Failed to process Role Menu data.');
			console.error('processSearchResults Error:', error);
		}
	}




	protected override handleSearchError(error: any): void {
		this.tableLoading = false;
		this.spinner.hide();
		this.appSettingService.showError('Error searching rolemenu.');
		console.error('Error searching rolemenu', error);
		super.handleSearchError(error);
	}

	// Legacy methods for template compatibility
	searchRolemenu() {
		this.search();
	}

	onSearchTriggered(searchValue: string): void {
		this.filterValue = searchValue;
		this.searchRolemenu();
	}

	onSearchCleared(): void {
		this.filterValue = '';
		this.clearFilterValue();
	}


	initializeHeaderActions(): void {
		this.headerActions = [
			{
				label: 'Create',
				icon: 'fas fa-plus',
				action: 'create',
			},
			{
				label: 'Report',
				icon: 'fas fa-file-alt',
				action: 'report',
				disabled: this.totalLengthOfCollection === 0
			},
			{
				label: 'Reset',
				icon: 'fas fa-sync-alt',
				action: 'reset'
			}
		];
	}
	onActionTriggered(action: string): void {
		switch (action) {
			case 'create':
				this.navigateToCreate();
				break;
			case 'report':
				this.report();
				break;
			case 'reset':
				this.resetPage();
				break;
			default:
				console.warn(`Unknown action: ${action}`);
		}
	}

	navigateToCreate() {
		this.router.navigate(['settings/rolemenu/entry'])
	}


	private updateHeaderActionState(): void {
		this.headerActions = this.headerActions.map(action => {
			if (action.action === 'report') {
				return { ...action, disabled: this.totalLengthOfCollection === 0 };
			}
			return action;
		});
	}
	clearFilterValue() {
		this.clearFilter();
	}

	override trackBy(index: number, item: any): number {
		return item.RoleMenuMasterSid || index;
	}


	viewRolemen(item: any, content: any): void {
		this.router.navigate(['/settings/rolemenu/entry', item.RoleMenuHeaderSid]);
		// this.openModal(content, item)
		console.log(this.viewRolemen, "Edit")
	}


	// Table configuration
	private initializeTableConfig(): void {
		this.tableConfig.columns = [
			{
				key: 'UserRoleName',
				label: 'Role Name ',
				sortable: true,
				filterable: true,
				visible: true,
				dataType: 'string',

			},
			{
				key: 'ModuleDisplay',
				label: 'Module',
				sortable: true,
				filterable: true,
				visible: true,
				dataType: 'string',
				tooltipKey: 'fullModuleTooltip', // ✅ Tooltip field

			},
			{
				key: 'MenuDisplay',
				label: 'Menu Name ',
				sortable: true,
				filterable: true,
				visible: true,
				dataType: 'string',
				tooltipKey: 'fullMenuTooltip', // ✅ Tooltip field

			},
			{
				key: 'status',
				label: 'Status',
				sortable: true,
				filterable: true,
				visible: true,
				template: 'status',
				width: '100px',
				dataType: 'string',
				cellClass: 'status-column'
			}
		];
	}

	// Table event handlers
	onTableActionClick(event: TableEventData): void {
		if (event.action === 'view') {
			this.viewRolemen(event.row, this.content);
		} else if (event.action === 'delete') {
			this.deleteBy(event.row)
		}
	}

	deleteBy(row: any) {
		this.deleteRoleMenuById(row.RoleMenuMasterSid)
	}

	onTableRowClick(row: any): void {
		// Row clicking can be handled by the table component if needed
	}

	onTableSortChange(sort: TableSortConfig): void {
		this.sortColumn = sort.column;
		this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
		this.search();
	}

	onTableFilterChange(filters: TableFilter[]): void {
		// For now, we'll handle this with the existing search functionality
		// In a more advanced implementation, you could apply individual column filters
		console.log('Filters changed:', filters);
	}

	report(): void {
		const formattedData = this.allRolemenu;
		const companyName = this.currentCompany?.companyName ?? 'Company';

		// Get visible columns in their current order from the table component
		const visibleColumns = this.rolemenuTable.getVisibleColumns();
		const dynamicHeaders = visibleColumns.map(column => ({
			key: column.key,
			label: column.label
		}));

		this.excelReportService.exportAsExcel({
			data: formattedData,
			headers: dynamicHeaders,
			fileName: 'Rolemenu-Report',
			title: companyName
		});
	}

	private getNestedProperty(obj: any, path: string): any {
		return path.split('.').reduce((o, p) => o?.[p], obj);
	}

	// onRoleMenuSearch() {
	// 	this.spinner.show();
	// 	const params = {
	// 		search: this.filterValue?.trim() || '',
	// 		page: this.page,
	// 		pageSize: this.pageSize
	// 	};
	// 	this.settingService.searchRoleMenu(params).subscribe({
	// 		next: (response: any) => {
	// 			if (response.status) {
	// 				this.roleMenuList = response?.data.items.map((rolemenu: any) => {
	// 					return {
	// 						...rolemenu,
	// 						menuName: rolemenu?.menuMaster?.MenuName,
	// 						roleName: rolemenu?.roleMaster?.UserRoleName,
	// 						status: rolemenu.status
	// 					}
	// 				})
	// 				this.totalAmountOfCollection = response.data?.totalCount;
	// 				console.log(this.roleMenuList);
	// 				console.log(this.totalAmountOfCollection);
	// 				this.applySorting();
	// 			} else {
	// 				this.appSettingService.showError(response.message);
	// 				this.roleMenuList = [];
	// 				this.totalAmountOfCollection = 0;
	// 			}
	// 			this.spinner.hide();
	// 			this.searchPerformed = true;
	// 		},
	// 		error: (err) => {
	// 			console.error('Error loading Role menu', err);
	// 		}
	// 	})
	// }

	// clearFilterValue() {
	// 	this.filterValue = '';
	// 	this.onRoleMenuSearch();
	// }

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

	deleteRoleMenuById(RoleMenuMasterSid: number) {
		const dialogRef = this.dialog.open(DeleteWarningComponent);
		dialogRef.afterClosed().subscribe(
			(res) => {
				if (res) {
					this.settingService.deleteRoleMenuById(RoleMenuMasterSid).subscribe(
						(resp: any) => {
							if (resp.status) {
								this.appSettingService.showSuccess('Role Menu Deleted Successfully');
								// this.onRoleMenuSearch()
								this.searchRolemenu()
							} else {
								this.appSettingService.showError('Error Deleting Role Menu');
							}
						},
						(error) => {
							console.error('Error Deleting Role Menu', error);
						}
					)
				}
			}
		)
	}

	updatePaginationData() {
		let start = (this.page - 1) * this.pageSize;
		let end = start + this.pageSize;
		// this.onRoleMenuSearch()
	}

	reset() {
		this.results = [];
		this.roleMenuList = [];
		this.totalAmountOfCollection = 0;
		this.searchPerformed = false;
		this.searchType = 'MenuMasterSid';
		this.filterValue = '';
		this.searchForm.reset();
		this.sortColumn = 'MenuMasterSid';
		this.sortDirection = 'asc';
		this.fetchAllData();
	}

	resetForm(): void {
		// If editing an existing role menu, reload the form data without reopening modal
		if (this.isEditMode && this.RoleMenuMasterSid && this.roleMenuData) {
			this.loadRoleMenuData(this.roleMenuData);
			return;
		}

		// Create-mode: reset form to sensible defaults
		this.roleMenuForm.reset({
			Module: null,
			MenuMasterSid: null,
			RoleMasterSid: null,
			Remarks: '',
			MenuPermissions: {},
			status: 'Active',
			InsertRole: true,
			ViewRole: true,
			UpdateRole: true,
			DeleteRole: false
		});

		// Clear related data
		this.menuList = [];
		this.selectedPermission = [];
		this.menuPermissionList = [];
		this.menuPermissionsFetched = false;

		// Clear form validation states
		this.roleMenuForm.markAsUntouched();
		this.roleMenuForm.updateValueAndValidity();
	}

	// Helper method to load role menu data into the form
	private loadRoleMenuData(data: any) {
		const ourModule = this.moduleList.find(module => module.ModuleName === data.Module);
		this.filterMenuByModule(ourModule);
		this.getMenuPermissions(data);

		let permissions = data.MenuPermissions;
		if (typeof permissions === 'string') {
			try {
				permissions = JSON.parse(permissions);
			} catch (e) {
				console.error('Error parsing permissions:', e);
				permissions = {};
			}
		}

		this.roleMenuForm.patchValue({
			Module: data.Module,
			MenuMasterSid: data.MenuMasterSid,
			RoleMasterSid: data.RoleMasterSid,
			Remarks: data.Remarks,
			status: data.status === 'A' ? 'Active' : 'Suspended',
		});

		if (permissions) {
			this.selectedPermission = Object.entries(permissions)
				.filter(([key, value]) => value === 'isTrue')
				.map(([key]) => key);
		}
		this.updatePermissionControl();
	}


	fetchAllData() {
		const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
		forkJoin({
			modules: this.settingService.getAllModule(),
			roles: this.settingService.getAllRole(CompanyMasterSid)
		}).subscribe(({ modules, roles }) => {
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

	initRoleMenuForm() {
		this.roleMenuForm = this.fb.group({
			Module: [, [Validators.required]],
			MenuMasterSid: [, [Validators.required]],
			RoleMasterSid: [, [Validators.required]],
			Remarks: [''],
			MenuPermissions: [{}],
			status: ['Active'],
			InsertRole: [true],
			ViewRole: [true],
			UpdateRole: [true],
			DeleteRole: [false]
		})
	}


	openModal(content: TemplateRef<any>, data?: any) {
		this.initRoleMenuForm();
		if (data) {
			console.log("During model open", data)
			this.isEditMode = true;
			this.roleMenuData = data;
			const ourModule = this.moduleList.find(module => module.ModuleName === data.Module);
			this.filterMenuByModule(ourModule);
			this.getMenuPermissions(data)
			let permissions = data.MenuPermissions;
			if (typeof permissions === 'string') {
				try {
					permissions = JSON.parse(permissions)
				} catch (e) {
					console.error('Error parsing permissions:', e);
					permissions = {};
				}
			}
			this.roleMenuForm.patchValue({
				Module: data.Module,
				MenuMasterSid: data.MenuMasterSid,
				RoleMasterSid: data.RoleMasterSid,
				Remarks: data.Remarks,
				status: data.status,

			})
			if (permissions) {
				this.selectedPermission = Object.entries(permissions)
					.filter(([key, value]) => value === 'isTrue')
					.map(([key]) => key);
			}
			this.updatePermissionControl();
			if (data.RoleMenuMasterSid) {
				this.RoleMenuMasterSid = data.RoleMenuMasterSid;
			}
		}
		this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
	}

	filterMenuByModule(selectedModule) {
		if (!selectedModule) {
			this.roleMenuForm.get('MenuMasterSid').setValue('');
			this.menuList = [];
			this.selectedPermission = [];
			return;
		}
		this.settingService.getMenuByModuleId(selectedModule.ModuleMasterSid).subscribe(
			(resp: any) => {
				if (resp) {
					this.menuList = resp;
				} else {
					this.appSettingService.showError('Error Loading Menus')
				}
			},
			(error) => {
				console.error('Error Loading Menus', error);
			}
		)
	}

	getMenuPermissions(menu) {
		// this.showLoading = true;
		this.settingService.getMenuPermissions(menu.MenuMasterSid).subscribe(
			(resp: any) => {
				if (resp) {
					this.menuPermissionList = resp;
					// this.showLoading = false;
					if (this.menuPermissionList.length > 0) {
						this.menuPermissionsFetched = true;
					}
				} else {
					this.appSettingService.showError('Error loading menu permissions.')
				}
			}
		)
	}


	handlePermission(permissionName, event) {
		const state = (event.target as HTMLInputElement).checked;
		if (state) {
			this.selectedPermission.push(permissionName);
		} else {
			this.selectedPermission = this.selectedPermission.filter(p => p !== permissionName)
		}
		this.updatePermissionControl()
	}

	updatePermissionControl() {
		const result: any = {};
		this.menuPermissionList.forEach((permission) => {
			const key = permission.permissionName;
			result[key] = this.selectedPermission.includes(permission.permissionName) ?
				'isTrue' : 'isFalse';
		})
		this.roleMenuForm.get('MenuPermissions')?.setValue(result, { emitEvent: false });
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

	onSubmit() {
		if (this.roleMenuForm.invalid) {
			this.roleMenuForm.markAllAsTouched();
			this.roleMenuForm.updateValueAndValidity();
			this.appSettingService.showWarning('Please fill all the required fields')
		}
		this.updatePermissionControl();
		const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
		const formValue = this.roleMenuForm.value;
		const payload = {
			...formValue,
			status:
				formValue.status === 'Active' || formValue.status === 'A'
					? 'A'
					: 'S',
			InsertRole: formValue.InsertRole ? 'Y' : 'N',
			ViewRole: formValue.ViewRole ? 'Y' : 'N',
			UpdateRole: formValue.UpdateRole ? 'Y' : 'N',
			DeleteRole: formValue.DeleteRole ? 'Y' : 'N',
			...(this.isEditMode ? { updatedBy: currentUserEmail } : { createdBy: currentUserEmail })
		}

		if (this.isEditMode) {
			this.settingService.updateRoleMenuById(this.RoleMenuMasterSid, payload).subscribe(
				(resp: any) => {
					if (resp.status) {
						this.appSettingService.showSuccess(resp.message);

						this.closeModal();
						// this.onRoleMenuSearch();
						this.searchRolemenu();
					} else {
						this.appSettingService.showError(resp.message);

					}
				},
				(error) => {
					console.error('Error Updating Role Menu', error);
				}
			)
		} else {
			this.settingService.createNewRoleMenu(payload).subscribe(
				(resp: any) => {
					if (resp.status) {
						this.appSettingService.showSuccess(resp.message)
						this.closeModal();
						// this.onRoleMenuSearch();
						this.searchRolemenu();
					} else {
						this.appSettingService.showError(resp.message);
					}
				},
				(error) => {
					console.error('Error Creating Role Menu', error);
				}
			)
		}
	}

	get f(): { [key: string]: AbstractControl<any, any> } {
		return this.roleMenuForm.controls;
	}

	closeModal() {
		this.menuList = [];
		this.selectedPermission = [];
		this.isEditMode = false;
		this.roleMenuForm.reset({
			status: 'Active'
		})
		this.menuPermissionsFetched = false;
		this.modalRef.close()
	}

	clearMenuPermissions() {
		this.menuPermissionsFetched = false;
		this.roleMenuForm.get('MenuPermissions').reset({});
		this.menuPermissionList = [];
		this.selectedPermission = [];
	}

	showInfo() {
		if (!this.roleMenuData) return;
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
