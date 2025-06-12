import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchableDropdownComponent } from './searchable-dropdown.component';

describe('SearchableDropdownComponent', () => {
  let component: SearchableDropdownComponent;
  let fixture: ComponentFixture<SearchableDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableDropdownComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchableDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
