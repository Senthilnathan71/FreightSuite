import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterJobEntryComponent } from './master-job-entry.component';

describe('MasterJobEntryComponent', () => {
  let component: MasterJobEntryComponent;
  let fixture: ComponentFixture<MasterJobEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterJobEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterJobEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
