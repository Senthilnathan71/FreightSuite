import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VolumetricAndCbmCalculationService {

  airVolumetricDivisor = 6000;
  lclVolumetricDivisor = 5000;

  constructor() { }


    calculateCBM(externlQty: number, length: number, width: number, height: number, uomSid: number, digitsAfterDecimal: number = 3): number {
    // Parse and validate inputs
    const qty = this.parseFloatSafe(externlQty);
    const len = this.parseFloatSafe(length);
    const wdt = this.parseFloatSafe(width);
    const hgt = this.parseFloatSafe(height);

    // Return 0 if any required dimension is missing or invalid
    if (qty <= 0 || len <= 0 || wdt <= 0 || hgt <= 0 || !uomSid) {
      return 0;
    }

    let cbm = 0;

    switch (uomSid) {
      case 1: // Meter - Direct calculation
        cbm = qty * len * wdt * hgt;
        break;
      case 2: // Centimeter - Convert to meters by dividing by 1,000,000
        cbm = (qty * len * wdt * hgt) / 1000000;
        break;
      case 3: // Inch - Convert to meters (1 inch = 0.0254 meters)
        cbm = qty * (len * 0.0254) * (wdt * 0.0254) * (hgt * 0.0254);
        break;
      default:
        cbm = 0;
    }

    return this.roundToPrecision(cbm, digitsAfterDecimal);
  }

  calculateVolumetric(
    externlQty: number, 
    length: number, 
    width: number, 
    height: number, 
    uomSid: number, 
    shipmentType: 'LCL' | 'AIR' = 'LCL',
    digitsAfterDecimal: number = 3
  ): number {
    // Parse and validate inputs
    const qty = this.parseFloatSafe(externlQty);
    const len = this.parseFloatSafe(length);
    const wdt = this.parseFloatSafe(width);
    const hgt = this.parseFloatSafe(height);

    // Return 0 if we don't have sufficient data
    if (qty <= 0 || (len <= 0 && wdt <= 0 && hgt <= 0) || !uomSid) {
      return 0;
    }

    let volumetric = 0;
    let volumeInCubicCm = 0;

    // Calculate volume in cubic centimeters
    switch (uomSid) {
      case 1: // Meters - Convert to centimeters (1m = 100cm)
        volumeInCubicCm = qty * ((len * 100) * (wdt * 100) * (hgt * 100));
        break;
      case 2: // Centimeters - Already in correct unit
        volumeInCubicCm = qty * len * wdt * hgt;
        break;
      case 3: // Inches - Convert to centimeters (1 inch = 2.54 cm)
        volumeInCubicCm = qty * ((len * 2.54) * (wdt * 2.54) * (hgt * 2.54));
        break;
      default:
        volumeInCubicCm = 0;
    }
     // Calculate volumetric weight based on shipment type
    if (volumeInCubicCm > 0) {
      if (shipmentType === 'LCL') {
        volumetric = volumeInCubicCm / this.lclVolumetricDivisor;
      } else if (shipmentType === 'AIR') {
        volumetric = volumeInCubicCm / this.airVolumetricDivisor;
      }
    }

    return this.roundToPrecision(volumetric, digitsAfterDecimal);
  }

  calculateCBMAndVolumetric(
    externlQty: number,
    length: number,
    width: number,
    height: number,
    uomSid: number,
    shipmentType: 'LCL' | 'AIR' = 'LCL',
    digitsAfterDecimal: number = 3
  ): { cbm: number; volumetric: number } {
    const cbm = this.calculateCBM(externlQty, length, width, height, uomSid, digitsAfterDecimal);
    const volumetric = this.calculateVolumetric(externlQty, length, width, height, uomSid, shipmentType, digitsAfterDecimal);
    
    return { cbm, volumetric };
  }

   recalculateOnUOMChange(
    externlQty: number,
    length: number,
    width: number,
    height: number,
    oldUomSid: number,
    newUomSid: number,
    shipmentType: 'LCL' | 'AIR' = 'LCL',
    digitsAfterDecimal: number = 3
  ): { cbm: number; volumetric: number } {
    
    // If we have valid dimensions, recalculate with new UOM
    const cbm = this.calculateCBM(externlQty, length, width, height, newUomSid, digitsAfterDecimal);
    const volumetric = this.calculateVolumetric(externlQty, length, width, height, newUomSid, shipmentType, digitsAfterDecimal);
    
    return { cbm, volumetric };
  }

  calculateChargeableWeight(volumetric: number, grossWeight: number, digitsAfterDecimal: number = 3): number {
    const vol = this.parseFloatSafe(volumetric);
    const gross = this.parseFloatSafe(grossWeight);
    
    const chargeableWeight = Math.max(vol, gross);
    return this.roundToPrecision(chargeableWeight, digitsAfterDecimal);
  }

    private parseFloatSafe(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  private roundToPrecision(value: number, digits: number): number {
    if (value === 0) return 0;
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }
}
