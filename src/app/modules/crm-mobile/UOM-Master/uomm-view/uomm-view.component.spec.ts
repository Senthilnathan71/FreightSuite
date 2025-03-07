import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UOMMViewComponent } from './uomm-view.component';

describe('UOMMViewComponent', () => {
  let component: UOMMViewComponent;
  let fixture: ComponentFixture<UOMMViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UOMMViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UOMMViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
