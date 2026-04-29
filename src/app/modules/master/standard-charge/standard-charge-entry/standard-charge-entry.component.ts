import { Component, ViewChild, OnInit, TemplateRef, Input } from '@angular/core';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { catchError, forkJoin, of, tap } from 'rxjs';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { MasterService } from '../../master.service';
import { AccountsService } from 'src/app/modules/accounts/accounts.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { CommonService } from 'src/app/common/common.service';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';

@Component({
  selector: 'app-standard-charge-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    SearchableDropdown,
    NgbDatepickerModule,
    FeatherModule,
    ReactiveFormsModule,
    CommonModule,
    CustomDatePipe,
    DecimalPrecisionDirective,
    NgbDropdownModule,
  ],
  templateUrl: './standard-charge-entry.component.html',
  styles: ``,
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class StandardChargeEntryComponent implements OnInit {

  @ViewChild('departmentLookup') departmentLookup!: SearchableDropdown;
  @ViewChild('chargeLookup') chargeLookup!: SearchableDropdown;
  @ViewChild('uomLookup') uomLookup!: SearchableDropdown;
  @ViewChild('currenciesLookup') currenciesLookup!: SearchableDropdown;

  standardChargeForm!: FormGroup;
  isEditMode = false;
  StdRateHeaderSid!: number;
  departments: any[] = [];
  charge: any[] = [];
  UOMType: any[] = [];
  currencies: any[] = [];
  // currencyList: any[] = [];
  currentCompany: any;
  currentBranch: any;
  standardChargeData: any;
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;
  UOMLookupConfig = DROPDOWN_CONFIGS.UOM;
  currenciesLookupConfig = DROPDOWN_CONFIGS.CURRENCY;
  loading: boolean = false;
  decimalAfterPrecision = 3;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  currentMenuId: number;
  MenuMasterSid: any;
  TandCList: any;
  userData: any;
  minValidToDates: NgbDateStruct[] = [];
  minValidFromDates: NgbDateStruct[] = [];
  filteredChargeList: any[] = [];
  statusItems = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];
  modeOfCargoType = [
    { id: 1, name: 'General' },
    { id: 2, name: 'Haz' },
    { id: 3, name: 'Reefer' },
    { id: 4, name: 'Tanker' },
    { id: 5, name: 'OOG' },
  ];
  minValidFrom: NgbDateStruct | null;
  private _currencyList: any[] = [];
  @Input()
  set currencyList(value: any[]) {
    this._currencyList = value || [];
    if (this._currencyList.length > 0 && this.currencyConfigService) {
      this.currencyConfigService.initializeConfigurations(this._currencyList);
      console.log(`Initialized currency configurations for ${this._currencyList.length} currencies`);
    }
  }
  get currencyList(): any[] {
    return this._currencyList;
  }
  constructor(
    private fb: FormBuilder,
    private appSettingsService: AppSettingsService,
    public dropdownStore: DropdownStore,
    private leadService: LeadService,
    private currencyConfigService: CurrencyConfigurationService,
    private masterService: MasterService,
    private accountService: AccountsService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    public mps: MenuPermissionService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private commonService: CommonService,
    private ngbModal: NgbModal,
  ) { }


  ngOnInit(): void {
    this.initForm();
    const today = new Date();

    this.minValidFrom = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingsService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid = sessionStorage.getItem('currentMenuId');
    this.loadAllLookups().subscribe({
      next: () => {
        this.route.params.subscribe(params => {
          const id = params['id'];
          if (id) {
            this.isEditMode = true;
            this.StdRateHeaderSid = +id;
            this.loadStandardChargeById(this.StdRateHeaderSid);
          }
        });
      }
    });
    this.mps.init().subscribe();
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
  }


  loadAllLookups() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;

    return forkJoin({
      departments: this.dropdownStore.loadDepartments({ CompanyMasterSid }).pipe(catchError(() => of([]))),
      charge: this.masterService.getAllCharges(CompanyMasterSid).pipe(catchError(() => of([]))),
      UOMType: this.leadService.getUOMsByType('C').pipe(catchError(() => of([]))),
      currencies: this.dropdownStore.loadCurrencies().pipe(catchError(() => of([]))),
    }).pipe(
      tap(({ departments, UOMType, currencies, charge }) => {
        this.departments = departments;
        this.UOMType = UOMType.data || [];
        this.currencyList = (currencies || []).map((c) => ({
          ...c,
          countryName: c?.countryMaster?.countryName,
        }));
        this.currencyConfigService.initializeConfigurations(this.currencyList);
        this.charge = Array.isArray(charge) ? charge : charge?.data || [];
        this.filteredChargeList = this.charge;
      })
    );
  }


  initForm() {
    this.standardChargeForm = this.fb.group({
      DepartmentMasterSid: ['', Validators.required],
      Remarks: [''],
      Status: ['A'],
      StdTariffDetails: this.fb.array([this.createChargeRow()])
    });
  }


  createChargeRow(): FormGroup {
    const row = this.fb.group({
      StdTariffDetailSid: [null],
      CargoType: ['', Validators.required],
      ChargeMasterSid: ['', Validators.required],
      UomSid: ['', Validators.required],
      SaleCurrency: ['', Validators.required],
      SaleAmount: ['', Validators.required],
      CostCurrency: ['', Validators.required],
      CostAmount: ['', Validators.required],
      ValidFrom: ['', Validators.required],
      ValidTo: ['', Validators.required],
      ChargeName: [''],
      Status: ['A']
    });

    row.get('Status')?.valueChanges.subscribe(val => {

      if (val === 'S') {

        setTimeout(() => {
          row.get('Status')?.disable();
        });

      }

    });
    return row
  }

  onValidFromChange(date: NgbDateStruct, index: number) {
    if (!date) return;

    const row = this.StdTariffDetails.at(index) as FormGroup;

    const nextDay: NgbDateStruct = {
      year: date.year,
      month: date.month,
      day: date.day + 1
    };

    this.minValidToDates[index] = nextDay;
  }


  get StdTariffDetails(): FormArray {
    return this.standardChargeForm.get('StdTariffDetails') as FormArray;
  }

  addRow() { this.StdTariffDetails.push(this.createChargeRow()); setTimeout(() => this.updateChargeStatusLock()); }
  removeRow(index: number) { if (this.StdTariffDetails.length > 1) this.StdTariffDetails.removeAt(index); }


  loadStandardChargeById(id: number) {
    this.spinner.show();
    this.masterService.fetchStdChargeById(id).subscribe({
      next: (res: any) => {
        const data = res.data;

        if (!data) return;
        this.standardChargeData = data;
        const header = data;
        const details = data.StdTariffDetails || [];
        console.log(details,"Details")
        this.standardChargeForm.patchValue({
          DepartmentMasterSid: header.DepartmentMasterSid,
          Remarks: header.Remarks,
          Status: header.Status
        });

        const selectedDept = this.departments.find(d => d.DepartmentMasterSid === header.DepartmentMasterSid);
        this.filterDepartment(selectedDept);

        if (this.isEditMode) {
          this.standardChargeForm.get('DepartmentMasterSid')?.disable();
        }

        this.StdTariffDetails.clear();

        details.forEach((row: any) => {
          const fg = this.createChargeRow();
          fg.patchValue({
            StdTariffDetailSid: row.StdTariffDetailSid,
            CargoType: row.CargoType,
            ChargeMasterSid: row.ChargeMasterSid,
            UomSid: row.UomSid,
            SaleCurrency: row.SaleCurrency,
            SaleAmount: row.SaleAmount,
            CostCurrency: row.CostCurrency,
            CostAmount: row.CostAmount,
            ValidFrom: row.ValidFrom,
            ValidTo: row.ValidTo,
            ChargeName: row.ChargeName,
            Status: row.Status
          });
          if (this.isEditMode) {
            fg.get('ValidFrom')?.disable();
            fg.get('ValidTo')?.disable();
            fg.get('SaleCurrency').disable();
            fg.get('SaleAmount')?.disable();
            fg.get('CostAmount')?.disable();
            fg.get('CostCurrency').disable();
            fg.get('UomSid').disable();
            // fg.get('CargoType').disable();
            fg.get('ChargeMasterSid').disable();
          }
          this.StdTariffDetails.push(fg);
          setTimeout(() => {
            this.updateChargeStatusLock();
          });
        });
        this.spinner.hide();
      },
      error: err => console.error('Failed to load standard charge:', err)
    });
    this.spinner.hide();
  }

  onCharge(index: number , chargeOrCargo ?: 'charge' | 'cargo') {

    
    const allDetails = this.StdTariffDetails.getRawValue()
    const currentDetail = allDetails[index];
    const selectedChargeSid = currentDetail?.ChargeMasterSid;
    const previousRows = allDetails
      .filter((r,i) => r.ChargeMasterSid === selectedChargeSid && r.Status !== 'S' && r.CargoType === currentDetail.CargoType && index !== i)
      .sort((a,b) => a.ValidTo - b.ValidTo);
      
      const lastRowIndex = previousRows.length;
      const lastRow = previousRows[lastRowIndex - 1];
      
      console.log(allDetails , previousRows , lastRow , currentDetail, "Hello");

    // ✅ Already Exists → Next Day
    if (lastRow?.ValidTo) {

      const prevTo = new Date(lastRow.ValidTo);
      prevTo.setDate(prevTo.getDate() + 1);

      this.minValidFromDates[index] = {
        year: prevTo.getFullYear(),
        month: prevTo.getMonth() + 1,
        day: prevTo.getDate()
      };
    }

    // ✅ Not Exists → Today Date
    else {

      const today = new Date();

      this.minValidFromDates[index] = {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
      };
    }

    if(chargeOrCargo === 'charge'){
      this.updateChargeStatusLock();
    }
  }

  updateChargeStatusLock() {

    const rows = this.StdTariffDetails.controls;

    rows.forEach((row, i) => {

      const chargeSid = row.get('ChargeMasterSid')?.value;
      if (!chargeSid) return;

      // Find all same charge rows
      const sameChargeRows = rows.filter(r =>
        r.get('ChargeMasterSid')?.value === chargeSid
      );

      // Find last row index of that charge
      const lastRow = sameChargeRows[sameChargeRows.length - 1];

      // Disable all previous rows
      if (row !== lastRow) {
        row.get('Status')?.disable();
      } else {
        row.get('Status')?.enable();
      }
    });
  }



  filterDepartment(dept: any) {
    const deptName = dept?.departmentName;
    console.log(deptName,"DEPT NAme")
    if (!deptName) {
      this.filteredChargeList = [...this.charge];
      return;
    }
    this.filteredChargeList = this.charge.filter(c =>
      Array.isArray(c.DepartmentMasterSid) &&
      c.DepartmentMasterSid.includes(deptName)
    );
    console.log(this.filteredChargeList,"Filter Charge List")
  }

  onSubmit() {
    if (this.standardChargeForm.invalid) {
      this.appSettingService.showWarning("Please fill all the required fields correctly");
      this.standardChargeForm.markAllAsTouched();
      this.standardChargeForm.updateValueAndValidity();
      return;
    }

    const formValue = this.standardChargeForm.getRawValue();
    const mappedDetails = formValue.StdTariffDetails.map((row: any) => {
      const selectedCharge = this.charge.find(
        c => c.ChargeMasterSid === row.ChargeMasterSid
      );

      return {
        ...row,
        ChargeName: selectedCharge?.chargeName || ''
      };
    });

    const CreatedOn = new Date();
    const currentUser = this.appSettingService.userSettingSource.value['userEmail'];
    const payload = this.isEditMode
      ? {
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        UpdatedBy: currentUser,
        StdRateHeaderSid: this.StdRateHeaderSid,
        ...formValue,
        StdTariffDetails: mappedDetails
      }
      : {
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        CreatedOn,
        CreatedBy: currentUser,
        ...formValue,
        StdTariffDetails: mappedDetails
      };

    const operation = this.isEditMode
      ? this.masterService.updateStdChargeById(this.StdRateHeaderSid, payload)
      : this.masterService.createNewStdCharge(payload);

    operation.subscribe({
      next: (res: any) => {
        if (res.status) {
          if (this.isEditMode) {
            this.loadStandardChargeById(this.StdRateHeaderSid);
            this.appSettingService.showSuccess('Standard-Charge is updated successfully');
          } else {
            this.appSettingService.showSuccess("Standard-Charge is created successfully");
            this.router.navigate(['/master/standard-charge/entry']);
          }
        } else {
          this.appSettingService.showError(res.message);
        }
      },
      error: err => console.error('Error saving standard charge:', err)
    });
  }


  reset() {
    if (this.isEditMode) {
      this.loadStandardChargeById(this.StdRateHeaderSid);
    } else {
      this.standardChargeForm.reset({ Status: 'A' });
      this.StdTariffDetails.clear();
      this.StdTariffDetails.push(this.createChargeRow());
    }
  }

  goBack() {
    this.router.navigate(['/master/standard-charge/list']);
  }

  showInfo() {
    if (!this.standardChargeData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.standardChargeData;
    modalRef.componentInstance.idLabel = 'Standard Charge Id';
    modalRef.componentInstance.idValue = this.standardChargeData?.StdRateHeaderSid;
  }

  // openTandC() {
  //   this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  //   const payload = { MenuMasterSid: this.currentMenuId };
  //   this.masterService.getTandCByCondition(payload).subscribe(
  //     (resp: any) => {
  //       if (resp.status) {
  //         this.TandCList = resp.data;
  //         const modalRef = this.modalService.open(TermsAndConditionsComponent, {
  //           size: 'lg',
  //           backdrop: 'static',
  //           centered: true
  //         });
  //         modalRef.componentInstance.terms = this.TandCList;
  //         modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
  //         modalRef.componentInstance.DocumentSid = this.StdRateHeaderSid;

  //       } else {
  //         this.appSettingService.showError('Error loading Terms and Conditions');
  //       }
  //     },
  //     (error) => {
  //       this.appSettingService.showError('Error loading Terms and Conditions', error);
  //     }
  //   );
  // }
  openEmail() {
    if (!this.standardChargeData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.standardChargeData;
    modalRef.componentInstance.idLabel = 'Standard Charge Id';
    modalRef.componentInstance.idValue = this.standardChargeData?.StdRateHeaderSid;
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
    modalRef.componentInstance.documentSid = this.StdRateHeaderSid;
  }

  openEDoc() {
    if (!this.standardChargeData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    })
    const data: any = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      DocumentSid: this.StdRateHeaderSid
    }
    console.log(this.MenuMasterSid)
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
    modalRef.componentInstance.DocumentSid = this.StdRateHeaderSid;
  }

  openFollowup() {
    if (!this.standardChargeData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.standardChargeData?.UserMasterSid;
    modalRef.componentInstance.parentEmail = this.standardChargeData;
    //   modalRef.componentInstance.parentSubject = `Quotation No.${this.userData} Date:${new Date(this.userData).toLocaleDateString()}`;
    modalRef.componentInstance.parentMailbody = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
    <p>Dear Sir/Madam,</p>
    <p>Please find enclosed the quotation as requested.</p>
    <p>Kindly review the details at your convenience.</p>
    <p>Looking forward to your feedback and the opportunity to work together.</p>
    <p>
      Approval Hyperlink: 
      <a href="https://xxxxxxxxx" target="_blank" style="color: #1a73e8;">Click here to approve</a>
    </p>
    <p>Best Regards,</p>
    <p>${this.userData['userEmail']}</p>
    </div>
  `;

    // Optionally, pass the quotation HTML content ID for PDF generation
    modalRef.componentInstance.pdfContentId = 'quotationContent';
  }

  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.StdRateHeaderSid) return;

    this.masterService.getAuditLogs(
      'StdRateHeader',
      this.StdRateHeaderSid.toString()
    ).subscribe({
      next: (logs: any[]) => {
        const ignoredFields = ['updatedOn', 'updatedBy']; // ✅ add more if needed later

        const formatFields = (val: any) => {
          if (!val) return [];
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          if (Object.keys(obj).length === 0) return [];
          return Object.entries(obj)
            .filter(([key]) => !ignoredFields.includes(key)) // 🚫 exclude fields
            .map(([key, value]) => `${key}: ${value ?? 'NA'}`);
        };

        this.auditLogs = logs
          .map(log => ({
            ...log,
            oldValDisplay: formatFields(log.oldVal),
            newValDisplay: formatFields(log.newVal),
          }))
          .filter(log => log.oldValDisplay.length > 0 || log.newValDisplay.length > 0);

        this.auditLogModalRef = this.modalService.open(modal, {
          centered: true,
          scrollable: true,
          windowClass: 'audit-log-modal'
        });
      },
      error: err => console.error('Error fetching audit logs:', err)
    });
  }

  public getAmountDecimalPlaces(CurrencyMasterSid: number): number {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(currency.currencyCode);
      return config?.amountDecimal || 2;
    }
    return 2;
  }
  toNgbDateStruct(dateStr: string | Date | null): NgbDateStruct | null {
    if (!dateStr) return null;

    const d = new Date(dateStr);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate()
    };
  }
  // Add this method to your component class
  deleteStdTariffDetail(index: number) {
    const row = this.StdTariffDetails.at(index) as FormGroup;
    const StdTariffDetailSid = row.get('StdTariffDetailSid')?.value;
    const currentUser = this.appSettingService.userSettingSource.value['userEmail'];

    if (StdTariffDetailSid) {
      this.spinner.show();

      this.masterService.deleteStdTariffDetail(StdTariffDetailSid, currentUser).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          if (res.status) {
            this.appSettingService.showSuccess('Charge detail deleted successfully');
            // Remove the row from UI
            this.StdTariffDetails.removeAt(index);
            this.StdTariffDetails.updateValueAndValidity();
          } else {
            this.appSettingService.showError(res.message || 'Failed to delete charge detail');
          }
        },
        error: (err) => {
          this.spinner.hide();
          this.appSettingService.showError(err?.message || 'Error deleting charge detail');
          console.error('Delete error:', err);
        }
      });
    } else {
      this.StdTariffDetails.removeAt(index);
      this.StdTariffDetails.updateValueAndValidity();
    }
  }

}
