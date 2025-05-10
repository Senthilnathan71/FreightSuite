import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainerTypeListComponent } from './container-type-list.component';

describe('ContainerTypeListComponent', () => {
  let component: ContainerTypeListComponent;
  let fixture: ComponentFixture<ContainerTypeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContainerTypeListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContainerTypeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
