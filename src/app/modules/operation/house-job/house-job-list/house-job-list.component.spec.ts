import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseJobListComponent } from './house-job-list.component';

describe('HouseJobListComponent', () => {
  let component: HouseJobListComponent;
  let fixture: ComponentFixture<HouseJobListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HouseJobListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HouseJobListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
