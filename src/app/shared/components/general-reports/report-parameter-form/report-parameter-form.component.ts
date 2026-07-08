import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReportService } from '../../../services/report.service';
import { Subscription } from 'rxjs';
import { finalize, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { getDefaultTodayDate, toNgbDateStruct } from 'src/app/common/helper';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';

export interface ReportParameter {
  ReportMasterDetailSid: number;
  ParameterName: string;
  ParameterFieldType: string;
  DropDownValue?: any[];
  ParameterQuery?: string;
  DefaultValue ?: any;
  ValidationRules ?: string;
  Status: string;
  DependsOnParameter?: string;  // Parent parameter name for cascading dropdowns
  DisplayLabel?: string;        // Optional override for the auto-generated label
}

@Component({
  selector: 'app-report-parameter-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    NgSelectModule,
    SearchableDropdown,
    MultiSelectComponent, 
    NgbDatepickerModule,
    FeatherModule
  ],
  templateUrl: './report-parameter-form.component.html',
  styleUrls: ['./report-parameter-form.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }
  ],
})
export class ReportParameterFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() parameters: ReportParameter[] = [];
  @Input() loading: boolean = false;
  @Input() module: 'accounts' | 'operation' = 'accounts';
  @Input() companyId!: number;
  @Input() branchId!: number;
  @Input() reportKey: string = '';
  @Input() reportDisplayName: string = '';
  @Output() onGenerate = new EventEmitter<any>();
  @Output() onReset = new EventEmitter<void>();
  @Output() onValueChange = new EventEmitter<any>();
  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;
  parameterForm!: FormGroup;
  dropdownData: Map<string, any[]> = new Map();
  loadingDropdowns: Map<string, boolean> = new Map();
  /** Shared empty-options reference. Returned by getDropdownOptions before data loads so the value
   *  template binding ([items]) stays referentially stable across change-detection — a fresh [] each
   *  pass makes ng-select's virtualScroll re-render in a loop (ExpressionChanged in _renderItemsRange). */
  private readonly EMPTY_OPTIONS: any[] = [];
  minDates = new Map<string, NgbDateStruct>();
  maxDates = new Map<string, NgbDateStruct>();

  // Cascading dropdown support
  disabledDropdowns: Map<string, boolean> = new Map();
  private parameterDependencies: Map<string, string[]> = new Map(); // parent -> children[]
  private subscriptions: Subscription = new Subscription();

  // Ageing Report: parameters hidden from the form until their trigger is met
  // (currently the Salesman dropdown, shown only when the "Salesman" checkbox is ticked).
  private hiddenParams: Set<string> = new Set();

  readonly FIELD_TYPES = {
    TEXT: 'TEXT',
    NUMBER: 'NUMBER',
    DATE: 'DATE',
    EMAIL: 'EMAIL',
    TEXTAREA: 'TEXTAREA',
    DROPDOWN: 'DROPDOWN',
    DROPDOWN_M: 'DROPDOWN M',
    DROPDOWN_D: 'DROPDOWN D',
    CHECKBOX: 'CHECKBOX',
    RADIO: 'RADIO',
    FILE: 'FILE',
    URL: 'URL',
    PHONE: 'PHONE'
  };

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private appSettingsService: AppSettingsService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
     const fy = this.appSettingsService.getCurrentFinancialYear();
            if (fy) {
              this.fyMinDate = toNgbDateStruct(fy.StartDate);
              const fyEnd = new Date(fy.EndDate);
              const today = getDefaultTodayDate();
              this.fyMaxDate = toNgbDateStruct(fyEnd > today ? today : fyEnd);
            }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['parameters'] && !changes['parameters'].firstChange) {
      this.buildForm();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

   /**
   * Build dynamic form
   */
  buildForm(): void {
    const group: any = {};

    const today = new Date();

    // Reset maps
    this.parameterDependencies.clear();
    this.disabledDropdowns.clear();

    // Build dependency map first
    this.buildDependencyMap();

    this.parameters.forEach(param => {
      console.log(param);
      const validators = this.buildValidators(param);

      group[param.ParameterName] = [
        this.getDefaultValue(param),
        validators
      ];

      if (param.ParameterFieldType === this.FIELD_TYPES.DROPDOWN ||
          param.ParameterFieldType === this.FIELD_TYPES.DROPDOWN_M ||
          param.ParameterFieldType === this.FIELD_TYPES.DROPDOWN_D) {

        // Check if this is a dependent dropdown
        if (param.DependsOnParameter) {
          // Start disabled until parent is selected
          this.disabledDropdowns.set(param.ParameterName, true);
          this.dropdownData.set(param.ParameterName, []);
        } else if(param.DropDownValue){
          this.dropdownData.set(param.ParameterName, param.DropDownValue);
        } else {
          this.loadDynamicDropdown(param);
        }
      }
    });

    this.parameterForm = this.fb.group(group);

    // DROPDOWN M is rendered via <multi-select>, which honours only the form control's disabled state
    // (no [disabled] input + map binding like the other field types). So disable dependent DROPDOWN M
    // controls until their parent is selected — scoped to DROPDOWN M so DROPDOWN/DROPDOWN D are untouched.
    this.parameters
      .filter(p => p.DependsOnParameter && p.ParameterFieldType === this.FIELD_TYPES.DROPDOWN_M)
      .forEach(p => this.parameterForm.get(p.ParameterName)?.disable({ emitEvent: false }));

    // Setup cascading listeners after form is built
    this.setupCascadingListeners();

    // Ageing Report: Salesman view is local-only, so lock CurrencyWise off when it is on.
    this.setupSalesmanCurrencyLock();
    // Ageing Report: show the Salesman dropdown only when the "Salesman" checkbox is ticked.
    this.setupSalesmanFilterVisibility();
    this.setupFormValueChanges();
  }

  /**
   * Ageing Report only: when "Salesman" is ticked, force "CurrencyWise" to false and disable it
   * (the salesman view works in local amounts); when unticked, re-enable it (value stays false).
   * Guarded by the presence of BOTH controls — that pair is unique to the Ageing Report, so this
   * works regardless of whether the host binds [reportKey].
   */
  private setupSalesmanCurrencyLock(): void {
    const salesman = this.parameterForm.get('Salesman');
    const currencyWise = this.parameterForm.get('CurrencyWise');
    if (!salesman || !currencyWise) return;

    const apply = (ticked: boolean) => {
      if (ticked) {
        currencyWise.setValue(false, { emitEvent: false });
        currencyWise.disable({ emitEvent: false });
      } else {
        currencyWise.enable({ emitEvent: false });
      }
    };

    apply(!!salesman.value); // initial state

    const sub = salesman.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((value) => apply(!!value));
    this.subscriptions.add(sub);
  }

  /**
   * Ageing Report only: the Salesman dropdown is hidden until the "Salesman" checkbox is ticked.
   * When hidden the control is cleared + disabled so it is neither validated nor submitted
   * (parameterForm.value excludes disabled controls); when shown it is re-enabled.
   * The dropdown is detected as any dropdown-type parameter whose name/label mentions "salesman"
   * (the checkbox itself is a CHECKBOX field, so it is never matched).
   */
  private setupSalesmanFilterVisibility(): void {
    const salesman = this.parameterForm.get('Salesman');
    const dropdownNames = this.getSalesmanDropdownNames();
    if (!salesman || dropdownNames.length === 0) return;

    const apply = (ticked: boolean) => {
      dropdownNames.forEach((name) => {
        const control = this.parameterForm.get(name);
        if (!control) return;
        if (ticked) {
          this.hiddenParams.delete(name);
          control.enable({ emitEvent: false });
        } else {
          this.hiddenParams.add(name);
          control.setValue(null, { emitEvent: false });
          control.disable({ emitEvent: false });
        }
      });
    };

    apply(!!salesman.value); // initial state

    const sub = salesman.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((value) => apply(!!value));
    this.subscriptions.add(sub);
  }

  /** Dropdown-type parameter(s) that represent the Salesman filter (excludes the Salesman checkbox). */
  private getSalesmanDropdownNames(): string[] {
    const dropdownTypes = [
      this.FIELD_TYPES.DROPDOWN,
      this.FIELD_TYPES.DROPDOWN_M,
      this.FIELD_TYPES.DROPDOWN_D,
    ];
    return this.parameters
      .filter((p) => dropdownTypes.includes(p.ParameterFieldType))
      .filter((p) => {
        const text = `${p.ParameterName} ${p.DisplayLabel ?? ''}`.toLowerCase();
        return text.includes('salesman');
      })
      .map((p) => p.ParameterName);
  }

  /** Whether a parameter field should be rendered (false while hidden behind its trigger). */
  isParamVisible(param: ReportParameter): boolean {
    return !this.hiddenParams.has(param.ParameterName);
  }

  private setupFormValueChanges(): void {
    this.onValueChange.emit(this.parameterForm.getRawValue());

    const sub = this.parameterForm.valueChanges
      .subscribe(() => this.onValueChange.emit(this.parameterForm.getRawValue()));
    this.subscriptions.add(sub);
  }

  /**
   * Build a map of parent -> children dependencies
   */
  private buildDependencyMap(): void {
    this.parameters.forEach(param => {
      if (param.DependsOnParameter) {
        const children = this.parameterDependencies.get(param.DependsOnParameter) || [];
        children.push(param.ParameterName);
        this.parameterDependencies.set(param.DependsOnParameter, children);
      }
    });
  }

  /**
   * Setup valueChanges listeners for parent dropdowns
   */
  private setupCascadingListeners(): void {
    // Clear existing subscriptions
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();

    this.parameterDependencies.forEach((children, parentName) => {
      const parentControl = this.parameterForm.get(parentName);
      if (parentControl) {
        const sub = parentControl.valueChanges.pipe(
          distinctUntilChanged(),
          debounceTime(100)
        ).subscribe(parentValue => {
          this.onParentValueChange(parentName, parentValue, children);
        });
        this.subscriptions.add(sub);
      }
    });
  }

  /**
   * Handle parent dropdown value change
   */
  private onParentValueChange(parentName: string, parentValue: any, childrenNames: string[]): void {
    childrenNames.forEach(childName => {
      const childControl = this.parameterForm.get(childName);
      const childParam = this.parameters.find(p => p.ParameterName === childName);

      if (!childControl || !childParam) return;

      // Clear child value
      childControl.setValue(null);
      this.dropdownData.set(childName, []);

      const isMultiSelect = childParam.ParameterFieldType === this.FIELD_TYPES.DROPDOWN_M;

      if (parentValue === null || parentValue === undefined || parentValue === '') {
        // Parent cleared - disable child
        this.disabledDropdowns.set(childName, true);
        // <multi-select> reads only control.disabled, so mirror the map onto the control for DROPDOWN M.
        if (isMultiSelect) childControl.disable({ emitEvent: false });
      } else {
        // Parent has value - enable and reload child dropdown
        this.disabledDropdowns.set(childName, false);
        if (isMultiSelect) childControl.enable({ emitEvent: false });
        this.loadDynamicDropdownWithContext(childParam, parentName, parentValue);
      }
    });
  }

  /**
   * Load dynamic dropdown with parent context for cascading
   */
  private loadDynamicDropdownWithContext(param: ReportParameter, parentName: string, parentValue: any): void {
    this.loadingDropdowns.set(param.ParameterName, true);

    // Build context with parent value
    const context: any = { companyId: this.companyId };
    context[parentName] = parentValue;

    // Also include any other parent values in the chain (for multi-level cascading)
    this.addParentValuesToContext(param, context);

    this.reportService.executeParameterQuery(
      this.module,
      param.ReportMasterDetailSid,
      context
    ).pipe(
      finalize(() => this.loadingDropdowns.set(param.ParameterName, false))
    ).subscribe({
      next: (options) => {
        this.dropdownData.set(param.ParameterName, options);
      },
      error: (error) => {
        console.error(`Failed to load options for ${param.ParameterName}:`, error);
        this.dropdownData.set(param.ParameterName, []);
      }
    });
  }

  /**
   * Recursively add all parent values to context for multi-level cascading
   */
  private addParentValuesToContext(param: ReportParameter, context: any): void {
    if (param.DependsOnParameter) {
      const parentParam = this.parameters.find(p => p.ParameterName === param.DependsOnParameter);
      if (parentParam) {
        const parentValue = this.parameterForm.get(param.DependsOnParameter)?.value;
        if (parentValue !== null && parentValue !== undefined) {
          context[param.DependsOnParameter] = parentValue;
        }
        // Recurse for multi-level dependencies
        this.addParentValuesToContext(parentParam, context);
      }
    }
  }

  /**
   * Check if a dropdown should be disabled (for cascading)
   */
  isDropdownDisabled(paramName: string): boolean {
    return this.disabledDropdowns.get(paramName) || false;
  }

  /**
   * Get the label of the parent parameter for placeholder text
   */
  getParentLabel(paramName: string): string {
    const param = this.parameters.find(p => p.ParameterName === paramName);
    if (param?.DependsOnParameter) {
      return this.getParameterLabel(param.DependsOnParameter);
    }
    return '';
  }

    /**
   * Build validators without ValidationService
   */
  private buildValidators(param: ReportParameter): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    const financialYr = this.appSettingsService.getCurrentFinancialYear();
    const today = getDefaultTodayDate();
    const startDate = new Date(financialYr.StartDate);
    const endDate = new Date(financialYr.EndDate);
    const isCurrentYr = today <= endDate && today>= startDate;

    // Required
    const rules = typeof param.ValidationRules === 'string'
    ? JSON.parse(param.ValidationRules)
    : param.ValidationRules;
    console.log("Received Validation Rules", rules);

    if (rules?.required) validators.push(Validators.required);
    if (rules?.minLength) validators.push(Validators.minLength(rules.minLength));
    if (rules?.maxLength) validators.push(Validators.maxLength(rules.maxLength));
    if (rules?.min != null) validators.push(Validators.min(rules.min));
    if (rules?.max != null) validators.push(Validators.max(rules.max));
    if (rules?.pattern) validators.push(Validators.pattern(rules.pattern));
    if (rules?.minDate) {
      let d : Date;
      switch(rules.minDate){
        case 'fy' : 
          d = startDate;
          break;
        case 'today':
          d = today
          break;
        default :
          d = new Date(rules.minDate)
      }
      this.minDates.set(param.ParameterName, toNgbDateStruct(d));
    }

    if (rules?.maxDate) {
      let d : Date;
      switch(rules.maxDate){
        case 'fy' : 
          d = isCurrentYr ? today : endDate;
          break;
        case 'today':
          d = today
          break;
        default :
          d = new Date(rules.maxDate)
      }
      this.maxDates.set(param.ParameterName, toNgbDateStruct(d));
    }

    // Field-specific
    switch (param.ParameterFieldType) {
      case this.FIELD_TYPES.EMAIL:
        validators.push(Validators.email);
        break;
      case this.FIELD_TYPES.URL:
        validators.push(this.urlValidator());
        break;
      case this.FIELD_TYPES.PHONE:
        validators.push(this.phoneValidator());
        break;
      case this.FIELD_TYPES.NUMBER:
        validators.push(this.numberValidator());
        break;
    }
    console.log(validators);
    console.log(this.minDates);
    console.log(this.maxDates);
    return validators;
  }

   /** Simple Validators */

  private urlValidator(): ValidatorFn {
    return (control) => {
      if (!control.value) return null;
      try {
        new URL(control.value);
        return null;
      } catch {
        return { invalidUrl: true };
      }
    };
  }

  private phoneValidator(): ValidatorFn {
    return (control) => {
      if (!control.value) return null;
      const regex = /^[0-9+\-\s()]+$/;
      return regex.test(control.value) ? null : { invalidPhone: true };
    };
  }

  private numberValidator(): ValidatorFn {
    return (control) => {
      if (!control.value) return null;
      return isNaN(Number(control.value)) ? { invalidNumber: true } : null;
    };
  }

  /**
   * Get default values
   */
  private getDefaultValue(param: ReportParameter) {

    if (param.ParameterFieldType === this.FIELD_TYPES.CHECKBOX)
      return param.DefaultValue === 'true';

    if (param.ParameterFieldType === this.FIELD_TYPES.CHECKBOX)
      return param.DefaultValue === 'true';

    if (param.ParameterFieldType === this.FIELD_TYPES.DROPDOWN_M)
      return param.DefaultValue ? param.DefaultValue.split(',') : [];

    if (param.ParameterFieldType === this.FIELD_TYPES.NUMBER)
      return param.DefaultValue ? Number(param.DefaultValue) : null;

    return param.DefaultValue || null;
  }

  /**
   * Load dynamic dropdown options from API
   */
  private loadDynamicDropdown(param: ReportParameter): void {
    this.loadingDropdowns.set(param.ParameterName, true);

    this.reportService.executeParameterQuery(
      this.module,
      param.ReportMasterDetailSid,
      { companyId: this.companyId , branchId : this.branchId }
    ).pipe(
      finalize(() => this.loadingDropdowns.set(param.ParameterName, false))
    ).subscribe({
      next: (options) => {
        this.dropdownData.set(param.ParameterName, options);
      },
      error: (error) => {
        console.error(`Failed to load options for ${param.ParameterName}:`, error);
        this.dropdownData.set(param.ParameterName, []);
        // Optionally show error to user
      }
    });
  }

  /**
   * Check if dropdown is currently loading
   */
  isDropdownLoading(paramName: string): boolean {
    return this.loadingDropdowns.get(paramName) || false;
  }

  getParameterLabel(paramName: string): string {
    // Convert camelCase to Title Case with spaces
    return paramName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  getDropdownOptions(paramName: string): any[] {
    return this.dropdownData.get(paramName) || this.EMPTY_OPTIONS;
  }

  private getDropdownSample(paramName: string): any {
    const options = this.getDropdownOptions(paramName);
    return options.length ? options[0] : {};
  }

  private getDropdownKeys(paramName: string): string[] {
    const sample = this.getDropdownSample(paramName);
    return Object.keys(sample || {});
  }

  private findFieldByPattern(keys: string[], pattern: RegExp): string | null {
    return keys.find(k => pattern.test(k)) || null;
  }

  private toTitleCaseFromKey(key: string): string {
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^./, s => s.toUpperCase())
      .trim();
  }

  getDropdownBindValue(paramName: string): string {
    const keys = this.getDropdownKeys(paramName);
    if (!keys.length) return 'value';

    return this.findFieldByPattern(keys, /^value$/i)
      || this.findFieldByPattern(keys, /(sid|id)$/i)
      || this.findFieldByPattern(keys, /code/i)
      || keys[0];
  }

  getDropdownBindLabel(paramName: string): string {
    const keys = this.getDropdownKeys(paramName);
    if (!keys.length) return 'label';

    return this.findFieldByPattern(keys, /^label$/i)
      || this.findFieldByPattern(keys, /name/i)
      || this.findFieldByPattern(keys, /code/i)
      || keys[0];
  }

  getDropdownDisplayFields(paramName: string): string[] {
    const keys = this.getDropdownKeys(paramName);
    if (!keys.length) return ['label'];

    const visibleKeys = keys.filter(key => !/^value$/i.test(key));
    if (!visibleKeys.length) return ['label'];

    const codeKey = this.findFieldByPattern(visibleKeys, /code/i);
    const nameKey = this.findFieldByPattern(visibleKeys, /(name|label)/i);

    const preferredFieldKeys = visibleKeys.filter(key =>
      /(name|label|group|code)/i.test(key),
    );

    if (preferredFieldKeys.length >= 2) {
      return preferredFieldKeys.slice(0, 2);
    }

    if (codeKey && nameKey && codeKey !== nameKey) {
      return [codeKey, nameKey];
    }

    if (visibleKeys.length >= 2) {
      return [visibleKeys[0], visibleKeys[1]];
    }

    return [visibleKeys[0]];
  }

  getDropdownDisplayLabels(paramName: string): string[] {
    const fields = this.getDropdownDisplayFields(paramName);
    return fields.map(field => {
      if (/code/i.test(field)) return 'Code';
      if (/group/i.test(field)) return 'Sub Group Name';
      if (/(name|label)/i.test(field)) return 'Name';
      return this.toTitleCaseFromKey(field);
    });
  }

  getDropdownLabelFields(paramName: string): string[] {
    return this.getDropdownDisplayFields(paramName);
  }

  isFieldRequired(paramName: string): boolean {
    const control = this.parameterForm.get(paramName);
    return control?.hasValidator(Validators.required) || false;
  }

  onSubmit(): void {
    if (this.parameterForm.valid) {
      if (!this.validateFromToDatePairs()) {
        return;
      }

      const formValue = this.parameterForm.value;

      // Format dates to ISO string if they're date objects
      const formattedValue = Object.keys(formValue).reduce((acc, key) => {
        const param = this.parameters.find(p => p.ParameterName === key);
        acc[key] = formValue[key];
        
        return acc;
      }, {} as any);

      this.onGenerate.emit(formattedValue);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.parameterForm.controls).forEach(key => {
        this.parameterForm.get(key)?.markAsTouched();
      });
    }
  }

  private validateFromToDatePairs(): boolean {
    if (this.isFreightMomGrowthReport()) {
      const fromControl = this.parameterForm.get('FromDate');
      const toControl = this.parameterForm.get('ToDate');
      const fromDate = this.toComparableDate(fromControl?.value);
      const toDate = this.toComparableDate(toControl?.value);

      if (fromDate && toDate) {
        if (fromDate.getTime() > toDate.getTime()) {
          fromControl?.markAsTouched();
          toControl?.markAsTouched();
          this.appSettingsService.showWarning('From Date cannot be after To Date');
          return false;
        }

        const isSameMonth =
          fromDate.getFullYear() === toDate.getFullYear() &&
          fromDate.getMonth() === toDate.getMonth();

        if (!isSameMonth) {
          fromControl?.markAsTouched();
          toControl?.markAsTouched();
          this.appSettingsService.showWarning('From Date and To Date must be within the same month.');
          return false;
        }
      }
    }

    const dateParamNames = new Set(
      this.parameters
        .filter(p => p.ParameterFieldType === this.FIELD_TYPES.DATE)
        .map(p => p.ParameterName)
    );
    const validatedPairs = new Set<string>();

    for (const fromName of dateParamNames) {
      const toName = this.findMatchingToDateName(fromName, dateParamNames);
      if (!toName) continue;

      const pairKey = [fromName, toName].sort().join('|');
      if (validatedPairs.has(pairKey)) continue;
      validatedPairs.add(pairKey);

      const fromControl = this.parameterForm.get(fromName);
      const toControl = this.parameterForm.get(toName);
      const fromDate = this.toComparableDate(fromControl?.value);
      const toDate = this.toComparableDate(toControl?.value);

      if (!fromDate || !toDate) continue;

      if (fromDate.getTime() > toDate.getTime()) {
        fromControl?.markAsTouched();
        toControl?.markAsTouched();
        this.appSettingsService.showWarning(
          `${this.getParameterLabel(fromName)} cannot be after ${this.getParameterLabel(toName)}`
        );
        return false;
      }
    }

    return true;
  }

  private isFreightMomGrowthReport(): boolean {
    const reportKey = this.reportKey?.trim().toLowerCase();
    const reportDisplayName = this.reportDisplayName?.trim().toLowerCase();

    return reportKey === 'freight-mom-growth'
      || reportDisplayName === 'freight mom growth report';
  }

  onDateSelected(paramName: string, selectedDate: NgbDateStruct): void {
    if (
      !this.isFreightMomGrowthReport()
      || paramName !== 'FromDate'
      || !selectedDate
      || selectedDate.day !== 1
    ) {
      return;
    }

    const toControl = this.parameterForm.get('ToDate');
    if (!toControl) {
      return;
    }

    const monthEndDate = new Date(selectedDate.year, selectedDate.month, 0);
    const maxToDate = this.getMaxDate('ToDate');
    const maxAllowedDate = maxToDate
      ? new Date(maxToDate.year, maxToDate.month - 1, maxToDate.day)
      : null;
    const finalToDate = maxAllowedDate && monthEndDate > maxAllowedDate
      ? maxAllowedDate
      : monthEndDate;

    toControl.setValue(new Date(Date.UTC(
      finalToDate.getFullYear(),
      finalToDate.getMonth(),
      finalToDate.getDate(),
      0, 0, 0, 0
    )));
  }

  private findMatchingToDateName(fromName: string, dateParamNames: Set<string>): string | null {
    if (!/from/i.test(fromName)) {
      return null;
    }

    const candidateNames = [
      fromName.replace(/^From/i, 'To'),
      fromName.replace(/From/i, 'To'),
      fromName.replace(/from/i, 'to'),
    ].filter(candidate => candidate !== fromName);

    for (const candidate of candidateNames) {
      if (dateParamNames.has(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private toComparableDate(value: any): Date | null {
    if (!value) return null;

    if (
      typeof value === 'object' &&
      value.year != null &&
      value.month != null &&
      value.day != null
    ) {
      return new Date(value.year, value.month - 1, value.day);
    }

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  resetForm(): void {
    this.parameterForm.reset();
    this.onReset.emit();
  }

  isFormValid(): boolean {
    return this.parameterForm.valid;
  }

  hasError(paramName: string): boolean {
    const control = this.parameterForm.get(paramName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(paramName: string): string {
    const control = this.parameterForm.get(paramName);
    if (control?.hasError('required')) {
      return `${this.getParameterLabel(paramName)} is required`;
    }
    return '';
  }

  getMinDate(paramName: string): NgbDateStruct | null {
    // console.log('🔵 getMinDate called with:', paramName);
    // console.log('🔵 minDates:', this.minDates);
    return this.minDates.get(paramName) || null;
  }

  getMaxDate(paramName: string): NgbDateStruct | null {
    // console.log('🔵 getMaxDate called with:', paramName);
    // console.log('🔵 maxDates:', this.maxDates);
    return this.maxDates.get(paramName) || null;
  }

}
