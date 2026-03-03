import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import intlTelInputData from 'intl-tel-input/data';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';

@Component({
  selector: 'app-dial-code-dropdown',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableDropdown],
  templateUrl: './dial-code-dropdown.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DialCodeDropdownComponent),
      multi: true,
    },
  ],
})
export class DialCodeDropdownComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() countries: any[] = [];
  @Input() placeholder = '';

  dialCodeOptions: Array<{ countryCode: string; countryName: string; dialCode: string }> = [];
  lookupConfig = {
    displayFields: ['countryName', 'dialCode'],
    displayLabels: ['Country', 'Dial Code'],
    labelFields: [ 'dialCode'],
  };

  control = new FormControl<string | null>(null);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private static readonly defaultDialCode = '+91';
  private static readonly dialCodeByCountryIso = new Map<string, string>(
    (intlTelInputData as any[]).map((country) => [
      String(country?.iso2 || '').toUpperCase(),
      `+${String(country?.dialCode || '').trim()}`,
    ])
  );

  static getDialCodeByCountry(country: any): string {
    const countryCode = String(country?.countryCode || '').trim().toUpperCase();
    if (!countryCode) return '';
    return this.dialCodeByCountryIso.get(countryCode) || '';
  }

  static getDialCodeByCountryCode(countryCode: string): string {
    return this.dialCodeByCountryIso.get(String(countryCode || '').trim().toUpperCase()) || '';
  }

  static getCurrentCountryDialCode(
    customerForm: any,
    countryList: any[],
    userData: any,
    fallbackDialCode = this.defaultDialCode
  ): string {
    const selectedCountryId = customerForm?.get('CountryMasterSid')?.value;
    const selectedCountry = countryList?.find((c: any) => c?.CountryMasterSid == selectedCountryId);
    const fromSelectedCountry = this.getDialCodeByCountryCode(selectedCountry?.countryCode || '');
    if (fromSelectedCountry) return fromSelectedCountry;
    return this.getDefaultDialCodeFromLoginCountry(userData, fallbackDialCode);
  }

  static getDefaultDialCodeFromLoginCountry(
    userData: any,
    fallbackDialCode = this.defaultDialCode
  ): string {
    const loginCountryCode = String(userData?.countryMaster?.countryCode || '').trim().toUpperCase();
    return this.dialCodeByCountryIso.get(loginCountryCode) || fallbackDialCode;
  }

  static splitPhoneNumber(rawValue: any, fallbackDialCode = this.defaultDialCode): { phoneCode: string; phoneNumber: string } {
    const value = String(rawValue || '').trim();
    if (!value) {
      return { phoneCode: '', phoneNumber: '' };
    }

    const compact = value.replace(/\s+/g, '');
    const knownDialCodes = Array.from(
      new Set(Array.from(this.dialCodeByCountryIso.values()).concat(fallbackDialCode))
    ).sort((a, b) => b.length - a.length);

    const matchedDialCode = knownDialCodes.find((code) => compact.startsWith(code));
    if (matchedDialCode) {
      const phoneNumber = compact.slice(matchedDialCode.length).replace(/\D/g, '').slice(0, 15);
      return {
        phoneCode: matchedDialCode,
        phoneNumber
      };
    }

    return {
      phoneCode: '',
      phoneNumber: compact.replace(/\D/g, '').slice(0, 15)
    };
  }

  static normalizePhoneDigits(value: any): string {
    return String(value || '').replace(/\D/g, '').slice(0, 15);
  }

  static buildPhoneWithDialCode(
    phoneValue: any,
    dialCode?: string,
    fallbackDialCode = this.defaultDialCode
  ): string {
    const phoneNumber = this.normalizePhoneDigits(phoneValue);
    if (!phoneNumber) return '';
    const resolvedDialCode = String(dialCode || fallbackDialCode).trim();
    return `${resolvedDialCode}${phoneNumber}`;
  }

  ngOnInit(): void {
    this.control.valueChanges.subscribe((value) => {
      this.onChange(value ?? null);
      this.onTouched();
    });
    this.buildOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['countries']) {
      this.buildOptions();
    }
  }

  writeValue(value: string | null): void {
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.control.disable({ emitEvent: false });
    } else {
      this.control.enable({ emitEvent: false });
    }
  }

  private buildOptions(): void {
    const countries = this.countries || [];
    const options = countries
      .map((country: any) => {
        const countryCode = String(country?.countryCode || '').trim().toUpperCase();
        const countryName = String(country?.countryName || '').trim();
        if (!countryCode) return null;
        const dialCode = DialCodeDropdownComponent.getDialCodeByCountryCode(countryCode);
        if (!dialCode) return null;
        return { countryCode, countryName, dialCode };
      })
      .filter(Boolean) as Array<{ countryCode: string; countryName: string; dialCode: string }>;

    const seen = new Set<string>();
    this.dialCodeOptions = options.filter((item) => {
      if (seen.has(item.dialCode)) return false;
      seen.add(item.dialCode);
      return true;
    });

    if (!this.dialCodeOptions.find((x) => x.dialCode === DialCodeDropdownComponent.defaultDialCode)) {
      this.dialCodeOptions.unshift({
        countryCode: 'IN',
        countryName: 'India',
        dialCode: DialCodeDropdownComponent.defaultDialCode
      });
    }
  }
}
