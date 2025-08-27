import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfitabilityReportEntryComponent } from './profitability-report-entry.component';

describe('ProfitabilityReportEntryComponent', () => {
  let component: ProfitabilityReportEntryComponent;
  let fixture: ComponentFixture<ProfitabilityReportEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfitabilityReportEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfitabilityReportEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
