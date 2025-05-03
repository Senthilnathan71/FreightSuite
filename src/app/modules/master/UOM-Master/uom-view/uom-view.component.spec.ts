import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UOMViewComponent } from './uom-view.component';

describe('UOMViewComponent', () => {
  let component: UOMViewComponent;
  let fixture: ComponentFixture<UOMViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UOMViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UOMViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
