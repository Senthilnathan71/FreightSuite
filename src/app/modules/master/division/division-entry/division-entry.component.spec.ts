import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DivisionEntryComponent } from './division-entry.component';

describe('DivisionEntryComponent', () => {
  let component: DivisionEntryComponent;
  let fixture: ComponentFixture<DivisionEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DivisionEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DivisionEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
