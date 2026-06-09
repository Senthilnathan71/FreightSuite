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
  selector: 'app-outturn-report',
  standalone: true,
  imports: [
    CustomDatePipe,
    CommonModule,
    PrintHeaderComponent,
    PrintFooterComponent,],
  templateUrl: './outturn-report.component.html',
  styles: ``,
})
export class OutturnReportComponent {
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
      this.reportRegistryService.getReportConfig('outturn').pdfOrientation;
  }

  get fullData(): any {
    return this.data || {};
  }

  get params(): any {
    return this.data?.params || {};
  }

  get reportData(): any[] {
    return this.fullData?.data || [];
  }

  isLastContainer(masterIndex: number, containerIndex: number): boolean {
    if (!this.reportData.length) {
      return true;
    }

    const lastMasterIndex = this.reportData.length - 1;
    const lastContainerIndex =
      (this.reportData[lastMasterIndex]?.containers?.length || 1) - 1;

    return (
      masterIndex === lastMasterIndex && containerIndex === lastContainerIndex
    );
  }

  getExcelData(): ComplexReportExportConfig {
    const tableHeaders: ExcelHeader[] = [
      { key: 'sno', label: 'SNo' },
      { key: 'hblNo', label: 'HBL No' },
      { key: 'marksAndNos', label: 'Manifested Marks & No' },
      { key: 'landedMarksAndNos', label: 'Actual Marks & Nos' },
      { key: 'manifestedQty', label: 'Qty Mnfst' },
      { key: 'qtyLanded', label: 'Qty Lnd' },
      { key: 'shortQty', label: 'Short' },
      { key: 'excessQty', label: 'Xcess' },
      { key: 'damageQty', label: 'Condition' },
      { key: 'packageType', label: 'Pkg Type' },
      { key: 'weight', label: 'Gross Wt' },
      { key: 'cbm', label: 'Vol (CBM)' },
      { key: 'jobType', label: 'Job Type' },
      { key: 'remarks', label: 'Notes' },
    ];

    const rows: ExcelRow[] = [];

      (this.reportData || []).forEach((master) => {
        (master?.containers || []).forEach((container: any) => {
          const vesselVoyage = `${master?.vesselName || container?.vesselName || '-'}${
            master?.voyageNo || container?.voyageNo
              ? ' / ' + (master?.voyageNo || container?.voyageNo)
              : ''
          }`;

          rows.push({
            cells: [
              { value: `MBL No : ${master?.mblNo || ''}`, colspan: 7 },
              { value: `Job Date : ${this.formatDate(master?.masterDate)}`, colspan: 7 },
            ],
            style: 'data',
          });

          rows.push({
            cells: [
              { value: `Job No : ${master?.masterJobNo || ''}`, colspan: 7 },
              { value: 'Container Owner : ', colspan: 7 },
            ],
            style: 'data',
          });

          rows.push({
            cells: [
              { value: `Manifest Seal : ${container?.lineSeal || ''}`, colspan: 7 },
              { value: `Container No : ${container?.containerNo || ''}`, colspan: 7 },
            ],
            style: 'data',
          });

          rows.push({
            cells: [
              {
                value: `Container Seal No : ${container?.customsSeal || container?.sealNo || ''}`,
                colspan: 7,
              },
              { value: `Vessel / Voyage : ${vesselVoyage}`, colspan: 7 },
            ],
            style: 'data',
          });

          rows.push({
            cells: [
              { value: 'Shift : ', colspan: 7 },
              {
                value: `De-Stuffing Location : ${container?.hblRows?.[0]?.cfs || ''}`,
                colspan: 7,
              },
            ],
            style: 'data',
          });

          rows.push({
            cells: [
              { value: `Size : ${container?.containerType || ''}`, colspan: 7 },
              { value: `Port of Load : ${container?.POL || ''}`, colspan: 7 },
            ],
            style: 'data',
          });

          rows.push({
            cells: [
              { value: `Origin Agent : ${container?.originAgent || ''}`, colspan: 7 },
              {
                value: `Vessel Arrival : ${this.formatDate(master?.ata || container?.ata)}`,
                colspan: 7,
              },
            ],
            style: 'data',
          });

          rows.push({
            cells: [
              { value: '', colspan: 7 },
              { value: `De-Stuff Date : ${this.formatDate(this.params?.ToDate)}`, colspan: 7 },
            ],
            style: 'data',
          });

          rows.push({
            cells: [{ value: '', colspan: 14 }],
            style: 'data',
          });

          rows.push({
            cells: tableHeaders.map((header) => ({
              value: header.label,
              alignment: { horizontal: 'center' },
          })),
          style: 'header',
        });

        (container?.hblRows || []).forEach((row: any, rowIndex: number) => {
          const cells: ExcelCell[] = [
            { value: rowIndex + 1, alignment: { horizontal: 'center' } },
            { value: row?.hblNo || '' },
            { value: row?.marksAndNos || '' },
            { value: row?.landedMarksAndNos || '' },
            { value: row?.manifestedQty || 0, alignment: { horizontal: 'right' } },
            { value: row?.qtyLanded || 0, alignment: { horizontal: 'right' } },
            { value: row?.shortQty || 0, alignment: { horizontal: 'right' } },
            { value: row?.excessQty || 0, alignment: { horizontal: 'right' } },
            { value: row?.damageQty || 0, alignment: { horizontal: 'right' } },
            { value: row?.packageType || '' },
            { value: row?.weight || 0, alignment: { horizontal: 'right' } },
            { value: row?.cbm || 0, alignment: { horizontal: 'right' } },
            { value: row?.jobType || '' },
            { value: row?.remarks || '' },
          ];

          rows.push({ cells, style: 'data' });
        });

        if (!container?.hblRows?.length) {
          rows.push({
            cells: [{ value: 'No Record Found', colspan: 14, alignment: { horizontal: 'center' } }],
            style: 'data',
          });
        }

        rows.push({
          cells: [{ value: '', colspan: 14 }],
          style: 'data',
        });
      });
    });

    return {
      fileName: 'Outturn-Report',
      sheetName: 'OutturnReport',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: 'OutTurn Report',
        additionalInfo: [
          {
            label: 'From Date',
            value: this.formatDate(this.params?.FromDate),
          },
          {
            label: 'To Date',
            value: this.formatDate(this.params?.ToDate),
          },
        ],
      },
      tableHeaders,
      includeTableHeaders: false,
      rows,
      columnWidths: [8, 18, 26, 26, 12, 12, 10, 10, 12, 14, 14, 14, 12, 24],
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
