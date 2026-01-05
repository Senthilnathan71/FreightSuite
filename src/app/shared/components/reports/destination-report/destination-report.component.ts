import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-destination-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './destination-report.component.html',
  styles: ``
})
export class DestinationReportComponent {

  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService
  ) {
    console.log('Destination Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('destination-report').pdfOrientation;
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
  
  getFilteredCustomerType(customerType: string[]): string {
    if (!customerType || !Array.isArray(customerType)) return '';
    const allowed = ['consignee', 'shipper'];
    return customerType.filter(c => allowed.includes(c)).join(', ');
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
    { key: 'houseDepartment', label: 'House Dept' },
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
    { key: 'notify', label: 'Notify Name' },
    { key: 'carrier', label: 'Carrier' },
    { key: 'originCarrier', label: 'Origin Carrier' },
    { key: 'agent', label: 'Agent' },
    { key: 'pcs', label: 'No of Pkg' },
    { key: 'incoTerms', label: 'Inco Terms' },
    { key: 'PPCC', label: 'PP/CC' },
    { key: 'vesselName', label: 'Vessel' },
    { key: 'voyageNo', label: 'Voyage' },
    { key: 'modeofTransport', label: 'Mode of Transport' },
    { key: 'jobType', label: 'Job Type' },
    { key: 'houseStatus', label: 'House Status' },
    { key: 'serviceLevelName', label: 'Service Level Name' },
    { key: 'POLCode', label: 'Shipment Origin Port Code' },
    { key: 'POLName', label: 'Shipment Origin Port Name' },
    { key: 'POLCountryCode', label: 'Shipment Origin Country Code' },
    { key: 'POLCountryName', label: 'Shipment Origin Country Name' },
    { key: 'PODCode', label: 'Shipment Destination Port Code' },
    { key: 'PODName', label: 'Shipment Destination Port Name' },
    { key: 'PODCountryCode', label: 'Shipment Destination Country Code' },
    { key: 'PODCountryName', label: 'Shipment Destination Country Name' },
    { key: 'blType', label: 'Release Type' },
    { key: 'BLIssuedDate', label: 'BL Issued Date' },
    { key: 'ETD', label: 'ETD' },
    { key: 'ATD', label: 'ATD' },
    { key: 'ETA', label: 'ETA' },
    { key: 'ATA', label: 'ATA' },
    { key: 'POLCode', label: 'POL Code' },
    { key: 'POLName', label: 'POL Name' },
    { key: 'POLCountryCode', label: 'POL Country Code' },
    { key: 'POLCountryName', label: 'POL Country Name' },
    { key: 'PODCode', label: 'POD Code' },
    { key: 'PODName', label: 'POD Name' },
    { key: 'PODCountryCode', label: 'POD Country Code' },
    { key: 'PODCountryName', label: 'POD Country Name' },
    { key: 'salesPerson', label: 'Salesperson' },
    { key: 'operationPerson', label: 'Operation Person' },
    { key: 'documentationPerson', label: 'Documentation Person' },
    { key: 'CSPerson', label: 'C/S Person' },
    { key: 'nominationBY', label: 'Nominated By' },
    { key: 'nominated', label: 'Nominated (Y/N)' },
    { key: 'coLoader', label: 'CO Loader' },
    { key: 'paymentTerms', label: 'FreightPPCC' },
    { key: 'internalNote', label: 'Internal Remarks' },
    { key: 'noOfContainers', label: 'No of Container' },
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
    { key: 'shipperNo', label: 'CustomerRef No' },
    { key: 'status', label: 'Status' },
    { key: 'masterStatus', label: 'Master Status' },
    { key: 'jobCloseDate', label: 'Job Close Date' },
    { key: 'housecreatedBy', label: 'House Created By' },
    { key: 'CANDate', label: 'CAN Date' },
    { key: 'DoNo', label: 'DO No' },
    { key: 'DoDate', label: 'DO Date' },
    { key: 'SOBDate', label: 'SOB' },
    { key: 'mastercreatedBy', label: 'Job Created By' },
    { key: 'shippingBillNo', label: 'Shipping Bill No' },
    { key: 'exportBroker', label: 'Export Broker' },
    { key: 'addtionalRemarks', label: 'External Note' }
  ];

const rows: ExcelRow[] = (this.fullData?.data || []).map(item => {
  const cells: ExcelCell[] = tableHeaders.map(header => {
    let value = item[header.key];

    // Check if the value is a date string or number
    if (value && (value instanceof Date || !isNaN(Date.parse(value)))) {
      value = this.formatDate(value);  // use your existing formatDate
    }

    if (typeof value === 'number') {
      return { value };
    }
    return { value: value ?? '' };
  });
  return { cells, style: 'data' };
});


  return {
    fileName: 'Shipment-Summary-Details',
    sheetName: 'ShipmentSummary',
    reportHeader: {
      companyName: this.currentCompany?.companyName || 'Company',
      reportTitle: `Shipment Summary Details as on ${this.formatDate(this.params?.FromHBLDt)}`,
      additionalInfo: [
        { label: 'Branch', value: this.params?.Branch || '' },
        { label: 'Dept', value: this.params?.Dept || '' },
        { label: 'Customer', value: this.params?.Customer || '' },
        { label: 'Salesperson', value: this.params?.Salesperson || '' },
        { label: 'Transhipment', value: this.params?.Transhipment || '' },
        { label: 'HBL From Date', value: this.formatDate(this.params?.FromHBLDt) },
        { label: 'HBL To Date', value: this.formatDate(this.params?.ToHBLDt) }
      ]
    },
    tableHeaders,
    rows,
    columnWidths: tableHeaders.map(() => 15) // all columns default width 15, adjust as needed
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
