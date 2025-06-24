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
		SearchableDropdown
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
	isDataLoading : boolean = true;
	tariffData : any;
	tariffDetailData : any;


	cargoTypes = ['General', 'Haz', 'Reefer', 'Flexi', 'ODC', 'Empty', 'RORO', 'OOG', 'Tanker'];
	serviceLevel = ['BreakBulk', 'OOG', 'Tanker']

	page=1;
	pageSize=5;
	totalNumberOfCollection:number;
	today = this.calendar.getToday();
	todayDate = new Date(this.today.year,this.today.month,this.today.day);

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
				this.loadTariff(this.TariffHeaderSid);
				this.loadTariffDetails();
			}
		})
	}

	initHeaderForm() {
		this.tariffHeaderForm = this.fb.group({

			DepartmentMasterSid: ['', [Validators.required]],
			POOSid: [,],
			POLSid: [, [Validators.required]],
			PODSid: [, [Validators.required]],
			FDCSid: [],
			ViaPortSid: [],
			POLTerminal: [''],
			PODTerminal: [''],
			Carrier: [''],
			MovementType : [''],
			AgentSid: [''],
			IncoTerms: [''],
			StuffingAt: ['Dock'],
			EffectiveDate: ['',[Validators.required]],
			status: ['Active'],
			Remarks: [''],
		})
	}

	initDetailsForm() {
		this.tariffDetailsForm = this.fb.group({
			detailisSlabApplicable : [false,[Validators.required]],
			detailSlabFrom : ['',this.slabConditionalValidator()],
			detailSlabTo : ['',this.slabConditionalValidator()],
			detailEffectiveDate : ['',[Validators.required]],
			detailExpiredOn : ['',[Validators.required]],
			detailChargeCode : ['',[Validators.required]],
			detailDescription : ['',[Validators.required]],
			detailCargoType : ['',[Validators.required]],
			detailUOMSid : ['',[Validators.required]],
			detailSaleCurrency :['',Validators.required],
			detailSalePerUnitPrice:['',[Validators.required]],
			detailBuyCurrency : ['',[Validators.required]],
			detailBuyPerUnitPrice : ['',[Validators.required]],
			detailMinSale : ['',[Validators.required]],
			detailstatus : ['Active'],
			detailRemarks : ['',[Validators.required]]
		})
		this.tariffDetailsForm.get('detailisSlabApplicable')?.valueChanges.subscribe(() => {
			this.updateSlabValidators();
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
		this.initDetailsForm();
		this.loadModalFields();
		if(data){
			this.isModalEditMode= true;
			this.tariffDetailData = data;
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
			
			if(data.TariffDetailSid){
				this.TariffDetailSid = data.TariffDetailSid;
			}
		} else {
			this.isModalEditMode = false;
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
			currencies : this.masterServ.getAllCurrencies()
		}).subscribe(({ ports, customers, departments, companies,currencies}) => {
			this.portList = ports.data,
			this.polList = ports.data,
			this.podList = ports.data,
			this.customerList = customers,
			this.departmentList = departments,
			this.companyList = companies,
			this.currencyList = currencies,
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
			const formValue = this.tariffHeaderForm.value;
			const payload = this.coerceIntoRequiredFormat(formValue);

			if (this.isEditMode) {
				this.masterServ.updateTariffById(this.TariffHeaderSid, payload).subscribe(
					(resp: any) => {
						if (resp.status) {
							this.appSettingServ.showSuccess('Tariff Updated Successfully');
							this.route.navigate(['master/tarrif/list']);
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
							this.route.navigate(['master/tarrif/list']);
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
			let formValue = this.tariffDetailsForm.value;
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
				...(this.isModalEditMode ? {createdBy:createdBy}:{updatedBy:updatedBy})
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

	setChargeCode(ChargeMasterSid){
		const requiredCharge = this.chargeList.find(charge => charge.ChargeMasterSid === ChargeMasterSid);
		this.tariffDetailsForm.get('detailChargeCode')?.setValue(requiredCharge.chargeCode);
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
		this.tariffHeaderForm.get('POLTerminal').setValue(port.PortCode)
		this.podList = this.portList.filter(each => each.PortMasterSid !== port.PortMasterSid);
	}

	filterPolList(port){
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


}
