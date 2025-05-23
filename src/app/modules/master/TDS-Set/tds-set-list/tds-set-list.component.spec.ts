import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TdsSetListComponent } from './tds-set-list.component';

describe('TdsSetListComponent', () => {
  let component: TdsSetListComponent;
  let fixture: ComponentFixture<TdsSetListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TdsSetListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TdsSetListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
