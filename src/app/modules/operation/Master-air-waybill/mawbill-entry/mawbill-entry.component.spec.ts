import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MawbillEntryComponent } from './mawbill-entry.component';

describe('MawbillEntryComponent', () => {
  let component: MawbillEntryComponent;
  let fixture: ComponentFixture<MawbillEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MawbillEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MawbillEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
