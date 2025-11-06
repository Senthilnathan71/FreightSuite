import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { NgbModal, NgbDatepickerModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import { OperationService } from 'src/app/modules/operation/operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';

interface NgbDateStructLike { day: number; month: number; year: number; }

@Component({
  selector: 'app-vendor-invoice-entry',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FeatherModule,
    NgbDatepickerModule,
    ReactiveFormsModule,
    FormsModule,
    NgxSpinnerModule,
    NumberFormatPipe,
    CustomDatePipe,
    SearchableDropdown
  ],
  templateUrl: './vendor-invoice-entry.component.html',
  styleUrls: ['./vendor-invoice-entry.component.scss'],
})
export class VendorInvoiceEntryComponent implements OnInit {
  vendorInvoiceForm!: FormGroup;
  headerId: number | null = null;
  currentCompany: any;
  currentBranch: any;
  vendorInvoiceData: any;

  currUserEmail: string | null = null;
  isViewMode: boolean = false;
  get isEditMode() { return !!this.headerId && !this.isViewMode; }

  // ViewChild references for modals
  @ViewChild('searchCostsModal') searchCostsModalRef: TemplateRef<any> | undefined;
  searchCostsModalInstance: NgbModalRef | null = null;

  // Lookups
  vendorList: any[] = [];
  vendorBranchList: any[] = [];
  currencyList: any[] = [];
  chargeList: any[] = [];
  hssacList: any[] = [];
  subledgerList: any[] = [];
  uomList: any[] = [];
  masterJobList: any[] = [];
  houseJobList: any[] = [];
  stateList: any[] = [];
  houseJobListByMasterJob: { [key: number]: any[] } = {};
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;
  

CurrencyLookupConfig = {
  displayFields: ['currencyCode', 'currencyName','countryName'],
  displayLabels: ['Code', 'Name','Country'],
  labelFields: ['currencyCode'],
};

HSSACLookupConfig = {
  displayFields: ['HSSACCode', 'HSSACName'],
  displayLabels: ['Code', 'Name'],
  labelFields: ['HSSACCode'],
};
 departmentList: any[] = [];
  departmentLookupConfig = {
    displayFields: ['departmentCode', 'departmentName'],
    displayLabels: ['Code', 'Name'],
    labelFields: ['departmentCode'],
  };
  // Add master job config with other configs
masterJobLookupConfig = {
  displayFields: ['MasterJobNumber', 'MBLNo'],
  displayLabels: ['Job No', 'MBL No'],
  labelFields: ['MasterJobNumber'],
};
  userData: any;
  currentDate = new Date();
  private pendingBranchToSelect: number | null = null;

  // UI state
  selectedTab = 'VendorInvoice';
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }
  tabs = [
    { name: 'VendorInvoice', icon: 'fas fa-file-invoice' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' }
  ];

  invoiceTypes = [
  { id: 'REG', name: 'Regular' },
  { id: 'REIMB', name: 'Reimbursement' },
  { id: 'BOS', name: 'Bill of Supply' },
  { id: 'NONGST', name: 'Non GST/Zero' },
];

gstTypes = [
  { id: 'B2B', name: 'B2B - Business to Business' },
  { id: 'B2C', name: 'B2C - Business to Customer' },
  { id: 'EXWP', name: 'Export With Payment' },
  { id: 'EXWOP', name: 'Export Without Payment' }
];

  statusList = [
    { value: 'A', name: 'Active' },
    { value: 'S', name: 'Suspended' },
  ];

  isSaving: boolean = false;

  gstType = [
    { id: 'B2B', name: 'B2B - Business to Business' },
    { id: 'B2CS', name: 'B2CS - Business to Customer(Small)' },
    { id: 'B2CL', name: 'B2CL - Business to Customer(Large)' },
    { id: 'EXWP', name: 'EXWP - Export With Payment of Tax' },
    { id: 'EXWOP', name: 'EXWOP - Export Without Payment of Tax' },
  ];

  searchTypes = [
    { id: 'Master Job', name: 'Master Job' },
    { id: 'House Job', name: 'House Job' },
    { id: 'MBL No', name: 'MBL No' },
    { id: 'HBL No', name: 'HBL No' },
    { id: 'Container No', name: 'Container No' }
  ];

  // Search costs
  searchType: string = 'Master Job';
  searchValue: string = '';
  pendingCosts: any[] = [];
  selectedCosts: Set<number> = new Set();
  searchPerformed: boolean = false;
  searchResultsLoading: boolean = false;

  // TDS Configuration
  tdsConfig: any = null;

  // Country/Tax mode
  bookingModeCountry: string = 'india';

  get isIndiaGST(): boolean {
    return this.bookingModeCountry === 'india';
  }
  get isVATMode(): boolean {
    return !this.isIndiaGST;
  }

  get f(): { [key: string]: AbstractControl } {
    return this.vendorInvoiceForm.controls;
  }
  get details(): FormArray {
    return this.vendorInvoiceForm.get('voucherDetails') as FormArray;
  }
  get tdsGroup(): FormGroup {
    return this.vendorInvoiceForm.get('voucherTDS') as FormGroup;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private companySettings: CompanySettingsManagerService
  ) {}

  ngOnInit(): void {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    try {
      this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
      this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
      console.log('=== INITIAL COMPANY DATA ===');
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    console.log('Company State:', this.getCompanyState());

      // Set country mode from company settings
      if (this.currentCompany?.CountryName) {
        this.bookingModeCountry = this.currentCompany.CountryName.toLowerCase();
      }
      // if (this.currentBranch?.stateName) {
      //   this.bookingModeCountry = this.currentBranch.stateName.toLowerCase();
      // }
    } catch (e) {
      this.currentCompany = null;
      this.currentBranch = null;
    }

    this.initForm();
    this.loadLookups();

    try {
      const decryptedProfileRaw = localStorage.getItem('user-profile');
      const decryptedProfile = decryptedProfileRaw ? this.appSettingService.decrypt(decryptedProfileRaw) : null;
      this.currUserEmail = decryptedProfile?.email || localStorage.getItem('user-email') || null;
    } catch (err) {
      this.currUserEmail = localStorage.getItem('user-email') || null;
    }

    // Check if view mode from route data
    this.route.data.subscribe(data => {
      this.isViewMode = data['viewMode'] === true;
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.headerId = Number(id);
        this.loadVendorInvoiceById(this.headerId);
      } else {
        // New vendor invoice - set default currency
        const currencySettings = this.companySettings.getCurrencySettings();
        console.log(currencySettings,'currencySettings')
        this.vendorInvoiceForm.patchValue({
          CurrencyCode: currencySettings.code,
          ExchangeRate: 1
        });
      }
    });

    // Recalculate when currency/exchange rate changes
    this.vendorInvoiceForm.get('CurrencyCode')?.valueChanges.subscribe(() => {
      this.recalculateAllRows();
    });

    this.vendorInvoiceForm.get('ExchangeRate')?.valueChanges.subscribe(() => {
      this.recalculateAllRows();
    });
  }

  initForm() {
    this.vendorInvoiceForm = this.fb.group({
      // Header
      VoucherNumber: [{ value: '', disabled: true }],
      VoucherDate: [this.formatDateForNgb(new Date()), Validators.required],
      PartyMasterSid: [null], // Vendor
      PartyName:  ['', Validators.required],
      PartyAddress: [{ value: '', disabled: true }],
      GSTNo: [{ value: '', disabled: true }],
      PlaceOfSupply: [{ value: '', disabled: true }],
      PostedOn: [{ value: null, disabled: true }],
      CustomerBranchSid: [null],
      CurrencyCode: ['', Validators.required],
      ExchangeRate: [1, [Validators.required, Validators.min(0)]],
      BillNo: ['', Validators.required],
      BillDate: [null, Validators.required],
      BillAmt: [0, [Validators.required, Validators.min(0)]],
      MBLNo: [''],
      HBLNo: [''],
      InvoiceType: ['B2B'],
      GSTType: [''],
      Narration: [''],
      Remarks: [''],
      MasterJobSid: [null],
      HouseJobSid: [null],
      Status: ['A'],

      // Details Array
      voucherDetails: this.fb.array([]),

      // TDS Section
      voucherTDS: this.fb.group({
        TDSSet: [{ value: '', disabled: true }],
        TDSCompany: [{ value: '', disabled: true }],
        ITSectionType: [{ value: '', disabled: true }],
        ITSectionCode: [{ value: '', disabled: true }],
        CertificateNo: [{ value: '', disabled: true }],
        Percentage: [{ value: 0, disabled: true }],
        TaxableAmt: [{ value: 0, disabled: true }],
        TDSAmt: [{ value: 0, disabled: true }],
        Reason: [''],
        TDSSectionCode:[''],
        TDSNature:[''],
        TDSCompanyType:[''],
        TDSPercent:[''],
        TDSAccountCode:['']
      }),

      // Others
      voucherOthers: this.fb.group({
        ContainerNumber: [''],
        VoucherNote: [''],
        Footer: ['']
      })
    });
  }

  createDetailGroup(data?: any): FormGroup {
  return this.fb.group({
    ChargeMasterSid: [data?.ChargeMasterSid || null, Validators.required],
    ChargeDescription: [data?.ChargeDescription || ''],
    HSSACMasterSid: [data?.HSSACMasterSid || null],
    ChargeUOMSid: [data?.ChargeUOMSid || null],
    NumberOfUnit: [data?.NumberOfUnit || 1, [Validators.required, Validators.min(0)]],
    DrCr: [data?.DrCr || 'Dr', Validators.required],
    CurrencyCode: [data?.CurrencyCode || this.vendorInvoiceForm.get('CurrencyCode')?.value || null],
    Rate: [data?.Rate || 0, [Validators.required, Validators.min(0)]],
    ExchangeRate: [data?.ExchangeRate || this.vendorInvoiceForm.get('ExchangeRate')?.value || 1],
    Amount: [data?.Amount || 0],
    TaxableAmount: [data?.TaxableAmount || 0],
    TaxPercentage1: [data?.TaxPercentage1 || 0],
    TaxAmount1: [data?.TaxAmount1 || 0],
    TaxPercentage2: [data?.TaxPercentage2 || 0],
    TaxAmount2: [data?.TaxAmount2 || 0],
    TaxPercentageIGST: [data?.TaxPercentageIGST || 0],
    TaxAmountIGST: [data?.TaxAmountIGST || 0],
    LocalAmount: [data?.LocalAmount || 0],
    PartyAmount: [data?.PartyAmount || 0],
    MasterJobSid: [data?.MasterJobSid || null],
    HouseJobSid: [data?.HouseJobSid || null],
    DepartmentMasterSid: [data?.DepartmentMasterSid || null],
    LedgerMasterSid: [data?.LedgerMasterSid || null],
    COAMasterSid: [data?.COAMasterSid || null]
  });
}
getDepartmentName(departmentSid: number): string {
  if (!departmentSid || this.departmentList.length === 0) {
    return '-';
  }
  const department = this.departmentList.find(dept => 
    dept.DepartmentMasterSid === departmentSid || 
    dept.departmentMasterSid === departmentSid
  );
  return department?.DepartmentName || department?.departmentName || '-';
}
onDetailChange(index: number, field?: string) {
  if (['NumberOfUnit', 'Rate', 'ExchangeRate', 'TaxPercentage1', 'TaxPercentage2', 'TaxPercentageIGST', 'CurrencyCode'].includes(field || '')) {
    this.recalcRow(index);
  } else if (field === 'ChargeMasterSid') {
    const chargeSid = this.details.at(index).get('ChargeMasterSid')?.value;
    const selectedCharge = this.chargeList?.find((c: any) => c.ChargeMasterSid === chargeSid);
    
    if (selectedCharge) {
      const description = selectedCharge.ChargeDescription || selectedCharge.chargeName || selectedCharge.ChargeName || '';
      let hssacId = selectedCharge.HSSACMasterSid ?? selectedCharge.HSSACMasterSid ?? null;
      
      // Auto-set HSN/SAC code from ChargeTaxMaster
      if (!hssacId && Array.isArray(selectedCharge.ChargeTaxMaster) && selectedCharge.ChargeTaxMaster.length > 0) {
        const firstTax = selectedCharge.ChargeTaxMaster[0];
        const hsnCode = firstTax?.HSNCode;
        
        // Find matching HSSAC from hssacList using HSNCode
        if (hsnCode) {
          const matchingHssac = this.hssacList.find(h => 
            h.HSSACCode === hsnCode || h.HSNCode === hsnCode
          );
          if (matchingHssac) {
            hssacId = matchingHssac.HSSACMasterSid;
          }
        }
      }
      
      const chargeUomId = selectedCharge.ChargeUOMSid ?? selectedCharge.UOM ?? selectedCharge.UOMMasterSid ?? null;

      // Auto-set LedgerMasterSid and COAMasterSid
      const ledgerMasterSid = selectedCharge.SubledgerMasterSid || null;
      const coaMasterSid = selectedCharge.DrCOAMappedId || null;

      this.details.at(index).patchValue({
        ChargeDescription: description,
        HSSACMasterSid: hssacId || null,
        ChargeUOMSid: chargeUomId || null,
        Rate: selectedCharge.DefaultRate || selectedCharge.Rate || this.details.at(index).get('Rate')?.value || 0,
        LedgerMasterSid: ledgerMasterSid,
        COAMasterSid: coaMasterSid
      });

      this.recalcRow(index);
    }
  }
}

recalcRow(index: number) {
  const row = this.details.at(index);
  if (!row) return;
  
  const unit = Number(row.get('NumberOfUnit')?.value || 0);
  const rate = Number(row.get('Rate')?.value || 0);
  const exRate = Number(row.get('ExchangeRate')?.value || this.vendorInvoiceForm.get('ExchangeRate')?.value || 1);

  // Calculate basic amounts
  const amount = unit * rate;
  const taxableAmount = exRate*(unit * rate);
  const localAmount = amount * exRate;

  // Get GST Type and determine tax applicability
  const gstType = this.vendorInvoiceForm.get('GSTType')?.value;
  const placeOfSupply = this.vendorInvoiceForm.get('PlaceOfSupply')?.value;
  const companyState = this.getCompanyState();
  
  let taxPerc1 = 0, taxAmt1 = 0, taxPerc2 = 0, taxAmt2 = 0, igstPerc = 0, igstAmt = 0;

  console.log('=== TAX CALCULATION DEBUG ===');
  console.log('GST Type:', gstType);
  console.log('Place of Supply:', placeOfSupply);
  console.log('Company State:', companyState);

  if (this.isIndiaGST && this.vendorInvoiceForm.get('GSTNo')?.value) {
    // Get HSN/SAC tax rate
    const hssacSid = row.get('HSSACMasterSid')?.value;
    const hssac = this.hssacList.find(h => h.HSSACMasterSid === hssacSid);
    const taxRate = hssac?.TaxRate || 18;

    // Determine tax type based on GST Type
    switch(gstType) {
      case 'CGST+SGST':
        // Scenario 1: Same State - Split tax between CGST and SGST
        taxPerc1 = taxRate / 2; // CGST
        taxAmt1 = (taxableAmount * taxPerc1) / 100;
        taxPerc2 = taxRate / 2; // SGST
        taxAmt2 = (taxableAmount * taxPerc2) / 100;
        console.log(`CGST+SGST: ${taxPerc1}% CGST + ${taxPerc2}% SGST`);
        break;
        
      case 'IGST':
        // Scenario 2: Different State - Full IGST
        igstPerc = taxRate;
        igstAmt = (taxableAmount * igstPerc) / 100;
        console.log(`IGST: ${igstPerc}% IGST`);
        break;
        
      case 'EXWP':
        // Scenario 3: Export - Zero GST
        console.log('EXWP: 0% GST');
        break;
        
      case 'B2C':
        // B2C transactions - may have different tax treatment
        taxPerc1 = taxRate;
        taxAmt1 = (taxableAmount * taxPerc1) / 100;
        console.log(`B2C: ${taxPerc1}% GST`);
        break;
        
      default:
        // Default to IGST if unsure
        igstPerc = taxRate;
        igstAmt = (taxableAmount * igstPerc) / 100;
        console.log(`DEFAULT: ${igstPerc}% IGST`);
        break;
    }
  } else if (this.isVATMode && this.vendorInvoiceForm.get('GSTNo')?.value) {
    // VAT calculation for non-India countries
    const hssacSid = row.get('HSSACMasterSid')?.value;
    const hssac = this.hssacList.find(h => h.HSSACMasterSid === hssacSid);
    taxPerc1 = hssac?.TaxRate || 5; // VAT
    taxAmt1 = (taxableAmount * taxPerc1) / 100;
    console.log(`VAT: ${taxPerc1}% VAT`);
  }

  // Update row values
  row.get('Amount')?.setValue(this.round(amount));
  row.get('TaxableAmount')?.setValue(this.round(taxableAmount));
  row.get('TaxPercentage1')?.setValue(this.round(taxPerc1));
  row.get('TaxAmount1')?.setValue(this.round(taxAmt1));
  row.get('TaxPercentage2')?.setValue(this.round(taxPerc2));
  row.get('TaxAmount2')?.setValue(this.round(taxAmt2));
  row.get('TaxPercentageIGST')?.setValue(this.round(igstPerc));
  row.get('TaxAmountIGST')?.setValue(this.round(igstAmt));
  row.get('LocalAmount')?.setValue(this.round(localAmount));
  row.get('PartyAmount')?.setValue(this.round(amount));

  // Update Bill Amount
  this.updateBillAmount();
  this.calculateTDS();
}

updateBillAmount() {
  const totalLocalAmount = this.calculateTotalLocalAmount();
  this.vendorInvoiceForm.get('BillAmt')?.setValue(this.round(totalLocalAmount));
}
recalculateAllRows() {
  for (let i = 0; i < this.details.length; i++) {
    const exRateCtrl = this.details.at(i).get('ExchangeRate');
    if (exRateCtrl && (exRateCtrl.value === null || exRateCtrl.value === undefined)) {
      exRateCtrl.setValue(this.vendorInvoiceForm.get('ExchangeRate')?.value || 1);
    }
    const currCtrl = this.details.at(i).get('CurrencyCode');
    if (currCtrl && !currCtrl.value) {
      currCtrl.setValue(this.vendorInvoiceForm.get('CurrencyCode')?.value || null);
    }
    this.recalcRow(i);
  }
}

getTotalCurrencyAmount(): number {
  let total = 0;
  for (let i = 0; i < this.details.length; i++) {
    const amount = Number(this.details.at(i).get('PartyAmount')?.value || 0);
    total += amount;
  }
  return this.round(total);
}

getTotalTaxAmount(): number {
  let total = 0;
  for (let i = 0; i < this.details.length; i++) {
    const taxAmt1 = Number(this.details.at(i).get('TaxAmount1')?.value || 0);
    const taxAmt2 = Number(this.details.at(i).get('TaxAmount2')?.value || 0);
    const igstAmt = Number(this.details.at(i).get('TaxAmountIGST')?.value || 0);
    total += taxAmt1 + taxAmt2 + igstAmt;
  }
  return this.round(total);
}

getGrandTotal(): number {
  return this.round(this.getTotalCurrencyAmount() + this.getTotalTaxAmount());
}

  addDetailRow() {
    const newRow = this.createDetailGroup();
    this.details.push(newRow);

    // Subscribe to changes for auto-calculation
    this.subscribeToRowChanges(newRow);
  }

  subscribeToRowChanges(row: FormGroup) {
    // Recalculate when NumberOfUnit or Rate changes
    row.get('NumberOfUnit')?.valueChanges.subscribe(() => this.recalculateRow(row));
    row.get('Rate')?.valueChanges.subscribe(() => this.recalculateRow(row));
    row.get('CGSTPercentage')?.valueChanges.subscribe(() => this.recalculateRow(row));
    row.get('SGSTPercentage')?.valueChanges.subscribe(() => this.recalculateRow(row));
    row.get('IGSTPercentage')?.valueChanges.subscribe(() => this.recalculateRow(row));
    row.get('VATPercentage')?.valueChanges.subscribe(() => this.recalculateRow(row));

    // When charge changes, fetch SAC code and UOM
    row.get('ChargeMasterSid')?.valueChanges.subscribe((chargeSid) => {
      if (chargeSid) {
        this.onChargeChange(row, chargeSid);
      }
    });
  }

  onChargeChange(row: FormGroup, chargeSid: number) {
    const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeSid);
    console.log(charge,'onChargeChange')

    const uom = this.uomList.find(u=>u.UOMMasterSid === charge.UOM)
    if (charge) {
      row.patchValue({
        ChargeDescription: charge.chargeName,
        SACCode: charge.HSNSAC || charge.HSNCode || '',
        Unit: uom.UOMCode || '',
        ChargeUOMSid: charge.ChargeUOMSid,
      }, { emitEvent: false });

      // Fetch HSN/SAC Master ID
      if (charge.SACCode || charge.HSNCode) {
        const hssac = this.hssacList.find(h =>
          h.HSSACCode === (charge.SACCode || charge.HSNSAC) ||
          h.SACCode === (charge.SACCode || charge.HSNCode)
        );
        if (hssac) {
          row.patchValue({ HSSACMasterSid: hssac.HSSACMasterSid }, { emitEvent: false });

          // Auto-fill tax percentage based on SAC code
          if (this.isIndiaGST) {
            const taxRate = hssac.TaxRate || 18; // Default 18% GST
            row.patchValue({
              CGSTPercentage: taxRate / 2,
              SGSTPercentage: taxRate / 2
            });
          } else {
            row.patchValue({
              VATPercentage: hssac.TaxRate || 5 // Default 5% VAT
            });
          }
        }
      }
    }
  }

  recalculateRow(row: FormGroup) {
    const numberOfUnit = Number(row.get('NumberOfUnit')?.value) || 0;
    const rate = Number(row.get('Rate')?.value) || 0;
    const exchangeRate = Number(row.get('ExchangeRate')?.value) || 1;

    // Calculate Amount
    const amount = numberOfUnit * rate;
    row.patchValue({ Amount: this.round(amount) }, { emitEvent: false });

    // Taxable Amount = Amount
    const taxableAmount = amount;
    row.patchValue({ TaxableAmount: this.round(taxableAmount) }, { emitEvent: false });

    // Calculate taxes
    let totalTax = 0;

    if (this.isIndiaGST) {
      const cgstPct = Number(row.get('CGSTPercentage')?.value) || 0;
      const sgstPct = Number(row.get('SGSTPercentage')?.value) || 0;
      const igstPct = Number(row.get('IGSTPercentage')?.value) || 0;

      if (igstPct > 0) {
        // Inter-state: IGST
        const igst = (taxableAmount * igstPct) / 100;
        row.patchValue({ IGST: this.round(igst), CGST: 0, SGST: 0 }, { emitEvent: false });
        totalTax = igst;
      } else {
        // Intra-state: CGST + SGST
        const cgst = (taxableAmount * cgstPct) / 100;
        const sgst = (taxableAmount * sgstPct) / 100;
        row.patchValue({
          CGST: this.round(cgst),
          SGST: this.round(sgst),
          IGST: 0
        }, { emitEvent: false });
        totalTax = cgst + sgst;
      }
    } else {
      // VAT for non-India
      const vatPct = Number(row.get('VATPercentage')?.value) || 0;
      const vat = (taxableAmount * vatPct) / 100;
      row.patchValue({ VAT: this.round(vat) }, { emitEvent: false });
      totalTax = vat;
    }

    // Local Amount = (Amount + Tax) * Exchange Rate
    const localAmount = (amount + totalTax) * exchangeRate;
    row.patchValue({ LocalAmount: this.round(localAmount) }, { emitEvent: false });

    // Recalculate TDS
    this.calculateTDS();
  }

 

  deleteDetailRow(index: number) {
    this.details.removeAt(index);
    this.renumberRows();
    this.calculateTDS();
  }

  renumberRows() {
    this.details.controls.forEach((row, i) => {
      row.patchValue({ Sno: i + 1 }, { emitEvent: false });
    });
  }

  calculateTDS() {
  const totalTaxable = this.details.controls.reduce((sum, row: any) => {
    return sum + (Number(row.get('TaxableAmount')?.value) || 0);
  }, 0);

  const tdsRate = this.tdsConfig?.tdsRate || 0;
  const tdsAmount = (totalTaxable * tdsRate) / 100;

  this.tdsGroup.patchValue({
    TaxableAmt: this.round(totalTaxable),
    TDSAmt: this.round(tdsAmount)
  });
}

  calculateTotalAmount(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('Amount')?.value) || 0);
    }, 0);
  }

  calculateTotalTaxableAmount(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('TaxableAmount')?.value) || 0);
    }, 0);
  }

  calculateTotalCGST(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('CGST')?.value) || 0);
    }, 0);
  }

  calculateTotalSGST(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('SGST')?.value) || 0);
    }, 0);
  }

  calculateTotalIGST(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('IGST')?.value) || 0);
    }, 0);
  }

  calculateTotalVAT(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('VAT')?.value) || 0);
    }, 0);
  }

  calculateTotalLocalAmount(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('LocalAmount')?.value) || 0);
    }, 0);
  }

 

  
  // Vendor selection
onVendorChange(selected: any) {
  const vendorMasterSid = (typeof selected === 'object' && selected !== null)
    ? (selected.CustomerMasterSid ?? selected)
    : selected;
  
  if (!vendorMasterSid) {
    this.vendorBranchList = [];
    this.vendorInvoiceForm.get('CustomerBranchSid')?.setValue(null);
    this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
    this.vendorInvoiceForm.get('PartyMasterSid')?.setValue(null); // Clear PartyMasterSid
    this.vendorInvoiceForm.get('GSTNo')?.setValue('');
    this.vendorInvoiceForm.get('PartyName')?.setValue('');
    this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue('');
    this.vendorInvoiceForm.get('InvoiceType')?.setValue('B2B');
    this.vendorInvoiceForm.get('GSTType')?.setValue('');
    return;
  }

  const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
  if (vendor) {
    // Set PartyName to vendor name
    this.vendorInvoiceForm.get('PartyName')?.setValue(vendor.CustomerName || '');
    
    // CRITICAL: Set PartyMasterSid from vendor's SubledgerMasterSid
    if (vendor.SubledgerMasterSid) {
      this.vendorInvoiceForm.get('PartyMasterSid')?.setValue(Number(vendor.SubledgerMasterSid));
      console.log('DEBUG - Set PartyMasterSid from vendor:', vendor.SubledgerMasterSid);
    } else {
      console.warn('DEBUG - Vendor has no SubledgerMasterSid:', vendor);
      this.vendorInvoiceForm.get('PartyMasterSid')?.setValue(null);
    }

    // Rest of your existing code for GST, InvoiceType, etc...
    const countryCode = this.getCustomerCountryCode(vendor);
    console.log('Vendor Country Code:', countryCode);
    
    if (countryCode === 'IN' && vendor.GSTNo) {
      this.vendorInvoiceForm.get('InvoiceType')?.setValue('B2B');
      console.log('Invoice Type: B2B (Indian vendor with GST)');
    } else if (countryCode !== 'IN') {
      this.vendorInvoiceForm.get('InvoiceType')?.setValue('EXWP');
      console.log('Invoice Type: EXWP (Export vendor)');
    } else {
      this.vendorInvoiceForm.get('InvoiceType')?.setValue('B2C');
      console.log('Invoice Type: B2C (Indian vendor without GST)');
    }

    // Load TDS configuration
    this.loadVendorTDS(vendorMasterSid);
  }

  // Reset branch selection when vendor changes
  this.vendorInvoiceForm.get('CustomerBranchSid')?.setValue(null);
  this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
  this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue('');
  this.vendorInvoiceForm.get('GSTType')?.setValue('');
  this.getVendorBranchByVendor(Number(vendorMasterSid));
}

// Enhanced vendor branch selection
onVendorBranchChange(selectedBranch: any) {
  const branchSid = (typeof selectedBranch === 'object' && selectedBranch !== null)
    ? (selectedBranch.CustomerBranchSid ?? selectedBranch)
    : selectedBranch;

  if (!branchSid) {
    this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
    this.vendorInvoiceForm.get('GSTNo')?.setValue('');
    this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue('');
    return;
  }

  const foundBranch = this.vendorBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));
  
  if (foundBranch) {
    // Set address from branch
    const address = foundBranch.Address || foundBranch.CustomerAddress1 || foundBranch.customerAddress || '';
    this.vendorInvoiceForm.get('PartyAddress')?.setValue(address);

    // Get Place of Supply from state lookup
    let placeOfSupply = '';
    const stateMasterSid = foundBranch.StateMasterSid;
    
    if (stateMasterSid && this.stateList.length > 0) {
      const state = this.stateList.find(s => 
        s.StateMasterSid === stateMasterSid || 
        s.stateMasterSid === stateMasterSid
      );
      if (state) {
        placeOfSupply = state.stateName || state.StateName || '';
      }
    }
    
    // If no state found, try to get city or use empty
    if (!placeOfSupply) {
      placeOfSupply = foundBranch.City || foundBranch.city || '';
    }

    console.log('Setting Place of Supply:', placeOfSupply);
    this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue(placeOfSupply);

    // Set GST No based on country
    const vendorMasterSid = foundBranch.CustomerMasterSid;
    if (vendorMasterSid) {
      const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
      if (vendor) {
        const countryCode = this.getCustomerCountryCode(vendor);
        if (countryCode === 'IN') {
          this.vendorInvoiceForm.get('GSTNo')?.setValue(foundBranch.GSTNo || '');
        } else {
          this.vendorInvoiceForm.get('GSTNo')?.setValue(vendor.PanType || '');
        }
      }
    }

    // Auto-determine GST Type based on Place of Supply
    this.determineGSTType(placeOfSupply);
  } else {
    this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
    this.vendorInvoiceForm.get('GSTNo')?.setValue('');
    this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue('');
  }
}

getStateNameFromVendor(vendorMasterSid: number): string {
  const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
  if (vendor && vendor.stateMaster) {
    return vendor.stateMaster.stateName || vendor.stateMaster.StateName || '';
  }
  return '';
}
determineGSTType(placeOfSupply: string) {
  if (!placeOfSupply) {
    this.vendorInvoiceForm.get('GSTType')?.setValue('');
    return;
  }

  const companyState = this.getCompanyState();
  const vendorGSTNo = this.vendorInvoiceForm.get('GSTNo')?.value;
  const invoiceType = this.vendorInvoiceForm.get('InvoiceType')?.value;
  
  console.log('=== DETERMINING GST TYPE ===');
  console.log('Company State:', companyState);
  console.log('Place of Supply:', placeOfSupply);
  console.log('Vendor GST No:', vendorGSTNo);
  console.log('Invoice Type:', invoiceType);
  console.log('Is India GST:', this.isIndiaGST);
  const normalizedCompanyState = companyState?.trim().toLowerCase();
  const normalizedPlaceOfSupply = placeOfSupply?.trim().toLowerCase();

  // Scenario 3: Export (Vendor outside India)
  if (invoiceType === 'EXWP' || invoiceType === 'EXWOP') {
    this.vendorInvoiceForm.get('GSTType')?.setValue('EXWP');
    console.log('GST Type set to: EXPORT (Export scenario)');
    return;
  }

  // Scenario 1 & 2: India GST scenarios
  if (this.isIndiaGST && vendorGSTNo) {
    if (placeOfSupply === companyState) {
      // Scenario 1: Same State - CGST + SGST
      this.vendorInvoiceForm.get('GSTType')?.setValue('CGST+SGST');
      console.log('GST Type set to: CGST+SGST (Intra-state)');
    } else {
      // Scenario 2: Different State - IGST
      this.vendorInvoiceForm.get('GSTType')?.setValue('IGST');
      console.log('GST Type set to: IGST (Inter-state)');
    }
  } else if (this.isIndiaGST && !vendorGSTNo) {
    // B2C or unregistered dealer in India
    this.vendorInvoiceForm.get('GSTType')?.setValue('B2C');
    console.log('GST Type set to: B2C (Unregistered dealer)');
  } else {
    // Non-India scenarios
    this.vendorInvoiceForm.get('GSTType')?.setValue('VAT');
    console.log('GST Type set to: VAT (Non-India)');
  }
}
getCompanyState(): string {
  if (!this.currentCompany) {
    console.warn('No current company data available');
    return '';
  }

  console.log('=== COMPANY STATE DEBUG ===');
  console.log('Current Company:', this.currentCompany);
  console.log('Current Branch:', this.currentBranch);
  console.log('User Data:', this.userData);

  // Method 1: Check if currentCompany has stateMaster directly
  if (this.currentCompany.stateMaster) {
    const state = this.currentCompany.stateMaster.stateName || this.currentCompany.stateMaster.StateName;
    if (state) {
      console.log('Company State from currentCompany.stateMaster:', state);
      return state;
    }
  }

  // Method 2: Check if currentCompany has StateMasterSid and look up in stateList
  if (this.currentCompany.StateMasterSid && this.stateList.length > 0) {
    const state = this.stateList.find(s => 
      s.StateMasterSid === this.currentCompany.StateMasterSid || 
      s.stateMasterSid === this.currentCompany.StateMasterSid
    );
    if (state) {
      const stateName = state.stateName || state.StateName;
      console.log('Company State from currentCompany.StateMasterSid lookup:', stateName);
      return stateName;
    }
  }

  // Method 3: Check currentBranch state information
  if (this.currentBranch && this.currentBranch.stateMaster) {
    const state = this.currentBranch.stateMaster.stateName || this.currentBranch.stateMaster.StateName;
    if (state) {
      console.log('Company State from currentBranch.stateMaster:', state);
      return state;
    }
  }

  // Method 4: Check currentBranch StateMasterSid
  if (this.currentBranch && this.currentBranch.StateMasterSid && this.stateList.length > 0) {
    const state = this.stateList.find(s => 
      s.StateMasterSid === this.currentBranch.StateMasterSid || 
      s.stateMasterSid === this.currentBranch.StateMasterSid
    );
    if (state) {
      const stateName = state.stateName || state.StateName;
      console.log('Company State from currentBranch.StateMasterSid lookup:', stateName);
      return stateName;
    }
  }

  // Method 5: Navigate through userData structure to get branch state
  if (this.userData && this.userData.userCompanyMaster) {
    const userCompanies = this.userData.userCompanyMaster;
    
    // Find the current company in user companies
    const currentUserCompany = userCompanies.find((uc: any) => 
      uc.CompanyMasterSid === this.currentCompany.CompanyMasterSid
    );
    
    if (currentUserCompany && currentUserCompany.companyMaster) {
      const companyMaster = currentUserCompany.companyMaster;
      
      // Check company master's userBranchMaster
      if (companyMaster.userBranchMaster && Array.isArray(companyMaster.userBranchMaster)) {
        // Find the current branch
        const currentUserBranch = companyMaster.userBranchMaster.find((ub: any) => 
          ub.BranchMasterSid === this.currentBranch.BranchMasterSid
        );
        
        if (currentUserBranch && currentUserBranch.branchMaster) {
          const branchMaster = currentUserBranch.branchMaster;
          
          // Method 5a: Check branchMaster's stateMaster
          if (branchMaster.stateMaster) {
            const state = branchMaster.stateMaster.stateName || branchMaster.stateMaster.StateName;
            if (state) {
              console.log('Company State from userData->branchMaster->stateMaster:', state);
              return state;
            }
          }
          
          // Method 5b: Check branchMaster's StateMasterSid
          if (branchMaster.StateMasterSid && this.stateList.length > 0) {
            const state = this.stateList.find(s => 
              s.StateMasterSid === branchMaster.StateMasterSid || 
              s.stateMasterSid === branchMaster.StateMasterSid
            );
            if (state) {
              const stateName = state.stateName || state.StateName;
              console.log('Company State from userData->branchMaster->StateMasterSid lookup:', stateName);
              return stateName;
            }
          }
        }
      }
      
      // Method 6: Check company master's StateMasterSid
      if (companyMaster.StateMasterSid && this.stateList.length > 0) {
        const state = this.stateList.find(s => 
          s.StateMasterSid === companyMaster.StateMasterSid || 
          s.stateMasterSid === companyMaster.StateMasterSid
        );
        if (state) {
          const stateName = state.stateName || state.StateName;
          console.log('Company State from userData->companyMaster->StateMasterSid lookup:', stateName);
          return stateName;
        }
      }
    }
  }

  console.log('No company state found after all attempts');
  return '';
}
getStateNameBySid(stateMasterSid: number): string {
  if (!stateMasterSid || this.stateList.length === 0) return '';
  
  const state = this.stateList.find(s => 
    s.StateMasterSid === stateMasterSid || 
    s.stateMasterSid === stateMasterSid
  );
  
  return state?.stateName || state?.StateName || '';
}
getVendorBranchByVendor(CustomerMasterSid: number) {
  if (!CustomerMasterSid) {
    this.vendorBranchList = [];
    return;
  }
  
  this.operationService.getCustomerBranchByCustomer(CustomerMasterSid).subscribe({
    next: (resp: any) => {
      if (resp?.status && resp.data) {
        this.vendorBranchList = Array.isArray(resp.data) ? resp.data : resp.data;
        
        // Auto-select the branch if there's a pending selection
        if (this.pendingBranchToSelect) {
          const branchId = this.pendingBranchToSelect;
          this.pendingBranchToSelect = null;
          const foundBranch = this.vendorBranchList.find((b: any) => 
            Number(b.CustomerBranchSid) === Number(branchId)
          );
          if (foundBranch) {
            // Set address from the found branch
            const address = foundBranch.Address || foundBranch.CustomerAddress1 || '';
            this.vendorInvoiceForm.get('PartyAddress')?.setValue(address);
            
            // Also set Place of Supply if needed
            let placeOfSupply = '';
            const stateMasterSid = foundBranch.StateMasterSid;
            
            if (stateMasterSid && this.stateList.length > 0) {
              const state = this.stateList.find(s => 
                s.StateMasterSid === stateMasterSid || 
                s.stateMasterSid === stateMasterSid
              );
              if (state) {
                placeOfSupply = state.stateName || state.StateName || '';
              }
            }
            
            if (!placeOfSupply) {
              placeOfSupply = foundBranch.City || foundBranch.city || '';
            }

            this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue(placeOfSupply);
            
            // Auto-determine GST Type
            this.determineGSTType(placeOfSupply);
          }
        }
      } else if (Array.isArray(resp)) {
        this.vendorBranchList = resp;
      } else if (resp?.data) {
        this.vendorBranchList = resp.data;
      } else {
        this.vendorBranchList = [];
      }
    },
    error: (err) => {
      console.error('Error fetching vendor branches', err);
      this.vendorBranchList = [];
    }
  });
}

private getCustomerCountryCode(vendor: any): string {
  if (vendor.CountryMasterSid && typeof vendor.CountryMasterSid === 'object') {
    const code = vendor.CountryMasterSid.countryCode || vendor.CountryMasterSid.CountryCode;
    return code || '';
  }
  
  const countryCode = vendor.CountryCode || 
                     vendor.countryCode || 
                     vendor.countryMaster?.countryCode ||
                     vendor.country?.countryCode ||
                     vendor.CountryMaster?.CountryCode ||
                     '';
  
  if (!countryCode) {
    const vendorBranches = this.vendorBranchList.filter(b => b.CustomerMasterSid === vendor.CustomerMasterSid);
    const hasGSTNo = vendorBranches.some(branch => branch.GSTNo);
    if (hasGSTNo) {
      return 'IN';
    }
  }
  
  return countryCode;
}
  onVendorSelect(vendor: any) {
    const vendors = (typeof vendor === 'object' && vendor !==null)
    ? (vendor.vendors ?? vendor)
    : vendor;
    if (!vendor) {
      this.vendorList = [];
      this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
      return;
    }
    this.vendorInvoiceForm.get('PartyAddress')?.setValue(vendor.Address || '');
  }

  loadVendorTDS(vendorSid: number) {
    this.operationService.getVendorTDSMapping(vendorSid).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.tdsConfig = response.data;

          this.tdsGroup.patchValue({
            TDSSet: this.tdsConfig.tdsSetName || '',
            TDSCompany: this.currentCompany?.CompanyName || '',
            ITSectionType: this.tdsConfig.companyType || '',
            ITSectionCode: this.tdsConfig.itSectionCode || '',
            CertificateNo: this.tdsConfig.certificateNo || '',
            Percentage: this.tdsConfig.tdsRate || 0
          });

          // Recalculate TDS
          this.calculateTDS();
        } else {
          // No TDS config found
          this.tdsConfig = null;
          this.tdsGroup.patchValue({
            TDSSet: '',
            TDSCompany: '',
            ITSectionType: '',
            ITSectionCode: '',
            CertificateNo: '',
            Percentage: 0,
            TDSAmt: 0
          });
        }
      },
      error: (error) => {
        console.error('Error loading TDS config:', error);
        this.tdsConfig = null;
      }
    });
  }

  // Search Pending Costs
  openSearchCostsModal() {
    if (!this.searchCostsModalRef) {
      this.appSettingService.showError('Search modal template not found');
      return;
    }

    this.searchType = 'Master Job';
    this.searchValue = '';
    this.pendingCosts = [];
    this.selectedCosts.clear();

    this.searchCostsModalInstance = this.modalService.open(this.searchCostsModalRef, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
  }

  searchPendingCostsAction() {
    if (!this.searchValue.trim()) {
      this.appSettingService.showWarning('Please enter a search value');
      return;
    }

    this.searchResultsLoading = true;
    const criteria = {
      searchType: this.searchType,
      searchValue: this.searchValue.trim(),
      vendorSid: this.vendorInvoiceForm.get('PartyMasterSid')?.value,
      source: 'booking' // or 'housejob' depending on context
    };

    this.operationService.searchPendingCosts(criteria).subscribe({
      next: (response) => {
        this.searchResultsLoading = false;
        this.searchPerformed = true;
        if (response.status && response.data) {
          this.pendingCosts = response.data;
          if (this.pendingCosts.length === 0) {
            this.appSettingService.showInfo('No pending costs found');
          }
        } else {
          this.appSettingService.showError('No pending costs found');
          this.pendingCosts = [];
        }
      },
      error: (error) => {
        this.searchResultsLoading = false;
        this.searchPerformed = true;
        this.appSettingService.showError('Error searching pending costs');
        console.error('Error:', error);
      }
    });
  }

  toggleCostSelection(costSid: number) {
    if (this.selectedCosts.has(costSid)) {
      this.selectedCosts.delete(costSid);
    } else {
      this.selectedCosts.add(costSid);
    }
  }

  addSelectedCosts() {
    if (this.selectedCosts.size === 0) {
      this.appSettingService.showWarning('Please select at least one cost');
      return;
    }

    const selectedCostItems = this.pendingCosts.filter(c => this.selectedCosts.has(c.BookingRatesSid || c.CostRevenueChargesSid));

    selectedCostItems.forEach(cost => {
      const detailRow = this.createDetailGroup({
        ChargeMasterSid: cost.ChargeMasterSid,
        ChargeDescription: cost.ChargeDescription,
        NumberOfUnit: cost.NumberOfUnit || 1,
        Rate: cost.CostAmount || cost.Rate || 0,
        CurrencyCode: cost.costCurrencyMaster?.currencyCode || this.vendorInvoiceForm.get('CurrencyCode')?.value,
        ExchangeRate: cost.CostExchangeRate || 1,
        MasterJobSid: cost.MasterJobSid,
        HouseJobSid: cost.HouseJobSid
      });

      this.details.push(detailRow);
      this.subscribeToRowChanges(detailRow);
    });

    this.renumberRows();
    this.recalculateAllRows();
    this.searchCostsModalInstance?.close();
    this.appSettingService.showSuccess(`${this.selectedCosts.size} cost(s) added successfully`);
  }

  getSelectedCosts(): any[] {
    return this.pendingCosts.filter(c => c.selected);
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.pendingCosts.forEach(cost => cost.selected = checked);
  }

  isAllSelected(): boolean {
    return this.pendingCosts.length > 0 && this.pendingCosts.every(c => c.selected);
  }

  closeSearchCostsModal() {
    this.searchCostsModalInstance?.close();
    this.selectedCosts.clear();
  }

  // Load lookups
  loadLookups() {
    this.spinner.show();
      const companyRaw = localStorage.getItem('selected-company');
      const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;
      const filterOption = { CompanyMasterSid: company?.CompanyMasterSid, BranchMasterSid: company?.BranchMasterSid };

    Promise.all([
      firstValueFrom(this.operationService.getAllCreditorWithCOAMapped(filterOption)),
      firstValueFrom(this.operationService.getAllCurrencies()),
      firstValueFrom(this.operationService.getAllMappedChargeDebtors(filterOption)),
      firstValueFrom(this.operationService.getAllHssac()),
      firstValueFrom(this.operationService.getAllUom()),
      firstValueFrom(this.operationService.getAllState()),
    ]).then(([vendors,currencies, charges, hssac, uom, states]) => {
      this.vendorList = vendors.data || [];
      this.subledgerList = vendors.data || [];
      this.currencyList = currencies.data || [];
      this.chargeList = charges.data || [];
      this.hssacList = hssac || [];
      this.uomList = uom.data || [];
       this.stateList = states?.data || states || [];
      this.loadDepartments(company?.CompanyMasterSid).catch(e => {
      console.error('Error loading departments', e);
      this.departmentList = [];
    });
    
    this.loadMasterJobs().catch(e => {
      console.error('Error loading master jobs', e);
      this.masterJobList = [];
    });
      this.spinner.hide();
    }).catch(error => {
      console.error('Error loading lookups:', error);
      this.spinner.hide();
      this.appSettingService.showError('Error loading lookup data');
    });
  }
async loadDepartments(companyMasterSid: number) {
  if (!companyMasterSid) {
    this.departmentList = [];
    return;
  }
  try {
    const departments: any = await firstValueFrom(this.operationService.getAllDepartments(companyMasterSid));
    if (departments && Array.isArray(departments)) {
      this.departmentList = departments;
    } else if (departments?.data && Array.isArray(departments.data)) {
      this.departmentList = departments.data;
    } else if (departments?.status && Array.isArray(departments.data)) {
      this.departmentList = departments.data;
    } else {
      this.departmentList = departments || [];
    }
  } catch (error) {
    console.error('Error loading departments:', error);
    this.departmentList = [];
    throw error;
  }
}
async loadMasterJobs() {
  try {
    const companyRaw = localStorage.getItem('selected-company');
    const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;

    const payload = {
      CompanyMasterSid: company?.CompanyMasterSid,
      BranchMasterSid: company?.BranchMasterSid,
      limit: 200,
      offset: 0
    };

    const resp: any = await firstValueFrom(this.operationService.getAllMasterJobs(payload));
    let items: any[] = [];
    if (resp?.data && Array.isArray(resp.data)) {
      items = resp.data;
    } else if (Array.isArray(resp)) {
      items = resp;
    } else if (resp?.data?.data && Array.isArray(resp.data.data)) {
      items = resp.data.data;
    }

    this.masterJobList = items.map((it: any) => {
      const mj = {
        ...it,
        MasterJobSid: it.MasterJobSid ?? it.masterJobSid ?? it.MasterJobId ?? null,
        MasterJobNumber: it.MasterJobNumber ?? it.masterJobNumber ?? it.JobNumber ?? it.JobNo ?? '',
        MBLNo: it.MBLNo ?? it.mblNo ?? it.MBL ?? '',
        HBLNo: it.HBLNo ?? it.hblNo ?? it.HouseJob ?? '',
      };
      mj.displayLabel = `${mj.MasterJobNumber || ('#' + (mj.MasterJobSid ?? ''))}`;
      return mj;
    });
  } catch (err) {
    console.error('Error loading master jobs', err);
    this.masterJobList = [];
  }
}
getMasterJobNumber(jobSid: number): string {
  const job = this.masterJobList.find(j => j.MasterJobSid === jobSid);
  return job?.MasterJobNumber || job?.displayLabel || '-';
}
  // Load vendor invoice by ID
  loadVendorInvoiceById(id: number) {
    this.spinner.show();
    this.operationService.getVendorInvoiceById(id).subscribe({
      next: (response) => {
        this.spinner.hide();
        if (response.status && response.data) {
          console.log(response.data,'loadVendorInvoiceById')
          this.vendorInvoiceData = response.data;
          this.populateForm(this.vendorInvoiceData);
          this.setFormReadonly();
        } else {
          this.appSettingService.showError('Vendor Invoice not found');
          this.router.navigate(['/operation/vendor-invoice/list']);
        }
      },
      error: (error) => {
        this.spinner.hide();
        this.appSettingService.showError('Error loading Vendor Invoice');
        console.error('Error:', error);
        this.router.navigate(['/operation/vendor-invoice/list']);
      }
    });
  }

  setFormReadonly() {
    if (this.isViewMode) {
      this.vendorInvoiceForm.disable();
    }
  }

  formatDateForDisplay(date: string | Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

  populateForm(data: any) {
    
    console.log('populateForm called with data:', data);

    const currency = this.currencyList.find(c=>c.CurrencyMasterSid === data.CurrencyMasterSid)
    
    console.log(currency,'currency')
    this.vendorInvoiceForm.patchValue({
      VoucherNumber: data.VoucherNumber,
      VoucherDate: this.formatDateForNgb(data.VoucherDate),
      PartyMasterSid: data.PartyMasterSid,
      PartyName: data.PartyName,
      PartyAddress: data.PartyAddress,
      CustomerBranchSid: data.CustomerBranchSid,
      GSTNo: data.GST_VAT,
      PlaceOfSupply: data.PlaceOfSupply,
      PostedOn: data.PostDate ? this.formatDateForDisplay(data.PostDate) : null,
      CurrencyCode: data.CurrencyCode || currency.currencyCode,
      ExchangeRate: data.ExchangeRate || 1,
      BillNo: data.DocumentNumber,
      BillDate: data.DocumentDate ? this.formatDateForNgb(data.DocumentDate) : null,
      BillAmt: data.Amount || 0,
      MBLNo: data.MasterNumber,
      HBLNo: data.HouseNumber,
      InvoiceType: data.InvoiceType || 'B2B',
      GSTType: data.GSTType,
      Narration: data.Narration || '',
      Remarks: data.Remarks || (data.VoucherOthers && data.VoucherOthers[0]?.Remarks) || '',
      MasterJobSid: data.MasterJobSid,
      HouseJobSid: data.HouseJobSid,
      Status: data.Status
    });
    // CRITICAL: Extract customer/vendor master SID and branch SID for address patching
  const customerMasterSidFromBranch = data?.customerBranch?.CustomerMasterSid
    || data?.CustomerBranch?.CustomerMasterSid
    || null;

  const cm = data.CustomerMasterSid || customerMasterSidFromBranch || null;
  const branchSid = data.CustomerBranchSid || data.PartyName 
    || (data.customerBranch ? data.customerBranch.CustomerBranchSid : null) 
    || null;

  // Set pending branch to select and load vendor branches
  this.pendingBranchToSelect = branchSid ? Number(branchSid) : null;
  
  if (cm) {
    this.getVendorBranchByVendor(cm);
  }
  
  if (branchSid) {
    this.vendorInvoiceForm.get('CustomerBranchSid')?.setValue(Number(branchSid));
    this.pendingBranchToSelect = Number(branchSid);
    
    // Load branches for the current vendor
    const currentVendor = this.vendorInvoiceForm.get('PartyMasterSid')?.value;
    if (currentVendor) {
      this.getVendorBranchByVendor(Number(currentVendor));
    }
  }

    // Populate details
    this.details.clear();
    console.log('Details array cleared, length:', this.details.length);

    if (data.VoucherDetail && Array.isArray(data.VoucherDetail)) {
      console.log('Populating details, count:', data.VoucherDetail.length);
      data.VoucherDetail.forEach((detail: any, index: number) => {
        console.log(`Processing detail ${index}:`, detail);
        const row = this.createDetailGroup({
          Sno: detail.Sno,
          LedgerMasterSid: detail.LedgerMasterSid,
          ChargeMasterSid: detail.ChargeMasterSid,
          ChargeDescription: detail.ChargeDescription,
          HSSACMasterSid: detail.HSSACMasterSid,
          ChargeUOMSid: detail.ChargeUOMSid,
          NumberOfUnit: detail.NumberOfUnit,
          DrCr: detail.DrCr,
          CurrencyCode: detail.CurrencyCode,
          ExchangeRate: detail.ExchangeRate,
          Rate: detail.Rate,
          Amount: detail.Amount,
          TaxableAmount: detail.TaxableAmount,
          TaxPercentage1: detail.TaxPercentage1,
          TaxAmount1: detail.TaxAmount1,
          TaxPercentage2: detail.TaxPercentage2,
          TaxAmount2: detail.TaxAmount2,
          LocalAmount: detail.LocalAmount,
          MasterJobSid: detail.MasterJobSid,
          HouseJobSid: detail.HouseJobSid,
          DepartmentMasterSid: detail.DepartmentMasterSid,
          Remarks: detail.Remarks
        });
        console.log(`Created form group for detail ${index}:`, row.value);
        this.details.push(row);
        console.log(`Pushed row to details array, new length: ${this.details.length}`);
        this.subscribeToRowChanges(row);
      });
      console.log('Finished populating details. Final length:', this.details.length);
      console.log('Details controls:', this.details.controls);
    } else {
      console.log('VoucherDetail is missing or not an array');
    }

    // Populate TDS
    if (data.VoucherTDS && data.VoucherTDS.length > 0) {
      const tds = data.VoucherTDS[0];
      this.tdsGroup.patchValue({
        ITSectionCode: tds.ITSectionCode,
        Percentage: tds.TDSRate,
        TaxableAmt: tds.TaxableAmount,
        TDSAmt: tds.TDSAmount,
        Reason: tds.Reason || ''
      });
    }

    // Populate others
    if (data.VoucherOthers && data.VoucherOthers.length > 0) {
      const others = data.VoucherOthers[0];
      this.vendorInvoiceForm.get('voucherOthers')?.patchValue({
        ContainerNumber: others.ContainerNumber || '',
        VoucherNote: others.VoucherNote || '',
        Footer: others.Footer || ''
      });
    }
  }

  // Save
  onSave() {
    if (this.vendorInvoiceForm.invalid) {
      this.appSettingService.showWarning('Please fill all required fields');
      this.markFormGroupTouched(this.vendorInvoiceForm);
      return;
    }

    if (this.details.length === 0) {
      this.appSettingService.showWarning('Please add at least one charge detail');
      return;
    }

    const payload = this.preparePayload();

    this.spinner.show();
    if (this.isEditMode) {
      this.operationService.updateVendorInvoiceById(this.headerId!, payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          if (response.status) {
            this.appSettingService.showSuccess('Vendor Invoice updated successfully');
            this.router.navigate(['/operation/vendor-invoice/list']);
          } else {
            this.appSettingService.showError('Failed to update Vendor Invoice');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.appSettingService.showError('Error updating Vendor Invoice');
          console.error('Error:', error);
        }
      });
    } else {
      this.operationService.createVendorInvoice(payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          if (response.status) {
            this.appSettingService.showSuccess('Vendor Invoice created successfully');
            this.router.navigate(['/operation/vendor-invoice/list']);
          } else {
            this.appSettingService.showError(response.message || 'Failed to create Vendor Invoice');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.appSettingService.showError('Error creating Vendor Invoice');
          console.error('Error:', error);
        }
      });
    }
  }

  preparePayload(): any {
    const formValue = this.vendorInvoiceForm.getRawValue();

    const payload: any = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      PartyMasterSid: formValue.PartyMasterSid,
      PartyName: formValue.PartyName,
      PartyAddress: formValue.PartyAddress,
      CustomerBranchSid: formValue.CustomerBranchSid,
      GSTNo: formValue.GSTNo,
      PlaceOfSupply: formValue.PlaceOfSupply,
      CurrencyCode: formValue.CurrencyCode,
      CurrencyMasterSid: this.currencyList.find(c => c.currencyCode === formValue.CurrencyCode)?.CurrencyMasterSid,
      ExchangeRate: formValue.ExchangeRate,
      BillNo: formValue.BillNo,
      BillDate: this.parseNgbDateToISO(formValue.BillDate),
      BillAmt: formValue.BillAmt,
      MBLNo: formValue.MBLNo,
      HBLNo: formValue.HBLNo,
      InvoiceType: formValue.InvoiceType,
      GSTType: formValue.GSTType,
      Narration: formValue.Narration,
      MasterJobSid: formValue.MasterJobSid,
      HouseJobSid: formValue.HouseJobSid,
      VoucherDate: this.parseNgbDateToISO(formValue.VoucherDate),
      PostDate: formValue.PostedOn ? this.parseNgbDateToISO(formValue.PostedOn) : null,
      status: formValue.Status,
      CreatedBy: this.currUserEmail || 'System',
      UpdatedBy: this.currUserEmail || 'System'
    };

    // Add details
    payload.VoucherDetail = formValue.voucherDetails.map((detail: any, index: number) => ({
      Sno: index + 1,
      ChargeMasterSid: detail.ChargeMasterSid,
      ChargeDescription: detail.ChargeDescription,
      HSSACMasterSid: detail.HSSACMasterSid,
      ChargeUOMSid: detail.ChargeUOMSid,
      NumberOfUnit: detail.NumberOfUnit,
      Rate: detail.Rate,
      Amount: detail.Amount,
      TaxableAmount: detail.TaxableAmount,
      TaxPercentage1: detail.CGSTPercentage || detail.VATPercentage || 0,
      TaxAmount1: detail.CGST || detail.VAT || 0,
      TaxPercentage2: detail.SGSTPercentage || 0,
      TaxAmount2: detail.SGST || 0,
      LocalAmount: detail.LocalAmount,
      CurrencyCode: detail.CurrencyCode,
      CurrencyMasterSid: this.currencyList.find(c => c.currencyCode === detail.CurrencyCode)?.CurrencyMasterSid,
      ExchangeRate: detail.ExchangeRate,
      DrCr: detail.DrCr,
      LedgerMasterSid: detail.LedgerMasterSid,
      MasterJobSid: detail.MasterJobSid,
      HouseJobSid: detail.HouseJobSid,
      DepartmentMasterSid: detail.DepartmentMasterSid,
      Remarks: detail.Remarks
    }));

    // Add TDS if available
    if (this.tdsConfig) {
      payload.VoucherTDS = {
        TDSSetRateSid: this.tdsConfig.tdsSetRateSid,
        ITSectionCode: formValue.voucherTDS.ITSectionCode,
        TDSRate: formValue.voucherTDS.Percentage,
        TaxableAmount: formValue.voucherTDS.TaxableAmt,
        TDSAmount: formValue.voucherTDS.TDSAmt,
        Reason: formValue.voucherTDS.Reason
      };
    }
     payload.VoucherTDS = this.prepareVoucherTDSPayload(formValue.voucherDetails);

    // Add others (include Remarks from root form)
    payload.VoucherOthers = {
      ...formValue.voucherOthers,
      Remarks: formValue.Remarks || ''
    };

    return payload;
  }
  prepareVoucherTDSPayload(details: any[]): any[] {
  const taxRecords: any[] = [];
  
  details.forEach((detail: any) => {
    if (detail.TaxAmount1 > 0 || detail.TaxAmount2 > 0 || detail.TaxAmountIGST > 0) {
      if (detail.TaxAmountIGST > 0) {
        taxRecords.push({
          TaxType: 'IGST',
          TaxPercentage: detail.TaxPercentageIGST,
          TaxAmount: detail.TaxAmountIGST,
          HSSACMasterSid: detail.HSSACMasterSid
        });
      } else {
        if (detail.TaxAmount1 > 0) {
          taxRecords.push({
            TaxType: 'CGST',
            TaxPercentage: detail.TaxPercentage1,
            TaxAmount: detail.TaxAmount1,
            HSSACMasterSid: detail.HSSACMasterSid
          });
        }
        if (detail.TaxAmount2 > 0) {
          taxRecords.push({
            TaxType: 'SGST',
            TaxPercentage: detail.TaxPercentage2,
            TaxAmount: detail.TaxAmount2,
            HSSACMasterSid: detail.HSSACMasterSid
          });
        }
      }
    }
  });
  
  return taxRecords;
}

  onReset() {
    if (this.isEditMode) {
      this.loadVendorInvoiceById(this.headerId!);
    } else {
      this.vendorInvoiceForm.reset();
      this.details.clear();
      this.tdsGroup.reset();
      const currencySettings = this.companySettings.getCurrencySettings();
      this.vendorInvoiceForm.patchValue({
        CurrencyCode: currencySettings.code,
        ExchangeRate: 1,
        InvoiceType: 'B2B',
        Status: 'A'
      });
    }
  }

  onCancel() {
    this.router.navigate(['/operation/vendor-invoice/list']);
  }

  onPrint() {
    window.print();
  }

  getChargeName(chargeMasterSid: number): string {
    if (!chargeMasterSid) return '-';
    const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeMasterSid);
    return charge?.chargeCode ||  '-';
  }

  onSubmit() {
    if (this.vendorInvoiceForm.invalid) {
      this.markFormGroupTouched(this.vendorInvoiceForm);
      this.appSettingService.showError('Please fill all required fields');
      return;
    }

    if (this.details.length === 0) {
      this.appSettingService.showError('Please add at least one detail row');
      return;
    }

    const payload = this.preparePayload();
    this.isSaving = true;
    this.spinner.show();

    if (this.isEditMode && this.headerId) {
      // Update existing vendor invoice
      this.operationService.updateVendorInvoiceById(this.headerId, payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          this.isSaving = false;
          if (response.status) {
            this.appSettingService.showSuccess('Vendor Invoice updated successfully');
            this.router.navigate(['/operation/vendor-invoice/list']);
          } else {
            this.appSettingService.showError('Failed to update Vendor Invoice');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.isSaving = false;
          this.appSettingService.showError('Error updating Vendor Invoice');
          console.error('Error:', error);
        }
      });
    } else {
      // Create new vendor invoice
      this.operationService.createVendorInvoice(payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          this.isSaving = false;
          if (response.status) {
            this.appSettingService.showSuccess('Vendor Invoice created successfully');
            this.router.navigate(['/operation/vendor-invoice/list']);
          } else {
            this.appSettingService.showError('Failed to create Vendor Invoice');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.isSaving = false;
          this.appSettingService.showError('Error creating Vendor Invoice');
          console.error('Error:', error);
        }
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.vendorInvoiceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isDetailFieldInvalid(index: number, fieldName: string): boolean {
    const row = this.details.at(index) as FormGroup;
    const field = row.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  setToday(fieldName: string, datepicker: any): void {
    const today = new Date();
    const ngbDate = { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() };
    this.vendorInvoiceForm.get(fieldName)?.setValue(ngbDate);
    datepicker.close();
  }

  onCurrencyChange(event: any): void {
    console.log(event,'onCurrencyChange')
    const currencySid = event?.CurrencyMasterSid || event;
    if (!currencySid) return;

    const currency = this.currencyList.find(c => c.CurrencyMasterSid === currencySid);
    if (currency) {
      this.vendorInvoiceForm.patchValue({
        CurrencyCode: currency.currencyCode,
        ExchangeRate: currency.ExchangeRate || 1
      });
      this.recalculateAllRows();
    }
  }

  onExchangeRateChange(): void {
    this.recalculateAllRows();
  }

  // Utility methods
  round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  formatDateForNgb(date: string | Date | null): NgbDateStructLike | null {
    if (!date) return null;
    const d = new Date(date);
    return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  }

  parseNgbDateToISO(ngbDate: NgbDateStructLike | null): string | null {
    if (!ngbDate) return null;
    const d = new Date(ngbDate.year, ngbDate.month - 1, ngbDate.day);
    return d.toISOString();
  }

  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }
  removeDetailRow(index: number) {
  if (this.details.length > index) this.details.removeAt(index);
  this.recalculateAllRows();
}

}
