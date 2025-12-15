import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';

@Component({
  selector: 'app-shipment',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './shipment.component.html',
  styles: ``
})
export class ShipmentComponent {
  currentCompany: any
  currentBranch: any;
  userData: any
  currentDate = new Date()
    branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;

  profitSummary : any;
  @Input() housejobData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL: any;

  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;
  @Input() chargeList:any;
  rateResult : any[] = [];
  @Input() customerWiseSummary : any;
  @Input() chargeWiseSummary : any;

    showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;
  
  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    console.log('houseJobData',this.housejobData);
   this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    console.log(this.branchDetails, "BRANCH DETAILS");
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
  }

    loadCityName(): void {
    if (!this.currentBranchCityId) return;


    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {
        console.log("City API response:", response);

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
          console.log("Final City Name:", this.currentBranchCityName);
        }

 
      },
      error: (error) => {
        console.error("Failed to load city:", error);
   
      }
    });
  }

  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private pdfService: PdfDownloadService,
    private spinner: NgxSpinnerService,
  ) { }


getChargeName(ChargeMasterSid: number): string {
  console.log("Status",{
    ChargeMasterSid,
    list : this.chargeList
  })
  if (!ChargeMasterSid) return 'N/A';
  if (!this.chargeList?.length) return 'N/A';

  const charge = this.chargeList.find(c =>
    c.ChargeMasterSid === ChargeMasterSid || c.ChargeMasterSID === ChargeMasterSid
  );

  console.log(charge,"Charge Name")
  return charge ? (charge.chargeName || charge.chargeCode || charge.chargeCode ) : 'N/A';
}


  calculateChargeWiseProfit() {
    this.profitSummary = [];
    const rateFormValue = this.rateResult || [];
    const data = [...rateFormValue];

    data.forEach(item => {
      console.log(item);
      const costAmt = parseFloat(item.CostLocalAmount);
      const revenueAmt = parseFloat(item.RevenueLocalAmount);
      const charge = this.chargeList.find(c => c.ChargeMasterSid === item.ChargeMasterSid);
      const chargeName = charge ? charge.chargeName : "Unknown";

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

    console.log(this.profitSummary);
  }

    calculateCustomerWiseAmount() {
    this.customerWiseSummary = {};
    const data = this.rateResult || [];

    const costHmap = new Map<number, CustomerProfit>();
    const revenueHmap = new Map<number, CustomerProfit>();

    // --- COST SUMMARY ---
    data.forEach(item => {
      const costAmt = parseFloat(item.CostLocalAmount) || 0;
      const customerName = item.costCustomerMaster?.CustomerName || "";
      const customerId = item.costCustomerMaster?.CustomerMasterSid || 0;

      const prevData = costHmap.get(customerId);
      const amtChange = item.CostDrCr === "D" ? costAmt : -costAmt;

      if (prevData) {
        prevData.Amount += amtChange;
      } else {
        costHmap.set(customerId, {
          CustomerName: customerName,
          Amount: amtChange
        });
      }
    });

    // --- REVENUE SUMMARY ---
    data.forEach(item => {
      const revenueAmt = parseFloat(item.RevenueLocalAmount) || 0;
      const customerName = item.revenueCustomerMaster?.CustomerName || "";
      const customerId = item.revenueCustomerMaster?.CustomerMasterSid || 0;

      const prevData = revenueHmap.get(customerId);
      const amtChange = item.RevenueDrCr === "C" ? revenueAmt : -revenueAmt;

      if (prevData) {
        prevData.Amount += amtChange;
      } else {
        revenueHmap.set(customerId, {
          CustomerName: customerName,
          Amount: amtChange
        });
      }
    });

    // --- LOGS & ASSIGNMENT ---
    console.log("Cost Summary:", costHmap);
    console.log("Revenue Summary:", revenueHmap);

    this.customerWiseSummary = {
      cost: Array.from(costHmap.values()),
      revenue: Array.from(revenueHmap.values())
    };
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

  calculateTotals(): any {
    if (!this.housejobData?.costRevenueCharges) {
      return {
        totalPCurrRevenue: 0,
        totalPCurrExpense: 0,
        totalPCurrGP: 0,
        totalLocalRevenue: 0,
        totalLocalExpense: 0,
        totalLocalGP: 0
      };
    }

    let totalPCurrRevenue = 0;
    let totalPCurrExpense = 0;
    let totalLocalRevenue = 0;
    let totalLocalExpense = 0;

    this.housejobData.costRevenueCharges.forEach((chargeItem: any) => {
      totalPCurrRevenue += parseFloat(this.getPCurrRevenue(chargeItem)) || 0;
      totalPCurrExpense += parseFloat(this.getPCurrExpense(chargeItem)) || 0;
      totalLocalRevenue += parseFloat(this.getLocalRevenue(chargeItem)) || 0;
      totalLocalExpense += parseFloat(this.getLocalExpense(chargeItem)) || 0;
    });

    return {
      totalPCurrRevenue: this.formatNumber(totalPCurrRevenue),
      totalPCurrExpense: this.formatNumber(totalPCurrExpense),
      totalPCurrGP: this.formatNumber(totalPCurrRevenue - totalPCurrExpense),
      totalLocalRevenue: this.formatNumber(totalLocalRevenue),
      totalLocalExpense: this.formatNumber(totalLocalExpense),
      totalLocalGP: this.formatNumber(totalLocalRevenue - totalLocalExpense)
    };
  }

  getPCurrExpense(chargeData: any): string {
    if (!chargeData) return '-';

    const localAmount = parseFloat(chargeData.CostLocalAmount || '0');
    const exchangeRate = parseFloat(chargeData.CostExchangeRate || '1');

    if (exchangeRate === 0) return '0.00';

    const usdAmount = localAmount / exchangeRate;
    return this.formatNumber(usdAmount);
  }

  // P.Curr GP (Gross Profit in USD)
  getPCurrGP(chargeData: any): string {
    const revenue = parseFloat(this.getPCurrRevenue(chargeData)) || 0;
    const expense = parseFloat(this.getPCurrExpense(chargeData)) || 0;
    const gp = revenue - expense;
    return this.formatNumber(gp);
  }

  // Local P.Revenue (in Local Currency)
  getLocalRevenue(chargeData: any): string {
    if (!chargeData) return '-';
    return this.formatNumber(parseFloat(chargeData.RevenueLocalAmount || '0'));
  }

  // Local P.Expense (in Local Currency)
  getLocalExpense(chargeData: any): string {
    if (!chargeData) return '-';
    return this.formatNumber(parseFloat(chargeData.CostLocalAmount || '0'));
  }

  // Local P.GP (Gross Profit in Local Currency)
  getLocalGP(chargeData: any): string {
    const revenue = parseFloat(this.getLocalRevenue(chargeData)) || 0;
    const expense = parseFloat(this.getLocalExpense(chargeData)) || 0;
    const gp = revenue - expense;
    return this.formatNumber(gp);
  }

  getPCurrRevenue(chargeData: any): string {
    if (!chargeData) return '-';

    const localAmount = parseFloat(chargeData.RevenueLocalAmount || '0');
    const exchangeRate = parseFloat(chargeData.RevenueExchangeRate || '1');

    if (exchangeRate === 0) return '0.00';

    const usdAmount = localAmount / exchangeRate;
    return this.formatNumber(usdAmount);
  }

  private formatNumber(value: number): string {
    if (isNaN(value)) return '0.00';
    return value.toFixed(2);
  }

  get totalGrossWeight(): number {
    return this.housejobData?.Cargo?.reduce((sum, c) => sum + Number(c.GrossWeight || 0), 0) || 0;
  }

  get totalVolume(): number {
    return this.housejobData?.Cargo?.reduce((sum, c) => sum + Number(c.Volume || 0), 0) || 0;
  }

  get totalChargeableWeight(): number {
    return this.housejobData?.Cargo?.reduce((sum, c) => sum + Number(c.ChargeableWeight || 0), 0) || 0;
  }

  get totalNetWeight(): number {
    return this.housejobData?.Cargo?.reduce((sum, c) => sum + Number(c.NetWeight || 0), 0) || 0;
  }

  modalClose() {
    this.activeModal.close()
  }

   getContainerName(ContainerTypeMasterSid:number){
    console.log(ContainerTypeMasterSid);
    if(!ContainerTypeMasterSid || this.containerTypeList.length === 0){
      return "";
    }
    console.log("HERE",this.containerTypeList)
    return this.containerTypeList.find(con => con.ContainerTypeMasterSid === ContainerTypeMasterSid)?.ContainerName || ""
  }

   formatVesselVoyage(vessel?: string, voyage?: string): string {
 
  // both vessel and voyage present
 
  if (vessel && voyage) {
 
    return `: ${vessel} / ${voyage}`;
 
  }
 
  // only vessel present
 
  else if (vessel) {
 
    return `:${vessel}`;
 
  }
 
  // only voyage present
 
  else if (voyage) {
 
    return `:${voyage}`;
 
  }
 
  // none present
 
  return ':';
 
}

// pdf download



  async downloadPDF() {
  this.showPrintLogo = false;
  this.showPdfLogo = true;

  setTimeout(async () => {
    this.spinner.show();
   try {
       const HouseJob = this.housejobData?.ShipmentNo || 'Receipt';
      await this.pdfService.downloadBalancedPDF(
        'printContent',
        `Shipment_${HouseJob}`,
        () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
        (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
      );
    } finally {
      this.spinner.hide();
    }
  }, 50);
}

    async generatePDFBlob(): Promise<Blob | null> {
          const printContent = document.getElementById('printContent');
          if (!printContent) {
            return null;
          }
      
          try {
            const canvas = await html2canvas(printContent, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
            });
      
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
      
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
      
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
      
            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
      
            return pdf.output('blob');
          } catch (error) {
            console.error('Error generating PDF blob:', error);
            return null;
          }
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


interface CustomerProfit {
  CustomerName : string,
  Amount : number
}
