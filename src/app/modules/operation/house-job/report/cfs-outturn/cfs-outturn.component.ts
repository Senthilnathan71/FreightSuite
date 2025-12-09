import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';

@Component({
  selector: 'app-cfs-outturn',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './cfs-outturn.component.html',
  styles: ``
})
export class CFSOutturnComponent implements OnInit {
  currentCompany: any;
  currentBranch: any;
  userData: any;
  currentDate = new Date();
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  
  @Input() masterJobData: any;
  @Input() housejobData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL: any;
  @Input() agentList: any[] = [];
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;
  
  // Group products by container
  groupedProducts: { [containerNo: string]: any[] } = {};
  containerList: string[] = [];

  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    
    // Group products by container
    this.groupProductsByContainer();
    
    this.loadCityName();
  }

  // Group products by ContainerNo
  groupProductsByContainer(): void {
    this.groupedProducts = {};
    
    if (this.housejobData?.Products && Array.isArray(this.housejobData.Products) && this.housejobData.Products.length > 0) {
      this.housejobData.Products.forEach((product: any) => {
        const containerNo = product.ContainerNo || 'No Container';
        
        if (!this.groupedProducts[containerNo]) {
          this.groupedProducts[containerNo] = [];
        }
        
        this.groupedProducts[containerNo].push(product);
      });
      
      // Get unique container list
      this.containerList = Object.keys(this.groupedProducts);
    } else {
      // If no container data, add a default container
      this.containerList = ['No Container Data'];
      this.groupedProducts['No Container Data'] = [];
    }
  }

  // Get all products for a specific container
  getProductsForContainer(containerNo: string): any[] {
    return this.groupedProducts[containerNo] || [];
  }

  // Check if we have actual container data
  hasContainerData(): boolean {
    return this.containerList.length > 0 && this.containerList[0] !== 'No Container Data';
  }

  // Calculate total weight for a container
  getTotalWeight(containerNo: string): number {
    const products = this.getProductsForContainer(containerNo);
    let total = 0;
    products.forEach(product => {
      total += Number(product.GrossWeight) || 0;
    });
    return total;
  }

  // Calculate total volume for a container
  getTotalVolume(containerNo: string): number {
    const products = this.getProductsForContainer(containerNo);
    let total = 0;
    products.forEach(product => {
      total += Number(product.Volume) || 0;
    });
    return total;
  }

  // Get total products for a container
  getTotalProductsForContainer(containerNo: string): number {
    return this.getProductsForContainer(containerNo).length;
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

  getContainerName(ContainerTypeMasterSid: number) {
    if (!ContainerTypeMasterSid || this.containerTypeList.length === 0) {
      return "";
    }
    return this.containerTypeList.find(con => con.ContainerTypeMasterSid === ContainerTypeMasterSid)?.ContainerName || "";
  }

  getAgentName(AgentSid: number) {
    if (!AgentSid || this.agentList.length === 0) return '';
    const agent = this.agentList.find(agent => agent.CustomerMasterSid === AgentSid);
    return agent ? agent.CustomerName : '';
  }

  getAgentAddress(AgentSid: number) {
    if (!AgentSid || this.agentList.length === 0) return '';
    const agent = this.agentList.find(agent => agent.CustomerMasterSid === AgentSid);
    return agent ? agent.Address : '';
  }

  async downloadPDF() {
    this.spinner.show();
    try {
      await this.pdfService.downloadBalancedPDF(
        'printContent',
        `CFS_Outturn_Report_${this.housejobData?.ShipmentNo || 'Report'}`,
        () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
        (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
      );
    } finally {
      this.spinner.hide();
    }
  }

  printDiv(divId: string): void {
    const printContents = document.getElementById(divId)?.innerHTML;
    if (!printContents) return;

    const popupWin = window.open('', '_blank', 'width=900,height=600');
    if (popupWin) {
      popupWin.document.open();
      popupWin.document.write(`
        <html>
          <head>
            <title>Print CFS Outturn Report</title>
            <style>
              @media print {
                .page-break {
                  page-break-after: always;
                }
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${printContents}
          </body>
        </html>
      `);
      popupWin.document.close();
    }
  }

  modal() {
    this.activeModal.close();
  }
}