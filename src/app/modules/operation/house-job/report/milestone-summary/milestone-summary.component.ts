import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-milestone-summary',
  standalone: true,
  imports: [],
  templateUrl: './milestone-summary.component.html',
  styles: ``
})
export class MilestoneSummaryComponent {
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


   modalClose() {
    this.activeModal.close()
  }
}
