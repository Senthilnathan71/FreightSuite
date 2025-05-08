import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyEntryComponent } from './company-entry.component';

describe('CompanyEntryComponent', () => {
  let component: CompanyEntryComponent;
  let fixture: ComponentFixture<CompanyEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompanyEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
