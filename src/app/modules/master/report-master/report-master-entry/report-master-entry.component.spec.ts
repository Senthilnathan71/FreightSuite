import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportMasterEntryComponent } from './report-master-entry.component';

describe('ReportMasterEntryComponent', () => {
  let component: ReportMasterEntryComponent;
  let fixture: ComponentFixture<ReportMasterEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportMasterEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReportMasterEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
