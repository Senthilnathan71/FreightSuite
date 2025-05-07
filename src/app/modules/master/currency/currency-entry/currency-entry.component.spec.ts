import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyEntryComponent } from './currency-entry.component';

describe('CurrencyEntryComponent', () => {
  let component: CurrencyEntryComponent;
  let fixture: ComponentFixture<CurrencyEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CurrencyEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
