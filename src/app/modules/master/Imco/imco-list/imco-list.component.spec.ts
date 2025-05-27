import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImcoListComponent } from './imco-list.component';

describe('ImcoListComponent', () => {
  let component: ImcoListComponent;
  let fixture: ComponentFixture<ImcoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImcoListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImcoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
