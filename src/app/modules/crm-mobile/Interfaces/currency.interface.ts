export interface Currency {
  CurrencyMasterSid: number;
  CountryMasterSid: number;
  currencyName: string;
  currencyCode: string;
  CurrencyUnit: string | null;
  CurrencySubUnit: string | null;
  SubUnitIn:string |null;
  ShortCode: string | null;
  Symbol: string | null;
  amountDecimal: number;
  exchangeDecimal: number;
  createdBy: string;
  createdOn: Date;
  updatedOn: Date;
  // deletedAt: Date | null;
  updatedBy: string | null;
  status: 'A' | 'S';
  RoundOf: string | null;
  LoginSid: number | null;
}