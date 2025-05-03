import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitEntryComponent } from './unit-entry.component';

describe('UnitEntryComponent', () => {
  let component: UnitEntryComponent;
  let fixture: ComponentFixture<UnitEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UnitEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
