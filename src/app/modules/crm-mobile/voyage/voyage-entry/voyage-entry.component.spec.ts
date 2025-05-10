import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoyageEntryComponent } from './voyage-entry.component';

describe('VoyageEntryComponent', () => {
  let component: VoyageEntryComponent;
  let fixture: ComponentFixture<VoyageEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoyageEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VoyageEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
