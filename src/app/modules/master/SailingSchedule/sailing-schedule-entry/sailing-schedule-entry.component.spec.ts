import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SailingScheduleEntryComponent } from './sailing-schedule-entry.component';

describe('SailingScheduleEntryComponent', () => {
  let component: SailingScheduleEntryComponent;
  let fixture: ComponentFixture<SailingScheduleEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SailingScheduleEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SailingScheduleEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
