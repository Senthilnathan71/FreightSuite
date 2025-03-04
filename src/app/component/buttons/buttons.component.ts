import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


interface buttonsData {
  btn: string;
  icon: string;
}

@Component({
  selector: 'app-ngbd-buttons',
  standalone: true,
  templateUrl: 'buttons.component.html',
  imports: [
    FormsModule, ReactiveFormsModule
  ]
})
export class NgbdButtonsComponent implements OnInit {
  public checkboxGroupForm: UntypedFormGroup = Object.create(null);

  public radioGroupForm: UntypedFormGroup = Object.create(null);

  constructor(private formBuilder: UntypedFormBuilder) { }

  buttonsdata: buttonsData[] = [
    {
      btn: 'primary',
      icon: 'fa-check',
    },
    {
      btn: 'secondary',
      icon: 'fa-link',
    },
    {
      btn: 'success',
      icon: 'fa-check',
    },
    {
      btn: 'info',
      icon: 'fa-heart',
    },
    {
      btn: 'warning',
      icon: 'fa-list',
    },
    {
      btn: 'danger',
      icon: 'fa-envelope',
    },
  ];

  model = {
    left: true,
    middle: false,
    right: false,
  };

  model1 = 1;

  ngOnInit() {
    this.checkboxGroupForm = this.formBuilder.group({
      left: true,
      middle: false,
      right: false,
    });

    this.radioGroupForm = this.formBuilder.group({
      model: 1,
    });
  }
}
