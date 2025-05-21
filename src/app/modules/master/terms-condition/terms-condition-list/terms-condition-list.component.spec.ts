import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsConditionListComponent } from './terms-condition-list.component';

describe('TermsConditionListComponent', () => {
  let component: TermsConditionListComponent;
  let fixture: ComponentFixture<TermsConditionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsConditionListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TermsConditionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
