import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MilestoneEntryComponent } from './milestone-entry.component';

describe('MilestoneEntryComponent', () => {
  let component: MilestoneEntryComponent;
  let fixture: ComponentFixture<MilestoneEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MilestoneEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MilestoneEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
