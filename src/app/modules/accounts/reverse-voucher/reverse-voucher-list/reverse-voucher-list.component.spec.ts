import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReverseVoucherListComponent } from './reverse-voucher-list.component';

describe('ReverseVoucherListComponent', () => {
  let component: ReverseVoucherListComponent;
  let fixture: ComponentFixture<ReverseVoucherListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReverseVoucherListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReverseVoucherListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
