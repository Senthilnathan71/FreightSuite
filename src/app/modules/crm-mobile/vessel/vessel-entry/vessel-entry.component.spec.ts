import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VesselEntryComponent } from './vessel-entry.component';

describe('VesselEntryComponent', () => {
  let component: VesselEntryComponent;
  let fixture: ComponentFixture<VesselEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VesselEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VesselEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
