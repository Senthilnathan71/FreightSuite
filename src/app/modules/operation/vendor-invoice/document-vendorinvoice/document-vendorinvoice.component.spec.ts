import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentVendorinvoiceComponent } from './document-vendorinvoice.component';

describe('DocumentVendorinvoiceComponent', () => {
  let component: DocumentVendorinvoiceComponent;
  let fixture: ComponentFixture<DocumentVendorinvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentVendorinvoiceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumentVendorinvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
