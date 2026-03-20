import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-mawb-stock-allocation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule
  ],
  templateUrl: './mawb-stock-allocation.component.html'
})
export class MawbStockAllocationComponent implements OnInit {

  @Input() mode: 'allocate' | 'deallocate' = 'allocate';
  
  allocationForm!: FormGroup;
  
  airlineList: any[] = [];
  customerList: any[] = [];
  clientlist: any[] = [];
  stockStatusList = ["Free","Void", "Return"]; // Removed "Void" as per your requirement

  currentCompany: any;
  currentBranch: any;
  loading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.currentCompany =
      this.appSettingService.decrypt(localStorage.getItem('selected-company'));

    this.currentBranch =
      this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

    this.initForm();
    this.loadAirlines();
    this.loadAllCustomers();
  }

  // ===============================
  // Initialize Reactive Form
  // ===============================
  initForm() {
    this.allocationForm = this.fb.group({
      airlineId: [null, this.mode === 'allocate' ? Validators.required : null],
      customerId: [null, Validators.required],
      stocks: this.fb.array([])
    });

    // If in deallocate mode, remove airline validator
    if (this.mode === 'deallocate') {
      this.allocationForm.get('airlineId')?.clearValidators();
      this.allocationForm.get('airlineId')?.updateValueAndValidity();
    }
  }

  // ===============================
  // Get stocks FormArray
  // ===============================
  get stocksArray(): FormArray {
    return this.allocationForm.get('stocks') as FormArray;
  }

  // ===============================
  // Load Airline List
  // ===============================
  loadAirlines() {
    this.masterService.getCustomerByItsType({
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      types: ['airLine']
    }).subscribe((resp: any) => {
      this.airlineList = resp?.data || [];
    });
  }

  // ===============================
  // Load Customer List
  // ===============================
  loadAllCustomers() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.masterService.getCustomerByItsType({ CompanyMasterSid, types: ['customer'] })
      .subscribe((resp: any) => {
        this.clientlist = resp.data || [];
      });
  }

  // ===============================
  // Load Stock Based On Mode
  // ===============================
  loadStock() {
    // Clear existing stocks
    while (this.stocksArray.length) {
      this.stocksArray.removeAt(0);
    }

    if (this.mode === 'allocate') {
      const airlineId = this.allocationForm.get('airlineId')?.value;
      if (!airlineId) return;

      const payload = {
        airlineId: airlineId,
        companyId: this.currentCompany.CompanyMasterSid,
        branchId: this.currentBranch.BranchMasterSid
      };

      this.loading = true;

      this.masterService.getFreeMawbStock(payload)
        .subscribe((resp: any) => {
          this.loading = false;
          if (resp.status) {
            this.populateStockArray(resp.data);
          }
        });

    } else {
      const customerId = this.allocationForm.get('customerId')?.value;
      if (!customerId) return;

      const payload = {
        customerId: customerId,
        companyId: this.currentCompany.CompanyMasterSid,
        branchId: this.currentBranch.BranchMasterSid
      };

      this.loading = true;

      this.masterService.getAllocatedMawbStock(payload)
        .subscribe((resp: any) => {
          this.loading = false;
          if (resp.status) {
            this.populateStockArray(resp.data);
          }
        });
    }
  }

  // ===============================
  // Populate Stock FormArray
  // ===============================
  populateStockArray(stocks: any[]) {
    stocks.forEach(stock => {
      this.stocksArray.push(
        this.fb.group({
          MawbStockSid: [stock.MawbStockSid],
          MasterBillNumber: [stock.MasterBillNumber],
          StockStatus: [{
            value: stock.StockStatus,
            disabled: this.mode === 'allocate' // Disable in allocate mode
          }],
          AvailableStatus: [stock.AvailableStatus],
          selected: [false],
          Customer: [stock.Customer]
        })
      );
    });
  }

  // ===============================
  // Toggle Selection
  // ===============================
  toggleSelection(index: number) {
    const control = this.stocksArray.at(index).get('selected');
    control?.setValue(!control?.value);
  }

  // ===============================
  // Get Selected Stocks
  // ===============================
  getSelectedStocks(): any[] {
    return this.stocksArray.controls
      .filter(control => control.get('selected')?.value)
      .map(control => ({
        MawbStockSid: control.get('MawbStockSid')?.value,
        StockStatus: control.get('StockStatus')?.value
      }));
  }

  // ===============================
  // Check if any stock selected
  // ===============================
  hasSelectedStocks(): boolean {
    return this.stocksArray.controls.some(control => control.get('selected')?.value);
  }

  // ===============================
  // Confirm Allocation / Deallocation
  // ===============================
  confirm() {
    const selectedStocks = this.getSelectedStocks();
    if (!selectedStocks.length) return;

    const customerId = this.allocationForm.get('customerId')?.value;

    // Prepare payload as per requirement
    const payload: any = {
      companyId: this.currentCompany.CompanyMasterSid,
      branchId: this.currentBranch.BranchMasterSid,
      customerId: customerId
    };

    if (this.mode === 'allocate') {
      // For allocation, just send stock IDs
      payload.stockIds = selectedStocks.map(s => s.MawbStockSid);
      
      this.loading = true;
      this.masterService.allocateMawbStock(payload)
        .subscribe(() => {
          this.loading = false;
          this.activeModal.close(true);
        });
    } else {
      // For deallocation, send stocks array with StockStatus
      payload.stocks = selectedStocks;
      
      this.loading = true;
      this.masterService.deallocateMawbStock(payload)
        .subscribe(() => {
          this.loading = false;
          this.activeModal.close(true);
        });
    }
  }

  // ===============================
  // Cancel Modal
  // ===============================
  cancel() {
    this.activeModal.dismiss();
  }

  // ===============================
  // TrackBy for performance
  // ===============================
  trackByIndex(index: number): number {
    return index;
  }
}