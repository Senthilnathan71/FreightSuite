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
    this.loadCustomers();
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
  loadCustomers() {
    this.masterService.getCustomerByItsType({
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      types: ['agent']
    }).subscribe((resp: any) => {
      this.customerList = resp?.data || [];
    });
  }

  // ===============================
  // Load Stock Based On Mode
  // ===============================
  loadStock() {

    this.selectedStockIds = [];
    this.stockList = [];

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
  // Confirm Allocation / Deallocation
  // ===============================
  confirm() {

    if (!this.selectedStockIds.length) return;

    const payload = {
      stockIds: this.selectedStockIds,
      customerId:
        this.mode === 'allocate'
          ? this.selectedCustomer
          : this.selectedCustomer,
      companyId: this.currentCompany.CompanyMasterSid,
      branchId: this.currentBranch.BranchMasterSid
    };

    this.loading = true;

    if (this.mode === 'allocate') {

      this.masterService.allocateMawbStock(payload)
        .subscribe(() => {
          this.loading = false;
          this.activeModal.close(true);
        });

    } else {

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

}
