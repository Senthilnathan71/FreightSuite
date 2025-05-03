import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyExchangeListComponent } from './currency-exchange-list.component';

describe('CurrencyExchangeListComponent', () => {
  let component: CurrencyExchangeListComponent;
  let fixture: ComponentFixture<CurrencyExchangeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyExchangeListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CurrencyExchangeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
