import { Component, HostListener, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, forkJoin, Subject, takeUntil } from 'rxjs';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { MasterService } from '../../master.service';
import { CommonModule } from '@angular/common';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';

@Component({
	selector: 'app-doctype',
	standalone: true,
	imports: [
		NgSelectModule,
		CommonModule,
		ReactiveFormsModule,
		OnlyTextDirective,
		OnlyNumbersDirective,
		TextWithNumbersDirective,
		NgbDropdownModule,
		SearchableDropdown
	],
	templateUrl: 'doctype.component.html',
	styleUrl: './doctype.component.scss'
})

export class DoctypeComponent implements OnInit, OnDestroy, HasUnsavedChanges {

	VoucherTypeMasterSid: number;
	isEditMode: boolean;
    MenuMasterSid:any;
	documentForm !: FormGroup;
	companyList : any[];
	branchList: any[];
	currencyList : any[];
	documentData: any
	permissions: string[] = [];
    currentMenuPermissions: any = {};
	userData:any;
	coaList: any[] = [];
	CurrencyLookupConfig = {
    displayFields: ['currencyCode', 'currencyName', 'countryName'],
    displayLabels: ['Code', 'Name', 'Country'],
    labelFields: ['currencyCode'],
  };
subledgerList: any[] = [];
currentCompany: any;
currentBranch: any;
	documentSeparators = [
		{ separator: 'None', value: 'None' },
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

	docTypeCodeDropdown = [
		{ id : 1 , code : 'INV'},
		{ id : 2 , code : 'VIN'},
		{ id : 4 , code : 'RPT'},
		{ id : 5 , code : 'PMT'},
		{ id : 6 , code : 'PRQ'},
		{ id : 3 , code : 'CRN'},
		{ id : 7 , code : 'VRN'},
		{ id : 8 , code : 'JV'},
		{ id : 9 , code : 'RJV'},
		{ id : 10 , code : 'VM'},
	]

	typeOptions = ['Cash', 'Bank', 'Others'];

	currentMenuId: number;
	TandCList: any;
	menuList : any[];
	auditLogs: any[] = []; // Stores audit logs
	  auditLogModalRef!: NgbModalRef;
	isDirty: boolean = false;
	isSaving: boolean = false;
	private initialFormValue: any = null;
	private destroy$ = new Subject<void>();

	constructor(
		private appSettingService: AppSettingsService,
		private masterService: MasterService,
		private router: Router,
		private currentRoute: ActivatedRoute,
		private modalService: NgbModal,
		private fb: FormBuilder,
		private commonService: CommonService,
		public mps : MenuPermissionService
	) { }

	ngOnInit() {
	this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
	this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
		this.initDocumentForm();
		this.initialFormValue = this.documentForm.getRawValue();
		this.subscribeToFormChanges();
		this.mps.init().subscribe();
		this.loadAllFields();
		this.currentRoute.paramMap.subscribe(
			(param) => {
				this.VoucherTypeMasterSid = +param.get('id');
				if (this.VoucherTypeMasterSid) {
					this.isEditMode = true;
					this.loadDocumentType(this.VoucherTypeMasterSid);
				}
			}
		)
	// 	 this.appSettingService.getUser().subscribe(user => {
    //      if (user) {
    //         this.userData = user;
    //       
    //      }
    //   });
	const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
     
		}
		const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
	}

    

	 

hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Authority', 'Email','Document Reference'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }


	initDocumentForm() {
		this.documentForm = this.fb.group({
			// BranchMasterSid: [null, [Validators.required]],
			DocumentTypeName: ['', [Validators.required]],
			DocumentTypeCode: ['', [Validators.required]],
			Type : [''],
			IsAutoPosting : ['N'],
			MenuMasterSid : [null],
			CurrencyCode: [null, [Validators.required]],
			COALedger: [''],
			Subledger: [''],
			ReportTitle : [''],
			ReportFooter : [''],
			DocumentStartingNo: ['', [Validators.required]],
			DocumentSeparator: [""],
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

		// Default Type to 'Others' and disable; enable only for RPT/PMT
		this.documentForm.get('Type')?.setValue('Others', { emitEvent: false });
		this.documentForm.get('Type')?.disable({ emitEvent: false });

		this.documentForm.get('DocumentTypeCode')?.valueChanges.subscribe((code) => {
			this.applyTypeFieldState(code);
		});
	}

	applyTypeFieldState(code: string) {
		const typeCtrl = this.documentForm.get('Type');
		if (!typeCtrl) return;
		if (code === 'RPT' || code === 'PMT') {
			typeCtrl.enable({ emitEvent: false });
		} else {
			typeCtrl.setValue('Others', { emitEvent: false });
			typeCtrl.disable({ emitEvent: false });
		}
	}

	loadAllFields() {
		const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin({
        companies: this.masterService.getAllCompanies(),
        currencies: this.masterService.getAllCurrencies(),
        coa: this.masterService.getAllCoa(CompanyMasterSid), // Add this line to fetch COA data
		menus : this.masterService.getAllMainMenus()
    }).subscribe(({ companies, currencies, coa,menus }) => {
        this.companyList = companies;
        this.currencyList =  this.currencyList = (currencies || []).map(c => ({
          ...c,
          countryName: c.countryMaster?.countryName
        }));
		this.menuList = menus.data || [];
        this.coaList = coa.map(item => ({
            COAMasterSid: item.COAMasterSid,
            LedgerName: item.LedgerName
        }));
    });
}

onCOASelected(COA: any) {
const COAMasterSid=COA?.COAMasterSid || COA?.COALedger
    if (COAMasterSid) {
        this.masterService.getSubledgersByCOA(COAMasterSid).subscribe(
            (resp: any) => {
                if (resp.status) {
                    this.subledgerList = resp.data.data
                } else {
                    this.subledgerList = [];
                    this.appSettingService.showError('Error loading subledgers');
                }
            },
            (error) => {
                this.subledgerList = [];
                this.appSettingService.showError('Error loading subledgers');
            }
        );
    } else {
        this.subledgerList = [];
        this.documentForm.get('Subledger').setValue('');
    }
}

	loadDocumentType(VoucherTypeMasterSid) {
		this.masterService.getDocTypeById(VoucherTypeMasterSid).subscribe(
			(resp: any) => {
				if (resp.status) {
					this.documentData = resp.data;
					const data = resp.data;
					this.documentForm.patchValue({
						...data,
						DocumentSeparator: String(data.DocumentSeparator).trim() || 'None',
						CompanyFlag: data.CompanyFlag === 'Y',
						BranchFlag: data.BranchFlag === 'Y',
						DocumentFlag: data.DocumentFlag === 'Y',
						MonthFlag: data.MonthFlag === 'Y',
						YearFlag: data.YearFlag === 'Y',
						status: data.status === 'A' ? 'Active' : 'Suspended',
					}, { emitEvent: false })
					 if (data) {
                    // Trigger the COA selection change to load subledgers
                    this.onCOASelected(data);
					this.handleReverseVoucherPosting(data);
					this.applyTypeFieldState(data.DocumentTypeCode);
                    
                    // After a small delay (to allow subledgers to load), set the subledger value
                    setTimeout(() => {
                        this.documentForm.patchValue({
                            Subledger: data.Subledger
                        }, { emitEvent: false });
						this.syncInitialFormState();
                    }, 300);
                }
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


	openAuditLogs() {
		  if (!this.VoucherTypeMasterSid) return;
		  const modalRef = this.modalService.open(AuditLogComponent, {
		  centered: true,
		  scrollable: true,
		  size: 'xl',
		  windowClass: 'audit-log-modal'
		});
		modalRef.componentInstance.title = 'DocType Logs';
		modalRef.componentInstance.tableName = 'VoucherTypeMaster';
		modalRef.componentInstance.recordId = this.VoucherTypeMasterSid.toString();
		modalRef.componentInstance.screenName = 'DocType';
		}

	validateFlagCombination(): string | null {
		const { ResetValue, DocumentFlag, MonthFlag, YearFlag } = this.documentForm.getRawValue();

		if (ResetValue === 'Year' || ResetValue === 'Financial Year') {
			if (!YearFlag) return 'Year Should be selected';
			if (!DocumentFlag) return 'Book flag require';
		}

		if (ResetValue === 'Month') {
			if (!MonthFlag) return 'Month flag should be selected';
			if (!YearFlag) return 'Year flag Should be selected';
			if (!DocumentFlag) return 'Book flag require';
		}

		return null;
	}

	onSubmit() {
		this.saveChanges();
	}

	saveChanges(): Promise<boolean> {
		if (this.isSaving) return Promise.resolve(false);
		if (this.documentForm.invalid) {
			this.documentForm.markAllAsTouched();
			this.documentForm.updateValueAndValidity();
			this.appSettingService.showWarning('Please fill all the required fields');
			return Promise.resolve(false);
		}
		if (this.hasNoChangesToSave()) {
			this.appSettingService.showWarning('No changes to save');
			return Promise.resolve(false);
		}

		const flagError = this.validateFlagCombination();
		if (flagError) {
			this.appSettingService.showWarning(flagError);
			return Promise.resolve(false);
		}

		 const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
         const BranchMasterSid = this.currentBranch?.BranchMasterSid;
		const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
		const formValue = this.documentForm.getRawValue();

		const payload = {
			...formValue,
			CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
			BranchMasterSid : this.currentBranch?. BranchMasterSid,
			COALedger : Number(formValue.COALedger),
			Subledger : Number(formValue.Subledger),
			DocumentSeparator: formValue.DocumentSeparator === 'None' ? '' : formValue.DocumentSeparator,
			CompanyFlag: formValue.CompanyFlag ? 'Y' : 'N',
			BranchFlag: formValue.BranchFlag ? 'Y' : 'N',
			DocumentFlag: formValue.DocumentFlag ? 'Y' : 'N',
			MonthFlag: formValue.MonthFlag ? 'Y' : 'N',
			YearFlag: formValue.YearFlag ? 'Y' : 'N',
			status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
			...(this.isEditMode ? { updatedBy: currentUserEmail } : { createdBy: currentUserEmail })
		}

		this.isSaving = true;
		if (this.isEditMode) {
			return new Promise<boolean>((resolve) => {
				this.masterService.updateDocTypeById(this.VoucherTypeMasterSid, payload).subscribe(
					(resp: any) => {
						if (resp.status) {
							this.appSettingService.showSuccess(resp.message);
							this.afterSuccessfulSave();
							resolve(true);
						} else {
							this.appSettingService.showError(resp.message);
							this.isSaving = false;
							resolve(false);
						}
					},
					(error) => {
						this.isSaving = false;
						this.appSettingService.showError('Error Updating Document Type');
						console.error('Error Updating Document Type', error);
						resolve(false);
					}
				);
			});
		} else {
			return new Promise<boolean>((resolve) => {
				this.masterService.createNewDocType(payload).subscribe(
					(resp: any) => {
						if (resp.status) {
							this.appSettingService.showSuccess(resp.message);
							this.afterSuccessfulSave();
							const createdId = resp?.data?.VoucherTypeMasterSid;
							if (createdId) {
								this.VoucherTypeMasterSid = createdId;
								this.isEditMode = true;
							}
							resolve(true);
						} else {
							this.appSettingService.showError(resp.message);
							this.isSaving = false;
							resolve(false);
						}
					},
					(error) => {
						this.isSaving = false;
						this.appSettingService.showError('Error Creating Document Type');
						console.error('Error Creating Document Type', error);
						resolve(false);
					}
				);
			});
		}
	}


	resetForm() {
  // If editing an existing document type, reload it from server to restore original values
  if (this.isEditMode && this.VoucherTypeMasterSid) {
    this.loadDocumentType(this.VoucherTypeMasterSid);
    return;
  }

  // Reset the form to defaults for create mode
  this.documentForm.reset({
    DocumentTypeName: '',
    DocumentTypeCode: '',
    Type: '',
    CurrencyCode: null,
    COALedger: '',
    Subledger: '',
    ReportTitle: '',
    ReportFooter: '',
    DocumentStartingNo: '',
    DocumentSeparator: null,
    DocumentSLNoLength: '',
    ResetValue: null,
    CompanyFlag: false,
    CompanyValue: '',
    BranchFlag: false,
    BranchValue: '',
    DocumentFlag: false,
    DocumentValue: '',
    MonthFlag: false,
    YearFlag: false,
    status: 'Active',
    Remarks: ''
  });

  // Ensure dependent value controls are disabled (they are enabled only when the corresponding flag is true)
  this.documentForm.get('CompanyValue')?.disable();
  this.documentForm.get('BranchValue')?.disable();
  this.documentForm.get('DocumentValue')?.disable();
	this.initialFormValue = this.documentForm.getRawValue();
	this.documentForm.markAsPristine();
	this.isDirty = false;

  // If you want to keep any other UI state (like loaded COA/subledger lists), leave them untouched.
}


	navigateBack() {
		this.router.navigate(['master/doctype/list']);
	}

	showInfo() {
		if (!this.documentData) return;
		const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
		modalRef.componentInstance.item = this.documentData;
		modalRef.componentInstance.idLabel = 'Document Type Id';
		modalRef.componentInstance.idValue = this.documentData?.VoucherTypeMasterSid;
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

	handleReverseVoucherPosting(documentType : any) {
		const code = documentType.code || documentType.DocumentTypeCode;
		const autoPostCtrl = this.documentForm.get('IsAutoPosting');

		const reverseTypes = ['CRN', 'VRN', 'RJV'];

		if (reverseTypes.includes(code)) {
			autoPostCtrl?.setValue('Y', { emitEvent: false });
			autoPostCtrl?.disable({ emitEvent: false });
		} else {
			if(code === 'VM') {
				autoPostCtrl?.setValue('N', { emitEvent: false });
				autoPostCtrl?.disable({ emitEvent: false });
			} else {
				autoPostCtrl?.enable({ emitEvent: false });
			}


			// optional: reset to default if you want
			// autoPostCtrl?.setValue('N', { emitEvent: false });
		}
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

		const separator = (!DocumentSeparator.value || DocumentSeparator.value === 'None') ? '' : DocumentSeparator.value;
		const voucherNumber = parts.join(separator);
		return voucherNumber;
	}

	openSampleModal(content : TemplateRef<any>){
		this.modalService.open(content,{size : 'lg',centered:true,backdrop:'static'})
	}

	// openTandC() {
	// 	this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
	// 	const payload = { MenuMasterSid: this.currentMenuId };
	// 	this.masterService.getTandCByCondition(payload).subscribe(
	// 		(resp: any) => {
	// 			if (resp.status) {
	// 				this.TandCList = resp.data;
	// 				const modalRef = this.modalService.open(TermsAndConditionsComponent, {
	// 					size: 'lg',
	// 					backdrop: 'static',
	// 					centered: true
	// 				});
	// 				modalRef.componentInstance.terms = this.TandCList;
	// 				modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
	// 				modalRef.componentInstance.DocumentSid = this.VoucherTypeMasterSid;

	// 			} else {
	// 				this.appSettingService.showError('Error loading Terms and Conditions');
	// 			}
	// 		},
	// 		(error) => {
	// 			this.appSettingService.showError('Error loading Terms and Conditions', error);
	// 		}
	// 	);
	// }
	openEmail() {
		if (!this.documentData) return;
		const modalRef = this.modalService.open(EmailEntryComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
	}

  openAuthority() {
	const MenuMasterSid = sessionStorage.getItem('currentMenuId');
	if (!MenuMasterSid) return;
   const modalRef = this.modalService.open(AuthorityLogComponent, { 
	size: 'lg', 
	centered: true, 
	backdrop: 'static' 
  });
	modalRef.componentInstance.menuMasterSid = MenuMasterSid;
	modalRef.componentInstance.documentSid = this.VoucherTypeMasterSid;
  }

openEDoc() {
  if (!this.documentData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.documentData;
  modalRef.componentInstance.idLabel = 'Document Type Id';
  modalRef.componentInstance.idValue = this.documentData?.VoucherTypeMasterSid;
   const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.VoucherTypeMasterSid
  }

      this.commonService.documentData.set(data)
}
openDocRef() {
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);  
    modalRef.componentInstance.DocumentSid = this.VoucherTypeMasterSid;
  }
 ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.commonService.clearDocumentData()
 }
 navigateToCreateDocType() {
    this.router.navigate(['master/doctype/entry'])
  }

	@HostListener('window:beforeunload', ['$event'])
	unloadNotification($event: BeforeUnloadEvent): void {
		if (this.hasUnsavedChanges()) {
			$event.preventDefault();
			$event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
		}
	}

	hasUnsavedChanges(): boolean {
		return this.isDirty;
	}

	private afterSuccessfulSave(): void {
		this.syncInitialFormState();
		this.isSaving = false;
	}

	private subscribeToFormChanges(): void {
		this.documentForm.valueChanges
			.pipe(takeUntil(this.destroy$), debounceTime(300))
			.subscribe(() => {
				this.isDirty = !this.deepEqual(this.initialFormValue, this.documentForm.getRawValue());
			});
	}

	private hasNoChangesToSave(): boolean {
		return this.deepEqual(this.documentForm.getRawValue(), this.initialFormValue);
	}

	private syncInitialFormState(): void {
		this.initialFormValue = this.documentForm.getRawValue();
		this.documentForm.markAsPristine();
		this.isDirty = false;
	}

	private normalizeValue(value: any): any {
		if (value === null || value === undefined) return null;
		if (value instanceof Date) return value.toISOString().split('T')[0];
		if (Array.isArray(value)) return value.map(item => this.normalizeValue(item));
		if (typeof value === 'object') {
			return Object.keys(value).reduce((result: any, key: string) => {
				result[key] = this.normalizeValue(value[key]);
				return result;
			}, {});
		}
		if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) return Number(value);
		return value;
	}

	private deepEqual(obj1: any, obj2: any): boolean {
		return JSON.stringify(this.normalizeValue(obj1)) === JSON.stringify(this.normalizeValue(obj2));
	}

}
