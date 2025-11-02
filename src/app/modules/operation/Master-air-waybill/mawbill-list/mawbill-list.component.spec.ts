import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MawbillListComponent } from './mawbill-list.component';

describe('MawbillListComponent', () => {
  let component: MawbillListComponent;
  let fixture: ComponentFixture<MawbillListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MawbillListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MawbillListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
