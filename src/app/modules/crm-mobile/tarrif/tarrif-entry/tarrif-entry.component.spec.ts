import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarrifEntryComponent } from './tarrif-entry.component';

describe('TarrifEntryComponent', () => {
  let component: TarrifEntryComponent;
  let fixture: ComponentFixture<TarrifEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarrifEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TarrifEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
