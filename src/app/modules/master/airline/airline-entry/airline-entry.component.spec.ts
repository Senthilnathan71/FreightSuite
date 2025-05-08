import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirlineEntryComponent } from './airline-entry.component';

describe('AirlineEntryComponent', () => {
  let component: AirlineEntryComponent;
  let fixture: ComponentFixture<AirlineEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirlineEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AirlineEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
