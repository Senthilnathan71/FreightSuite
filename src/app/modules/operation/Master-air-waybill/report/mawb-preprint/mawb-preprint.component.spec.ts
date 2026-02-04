import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MawbPreprintComponent } from './mawb-preprint.component';

describe('MawbPreprintComponent', () => {
  let component: MawbPreprintComponent;
  let fixture: ComponentFixture<MawbPreprintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MawbPreprintComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MawbPreprintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
