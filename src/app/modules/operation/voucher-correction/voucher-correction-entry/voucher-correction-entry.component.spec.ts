import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoucherCorrectionEntryComponent } from './voucher-correction-entry.component';

describe('VoucherCorrectionEntryComponent', () => {
  let component: VoucherCorrectionEntryComponent;
  let fixture: ComponentFixture<VoucherCorrectionEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoucherCorrectionEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VoucherCorrectionEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
