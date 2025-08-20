import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainerActivityComponent } from './container-activity.component';

describe('ContainerActivityComponent', () => {
  let component: ContainerActivityComponent;
  let fixture: ComponentFixture<ContainerActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContainerActivityComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContainerActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
