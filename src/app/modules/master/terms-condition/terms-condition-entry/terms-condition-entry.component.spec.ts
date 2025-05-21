import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsConditionEntryComponent } from './terms-condition-entry.component';

describe('TermsConditionEntryComponent', () => {
  let component: TermsConditionEntryComponent;
  let fixture: ComponentFixture<TermsConditionEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsConditionEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TermsConditionEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
