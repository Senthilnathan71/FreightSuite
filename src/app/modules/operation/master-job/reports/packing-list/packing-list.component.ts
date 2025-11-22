import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-packing-list',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './packing-list.component.html',
  styles: ``,
})
export class PackingListComponent {
  userData: any;
  currentCompany: any;
  currentBranch: any;
  currentDate = new Date();
  @Input() masterJobData: any;

  constructor(
    private appSettingsService: AppSettingsService,
    private activeModal: NgbActiveModal
  ) {}

  ngOnInit() {
    this.userData = this.appSettingsService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingsService.decrypt(
      localStorage.getItem('selected-company')
    );
    this.currentBranch = this.appSettingsService.decrypt(
      localStorage.getItem('selected-branch')
    );
  }


    modalClose() {
    this.activeModal.close();
  }
  
}
