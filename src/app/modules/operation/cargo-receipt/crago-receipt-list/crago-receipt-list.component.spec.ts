import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CragoReceiptListComponent } from './crago-receipt-list.component';

describe('CragoReceiptListComponent', () => {
  let component: CragoReceiptListComponent;
  let fixture: ComponentFixture<CragoReceiptListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CragoReceiptListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CragoReceiptListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
