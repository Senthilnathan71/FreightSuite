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

export interface CompanyConfiguration {
  systemSettings: {
    dateFormat: string;
    timeFormat: string;
    timezone: string;
    currency: {
      code: string;
      symbol: string;
      position: 'before' | 'after';
      decimalPlaces: number;
    };
    company: {
      logo?: string;
      name: string;
      address: string;
      contact: string;
    };
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