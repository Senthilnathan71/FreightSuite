import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfitabilityReportListComponent } from './profitability-report-list.component';

describe('ProfitabilityReportListComponent', () => {
  let component: ProfitabilityReportListComponent;
  let fixture: ComponentFixture<ProfitabilityReportListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfitabilityReportListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfitabilityReportListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
