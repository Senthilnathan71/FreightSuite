import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctypeListComponent } from './doctype-list.component';

describe('DoctypeListComponent', () => {
  let component: DoctypeListComponent;
  let fixture: ComponentFixture<DoctypeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctypeListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DoctypeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
