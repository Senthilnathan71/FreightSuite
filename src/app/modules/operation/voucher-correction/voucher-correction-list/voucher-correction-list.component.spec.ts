import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoucherCorrectionListComponent } from './voucher-correction-list.component';

describe('VoucherCorrectionListComponent', () => {
  let component: VoucherCorrectionListComponent;
  let fixture: ComponentFixture<VoucherCorrectionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoucherCorrectionListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VoucherCorrectionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
