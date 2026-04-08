import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  generateCfsOutturnDocument,
  transformCfsOutturnApiData,
} from 'src/app/common/pdf/generators/cfs-outturn-pdf.generator';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';

@Component({
  selector: 'app-cfs-outturn',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintFooterComponent,PrintHeaderComponent],
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
  private pdfDepsPromise?: Promise<{ pdfMake: any }>;

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
    private spinner: NgxSpinnerService,
    public logoService : LogoService,
    public mps: MenuPermissionService
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
    this.spinner.show();

    try {
      const { pdfMake } = await this.getPdfDependencies();
      const logo = await this.resolveReportLogo();
      const pdfData = transformCfsOutturnApiData(
        this.masterJobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        {
          agentList: this.agentList,
          yardList: this.yardList,
        },
      );
      const docDefinition = generateCfsOutturnDocument(pdfData);
      pdfMake
        .createPdf(docDefinition)
        .download(`CFS_Outturn_Report_${this.housejobData?.ShipmentNo || 'Report'}.pdf`);
      this.appSettingService.showSuccess('PDF downloaded successfully!');
    } catch (error) {
      console.error('CFS Outturn PDF generation error:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }

  private async getPdfDependencies(): Promise<{ pdfMake: any }> {
    if (this.pdfDepsPromise) {
      return this.pdfDepsPromise;
    }

    this.pdfDepsPromise = (async () => {
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

      const pdfMake: any = (pdfMakeModule as any).default || pdfMakeModule;
      const pdfFonts: any = (pdfFontsModule as any).default || pdfFontsModule;
      pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts;

      return { pdfMake };
    })();

    return this.pdfDepsPromise;
  }

  private async resolveReportLogo(): Promise<string | undefined> {
    const logoFromStream = await firstValueFrom(
      this.logoService.reportLogo$.pipe(take(1)),
    );
    const logoSource =
      logoFromStream || localStorage.getItem('current_report_logo') || '';

    if (!logoSource) return undefined;
    if (logoSource.startsWith('data:image')) return logoSource;

    return this.imageUrlToBase64(logoSource);
  }

  private imageUrlToBase64(url: string): Promise<string | undefined> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(undefined);
          return;
        }

        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => resolve(undefined);
      img.src = url;
    });
  }


  modal() {
    this.activeModal.close();
  }
}
