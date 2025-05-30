import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SailingScheduleLsitComponent } from './sailing-schedule-lsit.component';

describe('SailingScheduleLsitComponent', () => {
  let component: SailingScheduleLsitComponent;
  let fixture: ComponentFixture<SailingScheduleLsitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SailingScheduleLsitComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SailingScheduleLsitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
