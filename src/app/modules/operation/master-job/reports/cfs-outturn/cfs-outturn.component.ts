import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MasterService } from 'src/app/modules/master/master.service';

@Component({
  selector: 'app-cfs-outturn',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './cfs-outturn.component.html',
  styles: ``
})
export class CfsOutturnComponent {
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
  @Input() yardList: any[] = [];
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;

  // Group products by container
  groupedProducts: { [containerNo: string]: any[] } = {};
  containerList: string[] = [];


  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;

  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();

    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);

    // Group products by container
    this.groupContainers();

    this.loadCityName();
  }


  // Group products by container from house job data in masterJobData
groupProductsByContainer(): void {
  this.groupedProducts = {};
  
  // Get house job data from masterJobData
  const houseJob = this.masterJobData?.houseJob?.[0];
  
  // Check if house job has Products array
  if (houseJob?.Products && Array.isArray(houseJob.Products) && houseJob.Products.length > 0) {
    houseJob.Products.forEach((product: any) => {
      const containerNo = product.ContainerNo || 'No Container';
      
      if (!this.groupedProducts[containerNo]) {
        this.groupedProducts[containerNo] = [];
      }
      
      this.groupedProducts[containerNo].push(product);
    });
    
    // Get unique container list
    this.containerList = Object.keys(this.groupedProducts);
  } else if (houseJob?.Cargo && Array.isArray(houseJob.Cargo) && houseJob.Cargo.length > 0) {
    // If no Products but has Cargo, use that
    houseJob.Cargo.forEach((cargo: any) => {
      const containerNo = 'No Container';
      
      if (!this.groupedProducts[containerNo]) {
        this.groupedProducts[containerNo] = [];
      }
      
      this.groupedProducts[containerNo].push(cargo);
    });
    
    this.containerList = Object.keys(this.groupedProducts);
  } else {
    // If no container data at all
    this.containerList = ['No Container Data'];
    this.groupedProducts['No Container Data'] = [];
  }
}

  groupContainers(): void {
    this.groupedProducts = {};

    // Check if master job has containers array
    if (this.masterJobData?.containers && Array.isArray(this.masterJobData.containers)) {
      this.masterJobData.containers.forEach((container: any) => {
        const containerNo = container.ContainerNumber;

        if (containerNo) {
          if (!this.groupedProducts[containerNo]) {
            this.groupedProducts[containerNo] = [];
          }

          // Add only container details
          this.groupedProducts[containerNo].push({
            ContainerNumber: container.ContainerNumber,
            ContainerType: container.ContainerType,
            LineSeal: container.LineSeal,
            CustomsSeal: container.CustomsSeal,
            GrossWeight: container.GrossWeight,
            NetWeight: container.NetWeight,
            Volume: container.Volume,
            IsSoc: container.IsSoc,
            MarksandNumber: container.MarksandNumber,
            HsCode: container.HsCode,
            CommodityDescription: container.CommodityDescription
          });
        }
      });

      // Get unique container list
      this.containerList = Object.keys(this.groupedProducts);
    } else {
      // If no containers
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
    public logoService : LogoService
  ) { }


  // Get house job data from masterJobData
getHouseJobData(): any {
  return this.masterJobData?.houseJob?.[0] || null;
}

// Get total manifest (ExternlQty) for a container
getTotalManifest(containerNo: string): number {
  const products = this.getProductsForContainer(containerNo);
  let total = 0;
  products.forEach(product => {
    total += Number(product.ExternlQty) || 
             Number(this.getHouseJobData()?.Cargo?.[0]?.NoOfPackage) || 0;
  });
  return total;
}

// Get total outturn (ReceivedQty) for a container
getTotalOutturn(containerNo: string): number {
  const products = this.getProductsForContainer(containerNo);
  let total = 0;
  products.forEach(product => {
    total += Number(product.ReceivedQty) || 0;
  });
  return total;
}

// Calculate surplus for a product
getSurplus(product: any): number {
  const manifest = Number(product.ExternlQty) || 
                   Number(this.getHouseJobData()?.Cargo?.[0]?.NoOfPackage) || 0;
  const received = Number(product?.ReceivedQty || 0);
  
  // Surplus = Received - Manifest (if received > manifest)
  const surplus = received - manifest;
  return surplus > 0 ? surplus : 0;
}

// Calculate total surplus for a container
getTotalSurplus(containerNo: string): number {
  const products = this.getProductsForContainer(containerNo);
  let total = 0;
  
  products.forEach(product => {
    const manifest = Number(product.ExternlQty) || 
                     Number(this.getHouseJobData()?.Cargo?.[0]?.NoOfPackage) || 0;
    const received = Number(product?.ReceivedQty || 0);
    
    const surplus = received - manifest;
    if (surplus > 0) {
      total += surplus;
    }
  });
  
  return total;
}

// Calculate short for a product
getShort(product: any): number {
  const manifest = Number(product.ExternlQty) || 
                   Number(this.getHouseJobData()?.Cargo?.[0]?.NoOfPackage) || 0;
  const received = Number(product?.ReceivedQty || 0);
  
  // Short = Manifest - Received (if manifest > received)
  const short = manifest - received;
  return short > 0 ? short : 0;
}

// Calculate total short for a container
getTotalShort(containerNo: string): number {
  const products = this.getProductsForContainer(containerNo);
  let total = 0;
  
  products.forEach(product => {
    const manifest = Number(product.ExternlQty) || 
                     Number(this.getHouseJobData()?.Cargo?.[0]?.NoOfPackage) || 0;
    const received = Number(product?.ReceivedQty || 0);
    
    const short = manifest - received;
    if (short > 0) {
      total += short;
    }
  });
  
  return total;
}

// Calculate total damage quantity for a container
getTotalDamage(containerNo: string): number {
  const products = this.getProductsForContainer(containerNo);
  let total = 0;
  products.forEach(product => {
    total += Number(product.DamageQty) || 0;
  });
  return total;
}
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


  getYardName(id: number) {
    if (!id || this.yardList.length === 0) return '';
    const agent = this.yardList.find(agent => agent.CustomerMasterSid === id);
    return agent ? agent.CustomerName : '';
  }

  printDiv(divId: string): void {
    this.showPrintLogo = true;
    this.showPdfLogo = false;

    setTimeout(() => {
      const printContents = document.getElementById(divId)?.innerHTML;
      if (!printContents) return;

      const popupWin = window.open('', '_blank', 'width=900,height=600');
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
    }, 50); // small timeout so Angular updates DOM
  }



  async downloadPDF() {
    this.showPrintLogo = false;
    this.showPdfLogo = true;

    setTimeout(async () => {
      this.spinner.show();
      try {
        await this.pdfService.downloadBalancedPDF(
          'printContent',
          `CFS_Outturn_Report_${this.housejobData?.ShipmentNo || 'Report'}`,
          () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
          (error) => this.appSettingService.showError('Error generating PDF. Please try again.'),
          'landscape'
        );
      } finally {
        this.spinner.hide();
      }
    }, 50);
  }


  modal() {
    this.activeModal.close();
  }
}