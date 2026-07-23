import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { OperationService } from '../../../operation.service';
import { saveAs } from 'file-saver';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { toNumber } from 'src/app/common/helper';

interface summaryDTO {
  revenue : any[];
  cost : any[];
}


@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule, CustomDatePipe,PrintFooterComponent,PrintHeaderComponent],
  templateUrl: './job-card.component.html',
  styles: ``
})
export class JobCardComponent implements OnChanges {
 userData: any;
  currentCompany: any;
  currentBranch: any;
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  currentDate = new Date();
  @Input() housejobData: any;
  @Input() masterJobData: any;
  @Input() containerTypeList: any[] = [];
  @Input() masterJobContainers: any[] = [];
  @Input() packageTypeList: any[] = [];
  @Input() agentList: any[] = [];
  @Input() currencyList: any[] = [];
   profitSummary: any[] = [];
  @Input() customerWiseSummary : summaryDTO;
  @Input() chargeWiseSummary : any[] = [];
  @Input() chargeList: any[] =[];
  @Input() uomList: any[] = [];
  salemanList:any[] = [];
  @Input() portList: any[] = []; // Add this input
  @Input() selectedDepartmentType : any;
  @Input() houseMenuMasterSid: number | null = null;
   showPrintLogo: boolean = false;
    showPdfLogo: boolean = true;

  constructor(
    private appSettingsService: AppSettingsService,
    private activeModal: NgbActiveModal,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private pdfMakeService: PdfMakeService,
    public logoService : LogoService,
    public mps: MenuPermissionService,
    private operationService: OperationService,
    private modalService: NgbModal,
    private emailTriggerService: EmailTriggerService,
    private companySettings: CompanySettingsManagerService
  ) { }

  ngOnInit() {
    this.userData = this.appSettingsService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingsService.decrypt(
      localStorage.getItem('selected-company')
    );
    this.currentBranch = this.appSettingsService.decrypt(
      localStorage.getItem('selected-branch')
    );
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.getSalespersons();
    this.loadCityName();
    this.calculateChargeWiseProfit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(
      changes['housejobData'].previousValue !== changes['housejobData'].currentValue && 
      !changes['housejobData'].firstChange
    ){
      this.calculateChargeWiseProfit();
    }
  }

  loadCityName(): void {
    if (!this.currentBranchCityId) return;

    this.spinner.show();

    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
        }

        this.spinner.hide();
      },
      error: (error) => {
        console.error("Failed to load city:", error);
        this.spinner.hide();
      }
    });
  }

  getSalespersons(){
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.masterService.getAllSalesmans(CompanyMasterSid).subscribe(
      (resp)=>{
        this.salemanList=resp;
      }
    )
  }

  getSalespersonName(UserMasterSid:number){
  const salesman = this.salemanList.find(s => s.UserMasterSid === UserMasterSid);
  return salesman ? salesman.userName : '';
  }

  // Helper methods

  getContainerTypeName(ContainerTypeMasterSid: number): string {
    if (!ContainerTypeMasterSid || !this.containerTypeList?.length) {
      return '';
    }
    const containerType = this.containerTypeList.find(
      (ct) => ct.ContainerTypeMasterSid === ContainerTypeMasterSid
    );
    return containerType?.ContainerName || containerType?.ContainerType || containerType?.ContainerCode || '';
  }

  getChargeName(ChargeMasterSid: number): string {
    if (!ChargeMasterSid || !this.chargeList || this.chargeList.length === 0) {
      return '';
    }
    const charge = this.chargeList.find(
      (c) => c.ChargeMasterSid === ChargeMasterSid
    );
    return charge ? charge.chargeName || charge.ChargeName || 'N/A' : 'N/A';
  }

  getUnitCode(ChargeUomSid: number):string {
   
    if (!ChargeUomSid || !this.uomList || this.uomList.length === 0) {
      return '';
    }
    const uom = this.uomList.find(item => item.UOMMasterSid === ChargeUomSid);
    return uom ? uom.UOMCode : '';
  }

  getCurrencyName(CurrencyMasterSid: number): string {

    if (
      !CurrencyMasterSid ||
      !this.currencyList ||
      this.currencyList.length === 0
    ) {
      return '';
    }

    const currency = this.currencyList.find(
      (c) => c.CurrencyMasterSid === CurrencyMasterSid
    );
    return currency
      ? currency.currencyCode || currency.CurrencyCode || ''
      : 'N/A';
  }

  get totalLength(): number {
    return this.jobCardRows.reduce((sum, c) => {
      const value = Number(c.Length) || 0;
      return sum + value;
    }, 0);
  }
      get totalWidth(): number {
    return this.jobCardRows.reduce((sum, c) => {
      const value = Number(c.Width) || 0;
      return sum + value;
    }, 0);
  }
      get totalHeight(): number {
    return this.jobCardRows.reduce((sum, c) => {
      const value = Number(c.Height) || 0;
      return sum + value;
    }, 0);
  }
      get totalVolumteric(): number {
    return this.jobCardRows.reduce((sum, c) => {
      const value = Number(c.Volumetric) || 0;
      return sum + value;
    }, 0);
  }

  get totalNoOfPkg(): number {
    return this.jobCardRows.reduce((sum, c) => {
      const value = Number(c.ExternlQty ?? c.NoOfPackage) || 0;
      return sum + value;
    }, 0);
  }

  get totalGrossWeight(): number {
    return this.jobCardRows.reduce((sum, c) => {
      const value = Number(c.GrossWeight) || 0;
      return sum + value;
    }, 0);
  }

  get totalVolume(): number {
    return this.jobCardRows.reduce((sum, c) => {
      const value = Number(c.Volume) || 0;
      return sum + value;
    }, 0);
  }

  get totalNetWeight(): number {
    return this.jobCardRows.reduce((sum, c) => {
      const value = Number(c.NetWeight) || 0;
      return sum + value;
    }, 0);
  }

  get jobCardRows(): any[] {
    const products = this.housejobData?.Products || [];
    if (products.length) {
      return products;
    }

    const cargoRows = this.housejobData?.Cargo || [];
    return cargoRows.map((cargo: any) => ({
      ProductName: cargo?.CommodityDescription,
      ContainerNo: cargo?.ContainerNo || cargo?.NoofContainers || '',
      ContainerType: cargo?.ContainerType,
      ExternlQty: cargo?.ExternlQty ?? cargo?.NoOfPackage,
      NoOfPackage: cargo?.NoOfPackage,
      GrossWeight: cargo?.GrossWeight,
      Volume: cargo?.Volume,
      NetWeight: cargo?.NetWeight,
      Length: cargo?.Length,
      Width: cargo?.Width,
      Height: cargo?.Height,
      Volumetric: cargo?.Volumetric
    }));
  }

  getInternalRemarks(): string {
    return this.housejobData?.InternalNote || this.housejobData?.Others?.[0]?.InternalNote || '';
  }

get totalSales() {
  if (!this.profitSummary || !Array.isArray(this.profitSummary)) {
    return 0;
  }

  return this.profitSummary.reduce((sum, c) => {
    const value = Number(c.totalSales) || 0;
    return sum + value;
  }, 0);
}

get totalCost() {
  if (!this.profitSummary || !Array.isArray(this.profitSummary)) {
    return 0;
  }

  return this.profitSummary.reduce((sum, c) => {
    const value = Number(c.totalCost) || 0;
    return sum + value;
  }, 0);
}

get profit() {
  if (!this.profitSummary || !Array.isArray(this.profitSummary)) {
    return 0;
  }

  return this.profitSummary.reduce((sum, c) => {
    const value = Number(c.profit) || 0;
    return sum + value;
  }, 0);
}

 calculateChargeWiseProfit() {
    this.profitSummary = [];
    const rateFormValue = this.housejobData?.costRevenueCharges|| [];
    const data = [...rateFormValue];

    data.forEach(item => {
      const costAmt = toNumber(item.CostLocalAmount);
      const revenueAmt = toNumber(item.RevenueLocalAmount);
      const charge = this.chargeList.find(c => c.ChargeMasterSid === item.ChargeMasterSid);
      const chargeName = charge?.chargeName || charge?.ChargeName || item?.ChargeDescription || "";

      let existing = this.profitSummary.find(p => p.chargeName === chargeName);

      if (!existing) {
        existing = {
          chargeName,
          totalSales: 0,
          totalCost: 0,
          profit: 0,
          profitPercent: "0%"
        };
        this.profitSummary.push(existing);
      }

      // if (item.CostRevenue === "Cost") {
        existing.totalCost += item.CostDrCr === "D" ? costAmt : -costAmt;
      // }

      // if (item.CostRevenue === "Revenue") {
        existing.totalSales += item.RevenueDrCr === "C" ? revenueAmt : -revenueAmt;
      // }
    });

    this.profitSummary.forEach(p => {
      let profit: number;
      let profitPercent: number;

      if (p.totalSales > p.totalCost) {
        profit = p.totalSales - p.totalCost;
        profitPercent = p.totalSales !== 0 ? (profit / p.totalSales) * 100 : 0;
      } else {
        profit = -(p.totalCost - p.totalSales);
        profitPercent = p.totalCost !== 0 ? (profit / p.totalCost) * 100 : 0;
      }

      p.profit = profit.toFixed(2);
      p.profitPercent = profitPercent.toFixed(2) + "%";
      p.totalSales = p.totalSales.toFixed(2);
      p.totalCost = p.totalCost.toFixed(2);
    });

  }

  
 getPortName(portCode: string): string {
    if (!portCode || !this.portList || this.portList.length === 0) {
      return portCode || '';
    }
    
    const port = this.portList.find(p => p.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  }

 getGroupedRevenueByParty() {
  if (!this.housejobData?.costRevenueCharges) return [];

  const map = new Map<string, number>();

  this.housejobData.costRevenueCharges.forEach(item => {
    const party = item?.revenueCustomerMaster?.CustomerName;
    const amount = Number(item?.RevenueLocalAmount) || 0;

    if (party && amount) {
      map.set(party, (map.get(party) || 0) + amount);
    }
  });

  return Array.from(map.entries()).map(([party, amount]) => ({
    party,
    amount
  }));
}

getGroupedExpenseByParty() {
  if (!this.housejobData?.costRevenueCharges) return [];

  const map = new Map<string, number>();

  this.housejobData.costRevenueCharges.forEach(item => {
    const party = item?.costCustomerMaster?.CustomerName;
    const amount = Number(item?.CostLocalAmount) || 0;

    if (party && amount) {
      map.set(party, (map.get(party) || 0) + amount);
    }
  });

  return Array.from(map.entries()).map(([party, amount]) => ({
    party,
    amount
  }));
}

getActualRevenueLocalAmount(item: any): number {
  const voucherActuals = this.getActualAmountsFromVoucherDetails(item);
  if (voucherActuals.revenue !== 0) {
    return voucherActuals.revenue;
  }

  const hasRevenueVoucher = !!(item?.RevenueVoucherHeaderSid || item?.revenueVoucherHeader?.VoucherHeaderSid);
  if (!hasRevenueVoucher) return 0;

  return Number(
    item?.ActualRevenueLocalAmount ??
    item?.RevenueActualLocalAmount ??
    item?.ActRevenueLocalAmount ??
    item?.ActLocalRevenueAmount ??
    item?.RevenueLocalAmount ??
    0
  ) || 0;
}

getActualCostLocalAmount(item: any): number {
  const voucherActuals = this.getActualAmountsFromVoucherDetails(item);
  if (voucherActuals.cost !== 0) {
    return voucherActuals.cost;
  }

  const hasCostVoucher = !!(item?.CostVoucherHeaderSid || item?.costVoucherHeader?.VoucherHeaderSid);
  if (!hasCostVoucher) return 0;

  return Number(
    item?.ActualCostLocalAmount ??
    item?.CostActualLocalAmount ??
    item?.ActCostLocalAmount ??
    item?.ActLocalCostAmount ??
    item?.CostLocalAmount ??
    0
  ) || 0;
}

get totalRevenueLocalAmount(): number {
  const charges = this.housejobData?.costRevenueCharges || [];
  return charges.reduce((sum: number, item: any) => sum + (Number(item?.RevenueLocalAmount) || 0), 0);
}

get totalActualRevenueLocalAmount(): number {
  const charges = this.housejobData?.costRevenueCharges || [];
  return charges.reduce((sum: number, item: any) => sum + this.getActualRevenueLocalAmount(item), 0);
}

get totalCostLocalAmount(): number {
  const charges = this.housejobData?.costRevenueCharges || [];
  return charges.reduce((sum: number, item: any) => sum + (Number(item?.CostLocalAmount) || 0), 0);
}

get totalActualCostLocalAmount(): number {
  const charges = this.housejobData?.costRevenueCharges || [];
  return charges.reduce((sum: number, item: any) => sum + this.getActualCostLocalAmount(item), 0);
}

private getActualAmountsFromVoucherDetails(item: any): { revenue: number; cost: number } {
  const voucherDetails =
    item?.voucherDetail || item?.VoucherDetail || item?.VoucherDetails;
  if (!Array.isArray(voucherDetails)) {
    return { revenue: 0, cost: 0 };
  }

  return voucherDetails.reduce(
    (totals: { revenue: number; cost: number }, detail: any) => {
      const costRevenue = (detail?.CostRevenue || detail?.costRevenue || '').toString().toUpperCase();
      const drCr = (detail?.DrCr || detail?.drCr || '').toString().toUpperCase();
      const amount = parseFloat(detail?.LocalAmount || detail?.localAmount || 0) || 0;

      if (costRevenue === 'REVENUE') {
        totals.revenue += drCr === 'C' ? amount : -amount;
      } else if (costRevenue === 'COST') {
        totals.cost += drCr === 'D' ? amount : -amount;
      }

      return totals;
    },
    { revenue: 0, cost: 0 }
  );
}

  async sendMail(): Promise<void> {
    this.spinner.show();

    try {
      const blob = await this.generatePDFBlob();
      if (!blob) {
        this.appSettingService.showError('Error generating PDF. Please try again.');
        return;
      }

      const jobNo = this.housejobData?.masterJob?.MasterJobNumber || this.masterJobData?.MasterJobNumber || this.housejobData?.ShipmentNo || '';
      const hblNo = this.housejobData?.HBLNo || '';
      const documentName = 'Job Card';
      const documentDate = this.formatEmailDate(this.housejobData?.HBLDate || this.housejobData?.HouseJobDate);
      const toEmail = await this.emailTriggerService.resolveCustomerBranchEmailsByMenu({
        customerBranchSid: this.getCustomerBranchSidForEmail(),
        customerMasterSid: this.getCustomerMasterSidForEmail(),
        menuMasterSid: this.getCurrentMenuMasterSidForEmail()
      });
      const attachmentRequired = await this.emailTriggerService.isAttachmentRequiredForMenu(this.appSettingService.getCurrentCompanyInfo()?.CompanyMasterSid, this.getCurrentMenuMasterSidForEmail());

      if (toEmail.length === 0) {
        this.appSettingService.showError('No email found in customer branch email.');
        return;
      }

      const emailContent = this.emailTriggerService.buildOperationEmailContent({
        documentName,
        documentNoLabel: 'Job No.',
        documentNo: jobNo || hblNo,
        documentDate,
        pol: this.housejobData?.POL || '',
        pod: this.housejobData?.POD || '',
        fpd: this.housejobData?.FPD || '',
        userName: this.userData?.userName || '',
        introLine: `Please find attached the ${documentName} for your reference.`,
        followupLine: 'Kindly review the attached details at your convenience.'
      });

      const file = new File([blob], `Job_Card_${jobNo || hblNo || 'Report'}.pdf`, { type: 'application/pdf' });
      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        EmailTo: toEmail,
        EmailCC: this.userData?.userEmail ? [this.userData.userEmail] : [],
        EmailBCC: [],
        Subject: emailContent.subject,
        Mailbody: emailContent.body,
        context: {
          documentName,
          documentNoLabel: 'Job No',
          menuName: documentName,
          documentNo: jobNo || hblNo,
          date: documentDate,
          pol: this.housejobData?.POL || '',
          pod: this.housejobData?.POD || '',
          fpd: this.housejobData?.FPD || ''
        },
        attachmentRequired,
        // Print "Send Mail" always carries the generated PDF, even when the
        // menu's Mail Configuration has AttachmentRequire = No.
        attachments: [file]
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.createEmailAuditLog(documentName);
      });
    } catch (error) {
      console.error('Job Card email error:', error);
      this.appSettingService.showError('Error preparing email');
    } finally {
      this.spinner.hide();
    }
  }

  async generatePDFBlob(): Promise<Blob | null> {
    try {
      const logo = this.pdfMakeService.getReportLogo();
      return await this.pdfMakeService.generateJobCardBlobFromApi(
        this.housejobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        this.getJobCardPdfOptions()
      );
    } catch (error) {
      console.error('Job Card PDF blob error:', error);
      return null;
    }
  }

  private createEmailAuditLog(documentName: string): void {
    const payload = {
      tableName: 'HouseJob',
      recordId: String(this.housejobData?.HouseJobSid),
      operation: 'EMAIL',
      changedBy: this.appSettingService.userSettingSource.value['userEmail'],
      changes: {
        action: 'Send Mail'
      },
      newVal: {
        Email: `${documentName} Mail Send`
      }
    };

    this.operationService.createAuditLog(payload).subscribe({
      next: () => { },
      error: (err) => console.error(err)
    });
  }

  private getCustomerBranchSidForEmail(): number | null {
    const candidates = [
      this.housejobData?.CustomerBranchSid,
      this.housejobData?.customerBranch?.CustomerBranchSid,
      this.housejobData?.CustomerBranch?.CustomerBranchSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCustomerMasterSidForEmail(): number | null {
    const candidates = [
      this.housejobData?.CustomerMasterSid,
      this.housejobData?.customerMaster?.CustomerMasterSid,
      this.housejobData?.CustomerMaster?.CustomerMasterSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCurrentMenuMasterSidForEmail(): number | null {
    const sid = Number(
      this.houseMenuMasterSid ||
      this.housejobData?.MenuMasterSid
    );

    return Number.isFinite(sid) && sid > 0 ? sid : null;
  }

  private formatEmailDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB');
  }



  modalClose() {
    this.activeModal.close();
  }


   async downloadPDF() {


  setTimeout(async () => {
    this.spinner.show();
   try {
      const logo = this.pdfMakeService.getReportLogo();
      const blob = await this.pdfMakeService.generateJobCardBlobFromApi(
        this.housejobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        this.getJobCardPdfOptions()
      );

      if (!blob) {
        this.appSettingService.showError('No data available to generate PDF');
        return;
      }

      const jobNo = this.housejobData?.masterJob?.MasterJobNumber || '';
      const hblNo = this.housejobData?.HBLNo || '';
      saveAs(blob, `Job_Card_${jobNo || hblNo || 'Report'}.pdf`);
      this.appSettingService.showSuccess('PDF downloaded successfully!');
      const payload = {
        tableName: 'HouseJob',
        recordId: String(this.housejobData?.HouseJobSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          PDF: 'Job Card PDF Downloaded'
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      console.error('Job card PDF generation failed:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }, 50);
}

  private getJobCardPdfOptions() {
    return {
      containerTypeList: this.containerTypeList || [],
      currencyList: this.currencyList || [],
      chargeList: this.chargeList || [],
      profitSummary: this.profitSummary || [],
      salesmenList: this.salemanList || [],
      uomList: this.uomList || [],
      portList: this.portList || [],
      selectedDepartmentType: this.selectedDepartmentType || '',
      printSettings: this.companySettings.getPrintSettings()
    };
  }

  
printDiv(divId: string): void {
  this.showPrintLogo = true;
  this.showPdfLogo = false;

  setTimeout(() => {
    const printContents = document.getElementById(divId)?.innerHTML;
    if (!printContents) return;

    const popupWin = window.open('', '_blank', 'width=900,height=600');
    if (popupWin) {
      popupWin.document.open();
      popupWin.document.write(`
        <html>
          <head>
            <title>Print</title>
          </head>
          <body onload="window.print(); window.close();">
            ${printContents}
          </body>
        </html>
      `);
      popupWin.document.close();
    }
  }, 50); 
}


}
