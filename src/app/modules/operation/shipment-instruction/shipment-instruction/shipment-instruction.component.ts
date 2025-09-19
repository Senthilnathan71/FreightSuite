import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OperationService } from '../../operation.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-shipment-instruction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipment-instruction.component.html',
  styleUrl: './shipment-instruction.component.scss'
})
export class ShipmentInstructionComponent {

  constructor(
    private operationService: OperationService,
    private masterService: MasterService,
    private appSettingService: AppSettingsService
  ) { }
  bookingNumber: string
  bookingResponse: any
  isEditMode = false;
  searchHbl = '';
  showShipmentInstruction = false;
  shipmentData: any ={
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
  userData: any;
  currentCompany: any;
  currentBranch: any;
  ngOnInit() {
    this.loadAllPorts();
    this.loadPackageTypes();
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
  }

  loadAllPorts() {
    this.masterService.getAllPorts().subscribe(
      (resp: any) => {
        if (resp.status) {
          this.portList = resp.data;
        } else {
          this.appSettingService.showError('Error Loading Ports')
        }
      },
      (error) => {
        console.error('Error Loading Ports', error);
      }
    )
  }

  initializeShipmentData(bookingData?: any) {
    if (!bookingData) {
      // Return empty structure if no data provided
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
        freightPayableAt: '',
        typeOfService: '',
        shippedOnBoard: '',
        placeAndDateOfIssue: '',
        riderMarksNo: '',
        riderDesc: '',
        containers: []
      };
    }

    // Extract data from the response
    const data = bookingData.data || bookingData;
    const bookingOthers = data.Others?.[0] || {};
    const bookingProduct = data.Products?.[0] || {};
    const bookingCargo = data.Cargo?.[0] || {};
    const voyageDetails = data.voyageDetails || {};

    // Format dates
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('en-GB'); // DD/MM/YYYY format
    };

    // Get port names from loaded port list
    const getPortName = (portCode: string) => {
      if (!portCode || !this.portList) return portCode || '';

      const port = this.portList.find((p: any) =>
        p.PortCode === portCode ||
        p.portCode === portCode ||
        p.code === portCode ||
        p.Code === portCode
      );

      return port ? port.PortCode : portCode;
    };

    return {
      // Shipper Information
      shipper: {
        name: data.ShipperName || '',
        address: data.ShipperAddress || ''
      },

      // Consignee Information  
      consignee: {
        name: data.ConsigneeName || '',
        address: data.ConsigneeAddress || ''
      },

      // Notify Party Information
      notifyParty: {
        name: data.Notify || '',
        address: data.NotifyAddress || ''
      },

      // Notify Party 2 Information
      notifyParty2: {
        name: bookingOthers.Notify2 || '',
        address: bookingOthers.NotifyAddress2 || ''
      },

      // Bill of Lading Details
      billOfLadingNo: data.HBLNo || '',
      exportReference: data.BookingNo || '',
      deliveryAgent: data.CustomerName || data.AgentName || '',

      // Vessel Information
      vesselVoyNo: `${data.VesselName || ''} / ${data.VoyageNo || ''}`.replace(' / ', ' / ').trim(),

      // Port Information
      placeOfReceipt: getPortName(data.POO),
      portOfLoading: getPortName(data.POL),
      portOfDischarge: getPortName(data.POD),
      placeOfDelivery: getPortName(data.FPD),

      // Service Details
      releaseType: bookingOthers.ReleaseType || 'Draft',
      freightPayableAt: getPortName(data.POD),
      typeOfService: data.IncoTerms || '',

      // Date Information
      shippedOnBoard: formatDate(data.ETD),
      placeAndDateOfIssue: `${getPortName(data.POL)}, ${formatDate(String(new Date()))}`,

      // Rider Information (usually empty in initial data)
      riderMarksNo: '',
      riderDesc: '',

      // Container Information
      containers: this.mapContainerData(data)
    };
  }




  mapContainerData(data: any) {
    const containers = [];
    const bookingProducts = data.Products || [];
    const bookingCargo = data.Cargo?.[0] || {};

    if (bookingProducts.length > 0) {
      // Map each product to a container row
      bookingProducts.forEach((product: any, index: number) => {
        containers.push({
          containerNo: `${product.ShippingBillNo || 'Container'}`,
          marksAndNos: product.MarksAndNumber,
          descriptionOfGoods: product.ProductDescription || '',
          packCount: parseInt(product.ExternlQty)  || 0,
          packType: this.getPackageType(product.ExternaPkg) || 'Cartons',
          grossWeight: parseFloat(product.GrossWeight)|| 0,
          volume: parseFloat(product.Volume) || 0
        });
      });
    } 
    // else if (bookingCargo) {
    //   // Fallback to cargo information
    //   containers.push({
    //     containerNo: data.HBLNo,
    //     marksAndNos: data.HBLNo,
    //     descriptionOfGoods: bookingCargo.CargoType || 'General Cargo',
    //     packCount: bookingCargo.NoOfPackage || 0,
    //     packType: 'Cartons',
    //     grossWeight: parseFloat(bookingCargo.GrossWeight) || 0,
    //     volume: parseFloat(bookingCargo.Volume) || 0
    //   });
    // }

    // Ensure at least one container row
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
          // Assuming resp = [{ code: 'PACK', displayName: 'Packages' }, ...]
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



  // Updated searchShipment method
  searchShipment() {
    const hbl = this.searchHbl?.trim();
    if (!hbl) {
      return;
    } else {
      this.showShipmentInstruction = true;
      this.isEditMode = false;

      this.operationService.getBookingByBookingNumber(hbl)
        .subscribe({
          next: (resp) => {
            this.bookingResponse = resp;
            this.showShipmentInstruction = true;
            this.isEditMode = false;

            // Initialize shipment data with the response
            this.shipmentData = this.initializeShipmentData(resp);
          },
          error: (err) => {
            console.error('Booking fetch failed', err);
            // Show error message or handle appropriately
          }
        });
    }
  }


  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
  }

  saveShipmentInstruction() {

    const HouseJobSid = this.bookingResponse.data.HouseJobSid
    console.log(HouseJobSid, 'BookingHeaderSid')
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const bookingFormValue = this.bookingResponse.data
    const cargoFormValue = this.bookingResponse.data.Cargo[0]
    const otherFormValue = this.bookingResponse.data.Others[0]
    const detailFormValue = this.bookingResponse.data.Products
    // const payload = {
    //   CompanyMasterSid: bookingFormValue?.CompanyMasterSid,
    //   BranchMasterSid: bookingFormValue?.BranchMasterSid,
    //   MenuMasterSid: currentMenuId,
    //   DepartmentMasterSid: bookingFormValue.DepartmentMasterSid,
    //   CustomerMasterSid: bookingFormValue.CustomerMasterSid,
    //   CustomerBranchSid: bookingFormValue.CustomerBranchSid || null,
    //   CustomerName: bookingFormValue.CustomerName,
    //   CustomerAddress: bookingFormValue.CustomerAddress,
    //   SalesmanSid: bookingFormValue.SalesmanSid || null,
    //   ShipperName: this.shipmentData.shipper.name,
    //   ShipperAddress: this.shipmentData.shipper.address,
    //   ConsigneeName: this.shipmentData.ConsigneeName,
    //   ConsigneeAddress: this.shipmentData.ConsigneeAddress,
    //   Notify: this.shipmentData.Notify || '',
    //   NotifyAddress: this.shipmentData.NotifyAddress || '',
    //   DestinationAgent: this.shipmentData.DestinationAgent,
    //   AgentAddress: this.shipmentData.AgentAddress || '',
    //   CarrierName: bookingFormValue.CarrierName || null,
    //   QuotationHeaderSid: bookingFormValue.QuotationHeaderSid || null,
    //   HBLNo: this.shipmentData.HBLNo || '',
    //   MBLNo: bookingFormValue.MBLNo || '',
    //   MBLDate: bookingFormValue.MBLDate ? new Date(bookingFormValue.MBLDate) : null,
    //   status: bookingFormValue.status === 'A' ? 'A' : 'S',
    //   VesselName: this.shipmentData.VesselName || null,
    //   VoyageMasterSid: this.shipmentData.VoyageMasterSid || null,
    //   VoyageNo: bookingFormValue.VoyageNo || null,
    //   ETA: bookingFormValue.ETA ? new Date(bookingFormValue.ETA) : null,
    //   ETD: bookingFormValue.ETD ? new Date(bookingFormValue.ETD) : null,
    //   POO: bookingFormValue.POO || null,
    //   POL: this.shipmentData.portOfLoading,
    //   POD: this.shipmentData.portOfDischarge,
    //   POLTerminal: bookingFormValue.POLTerminal || '',
    //   PODTerminal: bookingFormValue.PODTerminal || '',
    //   FPD: bookingFormValue.FPD || null,
    //   MovementType: bookingFormValue.MovementType || null,
    //   DoValid: bookingFormValue.DoValid ? new Date(bookingFormValue.DoValid) : null,
    //   Coload: bookingFormValue.Coload ? 'Y' : 'N',
    //   ShipmentType: bookingFormValue.ShipmentType ? 'Y' : 'N',
    //   IncoTerms: bookingFormValue.IncoTerms,
    //   InternalNote: bookingFormValue.InternalNote || '',
    //   GeneralNote: bookingFormValue.GeneralNote || '',
    //   NominatedBy: bookingFormValue.NominatedBy || 'Self',
    //   FreightTerms: bookingFormValue.FreightTerms || '',
    //   ShipmentNo: bookingFormValue.ShipmentNo || '',
    //   houseJobCargo: {
    //     HouseJobCargoSid: cargoFormValue.HouseJobCargoSid || null,
    //     CargoType: cargoFormValue.CargoType || null,

    //     ContainerType: this.shipmentData.containers
    //       .map(c => c.containerNo),

    //     NoofContainers: this.shipmentData.containers.length || 0,

    //     GrossWeight: this.shipmentData.containers
    //       .reduce((sum, c) => sum + (c.grossWeight || 0), 0),

    //     NetWeight: parseFloat(cargoFormValue.NetWeight) || 0,
    //     Volume: this.shipmentData.containers
    //       .reduce((sum, c) => sum + (c.volume || 0), 0),

    //     ChargeableWeight: parseFloat(cargoFormValue.ChargeableWeight) || 0,
    //     NoOfPackage: this.shipmentData.containers
    //       .reduce((sum, c) => sum + (c.packCount || 0), 0),

    //     ShipmentTerms: cargoFormValue.ShipmentTerms || null,
    //     MovementType: cargoFormValue.MovementType || null,
    //     FreightTerms: cargoFormValue.FreightTerms || null,
    //     ModeOfTransport: cargoFormValue.ModeOfTransport || null,
    //     StuffingAt: cargoFormValue.StuffingAt || 'Dock',
    //   },

    //   houseJobOthers: {
    //     HouseJobOthersSid: otherFormValue.HouseJobOthersSid || null,
    //     CustomerRefNo: otherFormValue.CustomerRefNo || '',
    //     YardCFS: otherFormValue.YardCFS || '',
    //     ReleaseType: otherFormValue.ReleaseType || null,
    //     HBLNo: otherFormValue.HBLNo || '',
    //     Forwarder: otherFormValue.Forwarder || null,
    //     ForwarderAddress: otherFormValue.ForwarderAddress || '',
    //     NotifyParty: otherFormValue.NotifyParty || null,
    //     NotifyPartyAddress: otherFormValue.NotifyPartyAddress || '',
    //     Notify2: otherFormValue?.Notify2,
    //     NotifyAddress2: otherFormValue?.NotifyAddress2,
    //     Coloader: otherFormValue?.Coloader,
    //     PickupPlace: otherFormValue.PickupPlace || '',
    //     DeliveryPlace: otherFormValue.DeliveryPlace || '',
    //     DeliveryDate: otherFormValue.DeliveryDate ? new Date(otherFormValue.DeliveryDate) : null,
    //     CHAName: otherFormValue.CHAName || '',
    //     PickupAddress: otherFormValue.PickupAddress || '',
    //     DeliveryAddress: otherFormValue.DeliveryAddress || '',
    //     CargoCurrency: otherFormValue.CargoCurrency || null,
    //     CargoValue: parseFloat(otherFormValue.CargoValue) || 0,
    //     SwitchBL: otherFormValue.SwitchBL ? 'Y' : 'N',
    //     BacktoBack: otherFormValue.BacktoBack ? 'Y' : 'N',
    //     Depo: otherFormValue.Depo || '',
    //     ROValidity: otherFormValue.ROValidity ? new Date(otherFormValue.ROValidity) : null,
    //     SwitchBLAgent: otherFormValue?.SwitchBLAgent,
    //     AgentAddress: otherFormValue?.AgentAddress,
    //     SwitchBLShipper: otherFormValue?.SwitchBLShipper,
    //     SwitchBLConsignee: otherFormValue?.SwitchBLConsignee,
    //     SwitchLocation: otherFormValue?.SwitchLocation,
    //     CarrierBookingRef: otherFormValue?.CarrierBookingRef,
    //     CarrierBookingDate: otherFormValue?.CarrierBookingDate ? new Date(otherFormValue?.CarrierBookingDate) : null
    //   },
    //   houseJobProduct: detailFormValue.map((product: any) => ({
    //     HouseJobProductSid: product.HouseJobProductSid || null,
    //     ProductName: product.ProductName || '',
    //     ShippingBillNo: product.ShippingBillNo || '',
    //     ShippingBillDate: product.ShippingBillDate ? new Date(product.ShippingBillDate) : null,
    //     ExternaPkg: product.ExternaPkg || null,
    //     ExternlQty: String(product.ExternlQty),
    //     GrossWeight: parseFloat(product.GrossWeight) || 0,
    //     NetWeight: parseFloat(product.NetWeight) || 0,
    //     Volume: parseFloat(product.Volume) || 0,
    //     IsHaz: product.IsHaz ? 'Y' : 'N',
    //     ImcoClass: product.ImcoClass || '',
    //     UnNo: product.UnNo || '',
    //     PkgGroup: product.PkgGroup || '',
    //     Length: Number(product.Length),
    //     Width: Number(product.Width),
    //     Height: Number(product.Height),
    //     UomMasterSid: product.UomMasterSid,
    //     CargoRecDate: product.CargoRecDate
    //   })),
    //   bookingConnection: this.bookingResponse.data.houseConnections,
    //   // bookingRates: this.bookingResponse.data.bookingRates,
    // }

    const payload = {
  // ---------- Top-level booking info ----------
  CompanyMasterSid: bookingFormValue?.CompanyMasterSid,
  BranchMasterSid: bookingFormValue?.BranchMasterSid,
  MenuMasterSid: currentMenuId,
  DepartmentMasterSid: bookingFormValue.DepartmentMasterSid,
  CustomerMasterSid: bookingFormValue.CustomerMasterSid,
  CustomerBranchSid: bookingFormValue.CustomerBranchSid || null,
  CustomerName: bookingFormValue.CustomerName,
  CustomerAddress: bookingFormValue.CustomerAddress,
  SalesmanSid: bookingFormValue.SalesmanSid || null,

  // ---------- Shipment / party details ----------
  ShipperName: this.shipmentData.shipper.name,
  ShipperAddress: this.shipmentData.shipper.address,
  ConsigneeName: this.shipmentData.consignee.name,
  ConsigneeAddress: this.shipmentData.consignee.address,
  Notify: this.shipmentData.notifyParty.name || '',
  NotifyAddress: this.shipmentData.notifyParty.address || '',
  DestinationAgent: bookingFormValue.DestinationAgent || '',          // or your own field name

  AgentAddress: this.shipmentData.AgentAddress || '',               // if you keep a separate AgentAddress
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
  POL: this.shipmentData.portOfLoading || null,
  POD: this.shipmentData.portOfDischarge || null,
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
  // ---------- Cargo ----------
  houseJobCargo: {
    HouseJobCargoSid: cargoFormValue.HouseJobCargoSid || null,
    CargoType: cargoFormValue.CargoType || null,

    ContainerType: this.shipmentData.containers.map(c => c.containerNo),
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

  // ---------- Other details ----------
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

  // ---------- Products ----------
  houseJobProduct: detailFormValue.map((product: any) => ({
    HouseJobProductSid: product.HouseJobProductSid || null,
    ProductName: product.ProductName || '',
    ShippingBillNo: product.ShippingBillNo || '',
    ShippingBillDate: product.ShippingBillDate ? new Date(product.ShippingBillDate) : null,
    ExternaPkg: product.ExternaPkg || null,
    ExternlQty: String(product.ExternlQty),
    GrossWeight: parseFloat(product.GrossWeight) || 0,
    NetWeight: parseFloat(product.NetWeight) || 0,
    Volume: parseFloat(product.Volume) || 0,
    IsHaz: product.IsHaz ? 'Y' : 'N',
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
  })),

  bookingConnection: this.bookingResponse.data.houseConnections
  // bookingRates: this.bookingResponse.data.bookingRates,
};

    console.log('Final Payload:', payload);
    this.operationService.updateHouseById(HouseJobSid, payload).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess('Booking successfully updated.');
        } else {
          this.appSettingService.showError('Error updating booking.');
          console.error(resp.message);
        }
      },
      error: (err) => {
        this.appSettingService.showError('Failed to update booking.');
        console.error(err);
      }
    });
    console.log('Saving shipment instruction:', this.shipmentData);
    this.isEditMode = false;
  }

  resetForm() {
    this.isEditMode = false;
    this.showShipmentInstruction = false;
    this.searchHbl = '';
  }
}
