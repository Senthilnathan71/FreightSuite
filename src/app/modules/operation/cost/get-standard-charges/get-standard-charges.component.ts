// get-standard-charges.component.ts (updated)

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OperationService } from '../../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-get-standard-charges',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './get-standard-charges.component.html',
  styles: ``
})
export class GetStandardChargesComponent implements OnInit {
  @Input() screenName : 'Booking' | 'Master Job' | 'House Job' | 'House Air Waybill' | 'Master Air Waybill' | 'Service Job';
  @Input() parentFormValue: any;
  @Input() currentCompany: any;
  @Input() currentBranch: any;
  @Input() chargeList: any[] = [];
  @Input() uomList: any[] = [];
  @Input() currencyList: any[] = [];

  @Output() chargeSelected = new EventEmitter<any>();
  @Output() chargesSelected = new EventEmitter<any[]>(); // For multiple selection

  standardCharges: any[] = [];
  filteredStandardCharges: any[] = [];
  selectedCharges: Set<number> = new Set<number>(); // Store selected charge IDs
  loading: boolean = false;
  digitsAfterDecimal = 3;
  constructor(
    public activeModal: NgbActiveModal,
    private operationService: OperationService,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit(): void {
    this.loadStandardCharges();
  }

  loadStandardCharges() {
    this.loading = true;
    this.standardCharges = [];
    this.filteredStandardCharges = [];
    this.selectedCharges.clear();

    const companySid = this.currentCompany?.CompanyMasterSid;
    const departmentSid = this.parentFormValue?.DepartmentMasterSid;
    const currentBranch=  this.currentBranch?.BranchMasterSid;

    if (!companySid) {
      this.appSettingService.showWarning('Company information is required');
      this.loading = false;
      return;
    }

    console.log('Loading standard charges with:', {
      companySid,
      departmentSid
    });

const payload: any = {
  CompanyMasterSid: companySid,
  DepartmentMasterSid: departmentSid,
  BranchMasterSid: currentBranch,
  CargoType: this.parentFormValue?.CargoType,

  // ✅ Always send OperationDate
  OperationDate: this.parentFormValue?.EffectiveDate
    ? new Date(this.parentFormValue.EffectiveDate).toISOString()
    : null
};

// ✅ If Quotation → add extra dates
if (this.parentFormValue?.isQuotation === true) {

  payload.isQuotation = true;

  payload.EffectiveFrom = this.parentFormValue?.EffectiveFrom
    ? new Date(this.parentFormValue.EffectiveFrom).toISOString()
    : null;

  payload.ExpiredTo = this.parentFormValue?.ExpiredTo
    ? new Date(this.parentFormValue.ExpiredTo).toISOString()
    : null;
}


    this.operationService.getStdCharges(payload).pipe(
      catchError(err => {
        console.error('Error loading standard charges:', err);
        this.loading = false;
        this.appSettingService.showError('Error loading standard charges');
        return of({ data: [], message: 'Error loading standard charges' });
      })
    ).subscribe((resp: any) => {
      this.loading = false;

      console.log('API Response:', resp);

      if (resp && resp.data && resp.data && resp.data.length > 0) {
        this.standardCharges = this.processStandardCharges(resp.data);
        this.filteredStandardCharges = [...this.standardCharges];
        
        console.log('Standard charges processed:', this.filteredStandardCharges.length);
      } else {
        this.appSettingService.showInfo('No standard charges found for the selected criteria');
      }
    });
  }

  findFieldForQty(UnitQty: string) {
    const trimmedUnitQty = String(UnitQty).trim();
    switch (trimmedUnitQty) {
      case 'Per GrossWeight':
        return 'GrossWeight';
      case 'Per CBM':
        return 'Volume';
      case '20ft':
        return 'Qty';
      case '40ft':
        return 'Qty';
      case 'ChargeableWeight':
        return 'ChargeableWeight';
      case 'Per BL':
        return '1';
      case 'Per Shipment':
        return '1';
      default:
        return '1';
    }
  }

  processStandardCharges(data: any[]): any[] {
    return data.map((charge: any) => {
      const charges = this.getChargeCode(charge.ChargeCode);
      const qtySourceField = this.findFieldForQty(
        charge.UOMMaster?.UOMCode || ''
      );
      
      let value = 1;
      if (typeof qtySourceField === 'string' && this.parentFormValue[qtySourceField]) {
        value = this.parentFormValue[qtySourceField] || 1;
      } else if (typeof qtySourceField === 'number') {
        value = qtySourceField;
      }
      
      return {
        StdRateHeaderSid: charge.StdRateHeaderSid,
        StdTariffDetailSid: charge.StdTariffDetailSid,
        CompanyMasterSid: charge.CompanyMasterSid,
        CargoType: charge.CargoType,
        ChargeMasterSid: charge.ChargeMasterSid,
        ChargeCode: charge.ChargeMaster?.chargeCode,
        UOMCode: charge.UOMMaster?.UOMCode,
        ChargeDescription: charge.ChargeName,
        ChargeUomSid: charge.UomSid,
        UomSid: charge.UomSid,
        SaleCurrencyMasterSid: charge.SaleCurrency,
        SaleCurrency: charge.SaleCurrency,
        SaleAmount: charge.SaleAmount,
        CostCurrencyMasterSid: charge.CostCurrency,
        CostCurrency: charge.CostCurrency,
        CostAmount: charge.CostAmount,
        ValidFrom: charge.ValidFrom,
        ValidTo: charge.ValidTo,
        Remarks: charge.Remarks,
        CalculationType: charge.CalculationType,
        NoofUnit:value,
        exchangeRateCost:charge.costExchangeRate,
        exchangerateRevenue:charge.revenueExchangeRate,
      };
    });
  }

 
  // Selection Methods
  isChargeSelected(charge: any): boolean {
    return this.selectedCharges.has(charge.StdTariffDetailSid);
  }

  toggleChargeSelection(charge: any) {
    const chargeId = charge.StdTariffDetailSid;
    if (this.selectedCharges.has(chargeId)) {
      this.selectedCharges.delete(chargeId);
    } else {
      this.selectedCharges.add(chargeId);
    }
  }

  isAllSelected(): boolean {
    if (this.filteredStandardCharges.length === 0) return false;
    return this.filteredStandardCharges.every(charge => 
      this.selectedCharges.has(charge.StdTariffDetailSid)
    );
  }

  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    if (checked) {
      this.filteredStandardCharges.forEach(charge => {
        this.selectedCharges.add(charge.StdTariffDetailSid);
      });
    } else {
      this.selectedCharges.clear();
    }
  }

  hasSelectedCharges(): boolean {
    return this.selectedCharges.size > 0;
  }

  // Single charge selection (original functionality)
  selectSingleCharge(charge: any) {
    console.log('Single standard charge selected:', charge);
    
    this.chargeSelected.emit({
      ...charge,
      RateSid: charge.StdTariffDetailSid,
      ChargeUomSid: charge.UomSid,
      RevenueChargeUomSid: charge.UomSid,
      CostChargeUomSid: charge.UomSid,
      RevenueCurrencyMasterSid: charge.SaleCurrency,
      RevenueAmount: charge.SaleAmount,
      CostCurrencyMasterSid: charge.CostCurrency,
      CostAmount: charge.CostAmount,
      NoOfUnit: 1,
      RevenueNumberOfUnit: 1,
      CostNumberOfUnit: 1
    });
    
    this.activeModal.close();
  }

  // Multiple charge selection
  applySelectedCharges() {
    if (!this.hasSelectedCharges()) {
      this.appSettingService.showWarning('Please select at least one charge');
      return;
    }

    const selectedCharges = this.filteredStandardCharges.filter(charge => 
      this.selectedCharges.has(charge.StdTariffDetailSid)
    );

    console.log('Selected charges:', selectedCharges);

    // Process and emit each selected charge
    const processedCharges = selectedCharges.map(charge => ({
      ...charge,
      RateSid: charge.StdTariffDetailSid,
      ChargeUomSid: charge.UomSid,
      RevenueChargeUomSid: charge.UomSid,
      CostChargeUomSid: charge.UomSid,
      RevenueCurrencyMasterSid: charge.SaleCurrency,
      RevenueAmount: charge.SaleAmount,
      CostCurrencyMasterSid: charge.CostCurrency,
      CostAmount: charge.CostAmount,
      NoOfUnit: 1,
      RevenueNumberOfUnit: 1,
      CostNumberOfUnit: 1
    }));

    // Emit all selected charges
    this.chargesSelected.emit(processedCharges);
    this.activeModal.close();
  }

  closeModal() {
    this.activeModal.dismiss();
  }

  // Helper methods for display
  getChargeCode(ChargeMasterSid: number): string {
    if (!ChargeMasterSid || !this.chargeList?.length) return '';
    const charge = this.chargeList.find(c => c.ChargeMasterSid === ChargeMasterSid);
    return charge?.chargeCode || '';
  }

  getChargeName(ChargeMasterSid: number): string {
    if (!ChargeMasterSid || !this.chargeList?.length) return '';
    const charge = this.chargeList.find(c => c.ChargeMasterSid === ChargeMasterSid);
    return charge?.chargeName || '';
  }

  getUnitCode(UOMMasterSid: number): string {
    if (!UOMMasterSid || !this.uomList?.length) return '';
    const uom = this.uomList.find(u => u.UOMMasterSid === UOMMasterSid);
    return uom?.UOMCode || '';
  }

  getCurrencyCode(CurrencyMasterSid: number): string {
    if (!CurrencyMasterSid || !this.currencyList?.length) return '';
    const currency = this.currencyList.find(c => c.CurrencyMasterSid === CurrencyMasterSid);
    return currency?.currencyCode || '';
  }
}