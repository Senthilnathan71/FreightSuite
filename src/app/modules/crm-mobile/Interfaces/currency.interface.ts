export interface Currency {
  CurrencyMasterSid: number;
  currencyName: string;
  currencyCode: string;
  currencyID: string;
  CurrencyUnit: string | null;
  CurrencySubUnit: string | null;
  ShortCode: string | null;
  Symbol: string | null;
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
  status: 'A' | 'I';
  CountryMasterSid: number;
  LoginSid: number | null;
  Remarks?: string | null;
}