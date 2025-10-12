import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargoReceiptListComponent } from './cargo-receipt-list.component';

describe('CargoReceiptListComponent', () => {
  let component: CargoReceiptListComponent;
  let fixture: ComponentFixture<CargoReceiptListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargoReceiptListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CargoReceiptListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
