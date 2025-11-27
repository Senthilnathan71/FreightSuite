import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyConfigComponent } from './company-config.component';

describe('CompanyConfigComponent', () => {
  let component: CompanyConfigComponent;
  let fixture: ComponentFixture<CompanyConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyConfigComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompanyConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
