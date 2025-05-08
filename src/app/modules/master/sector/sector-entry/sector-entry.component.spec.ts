import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectorEntryComponent } from './sector-entry.component';

describe('SectorEntryComponent', () => {
  let component: SectorEntryComponent;
  let fixture: ComponentFixture<SectorEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectorEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SectorEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
