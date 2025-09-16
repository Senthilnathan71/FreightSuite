import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseJobEntryComponent } from './house-job-entry.component';

describe('HouseJobEntryComponent', () => {
  let component: HouseJobEntryComponent;
  let fixture: ComponentFixture<HouseJobEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HouseJobEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HouseJobEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
