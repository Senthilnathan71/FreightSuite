import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingPlanEntryComponent } from './loading-plan-entry.component';

describe('LoadingPlanEntryComponent', () => {
  let component: LoadingPlanEntryComponent;
  let fixture: ComponentFixture<LoadingPlanEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingPlanEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoadingPlanEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
