import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ConfigNewComponent } from './config-new.component';
import { CompanyConfigService } from '../services/company-config.service';
import { MasterService } from '../../master.service';

describe('ConfigNewComponent', () => {
  let component: ConfigNewComponent;
  let fixture: ComponentFixture<ConfigNewComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockConfigService: jasmine.SpyObj<CompanyConfigService>;
  let mockMasterService: jasmine.SpyObj<MasterService>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      snapshot: {
        params: { id: '1' }
      }
    };
    mockConfigService = jasmine.createSpyObj('CompanyConfigService', [
      'getFieldConfiguration',
      'saveCompanyConfiguration',
      'getDateFormatOptions',
      'getTimeFormatOptions',
      'getCurrencyPositionOptions',
      'getAvailableCurrencies',
      'getAvailableTimezones',
      'getDefaultConfiguration'
    ]);
    mockMasterService = jasmine.createSpyObj('MasterService', [
      'getFieldConfiguration',
      'saveCompanyConfig'
    ]);

    // Setup mock returns
    mockConfigService.getFieldConfiguration.and.returnValue(of({ fieldConfig: {} }));
    mockConfigService.getDateFormatOptions.and.returnValue([
      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }
    ]);
    mockConfigService.getTimeFormatOptions.and.returnValue([
      { value: '24', label: '24 Hour' }
    ]);
    mockConfigService.getCurrencyPositionOptions.and.returnValue([
      { value: 'before', label: 'Before Amount' }
    ]);
    mockConfigService.getAvailableCurrencies.and.returnValue(of([
      { code: 'USD', name: 'US Dollar', symbol: '$' }
    ]));
    mockConfigService.getAvailableTimezones.and.returnValue(of([
      { value: 'UTC', label: 'UTC' }
    ]));
    mockConfigService.getDefaultConfiguration.and.returnValue({
      systemSettings: {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24',
        timezone: 'UTC',
        currency: {
          code: 'USD',
          symbol: '$',
          position: 'before',
          decimalPlaces: 2
        },
        company: {
          name: '',
          address: '',
          contact: ''
        }
      },
      moduleFeatures: {
        crm: {},
        operations: {},
        accounts: {},
        masters: {}
      },
      fieldCustomization: {
        crm: {},
        operations: {},
        accounts: {},
        masters: {}
      }
    });

    await TestBed.configureTestingModule({
      imports: [
        ConfigNewComponent,
        ReactiveFormsModule,
        FormsModule
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: CompanyConfigService, useValue: mockConfigService },
        { provide: MasterService, useValue: mockMasterService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with company ID from route params', () => {
    expect(component.companyId).toBe(1);
  });

  it('should initialize system settings form', () => {
    expect(component.systemSettingsForm).toBeDefined();
    expect(component.systemSettingsForm.get('dateFormat')).toBeTruthy();
    expect(component.systemSettingsForm.get('timeFormat')).toBeTruthy();
    expect(component.systemSettingsForm.get('timezone')).toBeTruthy();
  });

  it('should load configuration options on init', () => {
    expect(mockConfigService.getDateFormatOptions).toHaveBeenCalled();
    expect(mockConfigService.getTimeFormatOptions).toHaveBeenCalled();
    expect(mockConfigService.getCurrencyPositionOptions).toHaveBeenCalled();
    expect(mockConfigService.getAvailableCurrencies).toHaveBeenCalled();
    expect(mockConfigService.getAvailableTimezones).toHaveBeenCalled();
  });

  it('should toggle module feature correctly', () => {
    component.toggleModuleFeature('crm', 'leadManagement');
    expect(component.config.moduleFeatures.crm['leadManagement']).toBeDefined();
    expect(component.config.moduleFeatures.crm['leadManagement'].enabled).toBe(true);

    component.toggleModuleFeature('crm', 'leadManagement');
    expect(component.config.moduleFeatures.crm['leadManagement'].enabled).toBe(false);
  });

  it('should check module feature enabled status', () => {
    component.config.moduleFeatures.crm['leadManagement'] = { enabled: true, description: '' };
    expect(component.isModuleFeatureEnabled('crm', 'leadManagement')).toBe(true);

    component.config.moduleFeatures.crm['leadManagement'] = { enabled: false, description: '' };
    expect(component.isModuleFeatureEnabled('crm', 'leadManagement')).toBe(false);
  });

  it('should toggle field visibility correctly', () => {
    component.toggleFieldVisibility('masters', 'customer', 'customerName');
    expect(component.config.fieldCustomization.masters['customer']).toBeDefined();
    expect(component.config.fieldCustomization.masters['customer'].fields['customerName']).toBeDefined();
    expect(component.config.fieldCustomization.masters['customer'].fields['customerName'].visible).toBe(true);
  });

  it('should navigate back to company on goBackToCompany', () => {
    component.goBackToCompany();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/master/company/entry', 1], {
      state: { config: component.config }
    });
  });

  it('should validate form before saving', () => {
    component.systemSettingsForm.patchValue({
      dateFormat: '',
      timeFormat: '',
      timezone: ''
    });

    spyOn(component, 'markFormGroupTouched' as any);
    component.saveConfiguration();

    expect(component['markFormGroupTouched']).toHaveBeenCalled();
  });

  it('should reset configuration to defaults', () => {
    const defaultConfig = mockConfigService.getDefaultConfiguration();
    component.resetConfiguration();
    expect(component.config).toEqual(defaultConfig);
  });

  it('should format labels correctly', () => {
    const result = component['formatLabel']('customerName');
    expect(result).toBe('Customer Name');
  });

  it('should handle currency change', () => {
    const currency = { code: 'EUR', symbol: '€', name: 'Euro' };
    component.onCurrencyChange(currency);
    expect(component.systemSettingsForm.get('currencySymbol')?.value).toBe('€');
  });

  it('should check field validity correctly', () => {
    const control = component.systemSettingsForm.get('dateFormat');
    control?.markAsTouched();
    control?.setErrors({ required: true });

    expect(component.isFieldInvalid('dateFormat')).toBe(true);
  });

  it('should return appropriate field error messages', () => {
    const control = component.systemSettingsForm.get('dateFormat');
    control?.setErrors({ required: true });

    expect(component.getFieldError('dateFormat')).toBe('dateFormat is required');
  });
});