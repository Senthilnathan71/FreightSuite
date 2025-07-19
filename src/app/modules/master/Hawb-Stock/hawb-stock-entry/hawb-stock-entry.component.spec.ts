import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HawbStockEntryComponent } from './hawb-stock-entry.component';

describe('HawbStockEntryComponent', () => {
  let component: HawbStockEntryComponent;
  let fixture: ComponentFixture<HawbStockEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HawbStockEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HawbStockEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
