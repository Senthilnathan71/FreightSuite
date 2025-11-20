import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReverseVoucherEntryComponent } from './reverse-voucher-entry.component';

describe('ReverseVoucherEntryComponent', () => {
  let component: ReverseVoucherEntryComponent;
  let fixture: ComponentFixture<ReverseVoucherEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReverseVoucherEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReverseVoucherEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
