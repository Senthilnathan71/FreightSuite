import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartAccountListComponent } from './chart-account-list.component';

describe('ChartAccountListComponent', () => {
  let component: ChartAccountListComponent;
  let fixture: ComponentFixture<ChartAccountListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartAccountListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartAccountListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
