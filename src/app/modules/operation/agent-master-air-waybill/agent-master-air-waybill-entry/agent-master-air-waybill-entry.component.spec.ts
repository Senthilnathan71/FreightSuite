import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentMasterAirWaybillEntryComponent } from './agent-master-air-waybill-entry.component';

describe('AgentMasterAirWaybillEntryComponent', () => {
  let component: AgentMasterAirWaybillEntryComponent;
  let fixture: ComponentFixture<AgentMasterAirWaybillEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentMasterAirWaybillEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgentMasterAirWaybillEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
