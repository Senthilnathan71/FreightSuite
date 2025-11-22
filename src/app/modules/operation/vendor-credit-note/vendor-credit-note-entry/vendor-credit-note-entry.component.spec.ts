import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorCreditNoteEntryComponent } from './vendor-credit-note-entry.component';

describe('VendorCreditNoteEntryComponent', () => {
  let component: VendorCreditNoteEntryComponent;
  let fixture: ComponentFixture<VendorCreditNoteEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorCreditNoteEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VendorCreditNoteEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
