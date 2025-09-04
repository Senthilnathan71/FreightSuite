import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitBookingEntryComponent } from './split-booking-entry.component';

describe('SplitBookingEntryComponent', () => {
  let component: SplitBookingEntryComponent;
  let fixture: ComponentFixture<SplitBookingEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitBookingEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SplitBookingEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
