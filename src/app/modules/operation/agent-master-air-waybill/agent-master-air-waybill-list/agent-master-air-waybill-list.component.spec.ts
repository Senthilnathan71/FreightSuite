import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentMasterAirWaybillListComponent } from './agent-master-air-waybill-list.component';

describe('AgentMasterAirWaybillListComponent', () => {
  let component: AgentMasterAirWaybillListComponent;
  let fixture: ComponentFixture<AgentMasterAirWaybillListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentMasterAirWaybillListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgentMasterAirWaybillListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
