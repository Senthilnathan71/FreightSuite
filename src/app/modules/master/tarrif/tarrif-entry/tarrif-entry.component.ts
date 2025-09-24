import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbAlertModule, NgbCalendar, NgbDate, NgbDateAdapter, NgbDateNativeAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbNavModule, NgbPaginationModule, NgbPopoverModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { Port } from 'src/app/modules/crm-mobile/Interfaces/port.interface';
import { forkJoin } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { Charge } from 'src/app/modules/crm-mobile/Interfaces/charge.interface';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';

@Component({
	selector: 'app-tarrif-entry',
	standalone: true,
	imports: [
		FeatherModule,
		NgbTooltip,
		ReactiveFormsModule,
		OnlyNumbersDirective,
		OnlyTextDirective,
		TextWithNumbersDirective,
		NgSelectModule,
		NgbDatepickerModule,
		FormsModule,
		NgbNavModule,
		NgbAlertModule,
		CommonModule,
		MatDialogModule,
		DatePipe,
		DecimalPrecisionDirective,
		NgbPopoverModule,
		NgbPaginationModule,
		CustomDatePipe,
		SearchableDropdown,
		PreventMultiClickDirective,
		NgbDropdownModule
	],
	templateUrl: './tarrif-entry.component.html',
	styleUrl: './tarrif-entry.component.scss',
	providers: [
		{ provide: NgbDateAdapter, useClass: CustomDateAdapter },
		{ provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
	],
})
export class TarrifEntryComponent implements OnInit {
	selectedDepartment: any;
selectedDepartmentType: string = '';
selectedFCLLCL: string = '';
filteredPorts: any[] = [];
filteredPOL: any[] = [];
filteredPOD: any[] = [];
departments: any[] = [];

	active = 1
	modalRef: NgbModalRef;
	tariffHeaderForm!: FormGroup;
	tariffDetailsForm!: FormGroup;
	isEditMode: boolean;
	isModalEditMode :boolean;
	setErrorMessage: boolean;
	TariffHeaderSid: number;
	TariffDetailSid : number;
	TariffDetailsList : any[];
	filteredTariffDetail : any[];
	portList: Port[];
	polList: Port[];
	podList: Port[];
	chargeList: any[];
	UOMList: any[];
	departmentList: any[];
	agentList: any[];
	carrierList: any[];
	companyList: any[];
	currencyList : any[];
	incoList : any[]
	isDataLoading : boolean = false;
	tariffData : any;
	tariffDetailData : any;

	userData:any;
	permissions: string[] = [];
    currentMenuPermissions: any = {};
	currentCompany: any;
    currentBranch: any;

	
auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;

 selectedTab = 'Tariff Details';
  tab=[
   { name: 'Tariff Details', icon: 'fas fa-info-circle' },
  ]
 selectTab(tab: string) {
    this.selectedTab = tab;
  }

	cargoTypes = ['General', 'Haz', 'Reefer', 'Flexi', 'ODC', 'Empty', 'RORO', 'OOG', 'Tanker'];
	serviceLevel = ['BreakBulk', 'OOG', 'Tanker']

	page=1;
	pageSize=5;
	totalNumberOfCollection:number;
	today = this.calendar.getToday();
	todayDate = new Date(this.today.year,this.today.month-1,this.today.day);
	minEffectiveDate = this.toNgbDateStruct(this.todayDate);
	minEffectiveFrom : any;
	currentMenuId: number;
	TandCList: any;
	chargeTaxes : any[];
	btnDisable: boolean = true;

	constructor(
		private masterServ: MasterService,
		private appSettingServ: AppSettingsService,
		private currRoute: ActivatedRoute,
		private appSettingService: AppSettingsService,
		private route: Router,
		private fb: FormBuilder,
		private modalService: NgbModal,
		private matdial : MatDialog,
		private calendar: NgbCalendar
	) { }
	ngOnInit(): void {
		this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
       this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
		this.initHeaderForm();
		this.loadAllFields();
	// 	this.tariffHeaderForm.get('DepartmentMasterSid')?.valueChanges
    // .subscribe((deptSid) => {
    //   console.log('[valueChanges] DepartmentMasterSid value:', deptSid);
    //   const department = this.departmentList?.find(d => d.DepartmentMasterSid === Number(deptSid));
    //   console.log('[valueChanges] resolved department from list:', department);
    //   this.onDeptChange(department);
    // });

  // Log pol/pod changes (if you have these)
  this.tariffHeaderForm.get('POLSid')?.valueChanges.subscribe(val => console.log('POLSid changed ->', val));
  this.tariffHeaderForm.get('PODSid')?.valueChanges.subscribe(val => console.log('PODSid changed ->', val));
		  this.tariffHeaderForm.statusChanges.subscribe(status => {
				this.btnDisable = status !== 'VALID';
			});
		this.currRoute.paramMap.subscribe(param => {
			this.TariffHeaderSid = Number(param.get('id'));
			if (this.TariffHeaderSid) {
				this.isEditMode = true;
				this.minEffectiveDate = undefined
				this.loadTariff(this.TariffHeaderSid);
				this.loadTariffDetails();
			} else {
				this.minEffectiveDate = this.toNgbDateStruct(this.todayDate)
			}
		})

	// 	 this.appSettingServ.getUser().subscribe((user) => {
    //   if (user) {
    //     this.userData = user;
    //     this.checkPermissions();
    //   }
    // });
	const userProfile = this.appSettingServ.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
	}

			
		checkPermissions() {
			const currentMenuId = Number(localStorage.getItem('currentMenuId'));
			const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
			console.log(currentMenuId);
			console.log(userRole);
			if (currentMenuId && userRole) {
			this.masterServ
				.getRoleMenuPermissions(currentMenuId, userRole)
				.subscribe({
				next: (response) => {
					this.currentMenuPermissions = response.data.MenuPermissions || {};
					this.permissions = Object.keys(this.currentMenuPermissions).filter(
					(key) => this.currentMenuPermissions[key] === 'isTrue'
					);
					console.log(this.permissions);
				},
				});
			}
		}

		hasPermission(permission: string): boolean {
			return this.permissions.includes(permission);
		}

	initHeaderForm() {
		this.tariffHeaderForm = this.fb.group({

			DepartmentMasterSid: [null, [Validators.required]],
			POOSid: [,],
			POLSid: [, [Validators.required]],
			PODSid: [, [Validators.required]],
			FDCSid: [],
			ViaPortSid: [],
			POLTerminal: [''],
			PODTerminal: [''],
			Carrier: [null],
			MovementType : [null],
			AgentSid: [null],
			IncoTerms: [null],
			StuffingAt: [null],
			// EffectiveDate: ['',[Validators.required]],
			status: ['Active'],
			Remarks: [''],
		})
		this.tariffHeaderForm.get('POLTerminal').disable()
		this.tariffHeaderForm.get('PODTerminal').disable()
	}

	initDetailsForm() {
		this.tariffDetailsForm = this.fb.group({
			detailisSlabApplicable : [false,[Validators.required]],
			detailSlabFrom : ['',this.slabConditionalValidator()],
			detailSlabTo : ['',this.slabConditionalValidator()],
			detailEffectiveDate : ['',[Validators.required]],
			detailExpiredOn : ['',[Validators.required]],
			detailChargeCode : [null,[Validators.required]],
			detailDescription : [''],
			detailCargoType : [null,[Validators.required]],
			detailUOMSid : [null,[Validators.required]],
			detailSaleCurrency :[null,Validators.required],
			detailSalePerUnitPrice:['',[Validators.required]],
			detailBuyCurrency : [null,[Validators.required]],
			detailBuyPerUnitPrice : ['',[Validators.required]],
			detailMinSale : [''],
			detailstatus : ['Active'],
			detailRemarks : [''],
			chargeTaxMasters: this.fb.array([]),
            chargeTds: this.fb.array([])

		})
		this.tariffDetailsForm.get('detailisSlabApplicable')?.valueChanges.subscribe(() => {
			this.updateSlabValidators();
		});
		this.tariffDetailsForm.get('detailDescription')?.disable();
		this.tariffDetailsForm.get('detailChargeCode')?.valueChanges.subscribe(chargeCode => {
    if (chargeCode) {
      this.onChargeCodeChange(chargeCode);
    } else {
      // If charge code is cleared, reset effective date
      this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(null);
      this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
    }
  });

	}
get tariffDetails(): FormArray {
  return this.tariffDetailsForm.get('tariffDetails') as FormArray;
}
createTariffDetailFormGroup(tariffData?: any): FormGroup {
  return this.fb.group({
    detailisSlabApplicable: [tariffData?.IsSlabApplicable === 'Y' ? true : false || false, [Validators.required]],
    detailSlabFrom: [tariffData?.SlabFrom || '', this.slabConditionalValidator()],
    detailSlabTo: [tariffData?.SlabTo || '', this.slabConditionalValidator()],
    detailEffectiveDate: [tariffData?.EffectiveDate ? new Date(tariffData.EffectiveDate) : '', [Validators.required]],
    detailExpiredOn: [tariffData?.ExpiredOn ? new Date(tariffData.ExpiredOn) : '', [Validators.required]],
    detailChargeCode: [tariffData?.ChargeCode || '', [Validators.required]],
    detailDescription: [tariffData?.Description || ''],
    detailCargoType: [tariffData?.CargoType || '', [Validators.required]],
    detailUOMSid: [tariffData?.UOMSid || '', [Validators.required]],
    detailSaleCurrency: [tariffData?.SaleCurrency || '', Validators.required],
    detailSalePerUnitPrice: [tariffData?.SalePerUnitPrice || '', [Validators.required]],
    detailBuyCurrency: [tariffData?.BuyCurrency || '', [Validators.required]],
    detailBuyPerUnitPrice: [tariffData?.BuyPerUnitPrice || '', [Validators.required]],
    detailMinSale: [tariffData?.MinSale || ''],
    detailstatus: [tariffData?.status ? (tariffData.status === 'A' ? 'Active' : 'Suspended') : 'Active'],
    detailRemarks: [tariffData?.Remarks || ''],
    TariffDetailSid: [tariffData?.TariffDetailSid || null]
  });
}


	slabConditionalValidator(): ValidatorFn {
		return (control: AbstractControl): { [key: string]: any } | null => {
			const parent = control.parent;
			if (!parent) return null;

			const isSlabApplicable = parent.get('detailisSlabApplicable')?.value;
			if (isSlabApplicable && !control.value) {
				return { required: true };
			}
			return null;
		};
	}

	updateSlabValidators() {
		const isApplicable = this.tariffDetailsForm.get('detailisSlabApplicable')?.value;

		const slabFromCtrl = this.tariffDetailsForm.get('detailSlabFrom');
		const slabToCtrl = this.tariffDetailsForm.get('detailSlabTo');

		if (isApplicable) {
			slabFromCtrl?.setValidators([this.slabConditionalValidator()]);
			slabToCtrl?.setValidators([this.slabConditionalValidator()]);
		} else {
			slabFromCtrl?.clearValidators();
			slabToCtrl?.clearValidators();
		}

		slabFromCtrl?.updateValueAndValidity();
		slabToCtrl?.updateValueAndValidity();
	}


	openTariffDetailEntryModal(content: TemplateRef<any>, data?: any) {
		if(!this.TariffHeaderSid){
			this.appSettingServ.showError('Adding tariff details requires creation of tariff header.')
			return;
		}
		this.initDetailsForm();
		this.loadModalFields();
		if(data){
			this.isModalEditMode= true;
			this.tariffDetailData = data;
			this.minEffectiveFrom = undefined
			this.tariffDetailsForm.patchValue({
				detailisSlabApplicable: data.IsSlabApplicable ==='Y' ? true : false || false,
				detailSlabFrom: data.SlabFrom || '',
				detailSlabTo: data.SlabTo || '',
				detailEffectiveDate: new Date(data.EffectiveDate) || '',
				detailExpiredOn: new Date(data.ExpiredOn) || '',
				detailChargeCode: data.ChargeCode || '',
				detailDescription: data.Description || '',
				detailCargoType: data.CargoType || '',
				detailUOMSid: data.UOMSid || '',
				detailSaleCurrency: data.SaleCurrency || '',
				detailSalePerUnitPrice: data.SalePerUnitPrice ||'',
				detailBuyCurrency: data.BuyCurrency || '',
				detailBuyPerUnitPrice: data.BuyPerUnitPrice || '',
				detailMinSale: data.MinSale || '',
				detailstatus: data.status ? (data.status === 'A' ? 'Active' : 'Suspended') : 'Active',
				detailRemarks: data.Remarks || ''
			})
			this.setChargeCode(data.ChargeCode);
			if(data.TariffDetailSid){
				this.TariffDetailSid = data.TariffDetailSid;
			}
		} else {
			this.isModalEditMode = false;
			this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
		}

		this.modalRef = this.modalService.open(content, { size: 'lg',centered : true,backdrop : 'static' })
	}

	loadTariff(TariffHeaderSid) {
		this.masterServ.getTariffById(TariffHeaderSid).subscribe(
			(tariffData) => {
				if(tariffData.data.status){
					this.tariffData = tariffData.data;
					this.tariffHeaderForm.patchValue({
						...tariffData.data,
						DepartmentMasterSid: Number(tariffData.data.DepartmentMasterSid),
						EffectiveDate: new Date(tariffData.data.EffectiveDate),
						status: tariffData.data.status === 'A' ? 'Active' : "Suspended"
					})
				}
			},
			(error) => {
				this.appSettingServ.showError('Error Loading Tariff ', error);
			}
		)
	}

	loadAllFields() {
  const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  forkJoin({
    ports: this.masterServ.getAllPorts(),
    agents: this.masterServ.getAllAgents(CompanyMasterSid),
    carriers: this.masterServ.getAllCarriers(CompanyMasterSid),
    departments: this.masterServ.getAllDepartments(this.currentCompany?.CompanyMasterSid),
    companies: this.masterServ.getAllCompanies(),
    currencies: this.masterServ.getAllCurrencies(),
    incos: this.masterServ.getAllInco(),
    chargeTax: this.masterServ.getAllChargeTax(CompanyMasterSid)
  }).subscribe(({ ports, agents, carriers, departments, companies, currencies, incos, chargeTax }) => {
	this.departments = departments || [];
    this.portList = (ports.data || []).map(p=>({
		...p,
		CountryName : p.countryMaster?.countryName
	}))

  // initialize filtered lists (these are the ones we will filter later)
  this.filteredPorts = [...this.portList];
  this.filteredPOL = [...this.filteredPorts];
  this.filteredPOD = [...this.filteredPorts];

  // make UI-bound lists use filtered arrays so UI reflects department filters
  this.polList = [...this.filteredPOL];
  this.podList = [...this.filteredPOD];
    this.agentList = agents;
    this.carrierList = carriers;
    this.departmentList = departments;
    this.companyList = companies;
    this.currencyList = currencies;
    this.incoList = incos;
    this.chargeTaxes = chargeTax.data;
    this.isDataLoading = false;
	console.log('Departments loaded:', departments);
    console.log('Initial polList length =', this.polList.length, 'podList length =', this.podList.length);
  }, err => console.error('loadAllFields error', err));
}
  

	
openAuditLogs(modal: TemplateRef<any>) {
  if (!this.TariffHeaderSid) return;

  this.masterServ.getAuditLogs('TariffHeader', this.TariffHeaderSid.toString()).subscribe({
    next: (logs: any[]) => {
      const formatFields = (val: any) => {
        if (!val) return ['NA'];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        delete obj.updatedOn; // Remove updatedOn field
        // If no fields exist after deleting updatedOn
        if (Object.keys(obj).length === 0) return ['NA'];
        return Object.entries(obj).map(
          ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
        );
      };

      this.auditLogs = logs.map(log => ({
        ...log,
        oldValDisplay: formatFields(log.oldVal),
        newValDisplay: formatFields(log.newVal)
      }));

      this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
    },
    error: err => console.error('Error fetching audit logs:', err)
  });
}
	loadModalFields() {
		 const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
		 console.log('Current Company ID for charges:', CompanyMasterSid);
         console.log('Current Company object:', this.currentCompany);
		forkJoin({
			charges: this.masterServ.getAllCharges(CompanyMasterSid),
			UOMs: this.masterServ.getAllUom(),
		}).subscribe(({ charges, UOMs }) => {
			console.log('Charges response:', charges);
			this.chargeList = charges,
				this.UOMList = UOMs.data
		})
	}
	navigateBack() {
		history.back();
	}

	onSave() {
		if (this.tariffHeaderForm.invalid) {
			this.tariffHeaderForm.markAllAsTouched();
			this.tariffHeaderForm.updateValueAndValidity();
			this.appSettingServ.showWarning('Please fill all required fields correctly');
			return;
		} else {
			const formValue = this.tariffHeaderForm.getRawValue();
			const payload = this.coerceIntoRequiredFormat(formValue);

			if (this.isEditMode) {
				this.masterServ.updateTariffById(this.TariffHeaderSid, payload).subscribe(
					(resp: any) => {
						if (resp.status) {
							this.appSettingService.showSuccess(resp.message);

							// this.route.navigate(['master/tarrif/list']);
							this.loadTariff(this.TariffHeaderSid);
						} else {
							this.appSettingServ.showError(resp.message);
						}
					},
					(error) => {
						console.error('Error loading Tariff : ', error);
					}
				)
			} else {
				this.masterServ.createTariff(payload).subscribe(
					(resp: any) => {
						if (resp.status) {
							this.appSettingService.showSuccess(resp.message);

							const tariffId = resp?.data?.TariffHeaderSid;
							if(tariffId){
								this.route.navigate(['master/tarrif/entry',tariffId]);
							}
						} else {
							this.appSettingServ.showError(resp.message);
						}
					},
					(error) => {
						console.error('Error loading Tariff : ', error);
					}
				)
			}
		}
	}

	onModalSave(){
		if(this.tariffDetailsForm.invalid){
			this.tariffDetailsForm.markAllAsTouched();
			this.tariffDetailsForm.updateValueAndValidity();
			this.appSettingServ.showWarning('Please fill all the required fields');
			return;
		} else {
			const createdBy = this.appSettingServ.userSettingSource.value['userEmail'];
			const updatedBy = this.appSettingServ.userSettingSource.value['userEmail'];
			let formValue = this.tariffDetailsForm.getRawValue();
			const payload = {
				
				TariffHeaderSid : this.TariffHeaderSid || parseInt(formValue.TariffHeaderSid),
				IsSlabApplicable: formValue.detailisSlabApplicable ? 'Y':'N',
				SlabFrom: parseInt(formValue.detailSlabFrom),
				SlabTo:parseInt(formValue.detailSlabTo),
				EffectiveDate: formValue.detailEffectiveDate,
				ExpiredOn : formValue.detailExpiredOn,
				ChargeCode: formValue.detailChargeCode,
				Description: formValue.detailDescription,
				CargoType: formValue.detailCargoType,
				UOMSid: parseInt(formValue.detailUOMSid),
				SaleCurrency: parseInt(formValue.detailSaleCurrency),
				SalePerUnitPrice: parseFloat(formValue.detailSalePerUnitPrice),
				BuyCurrency: parseInt(formValue.detailBuyCurrency),
				BuyPerUnitPrice: parseFloat(formValue.detailBuyPerUnitPrice),
				MinSale: formValue.detailMinSale,
				status: formValue.detailstatus === 'Active'? 'A':'S',
				Remarks: formValue.detailRemarks,
				...(this.isModalEditMode ? {updatedBy:updatedBy} : {createdBy:createdBy})
			}
			if(this.isModalEditMode){
				this.masterServ.updateTariffDetailById(this.TariffDetailSid,payload).subscribe(
					(resp:any)=>{
						if(resp.status){
							this.appSettingService.showSuccess(resp.message);

							this.tariffDetailsForm.reset();
							this.modalRef.close();
							this.loadTariffDetails();
						} else {
							this.appSettingServ.showError('Error Updating Tariff Detail')
						}
					},
					(error)=>{
						console.error('Error Updating Tariff Detail',error);
					}
				)
			} else {
				this.masterServ.createNewTariffDetail(payload).subscribe(
					(resp:any)=>{
						if(resp.status){
							this.appSettingServ.showSuccess('New Tariff Detail Created');
							this.tariffDetailsForm.reset();
							this.modalRef.close();
							this.loadTariffDetails();
						} else {
							this.appSettingServ.showError('Error Creating Tariff Detail')
						}
					},
					(error)=>{
						console.error('Error Creating Tariff Detail',error);
					}
				)
			}
		}
	}

	coerceIntoRequiredFormat(formValue) {
		let createdBy = this.appSettingServ.userSettingSource.value['userEmail'];
		let updatedBy = this.appSettingServ.userSettingSource.value['userEmail'];
		return (this.isEditMode) ? {
			...formValue,
			CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
			POOSid: Number(formValue.POOSid),
			POLSid: Number(formValue.POLSid),
			PODSid: Number(formValue.PODSid),
			FDCSid: Number(formValue.FDCSid),
			ViaPortSid: Number(formValue.ViaPortSid),
			AgentSid: Number(formValue.AgentSid),
			Carrier: Number(formValue.Carrier),
			updatedBy,
			status: formValue.status === "Active" ? "A" : "S"
		} : {
			...formValue,
			CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
			POOSid: Number(formValue.POOSid),
			POLSid: Number(formValue.POLSid),
			PODSid: Number(formValue.PODSid),
			FDCSid: Number(formValue.FDCSid),
			ViaPortSid: Number(formValue.ViaPortSid),
			AgentSid: Number(formValue.AgentSid),
			Carrier: Number(formValue.Carrier),
			createdBy,
			status: formValue.status === "Active" ? "A" : "S"
		}
	}

	deleteTariffDetail(TariffDetailSid) {
		const dialRef = this.matdial.open(DeleteWarningComponent);
		dialRef.afterClosed().subscribe(
			(res) => {
				if (res) {
					this.masterServ.deleteTariffDetailById(TariffDetailSid).subscribe(
						(resp) => {
							if (resp.data) {
								this.appSettingServ.showSuccess('Tariff Detail Deleted Successfully');
								this.loadTariffDetails();
							} else {
								this.appSettingServ.showError('Error Deleting Tariff Detail');
							}
						},
						(error)=>{
							console.error('Error Deleting Tariff Detail',error);
						}
					)
				}
			}
		)

	}
	onDeptChange(department: any): void {
		console.log('onDeptChange called with:', department);
  this.selectedDepartment = department;
  if (!department) {
    this.selectedDepartmentType = '';
    this.selectedFCLLCL = 'LCL';
    this.filteredPorts = [...(this.portList || [])];
    this.filteredPOL = [...this.filteredPorts];
    this.filteredPOD = [...this.filteredPorts];

    // update UI lists
    this.polList = [...this.filteredPOL];
    this.podList = [...this.filteredPOD];

    // clear selected values
    this.tariffHeaderForm.get('POOSid')?.setValue(null);
    this.tariffHeaderForm.get('POLSid')?.setValue(null);
    this.tariffHeaderForm.get('PODSid')?.setValue(null);
    this.tariffHeaderForm.get('FDCSid')?.setValue(null);
    this.tariffHeaderForm.get('MovementType')?.setValue(null);
    return;
  }

  this.selectedDepartmentType = (department.departmentType || '').toUpperCase();
  this.selectedFCLLCL = this.selectedDepartmentType === 'SEA'
    ? (department.FCLLCL?.toUpperCase() || 'LCL')
    : 'AIR';

  // Filter ports based on segment
  console.log('onDepChange',this.selectedFCLLCL)
  this.filteredPorts = this.getFilteredPortsBySegment(this.selectedFCLLCL);
  this.filteredPOL = [...this.filteredPorts];
  this.filteredPOD = [...this.filteredPorts];

  // update UI-bound lists
  this.polList = [...this.filteredPOL];
  this.podList = [...this.filteredPOD];

  // Set MovementType
  if (this.selectedDepartmentType === 'SEA') {
    this.tariffHeaderForm.get('MovementType')?.setValue('Sea');
  } else if (this.selectedDepartmentType === 'AIR') {
    this.tariffHeaderForm.get('MovementType')?.setValue('Air');
  }
}


getFilteredPortsBySegment(segment: string): any[] {
	console.log('getFilteredPortsBySegment',segment)
  if (segment === 'AIR') {
    return this.portList.filter(port => port.PortType === 'Air');
  } else if (segment === 'FCL' || segment === 'LCL') {
    return this.portList.filter(port => port.PortType === 'Sea');
  }
  return this.portList;
}

handlePOLChange(selectedPort: any): void {
  if (!selectedPort) {
    this.filteredPOD = [...this.filteredPorts];
    return;
  }
  const selectedPortSid = selectedPort.PortMasterSid ?? selectedPort;
  this.filteredPOD = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPortSid);
  this.tariffHeaderForm.get('POLSid')?.setValue(selectedPortSid, { emitEvent: false });
}

handlePODChange(selectedPort: any): void {
  if (!selectedPort) {
    this.filteredPOL = [...this.filteredPorts];
    return;
  }
  const selectedPortSid = selectedPort.PortMasterSid ?? selectedPort;
  this.filteredPOL = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPortSid);
  this.tariffHeaderForm.get('PODSid')?.setValue(selectedPortSid, { emitEvent: false });
}

	updatePaginationData() {
    let start = (this.page - 1) * this.pageSize;
    let end = start + this.pageSize;
    this.filteredTariffDetail = this.TariffDetailsList.slice(start, end)
  }

	// resetForm() {
	// 	this.tariffHeaderForm.reset();
	// }

	resetForm() {
		this.filteredPorts = [...this.portList];
  this.filteredPOL = [...this.filteredPorts];
  this.filteredPOD = [...this.filteredPorts];
  // If editing an existing tariff, reload it (restore original state)
  if (this.isEditMode && this.TariffHeaderSid) {
    this.loadTariff(this.TariffHeaderSid);
    this.loadTariffDetails();
    return;
  }

  // Create-mode: reset header form to sensible defaults
  this.tariffHeaderForm.reset({
    DepartmentMasterSid: null,
    POOSid: '',
    POLSid: '',
    PODSid: '',
    FDCSid: '',
    ViaPortSid: '',
    POLTerminal: '',
    PODTerminal: '',
    Carrier: null,
    MovementType: null,
    AgentSid: null,
    IncoTerms: null,
    StuffingAt: null,
    EffectiveDate: '',
    status: 'Active',
    Remarks: ''
  });

  // Reset detail list and pagination
  this.TariffDetailsList = [];
  this.filteredTariffDetail = [];
  this.totalNumberOfCollection = 0;
  this.page = 1;

  // Clear any validation states
  this.tariffHeaderForm.markAsUntouched();
  this.tariffHeaderForm.markAsPristine();
  this.tariffHeaderForm.updateValueAndValidity();

  // Reset additional component state
  this.tariffData = null;
  this.tariffDetailData = null;
  this.TariffHeaderSid = null;
  this.TariffDetailSid = null;
  this.isModalEditMode = false;
  this.btnDisable = true;

  // Reset port lists to full lists
  this.polList = [...this.portList];
  this.podList = [...this.portList];

  // Reset min date to today for new entries
  this.minEffectiveDate = this.toNgbDateStruct(this.todayDate);
  this.minEffectiveFrom = null;

  // Re-enable form controls that were disabled
  this.tariffHeaderForm.get('POLTerminal').disable();
  this.tariffHeaderForm.get('PODTerminal').disable();
}

	setPOLTerminal(event) {
		if (event) {
			const POLTerminal = this.portList.find(port => port.PortMasterSid === event).PortCode;
			this.tariffHeaderForm.get('POLTerminal').setValue(POLTerminal);
		}
	}
	setPODTerminal(event) {
		if (event) {
			const PODTerminal = this.portList.find(port => port.PortMasterSid === event).PortCode;
			this.tariffHeaderForm.get('PODTerminal').setValue(PODTerminal);
		}
	}

	setChargeCode(chargeCode){
		const requiredCharge = this.chargeList.find(charge => charge.chargeCode === chargeCode);
		// this.setChargeDescription(requiredCharge);
	}

	loadTariffDetails(){
		this.masterServ.getAllTariffDetail().subscribe(
			(resp)=>{
				const allTariffDetails = resp.data;
				if(this.TariffHeaderSid){
					this.TariffDetailsList = allTariffDetails.filter(
						tariffDetail=> tariffDetail.TariffHeaderSid === this.TariffHeaderSid
					);
				}
				this.totalNumberOfCollection=this.TariffDetailsList.length;
				this.updatePaginationData();
			},
			(error)=>{
				console.error('Error Loading All Tariff Details',error);
			}
		)
	}
	
	toNgbDateStruct(date: Date | null): NgbDateStruct | null {
		if (!date) return null;
		return {
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate()
		};
	}

	filterPodList(port){
  if(!port){
    this.tariffHeaderForm.get('POLTerminal')?.setValue('');
    this.podList = [...(this.filteredPorts || this.portList || [])];
    return;
  }
  this.tariffHeaderForm.get('POLTerminal')?.setValue(port.PortCode);
  this.podList = (this.filteredPorts || this.portList).filter(each => each.PortMasterSid !== port.PortMasterSid);
}

filterPolList(port){
  if(!port){
    this.tariffHeaderForm.get('PODTerminal')?.setValue('');
    this.polList = [...(this.filteredPorts || this.portList || [])];
    return;
  }
  this.tariffHeaderForm.get('PODTerminal')?.setValue(port.PortCode);
  this.polList = (this.filteredPorts || this.portList).filter(each => each.PortMasterSid !== port.PortMasterSid);
}


	showHeaderInfo() {
		if (!this.tariffData) return;
		const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
		modalRef.componentInstance.item = this.tariffData;
		modalRef.componentInstance.idLabel = 'Tariff Header Id';
		modalRef.componentInstance.idValue = this.tariffData?.TariffHeaderSid;
	}
	showDetailInfo() {
		if (!this.tariffDetailData) return;
		const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
		modalRef.componentInstance.item = this.tariffDetailData;
		modalRef.componentInstance.idLabel = 'Tariff Detail Id';
		modalRef.componentInstance.idValue = this.tariffDetailData?.TariffDetailSid;
	}

	openTandC() {
		this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
		const payload = { MenuMasterSid: this.currentMenuId };
		this.masterServ.getTandCByCondition(payload).subscribe(
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
					modalRef.componentInstance.DocumentSid = this.TariffHeaderSid;

				} else {
					this.appSettingServ.showError('Error loading Terms and Conditions');
				}
			},
			(error) => {
				this.appSettingServ.showError('Error loading Terms and Conditions', error);
			}
		);
	}

	openEmail() {
		if (!this.tariffData) return;
		const modalRef = this.modalService.open(EmailEntryComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
	}

	  openAuthority() {
		const MenuMasterSid = localStorage.getItem('currentMenuId');
		if (!MenuMasterSid) return;
	   const modalRef = this.modalService.open(AuthorityLogComponent, { 
		size: 'lg', 
		centered: true, 
		backdrop: 'static' 
	  });
		modalRef.componentInstance.menuMasterSid = MenuMasterSid;
		modalRef.componentInstance.documentSid = this.TariffHeaderSid;
	  }

	openEDoc() {
		if (!this.tariffData) return;
		const modalRef = this.modalService.open(EdocComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
	}

	setChargeDetails(charge?: Charge) {
  if (!charge || this.chargeTaxes.length === 0) {
    this.tariffDetailsForm.get('detailDescription')?.setValue('');
    this.tariffDetailsForm.get('detailUOMSid')?.setValue(null);
    return;
  }
  
  let ChargeMasterSid = charge?.ChargeMasterSid;
  this.tariffDetailsForm.get('detailUOMSid')?.setValue(charge?.UOM);
  
  const reqTaxes = this.chargeTaxes.filter(t => t.chargeTaxMasterSid === ChargeMasterSid);
  if (reqTaxes.length > 0) {
    this.tariffDetailsForm.get('detailDescription')?.setValue(reqTaxes[0].description);
  }
  
  // When charge details are set, also update the effective date based on charge code
  if (charge?.chargeCode) {
    this.setEffectiveDateBasedOnChargeCode(charge.chargeCode);
  }
}
	setEffectiveDateBasedOnChargeCode(chargeCode?: string) {
  if (!chargeCode) {
    // If no charge code selected, clear the effective date
    this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(null);
    this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
    return;
  }

  // Filter tariff details for the same charge code
  const sameChargeDetails = this.TariffDetailsList.filter(
    detail => detail.ChargeCode === chargeCode
  );

  if (sameChargeDetails.length === 0) {
    // No previous details for this charge code, set to today
    this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(this.todayDate);
    this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
    return;
  }

  // Find the maximum expired date for this charge code
  const expiredDates = sameChargeDetails.map(detail => new Date(detail.ExpiredOn));
  const maxExpiredDate = new Date(Math.max(...expiredDates.map(date => date.getTime())));
  
  // Set Effective From to the next day after max expired date
  const nextDay = new Date(maxExpiredDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  // Set the value in the form control
  this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(nextDay);
  this.minEffectiveFrom = this.toNgbDateStruct(nextDay);
}

// Update the charge code change handler
onChargeCodeChange(chargeCode: string) {
  this.setEffectiveDateBasedOnChargeCode(chargeCode);
  
  // Set charge description and other details
  this.setChargeDetails(this.chargeList.find(charge => charge.chargeCode === chargeCode));
}

	calculateMinEffectiveFrom(chargeCode?: string) {
  if (!chargeCode) {
    // If no charge code selected, default to today
    this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
    return;
  }

  // Filter tariff details for the same charge code
  const sameChargeDetails = this.TariffDetailsList.filter(
    detail => detail.ChargeCode === chargeCode
  );

  if (sameChargeDetails.length === 0) {
    // No previous details for this charge code, default to today
    this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
    return;
  }

  // Find the maximum expired date for this charge code
  const expiredDates = sameChargeDetails.map(detail => new Date(detail.ExpiredOn));
  const maxExpiredDate = new Date(Math.max(...expiredDates.map(date => date.getTime())));
  
  // Set minEffectiveFrom to the next day after max expired date
  const nextDay = new Date(maxExpiredDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  this.minEffectiveFrom = this.toNgbDateStruct(nextDay);
}

effectiveDateValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;

    const chargeCode = control.parent?.get('detailChargeCode')?.value;
    const effectiveDate = new Date(control.value);
    
    if (!chargeCode) return null;

    // Filter previous details for the same charge code
    const sameChargeDetails = this.TariffDetailsList.filter(
      detail => detail.ChargeCode === chargeCode
    );

    if (sameChargeDetails.length === 0) {
      // No previous details - must be today or future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (effectiveDate < today) {
        return { invalidEffectiveDate: 'Effective date cannot be in the past for new charge codes' };
      }
      return null;
    }

    // Find max expired date for this charge code
    const expiredDates = sameChargeDetails.map(detail => new Date(detail.ExpiredOn));
    const maxExpiredDate = new Date(Math.max(...expiredDates.map(date => date.getTime())));
    const requiredEffectiveDate = new Date(maxExpiredDate);
    requiredEffectiveDate.setDate(requiredEffectiveDate.getDate() + 1);
    
    // Check if the selected date is exactly the required date
    if (effectiveDate.toDateString() !== requiredEffectiveDate.toDateString()) {
      return { 
        invalidEffectiveDate: `Effective date must be ${requiredEffectiveDate.toLocaleDateString()} for this charge code` 
      };
    }

    return null;
  };
}

	

}
