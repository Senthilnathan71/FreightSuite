import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorCreditNoteListComponent } from './vendor-credit-note-list.component';

describe('VendorCreditNoteListComponent', () => {
  let component: VendorCreditNoteListComponent;
  let fixture: ComponentFixture<VendorCreditNoteListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorCreditNoteListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VendorCreditNoteListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
