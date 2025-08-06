import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuotationEntryComponent } from './quotation-entry.component';

describe('QuotationEntryComponent', () => {
  let component: QuotationEntryComponent;
  let fixture: ComponentFixture<QuotationEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotationEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuotationEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
