import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';

@Component({
  selector: 'app-shipment-summary-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
  templateUrl: './shipment-summary-report.component.html',
  styles: ``
})
export class ShipmentSummaryReportComponent {



  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation: 'portrait' | 'landscape' = 'landscape';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private reportRegistryService: ReportRegistryService
  ) {
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    this.orientation = this.reportRegistryService.getReportConfig('shipment-summary').pdfOrientation;
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

  get departmentNamesList(): string {
    const data = this.fullData?.data;
    if (!data || !data.length) return '';
    const unique = [...new Set(data.map((item: any) => item.department).filter(Boolean))];
    return unique.join(', ');
  }

  getTotal(data: any[], field: string): number {
    if (!data) return 0;

    return data.reduce((sum, item) => {
      const value = Number(item[field]) || 0;
      return sum + value;
    }, 0);
  }


  trackByCurrencyCode(index: number, group: any): string {
    return group.CurrencyCode;
  }

  trackBySubledger(index: number, sub: any): number {
    return sub.SubledgerMasterSid;
  }


  getExcelData(): ComplexReportExportConfig {
    const tableHeaders: ExcelHeader[] = [
      { key: 'masterNo', label: 'Job No' },
      { key: 'mblNo', label: 'MBL No' },
      { key: 'Hblno', label: 'HBL No' },
      { key: 'HblDate', label: 'HBL Date' },
      { key: 'department', label: 'Dept' },
      { key: 'CustomerName', label: 'Customer' },
      { key: 'vesselName', label: 'Vessel/Flight' },
      { key: 'voyageNo', label: 'Voyage/Flight No' },
      { key: 'etd', label: 'ETD' },
      { key: 'eta', label: 'ETA' },
      { key: 'originPort', label: 'Origin Port' },
      { key: 'originPortName', label: 'Origin Name' },
      { key: 'loadPort', label: 'Load Port' },
      { key: 'loadPortName', label: 'Load Name' },
      { key: 'dischargePort', label: 'Disch Port' },
      { key: 'dischargePortName', label: 'Disch Name' },
      { key: 'destinationPort', label: 'Dest Port' },
      { key: 'destinationPortName', label: 'Dest Name' },
      { key: 'type', label: 'Type' },
      { key: 'sendingAgent', label: 'Origin Agent' },
      { key: 'receivingAgent', label: 'Delivery Name' },
      { key: 'carrier', label: 'Carrier' },
      { key: 'Salesman', label: 'Salesman' },
      { key: 'ShipmentTerms', label: 'Shipment Terms' },
      { key: 'IncoTerms', label: 'Inco Terms' },
      { key: 'PPCC', label: 'PPCC' },
      { key: 'totalNoOfTEU', label: 'TEU' },
      { key: 'transhipmentShipment', label: 'T/S Ships' },
      { key: 'localShipment', label: 'Local Ships' },
      { key: 'totalShipment', label: 'Total Ships' },
      { key: 'NoofPkg', label: 'No of Pkg' },
      { key: 'weight', label: 'Gross Weight' },
      { key: 'Volumetric', label: 'Volumetric' },
      { key: 'volume', label: 'Volume' },
      { key: 'chargeable', label: 'Chargeable' },
      { key: 'nofcontainer', label: 'Containers' },
      { key: 'containerNoList', label: 'Container Nos' },
      { key: 'numberOfTwentyFt', label: "20'" },
      { key: 'numberOfFourtyFt', label: "40'" },
      { key: 'numberofFurtyFive', label: "45'" },
      { key: 'shipper', label: 'Shipper' },
      { key: 'Consignee', label: 'Consignee' },
      { key: 'Notify', label: 'Notify' },
      { key: 'Forwarder', label: 'Forwarder' },
      { key: 'houseStatus', label: 'House Status' },
      { key: 'transhipmentVol', label: 'T/S Vol' },
      { key: 'localShipmentVol', label: 'Local Vol' }
    ];

    const rows: ExcelRow[] = (this.fullData?.data || []).map(item => {
      const cells: ExcelCell[] = [
        { value: item.masterNo || '' },
        { value: item.mblNo || '' },
        { value: item.Hblno || '' },
        { value: item.HblDate ? this.formatDate(item.HblDate) : '' },
        { value: item.department || '' },
        { value: item.CustomerName || '' },
        { value: item.vesselName || '' },
        { value: item.voyageNo || '' },
        { value: item.etd ? this.formatDate(item.etd) : '' },
        { value: item.eta ? this.formatDate(item.eta) : '' },
        { value: item.originPort || '' },
        { value: item.originPortName || '' },
        { value: item.loadPort || '' },
        { value: item.loadPortName || '' },
        { value: item.dischargePort || '' },
        { value: item.dischargePortName || '' },
        { value: item.destinationPort || '' },
        { value: item.destinationPortName || '' },
        { value: item.type || '' },
        { value: item.sendingAgent || '' },
        { value: item.receivingAgent || '' },
        { value: item.carrier || '' },
        { value: item.Salesman || '' },
        { value: item.ShipmentTerms || '' },
        { value: item.IncoTerms || '' },
        { value: item.PPCC || '' },
        { value: item.totalNoOfTEU || 0 },
        { value: item.transhipmentShipment || 0 },
        { value: item.localShipment || 0 },
        { value: item.totalShipment || 0 },
        { value: item.NoofPkg || 0 },
        { value: this.formatNumber(item.weight || 0) },
        { value: this.formatNumber(item.Volumetric || 0) },
        { value: this.formatNumber(item.volume || 0) },
        { value: this.formatNumber(item.chargeable || 0) },
        { value: item.nofcontainer || 0 },
        { value: item.containerNoList || '' },
        { value: item.numberOfTwentyFt || 0 },
        { value: item.numberOfFourtyFt || 0 },
        { value: item.numberofFurtyFive || 0 },
        { value: item.shipper || '' },
        { value: item.Consignee || '' },
        { value: item.Notify || '' }, 
        { value: item.Forwarder || '' },
        { value: item.houseStatus || '' },
        { value: this.formatNumber(item.transhipmentVol || 0) },
        { value: this.formatNumber(item.localShipmentVol || 0) }
      ];
      return { cells, style: 'data' };
    });

    return {
      fileName: 'House-Summary',
      sheetName: 'HouseSummary',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `House Summary Report`,
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.FromHblDt) },
          { label: 'To Date', value: this.formatDate(this.params?.ToHblDt) },
          { label: 'Branch', value: this.fullData?.branchInvolved || '' },
          { label: 'Dept', value: this.fullData?.departmentNames || '' },
          { label: 'House Status', value: this.params?.HouseStatus }
        ]
      },
      tableHeaders,
      rows,
      columnWidths: [
        18, 10, 8, 14, 14, 10, 10, 10, 6, 14, 6, 12, 6, 12, 6, 12, 6, 12, 12, 10,
        5, 5, 5, 5, 6, 6, 6, 5, 4, 4, 4, 12, 14, 8, 6, 6
      ]
    };
  }

  private formatDate(date: any): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-GB');
    } catch {
      return String(date);
    }
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

}
