import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';

@Component({
  selector: 'app-payment-print',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './payment-print.component.html',
  styles: ``
})
export class PaymentPrintComponent {


  currentCompany: any
  currentBranch: any;
  userData: any
  currentDate = new Date()
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  @Input() paymentDataPrint: any;
  @Input() masterJobContainers: any[];
  @Input() selectedFCLLCL: any;
  @Input() agentList: any;
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;


    constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
  ) { }
  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
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



  modalClose() {
    this.activeModal.close()
  }

 getTotalOriginalCurrencyAmount(): number {
  if (!this.paymentDataPrint?.voucherMatchings) return 0;

  return this.paymentDataPrint.voucherMatchings.reduce((sum: number, voucher: any) => {
    return sum + (parseFloat(voucher?.OriginalCurrencyAmount) || 0);
  }, 0);
}

getTotalOriginalLocalAmount(): number {
  if (!this.paymentDataPrint?.voucherMatchings) return 0;

  return this.paymentDataPrint.voucherMatchings.reduce((sum: number, voucher: any) => {
    return sum + (parseFloat(voucher?.OriginalLocalAmount) || 0);
  }, 0);
}

// Inside PaymentPrintComponent
convertNumberToWords(num: number): string {
  if (!num) return 'Zero';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convert(num: number): string {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convert(num % 100) : '');
    if (num < 1000000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convert(num % 1000) : '');
    if (num < 1000000000) return convert(Math.floor(num / 1000000)) + ' Million' + (num % 1000000 !== 0 ? ' ' + convert(num % 1000000) : '');
    return convert(Math.floor(num / 1000000000)) + ' Billion' + (num % 1000000000 !== 0 ? ' ' + convert(num % 1000000000) : '');
  }

  return convert(num);
}


}
