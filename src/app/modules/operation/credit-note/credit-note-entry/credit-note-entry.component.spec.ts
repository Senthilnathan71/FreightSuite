import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditNoteEntryComponent } from './credit-note-entry.component';

describe('CreditNoteEntryComponent', () => {
  let component: CreditNoteEntryComponent;
  let fixture: ComponentFixture<CreditNoteEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditNoteEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreditNoteEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
