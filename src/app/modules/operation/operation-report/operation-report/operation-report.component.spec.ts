import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationReportComponent } from './operation-report.component';

describe('OperationReportComponent', () => {
  let component: OperationReportComponent;
  let fixture: ComponentFixture<OperationReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OperationReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
