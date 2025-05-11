import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeZoneListComponent } from './time-zone-list.component';

describe('TimeZoneListComponent', () => {
  let component: TimeZoneListComponent;
  let fixture: ComponentFixture<TimeZoneListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeZoneListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TimeZoneListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
