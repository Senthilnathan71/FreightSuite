import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-commerical-invoice',
  standalone: true,
  imports: [CommonModule,CustomDatePipe],
  templateUrl: './commerical-invoice.component.html',
  styles: ``
})
export class CommericalInvoiceComponent {
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
 

      getContainerName(ContainerTypeMasterSid: number) {
    console.log(ContainerTypeMasterSid);
    if (!ContainerTypeMasterSid || this.containerTypeList.length === 0) {
      return "";
    }
    console.log("HERE", this.containerTypeList)
    return this.containerTypeList.find(con => con.ContainerTypeMasterSid === ContainerTypeMasterSid)?.ContainerName || ""
  }
    
  modalClose() {
    this.activeModal.close()
  }
}
