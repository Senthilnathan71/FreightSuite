import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArApComponent } from './ar-ap.component';

describe('ArApComponent', () => {
  let component: ArApComponent;
  let fixture: ComponentFixture<ArApComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArApComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ArApComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
