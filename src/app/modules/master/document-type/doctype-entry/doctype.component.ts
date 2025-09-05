import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
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
	permissions: string[] = [];
    currentMenuPermissions: any = {};
	userData:any;
	coaList: any[] = [];
subledgerList: any[] = [];
currentCompany: any;
currentBranch: any;
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

	auditLogs: any[] = []; // Stores audit logs
	  auditLogModalRef!: NgbModalRef;

	constructor(
		private appSettingService: AppSettingsService,
		private masterService: MasterService,
		private router: Router,
		private currentRoute: ActivatedRoute,
		private modalService: NgbModal,
		private fb: FormBuilder
	) { }

	ngOnInit() {
	this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
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
	// 	 this.appSettingService.getUser().subscribe(user => {
    //      if (user) {
    //         this.userData = user;
    //          this.checkPermissions();
    //      }
    //   });
	const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
		const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
	}

    

	 checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId)
    console.log(userRole)
    if (currentMenuId && userRole) {
     this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
  next: (response) => {
    this.currentMenuPermissions = response.data.MenuPermissions || {};
    this.permissions = Object.keys(this.currentMenuPermissions)
      .filter(key => this.currentMenuPermissions[key] === 'isTrue');
      console.log(this.permissions)
  }
});
    }
  }
 
  hasPermission(permission: string): boolean {
  return this.permissions.includes(permission);
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
		const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin({
        companies: this.masterService.getAllCompanies(),
        currencies: this.masterService.getAllCurrencies(),
        coa: this.masterService.getAllCoa(CompanyMasterSid) // Add this line to fetch COA data
    }).subscribe(({ companies, currencies, coa }) => {
        this.companyList = companies;
        this.currencyList = currencies;
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
					 if (data) {
                    // Trigger the COA selection change to load subledgers
                    this.onCOASelected(data);
                    
                    // After a small delay (to allow subledgers to load), set the subledger value
                    setTimeout(() => {
                        this.documentForm.patchValue({
                            Subledger: data.Subledger
                        });
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


	openAuditLogs(modal: TemplateRef<any>) {
  if (!this.DocumentTypeMasterSid) return;

  this.masterService.getAuditLogsDocTypes('DocumentTypeMaster', this.DocumentTypeMasterSid.toString()).subscribe({
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

	onSubmit() {
		if (this.documentForm.invalid) {
			this.documentForm.markAllAsTouched();
			this.documentForm.updateValueAndValidity();
			this.appSettingService.showWarning('Please fill all the required fields');
			return;
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
						this.appSettingService.showSuccess(resp.message);

						this.router.navigate(['master/doctype/list'])
					} else {
						this.appSettingService.showError(resp.message);

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
						this.appSettingService.showSuccess(resp.message);
						this.router.navigate(['master/doctype/list'])
					} else {
						this.appSettingService.showError(resp.message);

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
	openEmail() {
		if (!this.documentData) return;
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
	modalRef.componentInstance.documentSid = this.DocumentTypeMasterSid;
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
  modalRef.componentInstance.idValue = this.documentData?.DocumentTypeMasterSid;
}


}