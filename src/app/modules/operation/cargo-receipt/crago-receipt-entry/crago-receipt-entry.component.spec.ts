import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CragoReceiptEntryComponent } from './crago-receipt-entry.component';

describe('CragoReceiptEntryComponent', () => {
  let component: CragoReceiptEntryComponent;
  let fixture: ComponentFixture<CragoReceiptEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CragoReceiptEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CragoReceiptEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
