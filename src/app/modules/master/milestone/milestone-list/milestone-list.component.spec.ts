import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MilestoneListComponent } from './milestone-list.component';

describe('MilestoneListComponent', () => {
  let component: MilestoneListComponent;
  let fixture: ComponentFixture<MilestoneListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MilestoneListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MilestoneListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
