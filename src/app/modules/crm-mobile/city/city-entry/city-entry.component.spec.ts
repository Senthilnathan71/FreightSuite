import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CityEntryComponent } from './city-entry.component';

describe('CityEntryComponent', () => {
  let component: CityEntryComponent;
  let fixture: ComponentFixture<CityEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CityEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CityEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
