import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditRequestEntryComponent } from './credit-request-entry.component';

describe('CreditRequestEntryComponent', () => {
  let component: CreditRequestEntryComponent;
  let fixture: ComponentFixture<CreditRequestEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditRequestEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreditRequestEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
