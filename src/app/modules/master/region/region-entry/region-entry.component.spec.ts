import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegionEntryComponent } from './region-entry.component';

describe('RegionEntryComponent', () => {
  let component: RegionEntryComponent;
  let fixture: ComponentFixture<RegionEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegionEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegionEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
