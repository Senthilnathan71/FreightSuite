import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoneEntryComponent } from './zone.component';

describe('ZoneEntryComponent', () => {
  let component: ZoneEntryComponent;
  let fixture: ComponentFixture<ZoneEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ZoneEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
