import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListpageComponent } from './listpage.component';

describe('ListpageComponent', () => {
  let component: ListpageComponent;
  let fixture: ComponentFixture<ListpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListpageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
