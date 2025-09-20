import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalRef, NgbNavModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { CommonModule } from '@angular/common';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';

@Component({
    selector: 'app-tds-set-entry',
    standalone: true,
    imports: [
        FeatherModule,
        NgSelectModule,
        NgbPaginationModule,
        NgbDatepickerModule,
        NgbNavModule,
        ReactiveFormsModule,
        CommonModule,
        OnlyTextDirective,
        OnlyNumbersDirective,
        TextWithNumbersDirective,
        DecimalPrecisionDirective,
        CustomDatePipe,
        NgbDropdownModule
    ],
    templateUrl: './tds-set-entry.component.html',
    styleUrl: './tds-set-entry.component.scss',
    providers: [
        { provide: NgbDateAdapter, useClass: CustomDateAdapter },
        { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    ],
})
export class TdsSetEntryComponent implements OnInit {

    tdsForm !: FormGroup;
    tdsDetailForm !: FormGroup;
    tdsExemptionForm !: FormGroup;
    TDSSetHeaderSid: number;
    TDSSetRateSid: number;
    TDSExemptionSid: number;
    isEditMode: boolean;
    detailModalEdit: boolean;
    exemptionModalEdit: boolean;
    tdsData: any;
    modalRef: NgbModalRef;

    tdsDetailList: any[];
    tdsExemptionList: any[];
    countryList: any[];
    vesselList: any[];
    carrierList: any[];
    transporterList: any[];
    filteredExemptionList: any[];
    filteredDetailsList: any[];
    active = 1
    active1 = 1

    page = 1;
    pageSize = 5;
    totalNumberOfDetails: number;
    exPage = 1;
    exPageSize = 5;
    totalNumberOfExemptions: number;

    companyTypeList = [
        { id: '1', name: 'Artificial Juridical Person' },
        { id: '2', name: 'Association Of Persons(AOP)' },
        { id: '3', name: 'Body Of Individuals' },
        { id: '4', name: 'Company' },
        { id: '5', name: 'Firm' },
        { id: '6', name: 'Government Agency' },
        { id: '7', name: 'Hindu Undivided Family' },
        { id: '8', name: 'Individual(proprietor)' },
        { id: '9', name: 'Limited Liability Partnership(LLP)' },
        { id: '10', name: 'Local Authority' },
        { id: '11', name: 'Trust' },
        { id: '12', name: 'Others' },
    ];

    today = this.calendar.getToday();
    todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
    minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
    minDetailEffectiveFrom = this.toNgbDateStruct(this.todayDate);
    minExemptionEffectiveFrom = this.toNgbDateStruct(this.todayDate);
    currentMenuId: number;
    TandCList: any;
    permissions: string[] = [];
    currentMenuPermissions: any = {};
    userData: any;
    currentCompany: any;
    currentBranch: any;

    tab = [
        { name: "TDSDetail", icon: "fas fa-file-invoice" },
        { name: "Exemption Detail", icon: "fas fa-percent" }
    ];
    
    
    selectTab(tab: string) {
        this.selectedTab = tab;
    }
    selectedTab = this.tab[0].name;


    auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;

    constructor(
        private masterService: MasterService,
        private appSettingService: AppSettingsService,
        private modalService: NgbModal,
        private router: Router,
        private currentRoute: ActivatedRoute,
        private fb: FormBuilder,
        private calendar: NgbCalendar,
        private dialog: MatDialog,
        private settingService: SettingsService
    ) { }

    ngOnInit(): void {
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
       this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        this.initTdsForm();
        // this.appSettingService.getUser().subscribe(
        //     (res) => {
        //         this.userData = res;
        //         this.checkPermissions();
        //     }
        // )
        const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
        this.currentRoute.paramMap.subscribe(
            (param) => {
                this.TDSSetHeaderSid = +param.get('id');
                if (this.TDSSetHeaderSid) {
                    this.isEditMode = true;
                    this.minEffectiveFrom = undefined
                    this.loadTDS(this.TDSSetHeaderSid);
                    this.loadTDSDetailsByHeader(this.TDSSetHeaderSid);
                    this.loadExemptionDetailsByHeader(this.TDSSetHeaderSid)
                } else {
                    this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate)
                }
            }
        )
    }
    checkPermissions() {
        const currentMenuId = Number(localStorage.getItem('currentMenuId'));
        const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
        console.log(currentMenuId)
        console.log(userRole)
        if (currentMenuId && userRole) {
            this.settingService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
                next: (response) => {
                    this.currentMenuPermissions = response.data.MenuPermissions || {};
                    this.permissions = Object.keys(this.currentMenuPermissions)
                        .filter(key => this.currentMenuPermissions[key] === 'isTrue');
                    console.log(this.permissions)
                }
            });
        }
    }

    initTdsForm() {
        this.tdsForm = this.fb.group({
            TDSSetName: ['', [Validators.required]],
            TransactionLimit: ['', [Validators.required]],
            AnnualLimit: ['', [Validators.required]],
            TDSsetTransactionLimit: ['', [Validators.required]],
            TDSSetAnnualLimit: ['', [Validators.required]],
            EffectiveFrom: ['', [Validators.required]],
            status: ['Active'],
        })
    }

    loadTDS(TDSSetHeaderSid) {
        this.masterService.fetchTdsById(TDSSetHeaderSid).subscribe(
            (resp: any) => {
                if (resp.status) {
                    this.tdsData = resp.data;
                    this.tdsForm.patchValue({
                        ...this.tdsData,
                        EffectiveFrom: new Date(this.tdsData.EffectiveFrom),
                        status: this.tdsData.status === 'A' ? 'Active' : 'Suspended'
                    })
                } else {
                    this.appSettingService.showError('Error loading TDS set.')
                    console.error(resp.message);
                }
            }
        )
    }

    onSubmit() {
        if (this.tdsForm.invalid) {
            this.tdsForm.markAllAsTouched();
            this.tdsForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields correctly.');
            return;
        }

        const formValue = this.tdsForm.value;
        const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];

        const payload = {
            ...formValue,
            CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
            status: formValue.status === 'Active' ? 'A' : 'S',
            ...(this.isEditMode ? { updatedBy: currentUserEmail } : { createdBy: currentUserEmail })
        }
        if (this.isEditMode) {
            this.masterService.updateTdsById(this.TDSSetHeaderSid, payload).subscribe(
                (resp: any) => {
                    if (resp.status) {
                       this.appSettingService.showSuccess(resp.message);

                        this.loadTDS(this.TDSSetHeaderSid);
                    } else {
                        this.appSettingService.showError(resp.message);
                        console.error(resp.message);
                    }
                }
            )
        } else {
            this.masterService.createNewTds(payload).subscribe(
                (resp: any) => {
                    if (resp.status) {
                        this.appSettingService.showSuccess(resp.message);

                        const tdsId = resp.data?.TDSSetHeaderSid;
                        if (tdsId) {
                            this.router.navigate(['/master/tds-set/entry', tdsId]);
                        }
                    } else {
                        this.appSettingService.showError(resp.message);
                        console.error(resp.message);
                    }
                }
            )
        }

    }

    loadTDSDetailsByHeader(TDSSetHeaderSid) {
        this.masterService.fetchTdsDetailByHeaderId(TDSSetHeaderSid).subscribe(
            (resp: any) => {
                if (resp.status) {
                    this.tdsDetailList = resp.data;
                    this.totalNumberOfDetails = this.tdsDetailList.length;
                    this.updateDetailsPagination();
                } else {
                    this.appSettingService.showError('Error loading TDS details.');
                    console.error(resp.message);
                }
            }
        )
    }

    deleteTdsSetDetail(TDSSetRateSid) {
        const dialogRef = this.dialog.open(DeleteWarningComponent);
        dialogRef.afterClosed().subscribe((res) => {
            if (res) {
                this.masterService.deleteTdsDetail(TDSSetRateSid).subscribe(
                    (resp: any) => {
                        this.appSettingService.showSuccess("Deleted!");
                        this.loadTDSDetailsByHeader(this.TDSSetHeaderSid);
                    });
            }
        })
    }

    initDetailForm() {
        this.tdsDetailForm = this.fb.group({
            CountryMasterSid: [null],
            Sno: [''],
            CompanyType: [null, [Validators.required]],
            IncomeCategory: [''],
            ITSectionCode: ['', [Validators.required]],
            TDSAmount: [''],
            TDSRate: ['', [Validators.required]],
            EffectiveFrom: ['', [Validators.required]],
            detailStatus: ['Active']
        })
    }

    openDetailModal(content: TemplateRef<any>, data?: any) {
        this.initDetailForm();
        this.loadAllCountries();
        if (data) {
            this.detailModalEdit = true;
            this.minDetailEffectiveFrom = undefined
            this.tdsDetailForm.patchValue({
                ...data,
                EffectiveFrom: new Date(data.EffectiveFrom),
                detailStatus: data.status === 'A' ? 'Active' : 'Suspended'
            })
            if (data.TDSSetRateSid) {
                this.TDSSetRateSid = data.TDSSetRateSid
            }
        } else {
            this.minDetailEffectiveFrom = this.toNgbDateStruct(this.todayDate);
            this.detailModalEdit = false;
        }
        this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static' });
    }

    openAuditLogs(modal: TemplateRef<any>) {
  if (!this.TDSSetHeaderSid) return;

  this.masterService.getAuditLogsTds('TDSSetHeader', this.TDSSetHeaderSid.toString()).subscribe({
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


    onSubmitDetails() {
        if (this.tdsDetailForm.invalid) {
            this.tdsDetailForm.markAllAsTouched();
            this.tdsDetailForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields correctly.');
            return;
        }

        const formValue = this.tdsDetailForm.value;
        const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];

        const payload = {
            TDSSetHeaderSid: this.TDSSetHeaderSid,
            CountryMasterSid: Number(formValue.CountryMasterSid),
            Sno: formValue.Sno,
            CompanyType: formValue.CompanyType,
            IncomeCategory: formValue.IncomeCategory,
            ITSectionCode: formValue.ITSectionCode,
            TDSAmount: parseFloat(formValue.TDSAmount),
            TDSRate: parseFloat(formValue.TDSRate),
            EffectiveFrom: formValue.EffectiveFrom,
            status: formValue.detailStatus === 'Active' ? 'A' : 'S',
            ...(this.detailModalEdit ? { updatedBy: currentUserEmail } : { createdBy: currentUserEmail })
        }

        if (this.detailModalEdit) {
            this.masterService.updateTdsDetailById(this.TDSSetRateSid, payload).subscribe(
                (resp: any) => {
                    if (resp.status) {
                        this.appSettingService.showSuccess("TDS Detail updated successfully.");
                        this.loadTDSDetailsByHeader(this.TDSSetHeaderSid);
                        this.modalRef.close();
                    } else {
                        this.appSettingService.showError(resp.message);
                        console.error(resp.message);
                    }
                }
            )
        } else {
            this.masterService.createNewTdsDetail(payload).subscribe(
                (resp: any) => {
                    if (resp.status) {
                        this.appSettingService.showSuccess("TDS Detail created successfully.");
                        this.loadTDSDetailsByHeader(this.TDSSetHeaderSid);
                        this.modalRef.close();
                        this.detailModalEdit = false;
                        this.tdsDetailForm.reset({ detailStatus: 'Active' });
                    } else {
                        this.appSettingService.showError(resp.message);
                        console.error(resp.message);
                    }
                }
            )
        }
    }

    loadExemptionDetailsByHeader(TDSSetHeaderSid) {
        this.masterService.fetchTdsExemptionByHeaderId(TDSSetHeaderSid).subscribe(
            (resp: any) => {
                if (resp.status) {
                    this.tdsExemptionList = resp.data;
                    this.totalNumberOfExemptions = this.tdsExemptionList.length;
                    this.updateExemptionPagination();
                } else {
                    this.appSettingService.showError('Error loading TDS exemption.');
                    console.error(resp.message);
                }
            }
        )
    }

    initExemptionForm() {
        this.tdsExemptionForm = this.fb.group({
            Vessel: [null, [Validators.required]],
            Carrier: [null, [Validators.required]],
            Transporter: [null, [Validators.required]],
            EffectiveFrom: ['', [Validators.required]],
            EffectiveTo: ['', [Validators.required]],
            exemptionStatus: ['Active'],
        })
    }

    deleteTdsExemption(TDSExemptionSid) {
        const dialogRef = this.dialog.open(DeleteWarningComponent);
        dialogRef.afterClosed().subscribe((res) => {
            if (res) {
                this.masterService.deleteTdsExemption(TDSExemptionSid).subscribe(
                    (resp: any) => {
                        this.appSettingService.showSuccess("Deleted!");
                        this.loadExemptionDetailsByHeader(this.TDSSetHeaderSid);
                    });
            }
        })
    }

    openExemptionModal(content: TemplateRef<any>, data?: any) {
        this.initExemptionForm();
        this.loadExemptionLookups();
        if (data) {
            this.exemptionModalEdit = true;
            this.minExemptionEffectiveFrom = undefined;
            this.tdsExemptionForm.patchValue({
                ...data,
                EffectiveFrom: new Date(data.EffectiveFrom),
                EffectiveTo: new Date(data.EffectiveTo),
                exemptionStatus: data.status === 'A' ? 'Active' : 'Suspended'
            })
            if (data.TDSExemptionSid) {
                this.TDSExemptionSid = data.TDSExemptionSid
            }
        } else {
            this.exemptionModalEdit = false;
            this.minExemptionEffectiveFrom = this.toNgbDateStruct(this.todayDate);
        }
        this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static' });
    }

    onSubmitExemption() {
        if (this.tdsExemptionForm.invalid) {
            this.tdsExemptionForm.markAllAsTouched();
            this.tdsExemptionForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields correctly.');
            return;
        }

        const formValue = this.tdsExemptionForm.value;
        const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];

        const payload = {
            TDSSetHeaderSid: this.TDSSetHeaderSid,
            Vessel: formValue.Vessel,
            Carrier: formValue.Carrier,
            Transporter: formValue.Transporter,
            EffectiveFrom: formValue.EffectiveFrom,
            EffectiveTo: formValue.EffectiveTo,
            status: formValue.exemptionStatus === 'Active' ? 'A' : 'S',
            ...(this.exemptionModalEdit ? { updatedBy: currentUserEmail } : { createdBy: currentUserEmail })
        }

        if (this.exemptionModalEdit) {
            this.masterService.updateTdsExemptionById(this.TDSExemptionSid, payload).subscribe(
                (resp: any) => {
                    if (resp.status) {
                        this.appSettingService.showSuccess("TDS exemption updated successfully.");
                        this.loadExemptionDetailsByHeader(this.TDSSetHeaderSid);
                        this.modalRef.close()
                    } else {
                        this.appSettingService.showError(resp.message);
                        console.error(resp.message);
                    }
                }
            )
        } else {
            this.masterService.createNewTdsExemption(payload).subscribe(
                (resp: any) => {
                    if (resp.status) {
                        this.appSettingService.showSuccess("TDS exemption created successfully.");
                        this.loadExemptionDetailsByHeader(this.TDSSetHeaderSid);
                        this.modalRef.close();
                        this.exemptionModalEdit = false;
                        this.tdsExemptionForm.reset({ exemptionStatus: 'Active' });
                    } else {
                        this.appSettingService.showError(resp.message);
                        console.error(resp.message);
                    }
                }
            )
        }
    }

    // Helper Functions

    loadAllCountries() {
        this.masterService.getAllCountry().subscribe(
            (resp: any) => {
                if (resp.status) {
                    this.countryList = resp.data;
                } else {
                    this.appSettingService.showError('Error loading countries.');
                    console.error('Error loading countries', resp.message);
                }
            }
        )
    }

    loadExemptionLookups() {
        const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
        forkJoin({
            vessels: this.masterService.getAllVessels(),
            carriers: this.masterService.getAllCarriers(CompanyMasterSid),
            transporters: this.masterService.getAllTransporters(CompanyMasterSid)
        }).subscribe(({ vessels, carriers, transporters }) => {
            this.vesselList = vessels.data,
                this.carrierList = carriers,
                this.transporterList = transporters
        })
    }

    toNgbDateStruct(date: Date | null): NgbDateStruct | null {
        if (!date) return null;
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
        };
    }


    modeOfStatus = [
        { id: "Active", name: "Active" },
        { id: "Suspended", name: "Suspended" },
    ]

    resetForm() {
  // If editing an existing TDS set, reload it (restore original state)
  if (this.isEditMode && this.TDSSetHeaderSid) {
    this.loadTDS(this.TDSSetHeaderSid);
    this.loadTDSDetailsByHeader(this.TDSSetHeaderSid);
    this.loadExemptionDetailsByHeader(this.TDSSetHeaderSid);
    return;
  }

  // Create-mode: reset header form to sensible defaults
  this.tdsForm.reset({
    TDSSetName: '',
    TransactionLimit: '',
    AnnualLimit: '',
    TDSsetTransactionLimit: '',
    TDSSetAnnualLimit: '',
    EffectiveFrom: '',
    status: 'Active'
  });

  // Reset related lists / pagination
  this.tdsDetailList = [];
  this.tdsExemptionList = [];
  this.filteredDetailsList = [];
  this.filteredExemptionList = [];
  this.totalNumberOfDetails = 0;
  this.totalNumberOfExemptions = 0;
  this.page = 1;
  this.exPage = 1;

  // Reset min date to today for new entries
  this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);

  // Clear selected IDs/state
  this.tdsData = null;
  this.TDSSetHeaderSid = null;
  this.TDSSetRateSid = null;
  this.TDSExemptionSid = null;
}


    showInfo() {
        if (!this.tdsData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.tdsData;
        modalRef.componentInstance.idLabel = 'TDS Set Id';
        modalRef.componentInstance.idValue = this.tdsData?.TDSSetHeaderSid;
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
                    modalRef.componentInstance.DocumentSid = this.TDSSetHeaderSid;

                } else {
                    this.appSettingService.showError('Error loading Terms and Conditions.');
                }
            },
            (error) => {
                this.appSettingService.showError('Error loading Terms and Conditions.', error);
            }
        );
    }

    openEmail() {
        if (!this.tdsData) return;
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
       modalRef.componentInstance.documentSid = this.TDSSetHeaderSid;
     }

    openEDoc() {
        if (!this.tdsData) return;
        const modalRef = this.modalService.open(EdocComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static'
        });
    }

    updateDetailsPagination() {
        let start = (this.page - 1) * this.pageSize;
        let end = start + this.pageSize;
        this.filteredDetailsList = this.tdsDetailList.slice(start, end);
    }
    updateExemptionPagination() {
        let start = (this.exPage - 1) * this.exPageSize;
        let end = start + this.exPageSize;
        this.filteredExemptionList = this.tdsExemptionList.slice(start, end);
    }

    hasPermission(permission: string): boolean {
        return this.permissions.includes(permission);
    }

    navigateBack() {
        history.back();
    }
}
