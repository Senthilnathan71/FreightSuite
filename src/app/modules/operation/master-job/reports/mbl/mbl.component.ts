import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-mbl',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './mbl.component.html',
  styles: ``,
})
export class MblComponent {
  currentCompany: any;
  currentBranch: any;
  userData: any;
  currentDate = new Date();

  @Input() masterJobData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL: any;
  @Input() agentList: any;
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;
  @Input() packageTypeList: any[] =[];


  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company')
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch')
    );
  }

  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService
  ) {}

  getDestinationAgentName(CustomerMasterSid: number | string): string {
    const agent = this.agentList.find(
      (a) => a.CustomerMasterSid == CustomerMasterSid
    );
    return agent ? agent.CustomerName : '';
  }

  getAgentName(AgentSid: number) {
    if (!AgentSid || this.agentList.length === 0) return '';
    const agent = this.agentList.find(
      (agent) => agent.CustomerMasterSid === AgentSid
    );
    return agent ? agent.CustomerName : '';
  }

  gettotalNoOfPkg(): number {
    return this.masterJobContainers.reduce((sum, c) => {
      const value = Number(c.NoOfPkg) || 0;
      return sum + value;
    }, 0);
  }

totalGrossWeight(): number {
  const containers = this.masterJobData?.containers || [];

  return containers.reduce((sum: number, item: any) => {
    const weight = Number(item?.GrossWeight) || 0;
    return sum + weight;
  }, 0);
}

totalVolume(): number {
  const containers = this.masterJobData?.containers || [];

  return containers.reduce((sum: number, item: any) => {
    const volume = Number(item?.Volume) || 0;
    return sum + volume;
  }, 0);
}

  getPackageTypeName(pkgTypeSid: number): string {
  if (!pkgTypeSid) return 'Unknown';
  const packageType = this.packageTypeList.find(pt => pt.UOMMasterSid === pkgTypeSid);
  return packageType ? packageType.UOMName : 'Unknown';
}
  modalClose() {
    this.activeModal.close();
  }
}
