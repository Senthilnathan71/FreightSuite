import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BIclauseComponent } from './biclause.component';

describe('BIclauseComponent', () => {
  let component: BIclauseComponent;
  let fixture: ComponentFixture<BIclauseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BIclauseComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BIclauseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
