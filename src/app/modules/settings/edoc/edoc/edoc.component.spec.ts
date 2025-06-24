import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EdocComponent } from './edoc.component';

describe('EdocComponent', () => {
  let component: EdocComponent;
  let fixture: ComponentFixture<EdocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EdocComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EdocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
