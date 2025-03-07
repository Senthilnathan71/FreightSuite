import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UOMMListComponent } from './uomm-list.component';

describe('UOMMListComponent', () => {
  let component: UOMMListComponent;
  let fixture: ComponentFixture<UOMMListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UOMMListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UOMMListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
