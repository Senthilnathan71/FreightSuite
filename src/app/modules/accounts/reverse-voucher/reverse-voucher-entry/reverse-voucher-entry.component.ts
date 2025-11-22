import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormsModule, AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbDatepickerModule, NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { AccountsService } from '../../accounts.service';
import { MasterService } from 'src/app/modules/master/master.service';

interface NgbDateStructLike { day: number; month: number; year: number; }

@Component({
  selector: 'app-reverse-voucher-entry',
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
        SearchableDropdown,
        NgbDropdownModule
  ],
  templateUrl: './reverse-voucher-entry.component.html',
  styleUrl: './reverse-voucher-entry.component.scss'
})
export class ReverseVoucherEntryComponent {
    reverseVoucherForm!: FormGroup;
    headerId: number | null = null;
    currentCompany: any;
    currentBranch: any;
    reverseVoucherData: any;
  
    currUserEmail: string | null = null;
    isViewMode: boolean = false;
    get isEditMode() { return !!this.headerId && !this.isViewMode; }
    voucherList: any[] = [];
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
    coaList: any[] = [];
    costCenterList: any[] = [];
    profitCenterList: any[] = [];
    houseJobListByMasterJob: { [key: number]: any[] } = {};
    selectedVendorForCosts: any = null; 
    allPendingCosts: any[] = []; 
    searchVendors: any[] = []; 
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
    private originalInvoiceRates: Map<number, number> = new Map();
    invoiceOutstandingAmount: number = 0;
    selectedOutstandingInvoice: any = null;
    showOutstandingInfo: boolean = false;
    invoiceLookupConfig = DROPDOWN_CONFIGS.INVOICE;
   
  
    reason =[
      {id: 'Service Cancelled', name: 'Service Cancelled'},  
      {id: 'Discount', name: 'Discount'},
      {id: 'Service Deficiency', name: 'Service Deficiency'},
      {id: 'Correction on Invoice', name: 'Correction on Invoice'},
      {id: 'Tax Changes', name: 'Tax Changes'},
      {id: 'Place of Supply Change', name: 'Place of Supply Change'},
      {id: 'Others', name: 'Others'},
    ]
  
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
      { id: 'Customer', name: 'Customer' },
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
    // tdsConfig: any = null;
    currentUserState: string;
    currentFinancialYear : number;
    currentCountry : number;
    currentCurrency: number;
    currentUserCurrency : string;
    currentUserCountry : string;
    // Country/Tax mode
    bookingModeCountry: string = 'india';
  
    get isIndiaGST(): boolean {
      return this.bookingModeCountry === 'india';
    }
    get isVATMode(): boolean {
      return !this.isIndiaGST;
    }
  
    get f(): { [key: string]: AbstractControl } {
      return this.reverseVoucherForm.controls;
    }
    get details(): FormArray {
      return this.reverseVoucherForm.get('voucherDetails') as FormArray;
    }
    // get tdsGroup(): FormGroup {
    //   return this.reverseVoucherForm.get('voucherTDS') as FormGroup;
    // }
  
    constructor(
      private router: Router,
      private route: ActivatedRoute,
      private fb: FormBuilder,
      private modalService: NgbModal,
      private operationService: OperationService,
      private accountService: AccountsService,
      private appSettingService: AppSettingsService,
      private masterService: MasterService,
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
      this.currentFinancialYear = Number(localStorage.getItem('current-year-id'));
      this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
      this.currentUserCountry = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
      this.currentCountry= Number(this.currentCompany?.CountryMasterSid)
      this.currentCurrency=Number(this.currentCompany?.CurrencyMasterSid)
      this.currentUserCurrency = String(this.currentCompany?.currencyMaster?.currencyName).trim().toLowerCase();
      this.currentUserState = String(this.currentBranch?.stateMaster?.stateName).trim().toLowerCase();
  
      console.log('=== INITIAL COMPANY DATA ===');
      console.log('Current Company:', this.currentCompany);
      console.log('Current Branch:', this.currentBranch);
      console.log('Company State:', this.currentUserState);
      console.log('Company Currency:', this.currentUserCurrency);
      console.log('Current Country:', this.currentCountry);
      console.log('Current Currency:', this.currentCurrency);
      console.log('Current Financial Year:', this.currentFinancialYear);
  
      // Set country mode from company settings
      if (this.currentCompany?.CountryName) {
        this.bookingModeCountry = this.currentCompany.CountryName.toLowerCase();
        console.log('DEBUG - Booking mode country:', this.bookingModeCountry);
      }
    } catch (e) {
      console.error('Error loading company data:', e);
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
          this.loadReverseVoucherById(this.headerId);
        } else {
          const currencySettings = this.companySettings.getCurrencySettings();
          console.log(currencySettings,'currencySettings')
          this.reverseVoucherForm.patchValue({
            CurrencyCode: currencySettings.code,
            ExchangeRate: 1
          });
        }
      });
  
      // Recalculate when currency/exchange rate changes
      this.reverseVoucherForm.get('CurrencyCode')?.valueChanges.subscribe(() => {
        this.recalculateAllRows();
      });
  
      this.reverseVoucherForm.get('ExchangeRate')?.valueChanges.subscribe(() => {
        this.recalculateAllRows();
      });
    }
  
    initForm() {
      this.reverseVoucherForm = this.fb.group({
        // Header
        VoucherNumber: [{ value: '', disabled: true }],
        ReversalVoucher:[null],
        VoucherDate: [this.formatDateForNgb(new Date()), Validators.required],
        PartyMasterSid: [{ value: null, disabled: true }], // Vendor
        PartyName:  [{ value: '', disabled: true }],
        PartyAddress: [{ value: '', disabled: true }],
        GSTNo: [{ value: '', disabled: true }],
        PlaceOfSupply: [{ value: '', disabled: true }],
        PostedOn: [{ value: null, disabled: true }],
        CustomerBranchSid: [{ value: null, disabled: true }],
        CurrencyCode: [{ value: '', disabled: true }],
        ExchangeRate: [{ value: 1, disabled: true }],
        BillNo: [{ value: '', disabled: true }],
        BillDate: [{ value: null, disabled: true }],
        BillAmt: [{ value: 0, disabled: true }],
        MBLNo: [{ value: '', disabled: true }],
        HBLNo: [{ value: '', disabled: true }],
        PostStatus:[{ value: 'U', disabled: true }],
        InvoiceType: [{ value: 'B2B', disabled: true }],
        GSTType: [{ value: '', disabled: true }],
        Narration: [{ value: '', disabled: true }],
        Remarks: [{ value: '', disabled: true }],
        MasterJobSid: [{ value: null, disabled: true }],
        HouseJobSid: [{ value: null, disabled: true }],
        CreditNoteReason: [''],
        Status: [{ value: 'A', disabled: true }],
  
        // Details Array
        voucherDetails: this.fb.array([]),
  
        // TDS Section
        // voucherTDS: this.fb.group({
        //   TDSSet: [{ value: '', disabled: true }],
        //   TDSCompany: [{ value: '', disabled: true }],
        //   ITSectionType: [{ value: '', disabled: true }],
        //   ITSectionCode: [{ value: 'null', disabled: true }],
        //   CertificateNo: [{ value: '', disabled: true }],
        //   Percentage: [{ value: 0, disabled: true }],
        //   TaxableAmt: [{ value: 0, disabled: true }],
        //   TDSSetRateSid: [{ value: 0, disabled: true }],
        //   TDSAmt: [{ value: 0, disabled: true }],
        //   Reason: [''],
        //   TDSSectionCode:[''],
        //   TDSNature:[''],
        //   TDSCompanyType:[''],
        //   TDSPercent:[''],
        //   TDSAccountCode:['']
        // }),
  
        // Others
        voucherOthers: this.fb.group({
          ContainerNumber: [''],
          VoucherNote: [''],
          Footer: ['']
        })
      });
    }
  
    getVoucherData(data?:any) {
      const id = data || this.reverseVoucherForm.get('ReversalVoucher')?.value;
      if (!id) {
        this.appSettingService.showWarning('Please select an voucher first.');
        return;
      }
  
      let reversalVoucherId = id;
      let vendorInvoiceNumber = '';
  
      if (typeof reversalVoucherId === 'object' && reversalVoucherId !== null) {
        vendorInvoiceNumber = reversalVoucherId.VoucherNumber || reversalVoucherId.voucherNumber || '';
        reversalVoucherId = reversalVoucherId.VoucherHeaderSid || reversalVoucherId.voucherHeaderSid;
        const autoNarration = this.autoGenerateNarration(reversalVoucherId);
    this.reverseVoucherForm.get('Narration')?.setValue(autoNarration);
      } else {
        const foundVendorInvoice = this.voucherList.find(inv => 
          inv.VoucherHeaderSid === reversalVoucherId || inv.voucherHeaderSid === reversalVoucherId
        );
        vendorInvoiceNumber = foundVendorInvoice?.VoucherNumber || foundVendorInvoice?.voucherNumber || '';
        const autoNarration = this.autoGenerateNarration(reversalVoucherId);
    this.reverseVoucherForm.get('Narration')?.setValue(autoNarration);
      }
      this.spinner.show();
      this.operationService.getVoucherById(id).subscribe({
        next: (resp: any) => {
          if (resp?.status && resp.data) {
            this.reverseVoucherForm.patchValue({
              ReversalVoucher: reversalVoucherId
            });
            this.patchVoucherData(resp.data);
            this.appSettingService.showSuccess('Reverse Voucher data loaded successfully.');
          } else {
            this.spinner.hide();
            this.appSettingService.showError('Error loading reverse voucher data.');
          }
        },
        error: (err) => {
          this.spinner.hide();
          console.error('Error fetching reverse voucher:', err);
          this.appSettingService.showError('Failed to load reverse voucher data.');
        }
      });
    }

  
    private patchVoucherData(data: any) {
      const header = data;
      const voucher = header.VoucherHeaderSid || header.voucherHeaderSid || null;
      const currentNarration = this.reverseVoucherForm.get('Narration')?.value;
  const autoNarration = this.autoGenerateNarration(this.reverseVoucherForm.get('ReversalVoucher')?.value);
      this.originalInvoiceRates = new Map();
      this.reverseVoucherForm.patchValue({
        ReversalVoucher: voucher,
        Narration: autoNarration || header.Narration || currentNarration || '',
        PartyMasterSid: header.PartyMasterSid || null,
        PartyName: header.PartyName || '',
        PartyAddress: header.PartyAddress || '',
        CustomerBranchSid: header.CustomerBranchSid || null,
        GSTNo: header.GST_VAT || '',
        GSTType: header.GSTType || '',
        PlaceOfSupply: header.PlaceOfSupply || '',
        InvoiceType: header.InvoiceType || '',
        CurrencyCode: header.currencyMaster?.currencyCode || header.CurrencyCode || null,
        ExchangeRate: header.ExchangeRate || header.ExRate || 1,
        BillAmount: header.Amount || 0,
        BillDate: this.toNgbDate(header.DocumentDate),
        BillNo: header.DocumentNumber || '',
        MBLNo: header.MBLNo || '',
        HBLNo: header.HBLNo || '',
        Remarks: header.Remarks || '',
      });
      const customerMasterSid = header.CustomerMasterSid;
      if (customerMasterSid) {
        this.reverseVoucherForm.get('CustomerMasterSid')?.setValue(customerMasterSid);
        const customer = this.vendorList.find(c => c.CustomerMasterSid === customerMasterSid);
        if (customer) {
          this.reverseVoucherForm.get('PartName')?.setValue(customer.CustomerName || '');
          if (customer.SubledgerMasterSid) {
            this.reverseVoucherForm.get('PartyMasterSid')?.setValue(Number(customer.SubledgerMasterSid));
          }
        }
        this.getVendorBranchByVendor(Number(customerMasterSid));
        const branchSid = header.CustomerBranchSid;
        if (branchSid) {
          setTimeout(() => {
            this.reverseVoucherForm.get('CustomerBranchSid')?.setValue(Number(branchSid));
            const foundBranch = this.vendorBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));
            if (foundBranch) {
              this.reverseVoucherForm.get('PartyAddress')?.setValue(foundBranch.Address || foundBranch.CustomerAddress1 || '');
            }
          }, 500);
        }
      }
  
      let detailsFromVendorInvoice: any[] = [];
  
      if (header.VoucherTransaction && Array.isArray(header.VoucherTransaction)) {
        detailsFromVendorInvoice = header.VoucherTransaction
        .filter((transaction: any) => transaction.voucherDetail) // Only transactions with voucherDetail
        .map((transaction: any) => {
          const detail = transaction.voucherDetail;
          const transactionData = transaction; // Main transaction data
          if (detail.ChargeMasterSid && detail.Rate != null) {
            const chargeId = Number(detail.ChargeMasterSid);
            const originalRate = Number(detail.Rate);
            
            this.originalInvoiceRates.set(chargeId, originalRate);
            
            console.log(`DEBUG - Stored original rate for charge ${chargeId}: ${originalRate}`);
          }
          return {
            ...detail,
            // Include transaction-level data that might be needed
            Amount: transaction.Amount || detail.Amount,
            LocalAmount: transaction.LocalAmount || detail.LocalAmount,
            // Map other fields as needed
          };
        });
      }
      if (detailsFromVendorInvoice.length === 0) {
      detailsFromVendorInvoice = data.voucherDetails 
        || data.voucherDetail 
        || data.VoucherDetail 
        || data.VoucherDetails 
        || [];
    }
    console.log('DEBUG - Extracted voucher details:', detailsFromVendorInvoice);
    this.details.clear();
    detailsFromVendorInvoice.forEach((detail: any) => {
      const amount = detail.Amount ? (Number(detail.Amount)) : 0;
      const taxableAmount = detail.TaxableAmount ? (Number(detail.TaxableAmount)) : 0;
      const taxAmount1 = detail.TaxAmount1 ? (Number(detail.TaxAmount1)) : 0;
      const taxAmount2 = detail.TaxAmount2 ? (Number(detail.TaxAmount2)) : 0;
      const taxAmountIGST = detail.TaxAmountIGST ?(Number(detail.TaxAmountIGST)) : 0;
      const localAmount = detail.LocalAmount ? (Number(detail.LocalAmount)) : 0;
      const partyAmount = detail.PartyAmount ? (Number(detail.PartyAmount)) : 0;
  
      const taxPercentage1 = detail.TaxPercentage1 !== undefined ? Number(detail.TaxPercentage1) : 
                          detail.taxPercentage1 !== undefined ? Number(detail.taxPercentage1) : 0;
    
      const taxPercentage2 = detail.TaxPercentage2 !== undefined ? Number(detail.TaxPercentage2) : 
                          detail.taxPercentage2 !== undefined ? Number(detail.taxPercentage2) : 0;
    
      const taxPercentageIGST = detail.TaxPercentageIGST !== undefined ? Number(detail.TaxPercentageIGST) : 
                             detail.taxPercentageIGST !== undefined ? Number(detail.taxPercentageIGST) : 0;
  
      console.log('DEBUG - Tax percentages for detail:', {
        taxPercentage1,
        taxPercentage2,
        taxPercentageIGST,
        chargeDescription: detail.ChargeDescription
      });
  
      // For credit note, typically use 'Cr' for credit entries
      const originalDrCr = detail.DrCr || detail.drCr || 'D';
      const swappedDrCr = originalDrCr === 'C' ? 'D' : 'C';
  
      console.log('DEBUG - Dr/Cr swap:', {
        original: originalDrCr,
        swapped: swappedDrCr,
        chargeDescription: detail.ChargeDescription
      });
  
      this.details.push(this.createDetailGroup({
        VoucherDetailSid: detail.VoucherDetailSid,
        ChargeMasterSid: detail.ChargeMasterSid,
        ChargeDescription: detail.ChargeDescription,
        HSSACMasterSid: detail.HSSACMasterSid,
        ChargeUOMSid: detail.ChargeUOMSid,
        DepartmentMasterSid: detail.DepartmentMasterSid,
        NumberOfUnit: detail.NumberOfUnit,
        DrCr: swappedDrCr,
        CurrencyCode: detail.CurrencyCode,
        Rate: detail.Rate != null ? Number(detail.Rate) : 0,
        ExchangeRate: detail.ExchangeRate,
        Amount: amount,
        TaxableAmount: taxableAmount,
        TaxPercentage1: taxPercentage1,
        TaxAmount1: taxAmount1,
        TaxPercentage2: taxPercentage2,
        TaxAmount2: taxAmount2,
        TaxPercentageIGST: taxPercentageIGST,
        TaxAmountIGST: taxAmountIGST,
        LocalAmount: localAmount,
        PartyAmount: partyAmount,
        MasterJobSid: detail.MasterJobSid,
        HouseJobSid: detail.HouseJobSid,
        ProfitCenterMasterSid: detail.ProfitCenterMasterSid,
        CostCenterMasterSid: detail.CostCenterMasterSid,
        COAMasterSid: detail.COAMasterSid,
        LedgerMasterSid: detail.LedgerMasterSid,
      }));
    });
  
    const voucherOthersSource = data.VoucherOthers 
        || data.voucherOthers 
        || (Array.isArray(data.voucherOthers) ? data.voucherOthers[0] : undefined);
    
      if (voucherOthersSource) {
        const vg = this.reverseVoucherForm.get('voucherOthers') as FormGroup;
        vg.patchValue({
          ContainerNumber: voucherOthersSource.ContainerNumber || '',
          VoucherNote: voucherOthersSource.VoucherNote || '',
          Footer: voucherOthersSource.Footer || '',
          ReverseCreditNote: voucherOthersSource.ReverseCreditNote || '',
          DueDate: this.toNgbDate(voucherOthersSource.DueDate),
          IRNNumber: voucherOthersSource.IRNNumber || ''
        });
      }
    
      console.log('DEBUG - Final details array length:', this.details.length);
  
    }
  
    private toNgbDate(d: any): NgbDateStructLike | null {
      if (!d) return null;
      const dt = (typeof d === 'string' || typeof d === 'number') ? new Date(d) : d instanceof Date ? d : new Date(d);
      if (isNaN(dt.getTime())) return null;
      return { year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() };
    }
  
    onFinalSave() {
    if (this.reverseVoucherForm.invalid) {
      this.reverseVoucherForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill required reverse voucher fields.');
      return;
    }
  
    if (this.details.length === 0) {
      this.appSettingService.showWarning('Please add at least one charge line.');
      return;
    }
  
    this.recalculateAllRows();
    this.saveReverseVoucher(true); // true indicates final save
  }
  
  private saveReverseVoucher(isFinal: boolean) {
    const payload = this.preparePayload();
  
    this.spinner.show();
    
    const saveObservable = this.headerId 
      ? this.operationService.updateReverseVoucherById(this.headerId, payload)
      : this.operationService.createReverseVoucher(payload);
  
    saveObservable.subscribe({
      next: async (resp: any) => {
        if (resp?.status) {
          const voucherHeaderSid = resp.data?.newVoucher?.VoucherHeaderSid || resp.data?.VoucherHeaderSid || this.headerId;
          
          if (isFinal && voucherHeaderSid) {
            // If final save, post the voucher
            await this.postVoucher(voucherHeaderSid);
          } else {
            this.spinner.hide();
            const message = isFinal ? 'Reverse Voucher saved and posted successfully!' : 'Reverse Voucher saved as draft successfully!';
            this.appSettingService.showSuccess(message);
            
            if (!this.headerId && voucherHeaderSid) {
              this.headerId = voucherHeaderSid;
              this.router.navigate(['operation/reverse-voucher/entry', voucherHeaderSid]);
            }
          }
        } else {
          this.spinner.hide();
          this.appSettingService.showError('Error saving Reverse Voucher.');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Save Reverse Voucher error', err);
        this.appSettingService.showError('Failed to save Reverse Voucher.');
      }
    });
  }
  
  private async postVoucher(voucherHeaderSid: number) {
    try {
      const currentCompany = this.currentCompany;
      const currentBranch = this.currentBranch;
      const currentFinancialYear = Number(localStorage.getItem('current-year-id'));
      const currentCountry =Number(this.currentCompany?.CountryMasterSid);
      const currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
      const currentCountryName = String(this. currentCompany?.countryMaster?.countryName).trim().toLowerCase();
      const currentUserEmail =  this.userData?.userEmail;
      
   
      
      if (!currentCompany || !currentBranch || !currentFinancialYear || !currentCountry || !currentCurrency) {
        throw new Error('Company, branch, or financial year or country information is missing');
       
      }
  
      const postPayload = {
        VoucherHeaderSid: voucherHeaderSid,
        CompanyMasterSid: currentCompany.CompanyMasterSid,
        BranchMasterSid: currentBranch.BranchMasterSid,
        YearMasterSid: currentFinancialYear,
        LocalCurrencyMasterSid: currentCurrency  ,
        LocalCurrencyCode: currentCompany.CurrencyCode , 
        PostedBy: currentUserEmail ,
        TaxDetails: {
          CountryMasterSid: currentCountry,
          countryName: currentCountryName,
          TaxCategory: 'Inter', 
          EffectiveFrom: new Date().toISOString(),
          TaxType: 'Output' 
        }
      };
  
      const result = await firstValueFrom(this.operationService.postVoucherSid(postPayload));
      
      this.spinner.hide();
      if (result.status) {
        this.appSettingService.showSuccess('Reverse Voucher posted successfully!');
        this.reverseVoucherData.PostStatus = 'P'; // Update local state
        
        // Navigate to list or stay on page but disable edits
        this.router.navigate(['accounts/reverse-voucher/list']);
      } else {
        this.appSettingService.showError(result.message || 'Failed to post Reverse Voucher.');
      }
    } catch (error) {
      this.spinner.hide();
      console.error('Post voucher error:', error);
      this.appSettingService.showError('Failed to post Reverse Voucher. Please try again.');
    }
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
  
    createDetailGroup(data?: any): FormGroup {
    return this.fb.group({
      VoucherDetailSid:[data?.VoucherDetailSid || null],
      CostRevenueChargesSid: [data?.CostRevenueChargesSid || null], // Store original cost ID
      ChargeMasterSid: [{value: data?.ChargeMasterSid || null, disabled: true}],
      ChargeDescription: [{value:data?.ChargeDescription || '', disabled: true}],
      HSSACMasterSid: [{value:data?.HSSACMasterSid || null, disabled: true}],
      ChargeUOMSid: [{value:data?.ChargeUOMSid || null, disabled: true}],
      NumberOfUnit: [{value:data?.NumberOfUnit || 1, disabled: true}],
      DrCr: [{value: data?.DrCr || 'D', disabled: true}],
      CurrencyCode: [{value: data?.CurrencyCode || this.reverseVoucherForm.get('CurrencyCode')?.value || null, disabled: true}],
      Rate: [data?.Rate != null ? Number(data.Rate) : 0],
      ExchangeRate: [{value:data?.ExchangeRate || this.reverseVoucherForm.get('ExchangeRate')?.value || 1, disabled: true}],
      Amount: [{value:data?.Amount || 0 , disabled: true}],
      TaxableAmount: [{value: data?.TaxableAmount || 0, disabled: true}],
      TaxPercentage1: [{value:data?.TaxPercentage1 || 0, disabled: true}],
      TaxAmount1: [{value:data?.TaxAmount1 || 0, disabled: true}],
      TaxPercentage2: [{value:data?.TaxPercentage2 || 0, disabled: true}],
      TaxAmount2: [{value:data?.TaxAmount2 || 0, disabled: true}],
      TaxPercentageIGST: [{value: data?.TaxPercentageIGST || 0, disabled: true}],
      TaxAmountIGST: [{value:data?.TaxAmountIGST || 0, disabled: true}],
      LocalAmount: [{value:data?.LocalAmount || 0, disabled: true}],
      PartyAmount: [{value:data?.PartyAmount || 0, disabled: true}],
      MasterJobSid: [{value:data?.MasterJobSid || null, disabled: true}],
      HouseJobSid: [{value: data?.HouseJobSid || null, disabled: true}],
      DepartmentMasterSid: [{value:data?.DepartmentMasterSid || null, disabled: true}],
      LedgerMasterSid: [{value: data?.LedgerMasterSid || null, disabled: true}],
      COAMasterSid: [{value:data?.COAMasterSid || null, disabled: true}],
      ProfitCenterMasterSid: [{value:data?.ProfitCenterMasterSid || null, disabled: true}],
      CostCenterMasterSid: [{value:data?.CostCenterMasterSid || null, disabled: true}],
    });
  }
  
  private rateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value && control.value !== 0) {
      return null; // Let required validator handle empty values
    }
  
    const rate = Number(control.value);
    const rowIndex = this.getRowIndexFromControl(control);
    
    if (rowIndex === -1) return null;
  
    const row = this.details.at(rowIndex);
    if (!row) return null;
  
    const chargeMasterSid = row.get('ChargeMasterSid')?.value;
    
    if (!chargeMasterSid || !this.originalInvoiceRates) {
      return null; // No original rate to compare against
    }
  
    const originalRate = this.originalInvoiceRates.get(Number(chargeMasterSid));
    
    // Allow rates less than or equal to original rate, but not greater
    if (originalRate !== undefined && rate > originalRate) {
      return { 
        rateExceeded: {
          actualRate: rate,
          maxAllowedRate: originalRate
        }
      };
    }
  
    return null;
  }
  private getRowIndexFromControl(control: AbstractControl): number {
    if (!this.details) return -1;
    
    for (let i = 0; i < this.details.length; i++) {
      const row = this.details.at(i);
      if (row.get('Rate') === control) {
        return i;
      }
    }
    return -1;
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
  // onDetailChange(index: number, field?: string) {
  //   if (['NumberOfUnit', 'Rate', 'ExchangeRate', 'TaxPercentage1', 'TaxPercentage2', 'TaxPercentageIGST', 'CurrencyCode'].includes(field || '')) {
  //     this.recalcRow(index);
  //   } else if (field === 'ChargeMasterSid') {
  //     const chargeSid = this.details.at(index).get('ChargeMasterSid')?.value;
  //     const selectedCharge = this.chargeList?.find((c: any) => c.ChargeMasterSid === chargeSid);
      
  //     if (selectedCharge) {
  //       const description = selectedCharge.ChargeDescription || selectedCharge.chargeName || selectedCharge.ChargeName || '';
  //       let hssacId = selectedCharge.HSSACMasterSid ?? selectedCharge.HSSACMasterSid ?? null;
        
  //       // Auto-set HSN/SAC code from ChargeTaxMaster
  //       if (!hssacId && Array.isArray(selectedCharge.ChargeTaxMaster) && selectedCharge.ChargeTaxMaster.length > 0) {
  //         const firstTax = selectedCharge.ChargeTaxMaster[0];
  //         const hsnCode = firstTax?.HSNCode;
          
  //         // Find matching HSSAC from hssacList using HSNCode
  //         if (hsnCode) {
  //           const matchingHssac = this.hssacList.find(h => 
  //             h.HSSACCode === hsnCode || h.HSNCode === hsnCode
  //           );
  //           if (matchingHssac) {
  //             hssacId = matchingHssac.HSSACMasterSid;
  //           }
  //         }
  //       }
        
  //       const chargeUomId = selectedCharge.ChargeUOMSid ?? selectedCharge.UOM ?? selectedCharge.UOMMasterSid ?? null;
  
  //       // Auto-set LedgerMasterSid and COAMasterSid
  //       const ledgerMasterSid = selectedCharge.SubledgerMasterSid || null;
  //       const coaMasterSid = selectedCharge.DrCOAMappedId || null;
  
  //       this.details.at(index).patchValue({
  //         ChargeDescription: description,
  //         HSSACMasterSid: hssacId || null,
  //         ChargeUOMSid: chargeUomId || null,
  //         Rate: selectedCharge.DefaultRate || selectedCharge.Rate || this.details.at(index).get('Rate')?.value || 0,
  //         LedgerMasterSid: ledgerMasterSid,
  //         COAMasterSid: coaMasterSid
  //       });
  
  //       this.recalcRow(index);
  //     }
  //   }
  // }
  
  recalcRow(index: number) {
    const row = this.details.at(index);
    if (!row) return;
    
    const unit = Number(row.get('NumberOfUnit')?.value || 0);
    const rate = Number(row.get('Rate')?.value || 0);
    const exRate = Number(row.get('ExchangeRate')?.value || this.reverseVoucherForm.get('ExchangeRate')?.value || 1);
  
    // Calculate basic amounts
    const amount = unit * rate;
    const taxableAmount = amount * exRate;
    const localAmount = amount * exRate;
  
    // Get GST Type and determine tax applicability
    const gstType = this.reverseVoucherForm.get('GSTType')?.value;
    const placeOfSupply = this.reverseVoucherForm.get('PlaceOfSupply')?.value;
    const companyState = this.getCompanyState();
    
    let taxPerc1 = 0, taxAmt1 = 0, taxPerc2 = 0, taxAmt2 = 0, igstPerc = 0, igstAmt = 0;
  
    console.log('=== TAX CALCULATION DEBUG ===');
    console.log('GST Type:', gstType);
    console.log('Place of Supply:', placeOfSupply);
    console.log('Company State:', companyState);
  
    if (this.isIndiaGST && this.reverseVoucherForm.get('GSTNo')?.value) {
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
    } else if (this.isVATMode && this.reverseVoucherForm.get('GSTNo')?.value) {
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
    // this.calculateTDS();
  }
  
  
  updateBillAmount() {
    const totalLocalAmount = this.calculateTotalLocalAmount();
    this.reverseVoucherForm.get('BillAmt')?.setValue(this.round(totalLocalAmount));
  }
  recalculateAllRows() {
    for (let i = 0; i < this.details.length; i++) {
      const exRateCtrl = this.details.at(i).get('ExchangeRate');
      if (exRateCtrl && (exRateCtrl.value === null || exRateCtrl.value === undefined)) {
        exRateCtrl.setValue(this.reverseVoucherForm.get('ExchangeRate')?.value || 1);
      }
      const currCtrl = this.details.at(i).get('CurrencyCode');
      if (currCtrl && !currCtrl.value) {
        currCtrl.setValue(this.reverseVoucherForm.get('CurrencyCode')?.value || null);
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
      // this.calculateTDS();
    }
  
   
  
    deleteDetailRow(index: number) {
      this.details.removeAt(index);
      this.renumberRows();
      // this.calculateTDS();
    }
  
    renumberRows() {
      this.details.controls.forEach((row, i) => {
        row.patchValue({ Sno: i + 1 }, { emitEvent: false });
      });
    }
  
  //   calculateTDS() {
  //   const totalTaxable = this.details.controls.reduce((sum, row: any) => {
  //     return sum + (Number(row.get('TaxableAmount')?.value) || 0);
  //   }, 0);
  
  //   const tdsRate = this.tdsConfig?.tdsRate || 0;
  //   const tdsAmount = (totalTaxable * tdsRate) / 100;
  
  //   this.tdsGroup.patchValue({
  //     TaxableAmt: this.round(totalTaxable),
  //     TDSAmt: this.round(tdsAmount)
  //   });
  // }
  
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
      this.reverseVoucherForm.get('CustomerBranchSid')?.setValue(null);
      this.reverseVoucherForm.get('PartyAddress')?.setValue('');
      this.reverseVoucherForm.get('PartyMasterSid')?.setValue(null); // Clear PartyMasterSid
      this.reverseVoucherForm.get('GSTNo')?.setValue('');
      this.reverseVoucherForm.get('PartyName')?.setValue('');
      this.reverseVoucherForm.get('PlaceOfSupply')?.setValue('');
      this.reverseVoucherForm.get('InvoiceType')?.setValue('B2B');
      this.reverseVoucherForm.get('GSTType')?.setValue('');
      return;
    }
  
    const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
    if (vendor) {
      // Set PartyName to vendor name
      this.reverseVoucherForm.get('PartyName')?.setValue(vendor.CustomerName || '');
      
      // CRITICAL: Set PartyMasterSid from vendor's SubledgerMasterSid
      if (vendor.SubledgerMasterSid) {
        this.reverseVoucherForm.get('PartyMasterSid')?.setValue(Number(vendor.SubledgerMasterSid));
        console.log('DEBUG - Set PartyMasterSid from vendor:', vendor.SubledgerMasterSid);
      } else {
        console.warn('DEBUG - Vendor has no SubledgerMasterSid:', vendor);
        this.reverseVoucherForm.get('PartyMasterSid')?.setValue(null);
      }
  
      // Rest of your existing code for GST, InvoiceType, etc...
      const countryCode = this.getCustomerCountryCode(vendor);
      console.log('Vendor Country Code:', countryCode);
      
      if (countryCode === 'IN' && vendor.GSTNo) {
        this.reverseVoucherForm.get('InvoiceType')?.setValue('B2B');
        console.log('Invoice Type: B2B (Indian vendor with GST)');
      } else if (countryCode !== 'IN') {
        this.reverseVoucherForm.get('InvoiceType')?.setValue('EXWP');
        console.log('Invoice Type: EXWP (Export vendor)');
      } else {
        this.reverseVoucherForm.get('InvoiceType')?.setValue('B2C');
        console.log('Invoice Type: B2C (Indian vendor without GST)');
      }
  
      // Load TDS configuration
      // this.loadVendorTDS(vendorMasterSid);
    }
  
    // Reset branch selection when vendor changes
    this.reverseVoucherForm.get('CustomerBranchSid')?.setValue(null);
    this.reverseVoucherForm.get('PartyAddress')?.setValue('');
    this.reverseVoucherForm.get('PlaceOfSupply')?.setValue('');
    this.reverseVoucherForm.get('GSTType')?.setValue('');
    this.getVendorBranchByVendor(Number(vendorMasterSid));
  }
  
  // Enhanced vendor branch selection
  onVendorBranchChange(selectedBranch: any) {
    const branchSid = (typeof selectedBranch === 'object' && selectedBranch !== null)
      ? (selectedBranch.CustomerBranchSid ?? selectedBranch)
      : selectedBranch;
  
    if (!branchSid) {
      this.reverseVoucherForm.get('PartyAddress')?.setValue('');
      this.reverseVoucherForm.get('GSTNo')?.setValue('');
      this.reverseVoucherForm.get('PlaceOfSupply')?.setValue('');
      return;
    }
  
    const foundBranch = this.vendorBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));
    
    if (foundBranch) {
      // Set address from branch
      const address = foundBranch.Address || foundBranch.CustomerAddress1 || foundBranch.customerAddress || '';
      this.reverseVoucherForm.get('PartyAddress')?.setValue(address);
  
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
      this.reverseVoucherForm.get('PlaceOfSupply')?.setValue(placeOfSupply);
  
      // Set GST No based on country
      const vendorMasterSid = foundBranch.CustomerMasterSid;
      if (vendorMasterSid) {
        const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
        if (vendor) {
          const countryCode = this.getCustomerCountryCode(vendor);
          if (countryCode === 'IN') {
            this.reverseVoucherForm.get('GSTNo')?.setValue(foundBranch.GSTNo || '');
          } else {
            this.reverseVoucherForm.get('GSTNo')?.setValue(vendor.PanType || '');
          }
        }
      }
  
      // Auto-determine GST Type based on Place of Supply
      this.determineGSTType(placeOfSupply);
    } else {
      this.reverseVoucherForm.get('PartyAddress')?.setValue('');
      this.reverseVoucherForm.get('GSTNo')?.setValue('');
      this.reverseVoucherForm.get('PlaceOfSupply')?.setValue('');
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
      this.reverseVoucherForm.get('GSTType')?.setValue('');
      return;
    }
  
    const companyState = this.getCompanyState();
    const vendorGSTNo = this.reverseVoucherForm.get('GSTNo')?.value;
    const invoiceType = this.reverseVoucherForm.get('InvoiceType')?.value;
    
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
      this.reverseVoucherForm.get('GSTType')?.setValue('EXWP');
      console.log('GST Type set to: EXPORT (Export scenario)');
      return;
    }
  
    // Scenario 1 & 2: India GST scenarios
    if (this.isIndiaGST && vendorGSTNo) {
      if (placeOfSupply === companyState) {
        // Scenario 1: Same State - CGST + SGST
        this.reverseVoucherForm.get('GSTType')?.setValue('CGST+SGST');
        console.log('GST Type set to: CGST+SGST (Intra-state)');
      } else {
        // Scenario 2: Different State - IGST
        this.reverseVoucherForm.get('GSTType')?.setValue('IGST');
        console.log('GST Type set to: IGST (Inter-state)');
      }
    } else if (this.isIndiaGST && !vendorGSTNo) {
      // B2C or unregistered dealer in India
      this.reverseVoucherForm.get('GSTType')?.setValue('B2C');
      console.log('GST Type set to: B2C (Unregistered dealer)');
    } else {
      // Non-India scenarios
      this.reverseVoucherForm.get('GSTType')?.setValue('VAT');
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
    // if (this.currentCompany.stateMaster) {
    //   const state = this.currentCompany.stateMaster.stateName || this.currentCompany.stateMaster.StateName;
    //   if (state) {
    //     console.log('Company State from currentCompany.stateMaster:', state);
    //     return state;
    //   }
    // }
  
    // Method 2: Check if currentCompany has StateMasterSid and look up in stateList
    // if (this.currentCompany.StateMasterSid && this.stateList.length > 0) {
    //   const state = this.stateList.find(s => 
    //     s.StateMasterSid === this.currentCompany.StateMasterSid || 
    //     s.stateMasterSid === this.currentCompany.StateMasterSid
    //   );
    //   if (state) {
    //     const stateName = state.stateName || state.StateName;
    //     console.log('Company State from currentCompany.StateMasterSid lookup:', stateName);
    //     return stateName;
    //   }
    // }
  
    // Method 3: Check currentBranch state information
    // if (this.currentBranch && this.currentBranch.stateMaster) {
    //   const state = this.currentBranch.stateMaster.stateName || this.currentBranch.stateMaster.StateName;
    //   if (state) {
    //     console.log('Company State from currentBranch.stateMaster:', state);
    //     return state;
    //   }
    // }
  
    // // Method 4: Check currentBranch StateMasterSid
    // if (this.currentBranch && this.currentBranch.StateMasterSid && this.stateList.length > 0) {
    //   const state = this.stateList.find(s => 
    //     s.StateMasterSid === this.currentBranch.StateMasterSid || 
    //     s.stateMasterSid === this.currentBranch.StateMasterSid
    //   );
    //   if (state) {
    //     const stateName = state.stateName || state.StateName;
    //     console.log('Company State from currentBranch.StateMasterSid lookup:', stateName);
    //     return stateName;
    //   }
    // }
  
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
  // Enhanced getVendorBranchByVendor method with callback
  getVendorBranchByVendor(CustomerMasterSid: number, callback?: (branches: any[]) => void) {
    if (!CustomerMasterSid) {
      this.vendorBranchList = [];
      if (callback) callback([]);
      return;
    }
    
    this.operationService.getCustomerBranchByCustomer(CustomerMasterSid).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          this.vendorBranchList = Array.isArray(resp.data) ? resp.data : resp.data;
          
          if (callback) {
            callback(this.vendorBranchList);
          }
          
          // Auto-select the branch if there's a pending selection
          if (this.pendingBranchToSelect) {
            const branchId = this.pendingBranchToSelect;
            this.pendingBranchToSelect = null;
            this.triggerVendorBranchChange(branchId);
          }
        } else if (Array.isArray(resp)) {
          this.vendorBranchList = resp;
          if (callback) callback(this.vendorBranchList);
        } else if (resp?.data) {
          this.vendorBranchList = resp.data;
          if (callback) callback(this.vendorBranchList);
        } else {
          this.vendorBranchList = [];
          if (callback) callback([]);
        }
      },
      error: (err) => {
        console.error('Error fetching vendor branches', err);
        this.vendorBranchList = [];
        if (callback) callback([]);
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
        this.reverseVoucherForm.get('PartyAddress')?.setValue('');
        return;
      }
      this.reverseVoucherForm.get('PartyAddress')?.setValue(vendor.Address || '');
    }
  
    // loadVendorTDS(vendorSid: number) {
    //   this.operationService.getVendorTDSMapping(vendorSid).subscribe({
    //     next: (response) => {
    //       if (response.status && response.data) {
    //         this.tdsConfig = response.data;
  
    //         this.tdsGroup.patchValue({
    //           TDSSet: this.tdsConfig.tdsSetName || '',
    //           TDSCompany: this.currentCompany?.CompanyName || '',
    //           ITSectionType: this.tdsConfig.companyType || '',
    //           ITSectionCode: this.tdsConfig.itSectionCode || '',
    //           TDSSetRateSid: this.tdsConfig.tdsSetRateSid || 0,
    //           CertificateNo: this.tdsConfig.certificateNo || '',
    //           Percentage: this.tdsConfig.tdsRate || 0
    //         });
  
    //         // Recalculate TDS
    //         this.calculateTDS();
    //       } else {
    //         // No TDS config found
    //         this.tdsConfig = null;
    //         this.tdsGroup.patchValue({
    //           TDSSet: '',
    //           TDSCompany: '',
    //           ITSectionType: '',
    //           ITSectionCode: '',
    //           TDSSetRateSid: 0,
    //           CertificateNo: '',
    //           Percentage: 0,
    //           TDSAmt: 0
    //         });
    //       }
    //     },
    //     error: (error) => {
    //       console.error('Error loading TDS config:', error);
    //       this.tdsConfig = null;
    //     }
    //   });
    // }
  // Extract unique vendors from costs
  
  
  private autoPopulateVendorFromSelection(vendor: any) {
    if (!vendor) return;
  
    // Set vendor information in main form
    this.reverseVoucherForm.patchValue({
      PartyName: vendor.VendorName || vendor.CustomerName,
      PartyMasterSid: vendor.VendorSid
    });
  
    // Load vendor branches
    this.getVendorBranchByVendor(vendor.VendorSid, (branches) => {
      if (branches.length > 0) {
        const matchingBranch = branches.find(branch => 
          branch.Address?.includes(vendor.VendorAddress) || 
          branch.CustomerAddress1?.includes(vendor.VendorAddress)
        );
        
        const branchToSelect = matchingBranch || branches[0];
        
        if (branchToSelect) {
          this.reverseVoucherForm.get('CustomerBranchSid')?.setValue(branchToSelect.CustomerBranchSid);
          this.triggerVendorBranchChange(branchToSelect.CustomerBranchSid);
        }
      }
    });
  
    // Set vendor address
    this.reverseVoucherForm.patchValue({
      PartyAddress: vendor.VendorAddress || vendor.Address || ''
    });
  }
  
    toggleCostSelection(costSid: number) {
      if (this.selectedCosts.has(costSid)) {
        this.selectedCosts.delete(costSid);
      } else {
        this.selectedCosts.add(costSid);
      }
    }
    private triggerVendorBranchChange(customerBranchSid: number) {
    const foundBranch = this.vendorBranchList.find(b => 
      Number(b.CustomerBranchSid) === Number(customerBranchSid)
    );
    
    if (foundBranch) {
      // Set address from branch
      const address = foundBranch.Address || foundBranch.CustomerAddress1 || foundBranch.customerAddress || '';
      this.reverseVoucherForm.get('PartyAddress')?.setValue(address);
  
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
      this.reverseVoucherForm.get('PlaceOfSupply')?.setValue(placeOfSupply);
  
      // Set GST No based on country
      const vendorMasterSid = foundBranch.CustomerMasterSid;
      if (vendorMasterSid) {
        const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
        if (vendor) {
          const countryCode = this.getCustomerCountryCode(vendor);
          if (countryCode === 'IN') {
            this.reverseVoucherForm.get('GSTNo')?.setValue(foundBranch.GSTNo || '');
          } else {
            this.reverseVoucherForm.get('GSTNo')?.setValue(vendor.PanType || '');
          }
        }
      }
  
      // Auto-determine GST Type based on Place of Supply
      this.determineGSTType(placeOfSupply);
    }
  }
  
  
  
  // Get selected costs
  getSelectedCosts(): any[] {
    return this.allPendingCosts.filter(cost => cost.selected);
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
        firstValueFrom(this.operationService.getAllVoucher()),
        firstValueFrom(this.accountService.getAllCostCenters()),
        firstValueFrom(this.accountService.getAllProfitCenters()),
      ]).then(([vendors,currencies, charges, hssac, uom, states, voucher, costCenters, profitCenters]) => {
        this.vendorList = vendors.data || [];
        this.costCenterList = costCenters.data || [];
        this.profitCenterList = profitCenters.data || [];
        this.subledgerList = vendors.data || [];
        this.currencyList = currencies.data || [];
        this.chargeList = charges.data || [];
        this.hssacList = hssac || [];
        this.uomList = uom.data || [];
        this.voucherList = voucher || [];
         this.stateList = states?.data || states || [];
        this.loadDepartments(company?.CompanyMasterSid).catch(e => {
        console.error('Error loading departments', e);
        this.departmentList = [];
      });
      this.loadCOAList();
      this.loadSubledgerList();
      
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
    loadCOAList(): void {
    this.accountService.getAllCoaWithLedgerCategory({
      LedgerCategory: 'Ledger',
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid
    }).subscribe({
      next: (response: any) => {
        this.coaList = response.data || [];
      },
      error: (err) => {
        console.error('Error loading COA list:', err);
      },
    });
  }
  loadSubledgerList(): void {
    this.masterService.getSubledgerMasterByType('Customer', this.currentCompany?.CompanyMasterSid).subscribe({
      next: (response: any) => {
        this.subledgerList = response.data || [];
      },
      error: (err) => {
        console.error('Error loading subledger list:', err);
      },
    });
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
    loadReverseVoucherById(id: number) {
      this.spinner.show();
      this.operationService.getReverseVoucherById(id).subscribe({
        next: (response) => {
          if (response.status && response.data) {
            console.log(response.data,'loadReverseVoucherById')
            this.reverseVoucherData = response.data;
            this.populateForm(this.reverseVoucherData);
            this.setFormReadonly();
          } else {
            this.appSettingService.showError('Reverse Voucher not found');
            this.router.navigate(['/accounts/reverse-voucher/list']);
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.appSettingService.showError('Error loading Reverse Voucher');
          console.error('Error:', error);
          this.router.navigate(['/accounts/reverse-voucher/list']);
        }
      });
    }
  
   setFormReadonly() {
    if (this.isViewMode || this.isPosted) {
      this.reverseVoucherForm.disable();
      
      // Also disable details array if posted
      // if (this.isPosted) {
      //   this.details.disable();
      // }
    } else {
      this.reverseVoucherForm.enable();
      this.details.enable();
      
      // Keep readonly fields as is
      this.reverseVoucherForm.get('VoucherNumber')?.disable();
      this.reverseVoucherForm.get('PostedOn')?.disable();
      this.reverseVoucherForm.get('PartyAddress')?.disable();
      this.reverseVoucherForm.get('GSTNo')?.disable();
      this.reverseVoucherForm.get('PlaceOfSupply')?.disable();
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
      const header = data;
      const voucherTypeForControl = header?.VoucherType != null ? [String(header.VoucherType)] : null;
        let reversalVoucherDisplay = header.ReversalVoucher;
       if (reversalVoucherDisplay && typeof reversalVoucherDisplay === 'object') {
      if (!reversalVoucherDisplay.VoucherNumber) {
        // Try to get from related invoice data or other fields
        reversalVoucherDisplay.VoucherNumber = header.InvoiceNumber || 
                                             header.ReversalInvoiceNumber || 
                                             (header.reversalVoucherDetails?.VoucherNumber) || 
                                             '-';
      }
    }
    
    const reversalVoucherId = header.ReversalVoucher || header.reversalVoucher || null;
      const customerMasterSidFromBranch = header?.customerBranch?.CustomerMasterSid
        || header?.CustomerBranch?.CustomerMasterSid
        || null;
      
      console.log(currency,'currency')
      this.reverseVoucherForm.patchValue({ 
        ReversalVoucher: reversalVoucherDisplay,
        VoucherNumber: header.VoucherNumber,
        VoucherDate: this.formatDateForNgb(header.VoucherDate),
        CustomerMasterSid: header.CustomerMasterSid || customerMasterSidFromBranch || null,
        PartyMasterSid: header.PartyMasterSid,
        PartyName: header.PartyName,
        PartyAddress: header.PartyAddress,
        CustomerBranchSid: header.CustomerBranchSid || customerMasterSidFromBranch || null,
        GSTNo: header.GST_VAT,
        PlaceOfSupply: header.PlaceOfSupply,
        PostedOn: header.PostDate ? this.formatDateForDisplay(header.PostDate) : null,
        CurrencyCode: header.CurrencyCode,
        ExchangeRate: header.ExchangeRate || 1,
        BillNo: header.DocumentNumber,
        BillDate: header.DocumentDate ? this.formatDateForNgb(header.DocumentDate) : null,
        BillAmt: header.Amount || 0,
        MBLNo: header.MasterNumber,
        HBLNo: header.HouseNumber,
        CreditNoteReason: header.CreditNoteReason || '',
        PostStatus: header.PostStatus,
        InvoiceType: header.InvoiceType || 'B2B',
        GSTType: header.GSTType,
        Narration: header.Narration || '',
        Remarks: header.Remarks || (header.VoucherOthers && header.VoucherOthers[0]?.Remarks) || '',
        MasterJobSid: header.MasterJobSid,
        HouseJobSid: header.HouseJobSid,
        Status: header.Status
      });
      console.log('DEBUG - data.PartyName:', header.PartyName);
      console.log('DEBUG - data.PartyAddress:', header.PartyAddress);
      console.log('DEBUG - data.CustomerBranchSid:', header.CustomerBranchSid);
      const cm = header.CustomerMasterSid || customerMasterSidFromBranch || null;
      console.log('DEBUG - cm:', cm);
      const branchSid = header.CustomerBranchSid || header.PartyName || (header.customerBranch ? header.customerBranch.CustomerBranchSid : null) || null;
      console.log('DEBUG - branchSid:', branchSid);
      this.pendingBranchToSelect = branchSid ? Number(branchSid) : null;
      this.getVendorBranchByVendor(cm);
      console.log('DEBUG - pendingBranchToSelect:', this.pendingBranchToSelect);
      if(branchSid){
        this.reverseVoucherForm.get('CustomerBranchSid')?.setValue(Number(branchSid));
        this.pendingBranchToSelect = Number(branchSid);
        console.log('DEBUG - pendingBranchToSelect:', this.pendingBranchToSelect);
        const currentVendor = this.reverseVoucherForm.get('CustomerMasterSid')?.value;
        if (currentVendor) {
          this.getVendorBranchByVendor(Number(currentVendor));
        } else {
         const found = this.vendorBranchList.find(b => 
            Number(b.CustomerBranchSid) === Number(branchSid) || 
            Number(b.CustomerName) === Number(branchSid)
          );
          if (found) {
            this.reverseVoucherForm.get('PartyName')?.setValue(Number(branchSid));
            this.reverseVoucherForm.get('PartyAddress')?.setValue(found.Address);
          }
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
            VoucherDetailSid: detail.VoucherDetailSid,
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
            Remarks: detail.Remarks,
            COAMasterSid: detail.COAMasterSid,
            LedgerMasterSid: detail.LedgerMasterSid,
            ProfitCenterMasterSid: detail.ProfitCenterMasterSid,
            CostCenterMasterSid: detail.CostCenterMasterSid,
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
      // if (data.VoucherTDS && data.VoucherTDS.length > 0) {
      //   const tds = data.VoucherTDS[0];
      //   this.tdsGroup.patchValue({
      //     ITSectionCode: tds.ITSectionCode,
      //     TDSSetRateSid: tds.TDSSetRateSid,
      //     Percentage: tds.TDSRate,
      //     TaxableAmt: tds.TaxableAmount,
      //     TDSAmt: tds.TDSAmount,
      //     Reason: tds.Reason || ''
      //   });
      // }
  
      // Populate others
      if (data.VoucherOthers && data.VoucherOthers.length > 0) {
        const others = data.VoucherOthers[0];
        this.reverseVoucherForm.get('voucherOthers')?.patchValue({
          ContainerNumber: others.ContainerNumber || '',
          VoucherNote: others.VoucherNote || '',
          Footer: others.Footer || ''
        });
      }
    }
  
    // Save
    onSave() {
      if (this.reverseVoucherForm.invalid) {
        this.appSettingService.showWarning('Please fill all required fields');
        this.markFormGroupTouched(this.reverseVoucherForm);
        return;
      }
  
      if (this.details.length === 0) {
        this.appSettingService.showWarning('Please add at least one charge detail');
        return;
      }
  
      const payload = this.preparePayload();
  
      this.spinner.show();
      if (this.isEditMode) {
        this.operationService.updateReverseVoucherById(this.headerId!, payload).subscribe({
          next: (response) => {
            this.spinner.hide();
            if (response.status) {
              this.appSettingService.showSuccess('Reverse Voucher updated successfully');
              this.router.navigate(['/accounts/reverse-voucher/list']);
            } else {
              this.appSettingService.showError('Failed to update Reverse Voucher');
            }
          },
          error: (error) => {
            this.spinner.hide();
            this.appSettingService.showError('Error updating Reverse Voucher');
            console.error('Error:', error);
          }
        });
      } else {
        this.operationService.createReverseVoucher(payload).subscribe({
          next: (response) => {
            this.spinner.hide();
            if (response.status) {
              this.appSettingService.showSuccess('Reverse Voucher created successfully');
              this.router.navigate(['/accounts/reverse-voucher/list']);
            } else {
              this.appSettingService.showError(response.message || 'Failed to create Reverse Voucher');
            }
          },
          error: (error) => {
            this.spinner.hide();
            this.appSettingService.showError('Error creating Reverse Voucher');
            console.error('Error:', error);
          }
        });
      }
    }
    
  
   preparePayload(): any {
    const formValue = this.reverseVoucherForm.getRawValue();
  
    const payload: any = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      ReversalVoucher: formValue.ReversalVoucher || null,
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
      BillDate: this.fromNgbDate(formValue.BillDate),
      BillAmt: formValue.BillAmt,
      MBLNo: formValue.MBLNo,
      HBLNo: formValue.HBLNo,
      PostStatus: formValue.PostStatus,
      InvoiceType: formValue.InvoiceType,
      GSTType: formValue.GSTType,
      Narration: formValue.Narration,
      MasterJobSid: formValue.MasterJobSid,
      HouseJobSid: formValue.HouseJobSid,
      VoucherDate: this.fromNgbDate(formValue.VoucherDate),
      PostDate: formValue.PostedOn ? this.fromNgbDate(formValue.PostedOn) : null,
      status: formValue.Status,
      CreatedBy: this.currUserEmail || 'System',
      UpdatedBy: this.currUserEmail || 'System'
    };
  
    // Add details with CostRevenueChargesSid
    payload.VoucherDetail = formValue.voucherDetails.map((detail: any, index: number) => ({
      Sno: index + 1,
      VoucherDetailSid: detail.VoucherDetailSid,
      CostRevenueChargesSid: detail.CostRevenueChargesSid, // Include original cost ID
      ChargeMasterSid: detail.ChargeMasterSid,
      ChargeDescription: detail.ChargeDescription,
      HSSACMasterSid: detail.HSSACMasterSid,
      ChargeUOMSid: detail.ChargeUOMSid,
      NumberOfUnit: detail.NumberOfUnit,
      Rate: detail.Rate,
      Amount: detail.Amount,
      TaxableAmount: detail.TaxableAmount,
      TaxPercentage1: detail.TaxPercentage1 || 0,
      TaxAmount1: detail.TaxAmount1 || 0,
      TaxPercentage2: detail.TaxPercentage2 || 0,
      TaxAmount2: detail.TaxAmount2 || 0,
      TaxPercentageIGST: detail.TaxPercentageIGST || 0,
      TaxAmountIGST: detail.TaxAmountIGST || 0,
      LocalAmount: detail.LocalAmount,
      CurrencyCode: detail.CurrencyCode,
      CurrencyMasterSid: this.currencyList.find(c => c.currencyCode === detail.CurrencyCode)?.CurrencyMasterSid,
      ExchangeRate: detail.ExchangeRate,
      DrCr: detail.DrCr,
      LedgerMasterSid: detail.LedgerMasterSid,
      MasterJobSid: detail.MasterJobSid,
      HouseJobSid: detail.HouseJobSid,
      DepartmentMasterSid: detail.DepartmentMasterSid,
      Remarks: detail.Remarks,
      COAMasterSid: detail.COAMasterSid,
      ProfitCenterMasterSid: detail.ProfitCenterMasterSid,  
      CostCenterMasterSid: detail.CostCenterMasterSid,
    }));
  
    // Add TDS
    // payload.VoucherTDS = this.prepareVoucherTDSPayload(formValue.voucherDetails);
  
    // Add others
    payload.VoucherOthers = {
      ...formValue.voucherOthers,
      Remarks: formValue.Remarks || ''
    };
  
    return payload;
  }
  //   prepareVoucherTDSPayload(details: any[]): any[] {
  //   const taxRecords: any[] = [];
    
  //   details.forEach((detail: any) => {
  //     if (detail.TaxAmount1 > 0 || detail.TaxAmount2 > 0 || detail.TaxAmountIGST > 0) {
  //       if (detail.TaxAmountIGST > 0) {
  //         taxRecords.push({
  //           TaxType: 'IGST',
  //           TaxPercentage: detail.TaxPercentageIGST,
  //           TaxAmount: detail.TaxAmountIGST,
  //           HSSACMasterSid: detail.HSSACMasterSid,
  //           TDSSetRateSid: detail.TDSSetRateSid,
  //           ITSectionCode: this.tdsGroup.get('ITSectionCode')?.value || ''
  //         });
  //       } else {
  //         if (detail.TaxAmount1 > 0) {
  //           taxRecords.push({
  //             TaxType: 'CGST',
  //             TaxPercentage: detail.TaxPercentage1,
  //             TaxAmount: detail.TaxAmount1,
  //             TDSSetRateSid: detail.TDSSetRateSid,
  //             HSSACMasterSid: detail.HSSACMasterSid,
  //             ITSectionCode: this.tdsGroup.get('ITSectionCode')?.value || ''
  //           });
  //         }
  //         if (detail.TaxAmount2 > 0) {
  //           taxRecords.push({
  //             TaxType: 'SGST',
  //             TaxPercentage: detail.TaxPercentage2,
  //             TaxAmount: detail.TaxAmount2,
  //             TDSSetRateSid: detail.TDSSetRateSid,
  //             HSSACMasterSid: detail.HSSACMasterSid,
  //             ITSectionCode: this.tdsGroup.get('ITSectionCode')?.value || ''
  //           });
  //         }
  //       }
  //     }
  //   });
    
  //   return taxRecords;
  // }
  
  // Check if voucher is posted (for UI controls)

    private autoGenerateNarration(reversalVoucher: any): string {
  if (!reversalVoucher) return '';
  
  let voucherNumber = '';
  let voucherType = '';
  
  // Extract voucher number
  if (typeof reversalVoucher === 'object' && reversalVoucher !== null) {
    voucherNumber = reversalVoucher.VoucherNumber || reversalVoucher.voucherNumber || '';
    voucherType = reversalVoucher.VoucherType || reversalVoucher.voucherType || '';
  } else {
    // If it's just an ID, find the voucher in the list
    const foundVoucher = this.voucherList.find(inv => 
      inv.VoucherHeaderSid === reversalVoucher || inv.voucherHeaderSid === reversalVoucher
    );
    if (foundVoucher) {
      voucherNumber = foundVoucher.VoucherNumber || foundVoucher.voucherNumber || '';
      voucherType = foundVoucher.VoucherType || foundVoucher.voucherType || '';
    }
  }
  
  if (voucherNumber) {
    return `Being reversal of ${voucherNumber}${voucherType ? ` - ${voucherType}` : ''}`;
  }
  
  return '';
}
  get isPosted(): boolean {
    return this.reverseVoucherData?.PostStatus === 'P';
  }
  
  // Check if voucher is draft
  get isDraft(): boolean {
    return !this.reverseVoucherData?.PostStatus || this.reverseVoucherData?.PostStatus === 'U';
  }
  
  
    onReset() {
      if (this.isEditMode) {
        this.loadReverseVoucherById(this.headerId!);
      } else {
        this.reverseVoucherForm.reset();
        this.details.clear();
        // this.tdsGroup.reset();
        const currencySettings = this.companySettings.getCurrencySettings();
        this.reverseVoucherForm.patchValue({
          CurrencyCode: currencySettings.code,
          ExchangeRate: 1,
          InvoiceType: 'B2B',
          Status: 'A'
        });
      }
    }
  
    onCancel() {
      this.router.navigate(['/accounts/reverse-voucher/list']);
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
      if (this.reverseVoucherForm.invalid) {
        this.markFormGroupTouched(this.reverseVoucherForm);
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
        this.operationService.updateReverseVoucherById(this.headerId, payload).subscribe({
          next: (response) => {
            this.spinner.hide();
            this.isSaving = false;
            if (response.status) {
              this.appSettingService.showSuccess('Reverse Voucher updated successfully');
              this.router.navigate(['/accounts/reverse-voucher/list']);
            } else {
              this.appSettingService.showError('Failed to update Reverse Voucher');
            }
          },
          error: (error) => {
            this.spinner.hide();
            this.isSaving = false;
            this.appSettingService.showError('Error updating Reverse Voucher');
            console.error('Error:', error);
          }
        });
      } else {
        this.operationService.createReverseVoucher(payload).subscribe({
          next: (response) => {
            this.spinner.hide();
            this.isSaving = false;
            if (response.status) {
              this.appSettingService.showSuccess('Reverse Voucher created successfully');
              this.router.navigate(['/accounts/reverse-voucher/list']);
            } else {
              this.appSettingService.showError('Failed to create Reverse Voucher');
            }
          },
          error: (error) => {
            this.spinner.hide();
            this.isSaving = false;
            this.appSettingService.showError('Error creating Reverse Voucher');
            console.error('Error:', error);
          }
        });
      }
    }
  
    isFieldInvalid(fieldName: string): boolean {
      const field = this.reverseVoucherForm.get(fieldName);
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
      this.reverseVoucherForm.get(fieldName)?.setValue(ngbDate);
      datepicker.close();
    }
  
    onCurrencyChange(event: any): void {
      console.log(event,'onCurrencyChange')
      const currencySid = event?.CurrencyMasterSid || event;
      if (!currencySid) return;
  
      const currency = this.currencyList.find(c => c.CurrencyMasterSid === currencySid);
      if (currency) {
        this.reverseVoucherForm.patchValue({
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
  
    // parseNgbDateToISO(ngbDate: NgbDateStructLike | null): string | null {
    //   if (!ngbDate) return null;
    //   const d = new Date(ngbDate.year, ngbDate.month - 1, ngbDate.day);
    //   return d.toISOString();
    // }
    private fromNgbDate(s: NgbDateStructLike | null): Date | null {
      if (!s || !s.year) return null;
      return new Date(s.year, (s.month || 1) - 1, s.day || 1);
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

  getPostStatusDisplay(): string {
  const postStatus = this.reverseVoucherForm.get('PostStatus')?.value;
  if (postStatus === 'P') {
    return 'Posted';
  } else if (postStatus === 'U') {
    return 'Unposted';
  }
  return postStatus || 'Unposted'; 
}
}
