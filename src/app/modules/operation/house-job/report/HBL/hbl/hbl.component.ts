import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-hbl',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './hbl.component.html',
  styles: ``
})
export class HblComponent {

  currentCompany: any
  currentBranch: any;
  userData: any
  currentDate = new Date()

  @Input() housejobData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL: any;
  @Input() agentList: any;
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


  grossAmount(): number {

    const cargoList = this.housejobData?.Cargo || [];

    return cargoList.reduce((sum: number, item: any) => {

      const weight = parseFloat(item?.GrossWeight) || 0;

      return sum + weight;

    }, 0);

  }
  volumeAmount(): number {

    const cargoList = this.housejobData?.Cargo || [];

    return cargoList.reduce((sum: number, item: any) => {

      const volume = parseFloat(item?.Volume) || 0;

      return sum + volume;

    }, 0);
  }
  getDestinationAgentName(CustomerMasterSid: number | string): string {
    const agent = this.agentList.find(a => a.CustomerMasterSid == CustomerMasterSid);
    return agent ? agent.CustomerName : '';
  }



  modalClose() {
    this.activeModal.close()
  }
}
