import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-shipment-summary-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './shipment-summary-report.component.html',
  styles: ``
})
export class ShipmentSummaryReportComponent {



  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private reportRegistryService: ReportRegistryService
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
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
      { key: 'masterNo', label: 'Master No' },
      { key: 'masterDate', label: 'Master Date' },
      { key: 'department', label: 'Dept' },
      { key: 'mblNo', label: 'MBL No' },
      { key: 'vesselName', label: 'Vessel / Flight Name' },
      { key: 'voyageNo', label: 'Voyage / Flight No' },
      { key: 'etd', label: 'ETD' },
      { key: 'eta', label: 'ETA' },
      { key: 'originPort', label: 'Origin Port' },
      { key: 'originPortName', label: 'Origin Port Name' },
      { key: 'loadPort', label: 'Load Port' },
      { key: 'loadPortName', label: 'Load Port Name' },
      { key: 'dischargePort', label: 'Discharge Port' },
      { key: 'dischargePortName', label: 'Discharge Port Name' },
      { key: 'destinationPort', label: 'Destination Port' },
      { key: 'destinationPortName', label: 'Destination Port Name' },
      { key: 'type', label: 'Type' },
      { key: 'sendingAgent', label: 'Sending Agent' },
      { key: 'receivingAgent', label: 'Receiving Agent' },
      { key: 'carrier', label: 'Carrier' },
      { key: 'totalNoOfTEU', label: 'TEU' },
      { key: 'transhipmentShipment', label: 'Transhipment Shipments' },
      { key: 'localShipment', label: 'Local Shipments' },
      { key: 'totalShipment', label: 'Total Shipments' },
      { key: 'weight', label: 'Weight' },
      { key: 'volume', label: 'Volume' },
      { key: 'chargeable', label: 'Chargeable' },
      { key: 'noOfContainers', label: 'No of Container' },
      { key: 'numberOfTwentyFt', label: "20'" },
      { key: 'numberOfFourtyFt', label: "40'" },
      { key: 'numberofFurtyFive', label: "40' HC" },
      { key: 'shipper', label: 'Shipper' },
      { key: 'containerNoList', label: 'Container No List' },
      { key: 'consolStatus', label: 'Consol Status' },
      { key: 'transhipmentVol', label: 'T/S Shipment Volume' },
      { key: 'localShipmentVol', label: 'Local Shipment Volume' }
    ];

    const rows: ExcelRow[] = (this.fullData?.data || []).map(item => {
      const cells: ExcelCell[] = [
        { value: item.masterNo || '' },
        { value: item.masterDate ? this.formatDate(item.masterDate) : '' },
        { value: item.department || '' },
        { value: item.mblNo || '' },
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
        { value: item.totalNoOfTEU || 0 },
        { value: item.transhipmentShipment || 0 },
        { value: item.localShipment || 0 },
        { value: item.totalShipment || 0 },
        { value: item.weight || 0 },
        { value: item.volume || 0 },
        { value: item.chargeable || 0 },
        { value: item.noOfContainers || 0 },
        { value: item.numberOfTwentyFt || 0 },
        { value: item.numberOfFourtyFt || 0 },
        { value: item.numberofFurtyFive || 0 },
        { value: item.shipper || '' },
        { value: item.containerNoList || '' },
        { value: item.consolStatus || '' },
        { value: item.transhipmentVol || 0 },
        { value: item.localShipmentVol || 0 }
      ];
      return { cells, style: 'data' };
    });

    return {
      fileName: 'Customer-Shipment-Summary',
      sheetName: 'CustomerShipmentSummary',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `Customer Shipment Summary as on ${this.formatDate(this.params?.FromMBLDt)}`,
        additionalInfo: [
          { label: 'Branch', value: this.params?.Branch || '' },
          { label: 'Dept', value: this.params?.Dept || '' },
          { label: 'From Date', value: this.formatDate(this.params?.FromMBLDt) },
          { label: 'To Date', value: this.formatDate(this.params?.ToMBLDt) }
        ]
      },
      tableHeaders,
      rows,
      columnWidths: [
        15, 15, 10, 15, 20, 15, 15, 15, 15, 20, 15, 20, 15, 20, 15, 20, 10, 20, 20, 20,
        10, 15, 15, 15, 15, 15, 15, 10, 10, 10, 10, 25, 25, 15, 15
      ] // adjust as needed
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



}
