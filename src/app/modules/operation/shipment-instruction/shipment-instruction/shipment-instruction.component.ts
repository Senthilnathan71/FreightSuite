import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OperationService } from '../../operation.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';

@Component({
  selector: 'app-shipment-instruction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipment-instruction.component.html',
  styleUrl: './shipment-instruction.component.scss'
})
export class ShipmentInstructionComponent {

  isPublicMode = false;
  publicToken = '';
  siConfirmed = false;

  constructor(
    private operationService: OperationService,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private emailTriggerService: EmailTriggerService,
  ) { }

  sendManualMail(): void {
    this.emailTriggerService.triggerManualEmails({
      companyId: this.currentCompany?.CompanyMasterSid,
      branchId: this.currentBranch?.BranchMasterSid,
      menuMasterSid: Number(sessionStorage.getItem('currentMenuId')),
      action: 'UPDATE',
      context: {}
    });
  }
  bookingNumber: string
  bookingResponse: any
  isEditMode = false;
  searchHbl = '';
  showShipmentInstruction = false;
  searchResults: any[] = [];
  showSearchResults = false;
  remarks = '';
  isSaving = false;
  shipmentData: any = {
    shipper: { name: '', address: '' },
    consignee: { name: '', address: '' },
    notifyParty: { name: '', address: '' },
    notifyParty2: { name: '', address: '' },
    billOfLadingNo: '',
    exportReference: '',
    deliveryAgent: '',
    vesselVoyNo: '',
    placeOfReceipt: '',
    portOfLoading: '',
    portOfDischarge: '',
    placeOfDelivery: '',
    releaseType: 'Draft',
    noOfOriginal: '',
    freightPayableAt: '',
    typeOfService: '',
    shippedOnBoard: '',
    placeAndDateOfIssue: '',
    riderMarksNo: '',
    riderDesc: '',
    containers: []
  }

  packageTypeMap: { [key: string]: string } = {};
  portList: any
  agentList: any[] = [];
  userData: any;
  currentCompany: any;
  currentBranch: any;
  ngOnInit() {
    const token = this.route.snapshot.queryParams['token'];
    if (token) {
      this.isPublicMode = true;
      this.publicToken = token;
      this.loadAllPorts(() => this.loadPublicSIData(token));
      return;
    }

    this.loadAllPorts();
    this.loadPackageTypes();
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.loadAllAgents(this.currentCompany?.CompanyMasterSid);
  }

  loadPublicSIData(token: string) {
    this.operationService.getPublicSIData(token).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.bookingResponse = resp.data;
          this.loadAllAgents(resp.data?.CompanyMasterSid);
          this.shipmentData = this.initializeShipmentData(resp.data);
          this.loadMasterJobNoOfOriginal(resp.data);
          this.showShipmentInstruction = true;
          this.isEditMode = false;
          this.siConfirmed = resp.data.SIStatus === 'Confirmed';
        } else {
          this.showShipmentInstruction = false;
        }
      },
      error: (err) => {
        console.error('Failed to load public SI data', err);
        this.showShipmentInstruction = false;
      }
    });
  }

  loadAllPorts(afterLoad?: () => void) {
    this.masterService.getAllPorts().subscribe(
      (resp: any) => {
        if (resp.status) {
          this.portList = resp.data;
          afterLoad?.();
        } else {
          this.appSettingService.showError('Error Loading Ports')
        }
      },
      (error) => {
        console.error('Error Loading Ports', error);
      }
    )
  }

  loadAllAgents(companyMasterSid: number) {
    if (!companyMasterSid) return;

    this.operationService.getAllAgents(companyMasterSid).subscribe({
      next: (resp: any) => {
        this.agentList = Array.isArray(resp) ? resp : [];

        if (this.bookingResponse) {
          this.shipmentData.deliveryAgent = this.getDeliveryAgentName(this.bookingResponse);
        }
      },
      error: (error) => {
        console.error('Error loading agents', error);
      }
    });
  }

  initializeShipmentData(bookingData?: any) {
    if (!bookingData) {
      return {
        shipper: { name: '', address: '' },
        consignee: { name: '', address: '' },
        notifyParty: { name: '', address: '' },
        notifyParty2: { name: '', address: '' },
        billOfLadingNo: '',
        exportReference: '',
        deliveryAgent: '',
        vesselVoyNo: '',
        placeOfReceipt: '',
        portOfLoading: '',
        portOfDischarge: '',
        placeOfDelivery: '',
        releaseType: 'Draft',
        noOfOriginal: '',
        freightPayableAt: '',
        typeOfService: '',
        shippedOnBoard: '',
        placeAndDateOfIssue: '',
        riderMarksNo: '',
        riderDesc: '',
        containers: []
      };
    }

    const data = bookingData;
    const bookingOthers = data.Others?.[0] || {};
    const bookingCargo = data.Cargo?.[0] || {};
    const voyageDetails = data.voyageDetails || {};

    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('en-GB');
    };

    const getPortName = (portCode: string) => {
      if (!portCode || !this.portList) return portCode || '';
      const port = this.portList.find((p: any) =>
        p.PortCode === portCode ||
        p.portCode === portCode ||
        p.code === portCode ||
        p.Code === portCode
      );
      return port ? `${port.PortName || portCode} (${port.PortCode || portCode})` : portCode;
    };

    return {
      shipper: {
        name: data.ShipperName || '',
        address: data.ShipperAddress || ''
      },
      consignee: {
        name: data.ConsigneeName || '',
        address: data.ConsigneeAddress || ''
      },
      notifyParty: {
        name: data.Notify || '',
        address: data.NotifyAddress || ''
      },
      notifyParty2: {
        name: bookingOthers.Notify2 || '',
        address: bookingOthers.NotifyAddress2 || ''
      },
      billOfLadingNo: data.HBLNo || '',
      exportReference: data.BookingNo || '',
      deliveryAgent: this.getDeliveryAgentName(data),
      vesselVoyNo: `${data.VesselName || ''} / ${data.VoyageNo || ''}`.replace(' / ', ' / ').trim(),
      placeOfReceipt: getPortName(data.POO),
      portOfLoading: getPortName(data.POL),
      portOfDischarge: getPortName(data.POD),
      placeOfDelivery: getPortName(data.FPD),
      releaseType: bookingOthers.ReleaseType || 'Draft',
      noOfOriginal: this.getNoOfOriginal(data),
      freightPayableAt: this.getFreightPayableAt(data),
      typeOfService: data.IncoTerms || '',
      shippedOnBoard: formatDate(data.ETD),
      placeAndDateOfIssue: `${getPortName(data.POL)}, ${formatDate(String(new Date()))}`,
      riderMarksNo: '',
      riderDesc: '',
      containers: this.mapContainerData(data)
    };
  }

  private getFirstAvailable(...values: any[]): any {
    return values.find((value) => value !== undefined && value !== null && value !== '');
  }

  private getNoOfOriginal(data: any): any {
    return this.getFirstAvailable(
      data?.masterJob?.NoofOriginal,
      data?.masterJob?.NoOfOriginal,
      data?.masterJob?.noOfOriginal,
      data?.masterJobData?.NoofOriginal,
      data?.masterJobData?.NoOfOriginal,
      data?.MasterJob?.NoofOriginal,
      data?.MasterJob?.NoOfOriginal,
      data?.NoofOriginal,
      data?.NoOfOriginal,
      data?.noOfOriginal,
      data?.Others?.[0]?.NoofOriginal,
      data?.Others?.[0]?.NoOfOriginal
    ) ?? '';
  }

  private getFreightPayableAt(data: any): string {
    return this.getFirstAvailable(
      data?.masterJob?.FreightPPCC,
      data?.masterJob?.FreightTerms,
      data?.masterJobData?.FreightPPCC,
      data?.masterJobData?.FreightTerms,
      data?.MasterJob?.FreightPPCC,
      data?.MasterJob?.FreightTerms,
      data?.FreightPPCC,
      data?.FreightTerms,
      data?.Cargo?.[0]?.FreightTerms,
      data?.Others?.[0]?.FreightPPCC,
      data?.Others?.[0]?.FreightTerms
    ) ?? '';
  }

  private getDeliveryAgentName(data: any): string {
    const directName = this.getFirstAvailable(
      data?.DestinationAgentName,
      data?.destinationAgentName,
      data?.DeliveryAgentName,
      data?.deliveryAgentName,
      data?.AgentName
    );

    if (directName) {
      return directName;
    }

    const destinationAgentSid = this.getFirstAvailable(
      data?.DestinationAgent,
      data?.destinationAgent,
      data?.masterJob?.DestinationAgent,
      data?.masterJobData?.DestinationAgent,
      data?.MasterJob?.DestinationAgent
    );

    const matchedAgent = this.agentList.find((agent: any) =>
      String(agent?.CustomerMasterSid) === String(destinationAgentSid)
    );

    return matchedAgent?.CustomerName || '';
  }

  private getPortCode(value: string): string {
    if (!value) return '';

    const bracketCode = value.match(/\(([^()]+)\)\s*$/);
    if (bracketCode) {
      return bracketCode[1].trim();
    }

    const matchedPort = this.portList?.find((port: any) =>
      String(port?.PortName || '').trim().toLowerCase() === value.trim().toLowerCase() ||
      String(port?.PortCode || '').trim().toLowerCase() === value.trim().toLowerCase()
    );

    return matchedPort?.PortCode || value;
  }

  private getMasterJobSid(data: any): number | null {
    const masterJobSid = this.getFirstAvailable(
      data?.MasterJobSid,
      data?.masterJobSid,
      data?.masterJob?.MasterJobSid,
      data?.masterJob?.masterJobSid,
      data?.masterJobData?.MasterJobSid,
      data?.MasterJob?.MasterJobSid
    );

    const parsedSid = Number(masterJobSid);
    return Number.isFinite(parsedSid) && parsedSid > 0 ? parsedSid : null;
  }

  private loadMasterJobNoOfOriginal(houseJobData: any): void {
    if (this.shipmentData.noOfOriginal !== '' && this.shipmentData.freightPayableAt !== '') {
      return;
    }

    const masterJobSid = this.getMasterJobSid(houseJobData);
    if (!masterJobSid) {
      console.warn('MasterJobSid not found for NoofOriginal lookup', houseJobData);
      return;
    }
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    this.operationService.getMasterJobById({
      screenName: 'Master Job',
      MasterJobSid: masterJobSid,
      CompanyMasterSid,
      BranchMasterSid
    }).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp?.data) {
          if (this.shipmentData.noOfOriginal === '') {
            this.shipmentData.noOfOriginal = this.getNoOfOriginal(resp.data);
          }
          if (this.shipmentData.freightPayableAt === '') {
            this.shipmentData.freightPayableAt = this.getFreightPayableAt(resp.data);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load master job NoofOriginal', err);
      }
    });
  }

  private toNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private getCargoForProduct(data: any, product: any): any {
    const cargos = data?.Cargo || [];
    const cargoSid = product?.HouseJobCargoSid || product?.houseJobCargoSid || product?.BookingCargoSid || product?.bookingCargoSid;

    if (cargoSid) {
      const matchedCargo = cargos.find((cargo: any) =>
        cargo?.HouseJobCargoSid === cargoSid ||
        cargo?.houseJobCargoSid === cargoSid ||
        cargo?.BookingCargoSid === cargoSid ||
        cargo?.bookingCargoSid === cargoSid
      );

      if (matchedCargo) {
        return matchedCargo;
      }
    }

    return cargos.length === 1 ? cargos[0] : {};
  }

  private getContainerNumberForProduct(data: any, product: any): string {
    if (product?.ContainerNo || product?.ContainerNumber) {
      return product.ContainerNo || product.ContainerNumber;
    }

    const masterJobContainers = data?.masterJob?.containers || data?.containers || [];
    const masterJobContainerSid = product?.MasterJobContainerSid || product?.masterJobContainerSid;

    if (masterJobContainerSid) {
      const matchedContainer = masterJobContainers.find((container: any) =>
        container?.MasterJobContainerSid === masterJobContainerSid ||
        container?.masterJobContainerSid === masterJobContainerSid
      );

      if (matchedContainer) {
        return matchedContainer.ContainerNumber || matchedContainer.ContainerNo || '';
      }
    }

    return product?.masterJobContainer?.ContainerNumber || '';
  }

  mapContainerData(data: any) {
    const containers = [];
    const bookingProducts = data.Products || [];

    if (bookingProducts.length > 0) {
      bookingProducts.forEach((product: any) => {
        const cargo = this.getCargoForProduct(data, product);

        containers.push({
          containerNo: this.getContainerNumberForProduct(data, product),
          marksAndNos: cargo?.MarksAndNumber || product?.MarksAndNumber || '',
          descriptionOfGoods: cargo?.CommodityDescription,
          packCount: this.toNumber(product.ExternlQty || product.NoOfPackage),
          packType: this.getPackageType(product.ExternaPkg) || 'Cartons',
          grossWeight: this.toNumber(product.GrossWeight),
          volume: this.toNumber(product.Volume)
        });
      });
    }

    if (containers.length === 0) {
      containers.push({
        containerNo: '',
        marksAndNos: '',
        descriptionOfGoods: '',
        packCount: 0,
        packType: 'Cartons',
        grossWeight: 0,
        volume: 0
      });
    }

    return containers;
  }

  loadPackageTypes() {
    this.operationService.getPackageTypeUOM().subscribe(
      (resp: any) => {
        if (resp && Array.isArray(resp)) {
          this.packageTypeMap = resp.reduce((acc, item) => {
            acc[item.code.toUpperCase()] = item.displayName;
            return acc;
          }, {} as { [key: string]: string });
        }
      },
      (error) => {
        console.error('Error loading package types', error);
      }
    );
  }

  getPackageType(externaPkg: string): string {
    const key = externaPkg?.toUpperCase();
    return this.packageTypeMap[key] || externaPkg || 'Cartons';
  }

  searchShipment() {
    const hbl = this.searchHbl?.trim();
    if (!hbl) {
      return;
    }

    this.searchResults = [];
    this.showSearchResults = false;

    this.operationService.getBookingByBookingNumber(hbl)
      .subscribe({
        next: (resp: any) => {
          if (!resp.status) {
            this.appSettingService.showError(resp.message || 'No records found.');
            return;
          }

          const result = resp.data;

          if (result.multiple) {
            this.searchResults = result.data;
            this.showSearchResults = true;
            this.showShipmentInstruction = false;
          } else {
            this.selectHouseJob(result.data);
          }
        },
        error: (err) => {
          console.error('Booking fetch failed', err);
          this.appSettingService.showError('Failed to fetch booking data.');
        }
      });
  }

  selectHouseJob(houseJobData: any) {
    this.bookingResponse = houseJobData;
    this.showShipmentInstruction = true;
    this.showSearchResults = false;
    this.isEditMode = false;
    this.remarks = '';
    this.shipmentData = this.initializeShipmentData(houseJobData);
    this.loadMasterJobNoOfOriginal(houseJobData);
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
  }

  saveShipmentInstruction() {
    if (this.isSaving) return;
    this.isSaving = true;

    const HouseJobSid = this.bookingResponse.HouseJobSid;
    const currentMenuId = this.isPublicMode ? 0 : Number(sessionStorage.getItem('currentMenuId'));
    const bookingFormValue = this.bookingResponse;
    const cargoFormValue = this.bookingResponse.Cargo?.[0] || {};
    const otherFormValue = this.bookingResponse.Others?.[0] || {};
    const detailFormValue = this.bookingResponse.Products || [];

    const payload = {
      CompanyMasterSid: bookingFormValue?.CompanyMasterSid,
      BranchMasterSid: bookingFormValue?.BranchMasterSid,
      MenuMasterSid: currentMenuId,
      DepartmentMasterSid: bookingFormValue.DepartmentMasterSid,
      CustomerMasterSid: bookingFormValue.CustomerMasterSid,
      CustomerBranchSid: bookingFormValue.CustomerBranchSid || null,
      CustomerName: bookingFormValue.CustomerName,
      CustomerAddress: bookingFormValue.CustomerAddress,
      SalesmanSid: bookingFormValue.SalesmanSid || null,
      ShipperName: this.shipmentData.shipper.name,
      ShipperAddress: this.shipmentData.shipper.address,
      ConsigneeName: this.shipmentData.consignee.name,
      ConsigneeAddress: this.shipmentData.consignee.address,
      Notify: this.shipmentData.notifyParty.name || '',
      NotifyAddress: this.shipmentData.notifyParty.address || '',
      DestinationAgent: bookingFormValue.DestinationAgent || null,
      AgentAddress: this.shipmentData.AgentAddress || '',
      CarrierName: bookingFormValue.CarrierName || null,
      QuotationHeaderSid: bookingFormValue.QuotationHeaderSid || null,
      HBLNo: this.shipmentData.billOfLadingNo || '',
      MBLNo: bookingFormValue.MBLNo || '',
      MBLDate: bookingFormValue.MBLDate ? new Date(bookingFormValue.MBLDate) : null,
      status: bookingFormValue.status === 'A' ? 'A' : 'S',
      VesselName: this.shipmentData.vesselVoyNo.split('/')[0]?.trim() || null,
      VoyageMasterSid: bookingFormValue.VoyageMasterSid || null,
      VoyageNo: bookingFormValue.VoyageNo || null,
      ETA: bookingFormValue.ETA ? new Date(bookingFormValue.ETA) : null,
      ETD: bookingFormValue.ETD ? new Date(bookingFormValue.ETD) : null,
      POO: bookingFormValue.POO || null,
      POL: this.getPortCode(this.shipmentData.portOfLoading) || null,
      POD: this.getPortCode(this.shipmentData.portOfDischarge) || null,
      POLTerminal: bookingFormValue.POLTerminal || '',
      PODTerminal: bookingFormValue.PODTerminal || '',
      FPD: bookingFormValue.FPD || null,
      MovementType: bookingFormValue.MovementType || null,
      DoValid: bookingFormValue.DoValid ? new Date(bookingFormValue.DoValid) : null,
      Coload: bookingFormValue.Coload ? 'Y' : 'N',
      ShipmentType: bookingFormValue.ShipmentType ? 'Y' : 'N',
      IncoTerms: bookingFormValue.IncoTerms,
      InternalNote: bookingFormValue.InternalNote || '',
      GeneralNote: bookingFormValue.GeneralNote || '',
      NominatedBy: bookingFormValue.NominatedBy || 'Self',
      FreightTerms: bookingFormValue.FreightTerms || '',
      ShipmentNo: bookingFormValue.ShipmentNo || '',
      createdBy: otherFormValue.createdBy,
      updatedBy: otherFormValue.updatedBy,
      houseJobCargo: {
        HouseJobCargoSid: cargoFormValue.HouseJobCargoSid || null,
        CargoType: cargoFormValue.CargoType || null,
        ContainerType: cargoFormValue.ContainerType || null,
        NoofContainers: this.shipmentData.containers.length || 0,
        GrossWeight: this.shipmentData.containers.reduce((sum, c) => sum + (c.grossWeight || 0), 0),
        NetWeight: parseFloat(cargoFormValue.NetWeight) || 0,
        Volume: this.shipmentData.containers.reduce((sum, c) => sum + (c.volume || 0), 0),
        ChargeableWeight: parseFloat(cargoFormValue.ChargeableWeight) || 0,
        NoOfPackage: this.shipmentData.containers.reduce((sum, c) => sum + (c.packCount || 0), 0),
        ShipmentTerms: cargoFormValue.ShipmentTerms || null,
        MovementType: cargoFormValue.MovementType || null,
        FreightTerms: cargoFormValue.FreightTerms || null,
        ModeOfTransport: cargoFormValue.ModeOfTransport || null,
        StuffingAt: cargoFormValue.StuffingAt || 'Dock',
        createdBy: otherFormValue.createdBy,
        updatedBy: otherFormValue.updatedBy,
        status: otherFormValue.status
      },
      houseJobOthers: {
        HouseJobOthersSid: otherFormValue.HouseJobOthersSid || null,
        CustomerRefNo: otherFormValue.CustomerRefNo || '',
        YardCFS: otherFormValue.YardCFS || '',
        ReleaseType: otherFormValue.ReleaseType || null,
        HBLNo: otherFormValue.HBLNo || '',
        Forwarder: otherFormValue.Forwarder || null,
        ForwarderAddress: otherFormValue.ForwarderAddress || '',
        NotifyParty: otherFormValue.NotifyParty || null,
        NotifyPartyAddress: otherFormValue.NotifyPartyAddress || '',
        Notify2: otherFormValue?.Notify2,
        NotifyAddress2: otherFormValue?.NotifyAddress2,
        Coloader: otherFormValue?.Coloader,
        PickupPlace: otherFormValue.PickupPlace || '',
        DeliveryPlace: otherFormValue.DeliveryPlace || '',
        DeliveryDate: otherFormValue.DeliveryDate ? new Date(otherFormValue.DeliveryDate) : null,
        CHAName: otherFormValue.CHAName || '',
        PickupAddress: otherFormValue.PickupAddress || '',
        DeliveryAddress: otherFormValue.DeliveryAddress || '',
        CargoCurrency: otherFormValue.CargoCurrency || null,
        CargoValue: parseFloat(otherFormValue.CargoValue) || 0,
        SwitchBL: otherFormValue.SwitchBL ? 'Y' : 'N',
        BacktoBack: otherFormValue.BacktoBack ? 'Y' : 'N',
        Depo: otherFormValue.Depo || '',
        ROValidity: otherFormValue.ROValidity ? new Date(otherFormValue.ROValidity) : null,
        SwitchBLAgent: otherFormValue?.SwitchBLAgent,
        AgentAddress: otherFormValue?.AgentAddress,
        SwitchBLShipper: otherFormValue?.SwitchBLShipper,
        SwitchBLConsignee: otherFormValue?.SwitchBLConsignee,
        SwitchLocation: otherFormValue?.SwitchLocation,
        CarrierBookingRef: otherFormValue?.CarrierBookingRef,
        CarrierBookingDate: otherFormValue?.CarrierBookingDate ? new Date(otherFormValue?.CarrierBookingDate) : null,
        createdBy: otherFormValue.createdBy,
        updatedBy: otherFormValue.updatedBy,
        status: otherFormValue.status
      },
      houseJobProduct: detailFormValue.map((product: any, index: number) => {
        const editedContainer = this.shipmentData.containers?.[index] || {};

        return {
          HouseJobProductSid: product.HouseJobProductSid || null,
          HouseJobCargoSid: product.HouseJobCargoSid || product.BookingCargoSid || null,
          BookingCargoSid: product.BookingCargoSid || null,
          MasterJobContainerSid: product.MasterJobContainerSid || null,
          ContainerNo: editedContainer.containerNo || product.ContainerNo || '',
          ProductName: product.ProductName || '',
          ShippingBillNo: product.ShippingBillNo || '',
          ShippingBillDate: product.ShippingBillDate ? new Date(product.ShippingBillDate) : null,
          ExternaPkg: product.ExternaPkg || editedContainer.packType || null,
          ExternlQty: String(editedContainer.packCount ?? product.ExternlQty ?? ''),
          GrossWeight: this.toNumber(editedContainer.grossWeight ?? product.GrossWeight),
          NetWeight: parseFloat(product.NetWeight) || 0,
          Volume: this.toNumber(editedContainer.volume ?? product.Volume),
          IsHaz: product.IsHaz ? 'Y' : 'N',
          // `product` is API-shaped here ('Y'/'N'), so compare explicitly rather than relying on
          // truthiness — 'N' is a truthy string. Must be sent: the API rewrites the row, and an
          // omitted flag would reset a stackable product to 'N'.
          IsStackable: product.IsStackable === true || product.IsStackable === 'Y' ? 'Y' : 'N',
          ImcoClass: product.ImcoClass || '',
          UnNo: product.UnNo || '',
          PkgGroup: product.PkgGroup || '',
          Length: Number(product.Length),
          Width: Number(product.Width),
          Height: Number(product.Height),
          UomMasterSid: product.UomMasterSid,
          CargoRecDate: product.CargoRecDate,
          createdBy: otherFormValue.createdBy,
          updatedBy: otherFormValue.updatedBy,
          status: otherFormValue.status
        };
      }),
      bookingConnection: this.bookingResponse.houseConnections
    };

    const siPayload = {
      CompanyMasterSid: bookingFormValue.CompanyMasterSid,
      BranchMasterSid: bookingFormValue.BranchMasterSid,
      HouseJobSid: HouseJobSid,
      Remarks: this.remarks,
      SIStatus: 'Confirmed',
      CreatedBy: this.isPublicMode ? 'Public-SI' : (this.userData?.userName || this.userData?.UserName || '')
    };

    if (this.isPublicMode) {
      this.operationService.savePublicSI({
        token: this.publicToken,
        houseJobPayload: payload,
        siPayload: siPayload
      }).subscribe({
        next: (resp: any) => {
          this.isSaving = false;
          this.isEditMode = false;
          if (resp.status) {
            this.siConfirmed = true;
            this.appSettingService.showSuccess('Shipment instruction saved successfully.');
          } else {
            this.appSettingService.showError(resp.message || 'Failed to save shipment instruction.');
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.appSettingService.showError(err?.error?.message || 'Failed to save shipment instruction.');
        }
      });
    } else {
      this.operationService.updateHouseById(HouseJobSid, payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.operationService.createShippingInstruction(siPayload).subscribe({
              next: (siResp: any) => {
                this.isSaving = false;
                if (siResp.status) {
                  this.appSettingService.showSuccess('Shipment instruction saved successfully.');
                } else {
                  this.appSettingService.showError('House job updated but failed to create shipping instruction.');
                }
              },
              error: (siErr) => {
                this.isSaving = false;
                this.appSettingService.showError('House job updated but failed to create shipping instruction.');
              }
            });
          } else {
            this.isSaving = false;
            this.appSettingService.showError('Error updating booking.');
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.appSettingService.showError('Failed to update booking.');
        }
      });
      this.isEditMode = false;
    }
  }

  resetForm() {
    this.isEditMode = false;
    this.showShipmentInstruction = false;
    this.showSearchResults = false;
    this.searchResults = [];
    this.searchHbl = '';
    this.remarks = '';
  }
}
