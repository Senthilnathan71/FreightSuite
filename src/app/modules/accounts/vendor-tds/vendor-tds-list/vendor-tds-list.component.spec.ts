import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorTdsListComponent } from './vendor-tds-list.component';

describe('VendorTdsListComponent', () => {
  let component: VendorTdsListComponent;
  let fixture: ComponentFixture<VendorTdsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorTdsListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VendorTdsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
