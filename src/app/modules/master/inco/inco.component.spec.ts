import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncoComponent } from './inco.component';

describe('IncoComponent', () => {
  let component: IncoComponent;
  let fixture: ComponentFixture<IncoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IncoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
