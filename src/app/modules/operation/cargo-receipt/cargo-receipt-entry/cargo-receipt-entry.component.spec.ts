import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargoReceiptEntryComponent } from './cargo-receipt-entry.component';

describe('CargoReceiptEntryComponent', () => {
  let component: CargoReceiptEntryComponent;
  let fixture: ComponentFixture<CargoReceiptEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargoReceiptEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CargoReceiptEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
