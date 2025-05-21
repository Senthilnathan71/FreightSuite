import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargeEntryComponent } from './charge-entry.component';

describe('ChargeEntryComponent', () => {
  let component: ChargeEntryComponent;
  let fixture: ComponentFixture<ChargeEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargeEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChargeEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
