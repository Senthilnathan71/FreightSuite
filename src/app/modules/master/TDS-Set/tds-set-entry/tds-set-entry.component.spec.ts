import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TdsSetEntryComponent } from './tds-set-entry.component';

describe('TdsSetEntryComponent', () => {
  let component: TdsSetEntryComponent;
  let fixture: ComponentFixture<TdsSetEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TdsSetEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TdsSetEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
