import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxGroupListComponent } from './tax-group-list.component';

describe('TaxGroupListComponent', () => {
  let component: TaxGroupListComponent;
  let fixture: ComponentFixture<TaxGroupListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxGroupListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TaxGroupListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
