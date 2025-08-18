import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainerActivityListComponent } from './container-activity-list.component';

describe('ContainerActivityListComponent', () => {
  let component: ContainerActivityListComponent;
  let fixture: ComponentFixture<ContainerActivityListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContainerActivityListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContainerActivityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
