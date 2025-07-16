import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorTdsEntryComponent } from './vendor-tds-entry.component';

describe('VendorTdsEntryComponent', () => {
  let component: VendorTdsEntryComponent;
  let fixture: ComponentFixture<VendorTdsEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorTdsEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VendorTdsEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
