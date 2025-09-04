import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MergeBookingComponent } from './merge-booking.component';

describe('MergeBookingComponent', () => {
  let component: MergeBookingComponent;
  let fixture: ComponentFixture<MergeBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MergeBookingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MergeBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
