import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnquiryEntryComponent } from './enquiry-entry.component';

describe('EnquiryEntryComponent', () => {
  let component: EnquiryEntryComponent;
  let fixture: ComponentFixture<EnquiryEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnquiryEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EnquiryEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
