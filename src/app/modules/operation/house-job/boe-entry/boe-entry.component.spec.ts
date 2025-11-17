import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoeEntryComponent } from './boe-entry.component';

describe('BoeEntryComponent', () => {
  let component: BoeEntryComponent;
  let fixture: ComponentFixture<BoeEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoeEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BoeEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
