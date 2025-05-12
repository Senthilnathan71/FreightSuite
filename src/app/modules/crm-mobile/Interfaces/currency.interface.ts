export interface Currency {
  subUnit: any;
  unit: any;
  countryMasterSid: any;
  remarks: string;
  symbol: any;
  currencySubUnit: any;
  currencyUnit: any;
  Remarks: any;
  CurrencyMasterSid: number;
  currencyName: string;
  currencyCode: string;
  currencyID: string;
  CurrencyUnit: string | null; // Rupee
  CurrencySubUnit: string | null; // Paise
  ShortCode: string | null; // Rs
  Symbol: string | null; // symb
  currencyFirstName: string;
  currencyLastName: string;
  currencyRatio: number;
  amountDecimal: number;
  exchangeDecimal: number;
  createdBy: string;
  createdOn: Date;
  updatedOn: Date;
  deletedAt: Date | null;
  updatedBy: string | null;
  status: 'A' | 'I'; // Assuming status can be 'A' (Active) or 'I' (Inactive)
  CountryMasterSid: number;
  LoginSid: number | null;
  
}

