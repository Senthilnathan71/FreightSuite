import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-mawb-stock-allocation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule
  ],
  templateUrl: './mawb-stock-allocation.component.html'
})
export class MawbStockAllocationComponent implements OnInit {

  airlineList: any[] = [];
  customerList: any[] = [];
  stockList: any[] = [];
  selectedStockIds: number[] = [];

  selectedAirline!: number;
  selectedCustomer!: number;
  stockStatusList = ["Free", "Utilised", "Return", "Void", "Hold"];

  mode: 'allocate' | 'deallocate' = 'allocate';

  currentCompany: any;
  currentBranch: any;

  loading = false;
  
  // Track original stock status for deallocation changes
  originalStockStatus: Map<number, string> = new Map();

  constructor(
    public activeModal: NgbActiveModal,
    private masterService: MasterService,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit(): void {

    this.currentCompany =
      this.appSettingService.decrypt(localStorage.getItem('selected-company'));

    this.currentBranch =
      this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

    this.loadAirlines();
    this.loadAllCustomers(); // Changed from loadCustomers to loadAllCustomers
  }

  // ===============================
  // Load Airline List (Agents)
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
  // Load ALL Customers (no type filter)
  // ===============================
  loadAllCustomers() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
     this. masterService.getCustomerByItsType({ CompanyMasterSid, types: ['customer'] })
      .subscribe((resp: any) => {
        this.customerList = resp.data || [];
      });
  }

  // ===============================
  // Load Stock Based On Mode
  // ===============================
  loadStock() {

    this.selectedStockIds = [];
    this.stockList = [];
    this.originalStockStatus.clear();

    if (this.mode === 'allocate') {

      if (!this.selectedAirline) return;

      const payload = {
        airlineId: this.selectedAirline,
        companyId: this.currentCompany.CompanyMasterSid,
        branchId: this.currentBranch.BranchMasterSid
      };

      this.loading = true;

      this.masterService.getFreeMawbStock(payload)
        .subscribe((resp: any) => {

          this.loading = false;

          if (resp.status) {
            this.stockList = resp.data;
          }
        });

    } else {

      if (!this.selectedCustomer) return;

      const payload = {
        customerId: this.selectedCustomer,
        companyId: this.currentCompany.CompanyMasterSid,
        branchId: this.currentBranch.BranchMasterSid
      };

      this.loading = true;

      this.masterService.getAllocatedMawbStock(payload)
        .subscribe((resp: any) => {

          this.loading = false;

          if (resp.status) {
            this.stockList = resp.data;
            // Store original stock status for each item
            this.stockList.forEach((stock: any) => {
              this.originalStockStatus.set(stock.MawbStockSid, stock.StockStatus);
            });
          }
        });
    }
  }

  // ===============================
  // Checkbox Toggle
  // ===============================
  toggleSelection(id: number) {

    if (this.selectedStockIds.includes(id)) {
      this.selectedStockIds =
        this.selectedStockIds.filter(x => x !== id);
    } else {
      this.selectedStockIds.push(id);
    }
  }

  // ===============================
  // Check if status has been changed
  // ===============================
  hasStatusChanged(stockId: number, currentStatus: string): boolean {
    const originalStatus = this.originalStockStatus.get(stockId);
    return originalStatus !== currentStatus;
  }

  // ===============================
  // Confirm Allocation / Deallocation
  // ===============================
  confirm() {

    if (!this.selectedStockIds.length) return;

    if (this.mode === 'allocate') {
      
      // Allocation: Customer is required
      if (!this.selectedCustomer) {
        alert('Please select a customer');
        return;
      }

      const payload = {
        stockIds: this.selectedStockIds,
        customerId: this.selectedCustomer,
        companyId: this.currentCompany.CompanyMasterSid,
        branchId: this.currentBranch.BranchMasterSid
      };

      this.loading = true;

      this.masterService.allocateMawbStock(payload)
        .subscribe(() => {
          this.loading = false;
          this.activeModal.close(true);
        });

    } else {

      // Deallocation: Get only selected stocks that have status changes
      const stocksWithStatusChanges = this.stockList
        .filter(stock => 
          this.selectedStockIds.includes(stock.MawbStockSid) && 
          this.hasStatusChanged(stock.MawbStockSid, stock.StockStatus)
        )
        .map(stock => ({
          id: stock.MawbStockSid,
          status: stock.StockStatus
        }));

      // If no status changes, just deallocate normally
      if (stocksWithStatusChanges.length === 0) {
        const payload = {
          stockIds: this.selectedStockIds,
          customerId: this.selectedCustomer,
          companyId: this.currentCompany.CompanyMasterSid,
          branchId: this.currentBranch.BranchMasterSid
        };

        this.loading = true;

        this.masterService.deallocateMawbStock(payload)
          .subscribe(() => {
            this.loading = false;
            this.activeModal.close(true);
          });
      } else {
        // Send deallocation with status changes
        const payload = {
          stockIds: this.selectedStockIds,
          customerId: this.selectedCustomer,
          companyId: this.currentCompany.CompanyMasterSid,
          branchId: this.currentBranch.BranchMasterSid,
          statusChanges: stocksWithStatusChanges
        };

        this.loading = true;

        this.masterService.deallocateMawbStockWithStatus(payload)
          .subscribe(() => {
            this.loading = false;
            this.activeModal.close(true);
          });
      }
    }
  }

  // ===============================
  // Cancel Modal
  // ===============================
  cancel() {
    this.activeModal.dismiss();
  }

  // ===============================
  // Check if stock is Void
  // ===============================
  isVoidStatus(status: string): boolean {
    return status === 'Void';
  }

  // ===============================
  // Switch Mode
  // ===============================
  switchMode(mode: 'allocate' | 'deallocate') {
    this.mode = mode;
    this.selectedAirline = null!;
    this.selectedCustomer = null!;
    this.stockList = [];
    this.selectedStockIds = [];
    this.originalStockStatus.clear();
  }

}