import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncoListComponent } from './inco-list.component';

describe('IncoListComponent', () => {
  let component: IncoListComponent;
  let fixture: ComponentFixture<IncoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncoListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IncoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
