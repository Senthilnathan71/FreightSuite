declare module 'intl-tel-input/data' {
  const allCountries: Array<{
    iso2: string;
    dialCode: string;
    name?: string;
  }>;

  export default allCountries;
}
