import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceJobListComponent } from './service-job-list.component';

describe('ServiceJobListComponent', () => {
  let component: ServiceJobListComponent;
  let fixture: ComponentFixture<ServiceJobListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceJobListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ServiceJobListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
