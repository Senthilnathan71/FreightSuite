import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductEntryComponent } from './product-entry.component';

describe('ProductEntryComponent', () => {
  let component: ProductEntryComponent;
  let fixture: ComponentFixture<ProductEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
