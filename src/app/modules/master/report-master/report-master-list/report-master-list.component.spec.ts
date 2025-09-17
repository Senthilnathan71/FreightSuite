import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportMasterListComponent } from './report-master-list.component';

describe('ReportMasterListComponent', () => {
  let component: ReportMasterListComponent;
  let fixture: ComponentFixture<ReportMasterListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportMasterListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReportMasterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
