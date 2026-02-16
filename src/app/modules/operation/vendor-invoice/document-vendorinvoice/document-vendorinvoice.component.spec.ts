import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentVendorInvoiceEntryComponent } from './document-vendorinvoice.component';

describe('DocumentVendorInvoiceEntryComponent', () => {
  let component: DocumentVendorInvoiceEntryComponent;
  let fixture: ComponentFixture<DocumentVendorInvoiceEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentVendorInvoiceEntryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentVendorInvoiceEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
