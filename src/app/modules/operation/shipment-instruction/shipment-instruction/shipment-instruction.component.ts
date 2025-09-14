import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-shipment-instruction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipment-instruction.component.html',
  styleUrl: './shipment-instruction.component.scss'
})
export class ShipmentInstructionComponent {
  isEditMode = false;
  searchHbl = '';
  showShipmentInstruction = false;

  shipmentData = {
    billOfLadingNo: '',
    exportReference: '',
    shipper: {
      name: 'GIVAUDAN WANG PTE LTD.',
      address: 'P/A GIVAUDAN SINGAPORE PTE LTD.\n1 WOODLANDS AVE 8,\nSINGAPORE 738972'
    },
    consignee: {
      name: '',
      address: ''
    },
    notifyParty: {
      name: '',
      address: ''
    },
    notifyParty2: {
      name: '',
      address: ''
    },
    deliveryAgent: '',
    vesselVoyNo: 'NORD WINTER/W1002',
    placeOfReceipt: 'CHENNAI CFS',
    portOfDischarge: 'CHENNAI',
    numberOfOriginalBL: '',
    releaseType: 'Draft',
    portOfLoading: 'CHENNAI',
    placeOfDelivery: 'SINGAPORE, SINGAPORE CFS',
    freightPayableAt: 'CHENNAI',
    typeOfService: 'Prepaid',
    shippedOnBoard: '',
    placeAndDateOfIssue: '',
    containers: [
      { containerNo: 'YTUT8909123/42G0', marksAndNos: '', descriptionOfGoods: 'STC.', packCount: 1, packType: 'Carton', grossWeight: 1000.000, volume: 0.500 },
      { containerNo: 'TTNU1234567/22G0', marksAndNos: '', descriptionOfGoods: 'GENERAL', packCount: 1, packType: 'PACK', grossWeight: 4000.000, volume: 2.000 },
      { containerNo: 'ASXC9087123/42G0', marksAndNos: '', descriptionOfGoods: 'STC.', packCount: 1, packType: 'Carton', grossWeight: 1000.000, volume: 0.500 }
    ],
    riderMarksNo: '',
    riderDesc: ''
  };

  searchShipment() {
    if (this.searchHbl.trim()) {
      // Service call will be implemented later
      this.showShipmentInstruction = true;
      this.isEditMode = false;
    }
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
  }

  saveShipmentInstruction() {
    // Service call will be implemented later
    console.log('Saving shipment instruction:', this.shipmentData);
    this.isEditMode = false;
  }

  resetForm() {
    this.isEditMode = false;
    this.showShipmentInstruction = false;
    this.searchHbl = '';
  }
}
