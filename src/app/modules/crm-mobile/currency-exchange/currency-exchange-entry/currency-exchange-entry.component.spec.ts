import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyExchangeEntryComponent } from './currency-exchange-entry.component';

describe('CurrencyExchangeEntryComponent', () => {
  let component: CurrencyExchangeEntryComponent;
  let fixture: ComponentFixture<CurrencyExchangeEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyExchangeEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CurrencyExchangeEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
