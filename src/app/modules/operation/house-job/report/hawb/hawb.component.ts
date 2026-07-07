import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { OperationService } from '../../../operation.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { firstValueFrom } from 'rxjs';
import { SafeInsertShipmentMilestone, ShipmentMilestoneService } from 'src/app/modules/operation/services/shipment-milestone.service';

@Component({
  selector: 'app-hawb',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './hawb.component.html',
  styles: ``,
})
export class HAWBComponent {
  currentCompany: any;
  currentBranch: any;
  userData: any;
  currentDate = new Date();
  currentCountry: any;
  currentCurrency: any;
  currentCountryName: number;
  currentCurrencyCode: number;
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;

  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;

  @Input() housejobData: any;
  @Input() masterJobData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL: any;
  @Input() selectedReportAir: 'HAWB' | 'HAWBDraft' = 'HAWB';
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() packageTypeList: any;
  @Input() containerTypeList: any;
  @Input() chargeList: any;
  @Output() hblCountUpdated = new EventEmitter<void>();
  // "Draft AWB" (DRAFT) milestone plumbing — parent sets these only for the HAWBDraft print.
  @Input() milestonePayload?: SafeInsertShipmentMilestone;
  @Input() autoInsertMilestone = false;
  @Output() reloadMilestone = new EventEmitter<void>();
  private milestoneInserted = false;
  costRevenueCharges: any[] = [];
  freightCharges: any[] = [];
  otherCharges: any[] = [];
  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company')
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch')
    );

    if (this.currentCompany && this.userData?.userCompanyMaster) {
      const companyRecord = this.userData.userCompanyMaster.find(
        (c: any) => c.CompanyMasterSid === this.currentCompany.CompanyMasterSid
      );
      this.currentCompany = companyRecord?.companyMaster || this.currentCompany;
    }

    if (this.currentBranch && this.currentCompany?.userBranchMaster) {
      const branchRecord = this.currentCompany.userBranchMaster.find(
        (b: any) => b.BranchMasterSid === this.currentBranch.BranchMasterSid
      );
      this.currentBranch = branchRecord?.branchMaster || this.currentBranch;
    }

    // IDs
    this.currentCountry = Number(this.currentCompany?.CountryMasterSid);
    this.currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);

    // Convert ID → Name / Code
    this.currentCountryName = this.currentCompany?.countryMaster?.countryName;
    this.currentCurrencyCode = this.getCurrencyCodeById(this.currentCurrency);

    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
    this.handleCharges()
  }


  loadCityName(): void {
    if (!this.currentBranchCityId) return;



    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
        }


      },
      error: (error) => {

      }
    });
  }
  constructor(
    private activeModal: NgbActiveModal,
    private spinner: NgxSpinnerService,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private pdfService: PdfDownloadService,
    private operationService: OperationService,
    public logoService: LogoService,
    public mps: MenuPermissionService,
    private milestoneService: ShipmentMilestoneService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['housejobData']) {
      this.handleCharges();
    }
  }

  modalClose() {
    this.activeModal.close();
  }

  getCurrencyCodeById(id: number) {
    if (!id || !this.currencyList) return '';

    const currency = this.currencyList.find((c: any) => c.CurrencyMasterSid === id);
    return currency ? currency.currencyCode : '';
  }

  getTotalExchangeRate(): number {
    if (!this.otherCharges || this.otherCharges.length === 0) return 0;

    return this.otherCharges.reduce((sum, c) => {
      return sum + (Number(c.RevenueExchangeRate) || 0);
    }, 0);
  }

  handleCharges() {
    this.costRevenueCharges = this.housejobData.costRevenueCharges || [];
    const filteredCharges = this.costRevenueCharges.filter(cost => !!cost.ChargeMasterSid);

    this.freightCharges = filteredCharges.filter(cr => {
      const chargeGroupName = cr.chargeMaster?.chargeGroup?.GroupName || '';
      return chargeGroupName === "Freight"
    })


    const freightChargeIds = this.freightCharges.map(c => c.ChargeMasterSid);

    this.otherCharges = filteredCharges.filter(c => {
      return !freightChargeIds.includes(c.ChargeMasterSid);
    })

  }

  getChargeCode(ChargeMasterSid: number) {
    const chargeCode = this.chargeList.find((c: any) => c.ChargeMasterSid === ChargeMasterSid);
    return chargeCode ? chargeCode.chargeCode : "";
  }


  printDiv(divId: string): void {
    // HAWB Draft - print directly
    if (this.selectedReportAir === 'HAWBDraft') {
      this.print(divId);
      return;
    }

    // HAWB - increment HBL count
    const payload = {
      HouseJobSid: this.housejobData?.HouseJobSid,
      CompanyMasterSid: this.housejobData?.CompanyMasterSid,
      BranchMasterSid: this.housejobData?.BranchMasterSid,
    }
    this.operationService.incrementHBLCount(payload).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.print(divId);
          this.updateHBLCountInDisplay();
        } else {
          this.appSettingService.showError("Error incrementing HBL Count")
        }
      },
      error: (error) => {
        this.appSettingService.showError(error.message)
        console.error(error);
      }
    });

  }

  print(divId: string) {
    this.showPrintLogo = true;
    this.showPdfLogo = false;
    const printContents = document.getElementById(divId)?.innerHTML;
    if (!printContents) return;

    const popupWin = window.open('', '_blank', 'width=1000,height=600');
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
  }


  // "Draft AWB" (DRAFT) milestone — captured when the HAWB Draft is downloaded from this modal. Only
  // the Draft variant carries a payload (built by the parent for HAWBDraft), so the final HAWB print
  // is a no-op here. Backend dedups on (HouseJobSid + MilestoneMasterSid + Status='A').
  private async insertMilestoneSafelyForPrint(): Promise<void> {
    if (!this.autoInsertMilestone || !this.milestonePayload || this.milestoneInserted) {
      return;
    }
    try {
      const resp: any = await firstValueFrom(
        this.milestoneService.safeInsertMilestone(this.milestonePayload),
      );
      if (resp?.status) {
        this.milestoneInserted = true;
        this.autoInsertMilestone = false;
        this.reloadMilestone.emit();
      }
    } catch (error) {
      console.error('Error inserting Draft AWB milestone', error);
    }
  }

  async downloadPDF() {
    // HAWB Draft - download directly
    if (this.selectedReportAir === 'HAWBDraft') {
      this.download();
      return;
    }

    // HAWB - increment HBL count
    const payload = {
      HouseJobSid: this.housejobData?.HouseJobSid,
      CompanyMasterSid: this.housejobData?.CompanyMasterSid,
      BranchMasterSid: this.housejobData?.BranchMasterSid,
    };

    this.spinner.show();

    this.operationService.incrementHBLCount(payload).subscribe({
      next: async (resp: any) => {
        if (resp.status) {
          this.download();
          this.updateHBLCountInDisplay();
        } else {
          this.spinner.hide();
          this.appSettingService.showError("Error incrementing HBL Count");
        }
      },
      error: (error) => {
        this.spinner.hide();
        this.appSettingService.showError(error.message);
        console.error(error);
      }
    });
  }

  async download() {
    try {
      const BankPaymentNo = this.housejobData?.HBLNo || '';
      await this.pdfService.downloadBalancedPDF(
        'printContent',
        `HAWB_${BankPaymentNo}`,
        () => {
          this.appSettingService.showSuccess('PDF downloaded successfully!');
          this.insertMilestoneSafelyForPrint();
          const payload = {
        tableName: 'HouseJob',
        recordId: String(this.masterJobData?.MasterJobSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          PDF: `${this.selectedReportAir} PDF Downloaded`
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });

        },
        (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
      );
    } catch (error) {
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }

  updateHBLCountInDisplay() {
    this.hblCountUpdated.emit();
  }

  getFreightTotal() {
    if (!this.freightCharges || this.freightCharges.length === 0) return 0;

    return this.freightCharges.reduce((sum, c) => {
      return sum + ((Number(c.RevenueExchangeRate) || 0) * (Number(c.RevenueAmount) || 0));
    }, 0);
  }

  getGrandTotal(): number {
    const exchangeTotal = this.getTotalExchangeRate() || 0;
    const freightAmount = Number(this.freightCharges?.[0]?.RevenueAmount) || 0;
    return exchangeTotal * freightAmount;
  }


  getFreightTotals() {
    if (!this.freightCharges?.length) return { totalExchangeRate: 0, totalRevenueAmount: 0 };

    const totalExchangeRate = this.freightCharges.reduce(
      (sum, c) => sum + Number(c.RevenueExchangeRate || 0),
      0
    );


    const totalRevenueAmount = this.freightCharges.reduce(
      (sum, c) => sum + Number(c.RevenueAmount || 0),
      0
    );


    return { totalExchangeRate, totalRevenueAmount };
  }

  getTotalPieces(): number {
    return (this.housejobData?.Cargo || []).reduce(
      (sum: number, c: any) => sum + Number(c.NoOfPackage || 0),
      0
    );
  }

  getTotalGrossWeight(): number {
    return (this.housejobData?.Cargo || []).reduce(
      (sum: number, c: any) => sum + Number(c.GrossWeight || 0),
      0
    );
  }

  getTotalChargeableWeight(): number {
    return (this.housejobData?.Cargo || []).reduce(
      (sum: number, c: any) => sum + Number(c.ChargeableWeight || 0),
      0
    );
  }

  getTotalRate(): number {
    return this.freightCharges.reduce(
      (sum, c) => sum + Number(c.RevenueExchangeRate || 0),
      0
    );
  }

}
