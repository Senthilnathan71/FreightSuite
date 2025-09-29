import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolsDropdownComponent } from './tools-dropdown.component';

describe('ToolsDropdownComponent', () => {
  let component: ToolsDropdownComponent;
  let fixture: ComponentFixture<ToolsDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolsDropdownComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ToolsDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
