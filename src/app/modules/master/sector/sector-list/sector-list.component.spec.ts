import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectorComponent } from './sector-list.component';



describe('SectorListComponent', () => {
  let component: SectorComponent;
  let fixture: ComponentFixture<SectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
