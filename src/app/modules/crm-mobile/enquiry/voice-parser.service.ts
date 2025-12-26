import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VoiceParserService {
  
  parseNavigationCommand(text: string): NavigationCommand {
  const lowerText = text.toLowerCase().trim();

  /* =========================
     NAVIGATION (NO DATA LOSS)
     ========================= */
  if (
    lowerText === 'next' ||
    lowerText === 'forward'
  ) {
    return { type: 'NAVIGATE', direction: 'NEXT' };
  }

  if (
    lowerText === 'previous' ||
    lowerText === 'back'
  ) {
    return { type: 'NAVIGATE', direction: 'PREVIOUS' };
  }

  if (
    lowerText === 'skip'
  ) {
    return { type: 'NAVIGATE', direction: 'SKIP' };
  }

  /* =========================
     CONTROL (DATA AFFECTING)
     ========================= */
  if (
    lowerText === 'clear' ||
    lowerText === 'remove' ||
    lowerText === 'reset field'
  ) {
    return { type: 'CONTROL', action: 'CLEAR' };
  }

  if (
    lowerText === 'stop' ||
    lowerText === 'pause'
  ) {
    return { type: 'CONTROL', action: 'STOP' };
  }

  if (
    lowerText === 'continue' ||
    lowerText === 'resume'
  ) {
    return { type: 'CONTROL', action: 'CONTINUE' };
  }

  /* =========================
     FALLBACK = FIELD INPUT
     ========================= */
  return { type: 'INPUT', text };
}


  extractFieldFromText(text: string, availableFields: string[]): string | null {
    const fieldPatterns: Record<string, string[]> = {
      'Segment': ['department', 'dept', 'segment', 'mode'],
      'CustomerBranchSid': ['customer', 'party', 'customer name'],
      'POL': ['pol', 'port of loading', 'loading port'],
      'POD': ['pod', 'port of discharge', 'discharge port'],
      'CargoType': ['cargo type', 'cargo', 'type'],
      'GrossWeight': ['gross weight', 'gross'],
      'NetWeight': ['net weight', 'net'],
      'cbm': ['cbm', 'volume', 'cubic meter'],
      'Remarks': ['remarks', 'comment', 'notes'],
      'Email': ['email', 'email address'],
      'ContactNumber': ['phone', 'contact', 'mobile'],
      'EnquiryType': ['enquiry type', 'mode of enquiry'],
      'IncoTerms': ['inco', 'incoterm', 'incoterms'],
      'FreightPPCC': ['freight', 'freight terms'],
      'shipmentDate': ['shipment date', 'expected date'],
      'CustomerRef': ['customer reference', 'reference'],
      'ClearanceBy': ['clearance by'],
      'TransportBy': ['transport by'],
      'ContactPerson': ['contact person'],
      'LeadOrCustomer': ['mode', 'customer or lead', 'type']
    };

    for (const [field, patterns] of Object.entries(fieldPatterns)) {
      for (const pattern of patterns) {
        if (text.includes(pattern) && availableFields.includes(field)) {
          return field;
        }
      }
    }
    
    return null;
  }

  extractValueFromText(text: string, field: string): string {
    // Remove field name from text to get value
    const patterns = this.getFieldPatterns(field);
    let processedText = text.toLowerCase();
    
    for (const pattern of patterns) {
      processedText = processedText.replace(pattern, '').trim();
    }
    
    // Remove common prefixes
    const prefixes = ['set', 'enter', 'select', 'choose', 'is', 'as'];
    prefixes.forEach(prefix => {
      if (processedText.startsWith(prefix + ' ')) {
        processedText = processedText.substring(prefix.length + 1);
      }
    });
    
    return processedText.trim();
  }

  private getFieldPatterns(field: string): string[] {
    const patterns: Record<string, string[]> = {
      'Segment': ['department', 'dept', 'segment'],
      'CustomerBranchSid': ['customer', 'party'],
      'POL': ['pol', 'port of loading'],
      'POD': ['pod', 'port of discharge'],
      'CargoType': ['cargo type', 'cargo']
    };
    
    return patterns[field] || [field.toLowerCase()];
  }

  matchDropdownValue(
  text: string,
  options: any[],
  searchFields: string[]
): any {
  console.warn('⚠️ DEPRECATED: matchDropdownValue',{
    text,
    options
  });

  if (!options || !options.length) return null;

  const normalize = (val: string) =>
    val
      .toLowerCase()
      .replace(/\s+/g, '')
      .trim();

  const spoken = normalize(text);

  for (const option of options) {
    for (const field of searchFields) {
      const value = option[field];
      if (!value) continue;

      const candidate = normalize(value.toString());

      // ✅ EXACT OR PARTIAL MATCH (BOTH DIRECTIONS)
      if (
        candidate === spoken ||
        candidate.includes(spoken) ||
        spoken.includes(candidate)
      ) {
        return option;
      }
    }
  }

  return null;
}


}

export interface NavigationCommand {
  type: 'NAVIGATE' | 'CONTROL' | 'INPUT';
  direction?: 'NEXT' | 'PREVIOUS' | 'SKIP';
  action?: string;
  text?: string;
}