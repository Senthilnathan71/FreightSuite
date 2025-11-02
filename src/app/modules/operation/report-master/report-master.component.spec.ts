import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportMasterComponent } from './report-master.component';

describe('ReportMasterComponent', () => {
  let component: ReportMasterComponent;
  let fixture: ComponentFixture<ReportMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportMasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReportMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
