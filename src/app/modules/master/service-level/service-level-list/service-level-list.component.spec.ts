import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceLevelListComponent } from './service-level-list.component';

describe('ServiceLevelListComponent', () => {
  let component: ServiceLevelListComponent;
  let fixture: ComponentFixture<ServiceLevelListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceLevelListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ServiceLevelListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
