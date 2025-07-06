import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbAlertModule, NgbCalendar, NgbDate, NgbDateAdapter, NgbDateNativeAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbModal, NgbModalModule, NgbModalRef, NgbNavModule, NgbPaginationModule, NgbPopoverModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
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
		PreventMultiClickDirective
	],
	templateUrl: './tarrif-entry.component.html',
	styleUrl: './tarrif-entry.component.scss',
	providers: [
		{ provide: NgbDateAdapter, useClass: CustomDateAdapter },
		{ provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
	],
})
export class TarrifEntryComponent implements OnInit {

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
	customerList: any[];
	companyList: any[];
	currencyList : any[];
	incoList : any[]
	isDataLoading : boolean = false;
	tariffData : any;
	tariffDetailData : any;


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

	constructor(
		private masterServ: MasterService,
		private appSettingServ: AppSettingsService,
		private currRoute: ActivatedRoute,
		private route: Router,
		private fb: FormBuilder,
		private modalService: NgbModal,
		private matdial : MatDialog,
		private calendar: NgbCalendar
	) { }
	ngOnInit(): void {
		this.initHeaderForm();
		this.loadAllFields();
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
			EffectiveDate: ['',[Validators.required]],
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
			detailRemarks : ['']
		})
		this.tariffDetailsForm.get('detailisSlabApplicable')?.valueChanges.subscribe(() => {
			this.updateSlabValidators();
		});
		this.tariffDetailsForm.get('detailDescription')?.disable();
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
			this.calculateMinEffectiveFrom();
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
		forkJoin({
			ports: this.masterServ.getAllPorts(),
			customers: this.masterServ.getAllCustomers(),
			departments: this.masterServ.getAllDepartments(),
			companies: this.masterServ.getAllCompanies(),
			currencies : this.masterServ.getAllCurrencies(),
			incos : this.masterServ.getAllInco(),
			chargeTax : this.masterServ.getAllChargeTax()
		}).subscribe(({ ports, customers, departments, companies,currencies,incos,chargeTax}) => {
			this.portList = ports.data,
			this.polList = ports.data,
			this.podList = ports.data,
			this.customerList = customers,
			this.departmentList = departments,
			this.companyList = companies,
			this.currencyList = currencies,
			this.incoList = incos
			this.chargeTaxes = chargeTax.data
			this.isDataLoading = false;
		})
	}

	loadModalFields() {
		forkJoin({
			charges: this.masterServ.getAllCharges(),
			UOMs: this.masterServ.getAllUom(),
		}).subscribe(({ charges, UOMs }) => {
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
							this.appSettingServ.showSuccess('Tariff Updated Successfully');
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
							this.appSettingServ.showSuccess('Tariff Created Successfully');
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
							this.appSettingServ.showSuccess('Tariff Detail Updated')
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

	updatePaginationData() {
    let start = (this.page - 1) * this.pageSize;
    let end = start + this.pageSize;
    this.filteredTariffDetail = this.TariffDetailsList.slice(start, end)
  }

	resetForm() {
		this.tariffHeaderForm.reset();
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
		this.setChargeDescription(requiredCharge);
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
			this.tariffHeaderForm.get('POLTerminal').setValue('')
			return
		}
		this.tariffHeaderForm.get('POLTerminal').setValue(port.PortCode)
		this.podList = this.portList.filter(each => each.PortMasterSid !== port.PortMasterSid);
	}

	filterPolList(port){
		if(!port){
			this.tariffHeaderForm.get('PODTerminal').setValue('')
			return
		}
		this.tariffHeaderForm.get('PODTerminal').setValue(port.PortCode)
		this.polList = this.portList.filter(each => each.PortMasterSid !== port.PortMasterSid);
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

	setChargeDescription(charge ?: Charge){
		if(!charge || this.chargeTaxes.length === 0)
		{
			this.tariffDetailsForm.get('detailDescription').setValue('');
			return;
		}
		let ChargeMasterSid = charge.ChargeMasterSid;
		const reqTaxes = this.chargeTaxes.filter(t => t.chargeTaxMasterSid === ChargeMasterSid);
		if(reqTaxes.length > 0){
			this.tariffDetailsForm.get('detailDescription').setValue(reqTaxes[0].description);
		}
	}

	calculateMinEffectiveFrom(){
		if(this.TariffDetailsList.length === 0){
			this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
			return;
		}
		const onlyExpiredData = this.TariffDetailsList.map( m => m.ExpiredOn);
		onlyExpiredData.sort((a,b)=>new Date(a).getTime() - new Date(b).getTime())
		const maxExpiredOn = onlyExpiredData[onlyExpiredData.length-1];
		this.minEffectiveFrom = this.toNgbDateStruct(new Date(maxExpiredOn));
	}


}
