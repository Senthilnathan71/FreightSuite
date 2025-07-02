import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { MasterService } from '../../master.service';
import { CommonModule } from '@angular/common';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';

@Component({
	selector: 'app-doctype',
	standalone: true,
	imports: [
		NgSelectModule,
		CommonModule,
		ReactiveFormsModule,
		OnlyTextDirective,
		OnlyNumbersDirective,
		TextWithNumbersDirective
	],
	templateUrl: 'doctype.component.html',
	styleUrl: './doctype.component.scss'
})

export class DoctypeComponent implements OnInit {

	DocumentTypeMasterSid: number;
	isEditMode: boolean;

	documentForm !: FormGroup;
	companyList : any[];
	branchList: any[];
	currencyList : any[];
	documentData: any

	documentSeparators = [
		{ separator: 'Slash ( / )', value : '/' },
		{ separator: 'Hyphen ( - )', value : '-' },
		{ separator: 'Colon ( : )', value : ':' },
		{ separator: 'Dot ( . )', value : '.' }
	];

	resetValues = [
		{ value: 'Year' },
		{ value: 'Month' },
		{ value: 'Financial Year' }
	]

	modeOfStatus: [
		{ id: 1, name: 'Active' },
		{ id: 2, name: 'Suspended' }
	]
	currentMenuId: number;
	TandCList: any;


	constructor(
		private appSettingService: AppSettingsService,
		private masterService: MasterService,
		private router: Router,
		private currentRoute: ActivatedRoute,
		private modalService: NgbModal,
		private fb: FormBuilder
	) { }

	ngOnInit() {
		this.initDocumentForm();
		this.loadAllFields();
		this.currentRoute.paramMap.subscribe(
			(param) => {
				this.DocumentTypeMasterSid = +param.get('id');
				if (this.DocumentTypeMasterSid) {
					this.isEditMode = true;
					this.loadDocumentType(this.DocumentTypeMasterSid);
				}
			}
		)
	}


	initDocumentForm() {
		this.documentForm = this.fb.group({
			// BranchMasterSid: [null, [Validators.required]],
			DocumentTypeName: ['', [Validators.required]],
			DocumentTypeCode: ['', [Validators.required]],
			Type : [''],
			CurrencyCode: [null, [Validators.required]],
			COALedger: ['', [Validators.required]],
			Subledger: ['', [Validators.required]],
			ReportTitle : [''],
			ReportFooter : [''],
			DocumentStartingNo: ['', [Validators.required]],
			DocumentSeparator: [null, [Validators.required]],
			DocumentSLNoLength: ['', [Validators.required]],
			ResetValue: [null, [Validators.required]],
			CompanyFlag: [false],
			CompanyValue: [''],
			BranchFlag: [false],
			BranchValue: [''],
			DocumentFlag: [false],
			DocumentValue: [''],
			MonthFlag: [false],
			YearFlag: [false],
			status: ['Active'],
			Remarks: ['']
		})
		this.documentForm.get('CompanyValue').disable();
		this.documentForm.get('BranchValue').disable();
		this.documentForm.get('DocumentValue').disable();
	}

	loadAllFields() {
		forkJoin({
			companies : this.masterService.getAllCompanies(),
			currencies : this.masterService.getAllCurrencies(),
		}).subscribe(({ companies, currencies }) => {
			this.companyList = companies,
			this.currencyList = currencies
		})
	}

	loadDocumentType(DocumentTypeMasterSid) {
		this.masterService.getDocTypeById(DocumentTypeMasterSid).subscribe(
			(resp: any) => {
				if (resp.status) {
					this.documentData = resp.data;
					const data = resp.data;
					this.documentForm.patchValue({
						...data,
						CompanyFlag: data.CompanyFlag === 'Y',
						BranchFlag: data.BranchFlag === 'Y',
						DocumentFlag: data.DocumentFlag === 'Y',
						MonthFlag: data.MonthFlag === 'Y',
						YearFlag: data.YearFlag === 'Y',
						status: data.status === 'A' ? 'Active' : 'Suspended',
					})
					this.getBranchesByCompanyId({CompanyMasterSid : data.CompanyMasterSid})
					// if(data.CompanyFlag === 'Y'){
					// 	this.documentForm.get('CompanyValue').enable();
					// }
					// if(data.BranchFlag === 'Y'){
					// 	this.documentForm.get('BranchValue').enable();
					// }
					// if(data.DocumentFlag === 'Y'){
					// 	this.documentForm.get('DocumentValue').enable();
					// }
				} else {
					this.appSettingService.showError('Error Loading Document Type');
				}
			},
			(error) => {
				this.appSettingService.showError('Error Loading Document Type');
				console.error('Error loading Document Type', error);
			}
		)
	}


	onSubmit() {
		if (this.documentForm.invalid) {
			this.documentForm.markAllAsTouched();
			this.documentForm.updateValueAndValidity();
			this.appSettingService.showWarning('Please fill all the required fields');
			return;
		}

		const BranchMasterSid = this.appSettingService.userSettingSource.value['userBranchMaster'][0].branchMaster.BranchMasterSid;
		const CompanyMasterSid = this.appSettingService.userSettingSource.value['userBranchMaster'][0].companyMaster.CompanyMasterSid;
		const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
		const formValue = this.documentForm.getRawValue();

		const payload = {
			...formValue,
			CompanyMasterSid : CompanyMasterSid,
			BranchMasterSid : BranchMasterSid,
			COALedger : Number(formValue.COALedger),
			Subledger : Number(formValue.Subledger),
			CompanyFlag: formValue.CompanyFlag ? 'Y' : 'N',
			BranchFlag: formValue.BranchFlag ? 'Y' : 'N',
			DocumentFlag: formValue.DocumentFlag ? 'Y' : 'N',
			MonthFlag: formValue.MonthFlag ? 'Y' : 'N',
			YearFlag: formValue.YearFlag ? 'Y' : 'N',
			status: formValue.status === 'Active' ? 'A' : 'S',
			...(this.isEditMode ? { updatedBy: currentUserEmail } : { createdBy: currentUserEmail })
		}

		if (this.isEditMode) {
			this.masterService.updateDocTypeById(this.DocumentTypeMasterSid, payload).subscribe(
				(resp: any) => {
					if (resp.status) {
						this.appSettingService.showSuccess('Document Type Successfully Updated')
						this.router.navigate(['master/doctype/list'])
					} else {
						this.appSettingService.showError('Error Updating Document Type');
					}
				},
				(error) => {
					this.appSettingService.showError('Error Updating Document Type');
					console.error('Error Updating Document Type', error);
				}
			)
		} else {
			this.masterService.createNewDocType(payload).subscribe(
				(resp: any) => {
					if (resp.status) {
						this.appSettingService.showSuccess('Document Type successfully Created');
						this.router.navigate(['master/doctype/list'])
					} else {
						this.appSettingService.showError('Error Creating Document Type');
					}
				},
				(error) => {
					this.appSettingService.showError('Error Creating Document Type');
					console.error('Error Creating Document Type', error);
				}
			)
		}

	}


	resetForm() {
		this.documentForm.reset({
			status: 'Active'
		})
	}

	navigateBack() {
		history.back()
	}

	showInfo() {
		if (!this.documentData) return;
		const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
		modalRef.componentInstance.item = this.documentData;
		modalRef.componentInstance.idLabel = 'Document Type Id';
		modalRef.componentInstance.idValue = this.documentData?.DocumentTypeMasterSid;
	}

	getBranchesByCompanyId(company){
		this.masterService.getBranchesByCompanyId(company.CompanyMasterSid).subscribe(
			(resp:any)=>{
				if(resp){
					this.branchList = resp;
				} else {
					this.appSettingService.showError('Error Loading Branches By Company')
				}
			}
		)
	}

	enableValueField(field, event) {
		const state = event.target.checked;
		const control = this.documentForm.get(field);

		if (!control) return;

		if (state) {
			control.enable();
			control.setValidators(Validators.required);
			control.markAsTouched();
		} else {
			control.setValue('');
			control.clearValidators(); 
			control.disable();
		}

		control.updateValueAndValidity();
	}


	createVoucherNumber() {
		const {
			CompanyFlag, BranchFlag, DocumentFlag, YearFlag, MonthFlag,
			CompanyValue, BranchValue, DocumentValue,
			DocumentStartingNo, DocumentSLNoLength, DocumentSeparator
		} = this.documentForm.controls;

		const currentYear = new Date().getFullYear();
		const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
		const serial = String(DocumentStartingNo.value).padStart(DocumentSLNoLength.value, "0");

		const parts = [
			CompanyFlag.value ? CompanyValue.value.trim() : '',
			BranchFlag.value ? BranchValue.value.trim() : '',
			DocumentFlag.value ? DocumentValue.value.trim() : '',
			YearFlag.value ? currentYear : '',
			MonthFlag.value ? currentMonth : '',
			serial
		].filter(Boolean);

		const voucherNumber = parts.join(DocumentSeparator.value);
		return voucherNumber;
	}

	openSampleModal(content : TemplateRef<any>){
		this.modalService.open(content,{size : 'lg',centered:true,backdrop:'static'})
	}

	openTandC() {
		this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
		const payload = { MenuMasterSid: this.currentMenuId };
		this.masterService.getTandCByCondition(payload).subscribe(
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
					modalRef.componentInstance.DocumentSid = this.DocumentTypeMasterSid;

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