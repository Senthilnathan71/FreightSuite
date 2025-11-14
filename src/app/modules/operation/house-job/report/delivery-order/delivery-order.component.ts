import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-delivery-order',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './delivery-order.component.html',
  styles: ``
})
export class DeliveryOrderComponent {

  currentCompany: any
  currentBranch: any;
  userData: any
  currentDate = new Date()

  @Input() housejobData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL: any;

  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() packageTypeList: any;
  @Input() containerTypeList: any;
  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
  }


  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
  ) { }

  getUnitCode(ChargeUomSid: number) {
    console.log("GETUNITCODE", {
      currentUOMId: ChargeUomSid,
      uomList: this.uomList
    })
    if (!ChargeUomSid || !this.uomList || this.uomList.length === 0) {
      return '';
    }
    const uom = this.uomList.find(item => item.UOMMasterSid === ChargeUomSid);
    console.log(uom);
    return uom ? uom.UOMCode : '';
  }

  getCurrencyCode(revenueCurrencyMasterSid: number): string {
    const currency = this.currencyList.find(
      c => c.CurrencyMasterSid === revenueCurrencyMasterSid
    );
    return currency ? currency.currencyCode : '';
  }

  getCurrencyCodeCost(CostCurrencyMasterSid: number): string {
    const currency = this.currencyList.find(
      c => c.CurrencyMasterSid === CostCurrencyMasterSid
    );
    return currency ? currency.currencyCode : '';
  }
  getTotalLocalRevenuAmount(): number {

    return (this.housejobData?.costRevenueCharges || [])
      .reduce((sum, rate) => sum + Number(rate.RevenueRate || 0), 0);
  }

  TotalLocalAmount(): number {
    return (this.housejobData?.costRevenueCharges || [])
      .reduce((sum, rate) => sum + Number(rate.RevenueAmount || 0), 0);

  }

  getCostAmount(): number {
    return (this.housejobData?.costRevenueCharges || [])
      .reduce((sum, rate) => sum + Number(rate.CostRate || 0), 0);

  }

  CostAmount(): number {
    return (this.housejobData?.costRevenueCharges || [])
      .reduce((sum, rate) => sum + Number(rate.CostAmount || 0), 0);

  }

    getPkgTypeName(PackageTypeMasterSid:number){
    console.log("getPkgMame",{
      PackageTypeMasterSid,
      pkgList:this.packageTypeList
    })
    if(!PackageTypeMasterSid||this.packageTypeList.length===0){
      return "";
    }
    return this.packageTypeList.find(pkg=>pkg.UOMMasterSid===PackageTypeMasterSid)?.UOMName|| "";
  }

   getContainerName(ContainerTypeMasterSid:number){
    console.log(ContainerTypeMasterSid);
    if(!ContainerTypeMasterSid || this.containerTypeList.length === 0){
      return "";
    }
    console.log("HERE",this.containerTypeList)
    return this.containerTypeList.find(con => con.ContainerTypeMasterSid === ContainerTypeMasterSid)?.ContainerName || ""
  }

    modalClose() {
    this.activeModal.close()
  }
}
