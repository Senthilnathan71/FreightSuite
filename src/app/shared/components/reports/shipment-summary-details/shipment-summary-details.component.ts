import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';

@Component({
  selector: 'app-shipment-summary-details',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent,PrintFooterComponent],
  templateUrl: './shipment-summary-details.component.html',
  styles: ``
})
export class ShipmentSummaryDetailsComponent {

  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('shipment-summary-details').pdfOrientation;
  }

  get fullData(): any {
    return this.data || {};
  }

  get params(): any {
    return this.data?.params || {};
  }

  get bucketLabels(): any {
    return this.fullData?.bucketLabels || [];
  }

  private profitMetricsCache = new WeakMap<any, {
    revenueLocalAmt: number;
    costLocalAmt: number;
    gp: number;
    profitPercent: number;
  }>();
  
getFilteredCustomerType(customerType: string[]): string {
  if (!customerType || !Array.isArray(customerType)) return '';

  const allowed = ['consignee', 'shipper', 'customer'];

  return customerType
    .filter(c => allowed.includes(c))
    .map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())
    .join(', ');
}


  getExcelData(): ComplexReportExportConfig {

    const tableHeaders: ExcelHeader[] = [
      { key: 'branchName', label: 'Branch' },
      { key: 'houseDepartment', label: 'Dept' },
      { key: 'jobMonth', label: 'Job Month' },
      { key: 'HBLDate', label: 'Job Date' },
      { key: 'MBL', label: 'MBL / MAWB' },
      { key: 'importJobNo', label: 'Import Job No' },
      { key: 'exportJobNo', label: 'Export Job No' },
      { key: 'shipmentNo', label: 'Shipment No' },
      { key: 'bookingDate', label: 'Booking Date' },
      { key: 'HBL', label: 'HBL / HAWB' },
      { key: 'grossWeight', label: 'Weight' },
      { key: 'volume', label: 'Volume' },
      { key: 'chargeable', label: 'Chargeable' },
      { key: 'netWeight', label: 'Volume Wt' },

      { key: 'customer', label: 'Customer' },
      { key: 'customerType', label: 'Customer Type' },
      { key: 'shipper', label: 'Shipper' },
      { key: 'consignee', label: 'Consignee' },

      { key: 'originAgent', label: 'Origin Agent' },
      { key: 'deliveryAgent', label: 'Delivery Agent' },
      { key: 'carrier', label: 'Carrier' },

      { key: 'pcs', label: 'No of Pkg' },
      { key: 'incoTerms', label: 'Inco Terms' },
      { key: 'PPCC', label: 'PP/CC' },

      { key: 'vesselName', label: 'Vessel' },
      { key: 'voyageNo', label: 'Voyage' },
      { key: 'modeofTransport', label: 'Mode of Transport' },

      { key: 'jobType', label: 'Job Type' },
      { key: 'houseStatus', label: 'House Status' },

      { key: 'POLCode', label: 'POL Code' },
      { key: 'POLName', label: 'POL Name' },
      { key: 'PODCode', label: 'POD Code' },
      { key: 'PODName', label: 'POD Name' },

      
      { key: 'nofcontainer', label: 'No of Container' },
      { key: 'numberOfTwentyFt', label: "20'F" },
      { key: 'numberOfFourtyFt', label: "40'F" },
      { key: 'numberofFurtyFiveFt', label: "40' HC" },

      { key: 'numberOfTwentyRefer', label: "20' Refer" },
      { key: 'numberOfFourtyRefer', label: "40' Refer" },
      { key: 'numberOfFourtyFiveRefer', label: "40' HC Refer" },

      { key: 'numberofTwentyOpen', label: "20' Open Top" },
      { key: 'numberofFourtyOpen', label: "40' Open Top" },
      { key: 'numberofFourtyFiveOpen', label: "40' HC Open Top" },

      { key: 'totalNoOfTEU', label: 'TEU' },

      { key: 'status', label: 'Status' },
      { key: 'masterStatus', label: 'Master Status' },

      { key: 'housecreatedBy', label: 'House Created By' },
      { key: 'mastercreatedBy', label: 'Job Created By' },

      { key: 'shippingBillNo', label: 'Shipping Bill No' },
      { key: 'addtionalRemarks', label: 'External Note' },
      { key: 'proRevenueLocalAmt', label: 'P.Revenue Local Amt' },
      { key: 'proCostLocalAmt', label: 'P.Cost Local Amt' },
      { key: 'gp', label: 'GP' },
      { key: 'profitPercent', label: 'Profit %' }
    ];

    const columnWidths = tableHeaders.map(() => 18);
    const rows: ExcelRow[] = [];

   
    (this.fullData?.data || []).forEach((item: any) => {

      const cells: ExcelCell[] = tableHeaders.map(header => {

        let value = item?.[header.key];
        if (header.key === 'proRevenueLocalAmt') {
          value = this.getProRevenueLocalAmt(item);
        }
        if (header.key === 'proCostLocalAmt') {
          value = this.getProCostLocalAmt(item);
        }
        if (header.key === 'gp') {
          value = this.getGp(item);
        }
        if (header.key === 'profitPercent') {
          value = this.getProfitPercent(item);
        }

        if (header.key === 'customerType') {
          value = this.getFilteredCustomerType(item.customerType);
        }

        if (header.key === 'jobMonth') {
          value = new Date(this.params?.FromHblDt).toLocaleString('en-US', {
            month: 'long'
          });
        }

        else if (
          header.key.toLowerCase().includes('date') ||
          header.key === 'ETD' ||
          header.key === 'ETA' ||
          header.key === 'ATD' ||
          header.key === 'ATA'
        ) {
          value = this.formatDate(value);
        }

        
        if (
          header.key === 'grossWeight' ||
          header.key === 'volume' ||
          header.key === 'chargeable' ||
          header.key === 'netWeight'
        ) {
          value = this.formatNumber(value || 0);
        }

        
        return { value: value ?? '' };
      });

      rows.push({
        cells,
        style: 'data'
      });
    });

    return {
      fileName: 'House-Summary-Details',
      sheetName: 'HouseSummaryDetails',

      reportHeader: {
        companyName: this.currentCompany?.companyName || '',
        reportTitle: `House Summary Details`,

        additionalInfo: [
          {
            label: 'HBL From Date',
            value: this.formatDate(this.params?.FromHblDt)
          },
          {
            label: 'HBL To Date',
            value: this.formatDate(this.params?.ToHblDt)
          },
          { label: 'Branch', value: this.fullData?.branchInvolved || '' },
          { label: 'Dept', value: this.fullData?.departmentNames || '' },
          { label: 'Customer', value: this.fullData?.Customer || '' },
          { label: 'Salesperson', value: this.fullData?.SalePerson || '' },
          {
            label: 'Transhipment',
            value: this.params?.Transhipment ? 'Yes' : 'No'
          }
        ]
      },

      tableHeaders,
      columnWidths,
      rows
    };
  }


 private formatNumber(value: any): string {
  if (value === null || value === undefined) return '';

  const num = Number(value);
  if (isNaN(num)) return '';

  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

  private formatDate(date: any): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-GB');
    } catch {
      return String(date);
    }
  }

  private calculateProfitMetrics(item: any): {
    revenueLocalAmt: number;
    costLocalAmt: number;
    gp: number;
    profitPercent: number;
  } {
    const cached = this.profitMetricsCache.get(item);
    if (cached) {
      return cached;
    }

    const details = Array.isArray(item?.costRevenueDetails) ? item.costRevenueDetails : [];
    const grouped = new Map<string, { revenue: number; cost: number }>();

    details.forEach((row: any) => {
      const charge = String(row?.Charge || '').trim().toLowerCase();
      const key = charge || '__unknown__';
      const existing = grouped.get(key) || { revenue: 0, cost: 0 };

      const revenue = Number(row?.RevenueLocalAmt || 0);
      const cost = Number(row?.CostLocalAmt || 0);
      const revenueSigned = String(row?.RevenueDrCr || 'C').toUpperCase() === 'C' ? revenue : -revenue;
      const costSigned = String(row?.CostDrCr || 'D').toUpperCase() === 'D' ? cost : -cost;

      existing.revenue += revenueSigned;
      existing.cost += costSigned;
      grouped.set(key, existing);
    });

    let totalRevenue = 0;
    let totalCost = 0;
    grouped.forEach((value) => {
      totalRevenue += value.revenue;
      totalCost += value.cost;
    });

    let gp = 0;
    let profitPercent = 0;

    if (totalRevenue > totalCost) {
      gp = totalRevenue - totalCost;
      profitPercent = totalRevenue !== 0 ? (gp / totalRevenue) * 100 : 0;
    } else {
      gp = -(totalCost - totalRevenue);
      profitPercent = totalCost !== 0 ? (gp / totalCost) * 100 : 0;
    }

    const result = {
      revenueLocalAmt: totalRevenue,
      costLocalAmt: totalCost,
      gp,
      profitPercent
    };

    this.profitMetricsCache.set(item, result);
    return result;
  }

  getProRevenueLocalAmt(item: any): number {
    return this.calculateProfitMetrics(item).revenueLocalAmt;
  }

  getProCostLocalAmt(item: any): number {
    return this.calculateProfitMetrics(item).costLocalAmt;
  }

  getGp(item: any): number {
    return this.calculateProfitMetrics(item).gp;
  }

  getProfitPercent(item: any): string {
    return `${this.calculateProfitMetrics(item).profitPercent.toFixed(3)}%`;
  }

}
