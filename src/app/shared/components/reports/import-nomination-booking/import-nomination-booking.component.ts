import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import {
  ComplexReportExportConfig,
  ExcelCell,
  ExcelHeader,
  ExcelRow,
} from 'src/app/shared/excel-report-service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';

@Component({
  selector: 'app-import-nomination-booking',
  standalone: true,
  imports: [
    CustomDatePipe,
    CommonModule,
    PrintHeaderComponent,
    PrintFooterComponent,],
  templateUrl: './import-nomination-booking.component.html',
  styles: ``
})
export class ImportNominationBookingComponent {
    currentCompany: any;
    currentBranch: any;
    selectedData: any[];
    orientation: 'portrait' | 'landscape' = 'portrait';
    constructor(
      @Inject(REPORT_DATA) public data: any,
      private appSettingsService: AppSettingsService,
      private reportRegistryService: ReportRegistryService,
    ) {}
  
    ngOnInit(): void {
      this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
      this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
      this.orientation =
        this.reportRegistryService.getReportConfig(
          'nomination-booking',
        ).pdfOrientation;
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
   
    totalNoofPkgs() {
      return this.fullData?.data?.reduce((sum, item) => sum + item.NoofPkg, 0);
    }
    totalGrossWt() {
      return this.fullData?.data?.reduce((sum, item) => sum + item.GrossWt, 0);
    }
    totalVolume() {
      return this.fullData?.data?.reduce((sum, item) => sum + item.Volume, 0);
    }

    getExcelData(){
      const tableHeaders: ExcelHeader[] = [
        { key: 'bookingDate', label: 'Booking Date' },
        { key: 'bookingNumber', label: 'Booking No.' },
        { key: 'HBLNo', label: 'HBL No' },
        { key: 'jobType', label: 'Job Type' },
        { key: 'NoofPkg', label: 'No of Pkgs' },
        { key: 'GrossWt', label: 'Gross Weight' },
        { key: 'Volume', label: 'Volume' },
        { key: 'customerName', label: 'Customer' },
        { key: 'Dept', label: 'Dept' },
        { key: 'nominatedBy', label: 'Nominated By' },
        { key: 'POL', label: 'POL' },
        { key: 'FDC', label: 'FDC' },
        { key: 'Incoterms', label: 'Incoterms' },
        { key: 'originAgent', label: 'Origin Agent' },
        { key: 'salesperson', label: 'Salesperson' },
      ];

      const rows: ExcelRow[] = (this.fullData?.data || []).map((item) => {
        const cells: ExcelCell[] = [
          { value: this.formatDate(item.bookingDate || '') || '' },
          { value: item.bookingNumber || '' },
          { value: item.HBLNo || '' },
          { value: item.jobType || '' },
          { value: item.NoofPkg || 0 },
          { value: this.formatNumber(item.GrossWt) || 0 },
          { value: this.formatNumber(item.Volume) || 0 },
          { value: item.customerName || '' },
          { value: item.Dept || '' },
          { value: item.nominatedBy || '' },
          { value: item.POL || '' },
          { value: item.FDC || '' },
          { value: item.incoterms || '' },
          { value: item.originAgent || '' },
          { value: item.salesperson || '' },
        ];

        return { cells, style: 'data' };
      });

      rows.push({
        cells: [
          { value: 'Total' , colspan: 4 , alignment: { horizontal: 'right' } },
          { value: this.totalNoofPkgs() },
          { value: this.formatNumber(this.totalGrossWt()) },
          { value: this.formatNumber(this.totalVolume()) },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
           { value: '' },
        ],
        style: 'total',
      });

      return {
        fileName: 'ImportNominationBookingReport',
        sheetName: 'ImportNominationBookingReport',
        reportHeader: {
          companyName: this.currentCompany?.companyName || '',
          reportTitle: `Import Nomination Booking Report`,
          additionalInfo: [
            {
              label: 'Booking From Date',
              value: this.formatDate(this.params?.BookingFromDate),
            },
            { label: 'Booking To Date', value: this.formatDate(this.params?.BookingToDate) },
          ],
        },
        tableHeaders,
        rows,
        columnWidths: [
          14, 28, 6, 6, 6, 8, 8, 15, 4, 15, 15, 15, 15, 15, 15, 15, 15, 25,
        ],
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
}
