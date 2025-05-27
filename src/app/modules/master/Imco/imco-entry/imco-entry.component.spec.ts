import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImcoEntryComponent } from './imco-entry.component';

describe('ImcoEntryComponent', () => {
  let component: ImcoEntryComponent;
  let fixture: ComponentFixture<ImcoEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImcoEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImcoEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
