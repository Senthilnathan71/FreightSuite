export interface CompanyConfigField {
  visible: boolean;
  label: string;
  required?: boolean;
  editable?: boolean;
}

export interface CompanyConfigSection {
  [fieldKey: string]: CompanyConfigField;
}

export interface CompanyConfigSubsection {
  fields: CompanyConfigSection;
  enabled?: boolean;
}

export interface CompanyConfigModule {
  [subsectionKey: string]: CompanyConfigSubsection;
}

export interface EmailConfiguration {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
}

export interface CompanyConfiguration {
  systemSettings: {
    dateFormat: string;
    timeFormat: string;
    timezone: string;
    currency: {
      currencyMasterSid: number;
      code: string;
      symbol: string;
      position: 'before' | 'after';
      decimalPlaces: number;
    };
    numberFormat?: {
      decimalSeparator: string;
      thousandSeparator: string;
      decimalPlaces: number;
    };
    company: {
      logo?: string;
      name: string;
      address: string;
      contact: string;
    };
    emailConfig?: EmailConfiguration;
  };
  moduleFeatures: {
    crm: { [featureKey: string]: ModuleFeature };
    operations: { [featureKey: string]: ModuleFeature };
    accounts: { [featureKey: string]: ModuleFeature };
    masters: { [featureKey: string]: ModuleFeature };
  };
  fieldCustomization: {
    crm: CompanyConfigModule;
    operations: CompanyConfigModule;
    accounts: CompanyConfigModule;
    masters: CompanyConfigModule;
  };
  documentConfiguration?: DocumentConfiguration;
}

export interface SystemSettings {
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  currency: CurrencySettings;
  numberFormat: {
    decimalSeparator: string;
    thousandSeparator: string;
    decimalPlaces: number;
  };
  preferences: {
    enableNotifications: boolean;
    autoSave: boolean;
    sessionTimeout: number;
  };
}

export interface CurrencySettings {
  currencyMasterSid: number;
  code: string;
  symbol: string;
  position: 'before' | 'after';
  decimalPlaces: number;
}

export interface ModuleFeature {
  enabled: boolean;
  description: string;
  dependencies?: string[];
}

export interface ModuleFeatures {
  crm: { [featureKey: string]: ModuleFeature };
  operations: { [featureKey: string]: ModuleFeature };
  accounts: { [featureKey: string]: ModuleFeature };
  masters: { [featureKey: string]: ModuleFeature };
}

/**
 * Document Configuration Interface
 * Applies to all document types (Invoices, Purchase Orders, Bill of Lading, etc.)
 */
export interface DocumentConfiguration {
  logoPosition: 'left' | 'center' | 'right';
  companyPosition: 'left' | 'center' | 'right';
  companyAlignment: 'left' | 'center' | 'right';
  // enableFooter: boolean;
  // footerText?: string;
  // footerPosition: 'left' | 'center' | 'right';
  // marginTop?: number;
  // marginBottom?: number;
  // marginLeft?: number;
  // marginRight?: number;
}

export interface FieldMapping {
  originalLabel: string;
  customLabel: string;
  visible: boolean;
  required: boolean;
  editable: boolean;
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}