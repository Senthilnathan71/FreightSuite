import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-vat-210',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './vat-210.component.html',
  styles: ``
})
export class Vat210Component {

  currentCompany: any;
  currentBranch: any;
  selectedData: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService
  ) {
    console.log('VAT Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('vat-report').pdfOrientation;
  }

  get fullData(): any {
    return this.data || {};
  }

  get param(): any {
    return this.data?.param || {};
  }


  get localInputTax(): any[] {
    return this.fullData?.inputTax?.local || [];
  }

  get outSideInputTax(): any[] {
    return this.fullData?.inputTax?.overseas || [];
  }

  get localoutputTax(): any[] {
    return this.fullData?.outputTax?.local || [];
  }

  get overseasoutputTax(): any[] {
    return this.fullData?.outputTax?.overseas || [];
  }

  get summary() {
    return this.fullData?.summary || {};
  }


  get bucketLabels(): any {
    return this.fullData?.bucketLabels || [];
  }



  get localSalesTaxableTotal(): number {
    return this.localInputTax?.reduce(
      (sum, x) => sum + (x.TaxableAmount || 0),
      0
    );
  }

  get localSalesTaxTotal(): number {
    return this.localInputTax?.reduce(
      (sum, x) => sum + (x.TaxAmount || 0),
      0
    );
  }



  get overseasSalesTaxableTotal(): number {
    return this.outSideInputTax?.reduce(
      (sum, x) => sum + (x.TaxableAmount || 0),
      0
    );
  }

  get overseasSalesTaxTotal(): number {
    return this.outSideInputTax?.reduce(
      (sum, x) => sum + (x.TaxAmount || 0),
      0
    );
  }



  get localPurchaseTaxableTotal(): number {
    return this.localoutputTax?.reduce(
      (sum, x) => sum + (x.TaxableAmount || 0),
      0
    );
  }

  get localPurchaseTaxTotal(): number {
    return this.localoutputTax?.reduce(
      (sum, x) => sum + (x.TaxAmount || 0),
      0
    );
  }


  get overseasPurchaseTaxableTotal(): number {
    return this.overseasoutputTax?.reduce(
      (sum, x) => sum + (x.TaxableAmount || 0),
      0
    );
  }

  get overseasPurchaseTaxTotal(): number {
    return this.overseasoutputTax?.reduce(
      (sum, x) => sum + (x.TaxAmount || 0),
      0
    );
  }


  get grandSalesTaxableTotal(): number {
  return (
    (this.localSalesTaxableTotal || 0) +
    (this.overseasSalesTaxableTotal || 0)
  );
}

get grandSalesTaxTotal(): number {
  return (
    (this.localSalesTaxTotal || 0) +
    (this.overseasSalesTaxTotal || 0)
  );
}


get grandPurchaseTaxableTotal(): number {
  return (
    (this.localPurchaseTaxableTotal || 0) +
    (this.overseasPurchaseTaxableTotal || 0)
  );
}

get grandPurchaseTaxTotal(): number {
  return (
    (this.localPurchaseTaxTotal || 0) +
    (this.overseasPurchaseTaxTotal || 0)
  );
}


get vatPayableAmountLocal(): number {
  return (
    (this.grandSalesTaxableTotal || 0) -
    (this.grandPurchaseTaxableTotal || 0)
  );
}


get vatPayableAmountOversea(): number {
  return (
    (this.grandSalesTaxTotal || 0) -
    (this.grandPurchaseTaxTotal || 0)
  );
}


}
