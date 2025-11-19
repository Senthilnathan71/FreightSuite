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
  @Input() masterJobContainers: any[] = [];
  @Input() packageTypeList: any[] =[];

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

    get totalNoOfPkg(): number {
    console.log("Containers",this.masterJobContainers)
    return this.masterJobContainers.reduce((sum, c) => {
      const value = Number(c.NoOfPkg) || 0;
      return sum + value;
    }, 0);
  }

  get totalGrossWeight(): number {
    return this.masterJobContainers.reduce((sum, c) => {
      const value = Number(c.GrossWeight) || 0;
      return sum + value;
    }, 0);
  }

  get totalVolume(): number {
    return this.masterJobContainers.reduce((sum, c) => {
      const value = Number(c.Volume) || 0;
      return sum + value;
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
