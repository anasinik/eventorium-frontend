import { ComponentFixture, fakeAsync, flush, TestBed, tick } from "@angular/core/testing";
import { UserRegisterComponent } from "./user-register.component";
import { AuthService } from "../auth.service";
import { SharedService } from "../../shared/shared.service";
import { ReactiveFormsModule } from "@angular/forms";
import { of } from "rxjs";
import { citiesMock } from "../../../testing/mocks/city.mock";
import { rolesMock } from "../../../testing/mocks/roles.mock";
import { MaterialModule } from "../../infrastructure/material/material.module";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { invalidRegistrationTestCases, mockValidRegistrationForm } from "../../../testing/mocks/registration-form.mock";
import { Router } from "@angular/router";
import { validAuthResponseMock } from "../../../testing/mocks/user.mock";
import {runInvalidFormTestCases} from '../../../testing/util/form-validation.utils';
import {mockValidAuthRequest, validAuthRequestMock} from "../../../testing/mocks/auth-request.mock";
import {Role} from '../model/user-role.model';

describe('UserRegisterComponent', () => {
  let component: UserRegisterComponent;
  let fixture: ComponentFixture<UserRegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let sharedServiceSpy: jasmine.SpyObj<SharedService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['registerUser', 'uploadProfilePhoto', 'getRegistrationOptions']);
    sharedServiceSpy = jasmine.createSpyObj('SharedService', ['getCities'])
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [UserRegisterComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SharedService, useValue: sharedServiceSpy },
        { provide: Router, useValue: routerSpy }
      ],
      imports: [ReactiveFormsModule, MaterialModule, BrowserAnimationsModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
      fixture = TestBed.createComponent(UserRegisterComponent);
      component = fixture.componentInstance;

      sharedServiceSpy.getCities.and.returnValue(of(citiesMock));
      authServiceSpy.getRegistrationOptions.and.returnValue(of(rolesMock));

      fixture.detectChanges();
  })

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    const formValue = component.registrationForm.value;
    for (const key in formValue)
      expect(formValue[key]).toBe('');
  });

  it('should load cities and roles on init', fakeAsync(() => {
    flush();

    expect(authServiceSpy.getRegistrationOptions).toHaveBeenCalled();
    expect(sharedServiceSpy.getCities).toHaveBeenCalled();
  }));

  it('should enable submit button when the form is valid', () => {
    const submitButton = fixture.nativeElement.querySelector('.submit-button');
    component.registrationForm.patchValue(mockValidRegistrationForm);

    fixture.detectChanges();

    expect(submitButton.disabled).toBeFalsy();
  });

  it('should validate required fields', () => {
    runInvalidFormTestCases(
      component.registrationForm,
      fixture,
      '.submit-button',
      mockValidRegistrationForm,
      invalidRegistrationTestCases
    );
  });

  it('should disable submit button when passwords do not match', () => {
    const form = component.registrationForm;
    const submitButton = fixture.nativeElement.querySelector('.submit-button');

    form.patchValue({
        ...mockValidRegistrationForm,
        password: 'password123',
        passwordConfirmation: 'different123'
    });

    fixture.detectChanges();

    expect(form.hasError('passwordMismatch')).withContext('Form should have passwordMismatch error').toBeTrue();
    expect(form.invalid).withContext('Form should be invalid due to password mismatch').toBeTrue();
    expect(submitButton.disabled).withContext('Submit button should be disabled due to password mismatch').toBeTrue();
  });

  it('should ignore invalid file types while uploading profile photo', () => {
    const invalidFile = new File([''], 'test.sql', { type: 'text/plain '});
    const mockEvent = { target: { file: [invalidFile] } } as unknown as Event;

    component.onFileSelected(mockEvent);
    expect(component.profilePhoto).toBe(null);
  })

  /**
   * NOTE: The following three helper functions support testing different registration flows,
   * which are covered in the four tests below.
   */

  // prepare the form and setup spies based on role and photo presence
  function prepareFormAndSpies(roleIndex: number, withPhoto: boolean = false) {
    component.registrationForm.patchValue(mockValidRegistrationForm);
    component.registrationForm.controls['role'].setValue(rolesMock[roleIndex]);
    component.profilePhoto = withPhoto ? new File([''], 'photo.jpg', { type: 'image/jpeg' }) : null;
    fixture.detectChanges();

    authServiceSpy.registerUser.and.returnValue(of(validAuthResponseMock));
    if (withPhoto) {
      authServiceSpy.uploadProfilePhoto.and.returnValue(of(''));
    }
  }

  // click the submit button and flush async operations
  function clickSubmitAndFlush() {
    const submitButton = fixture.nativeElement.querySelector('.submit-button');
    submitButton.click();
    flush();
  }

  // run the registration flow and verify navigation outcome
  function performRegistrationAndCheckNavigation(roleIndex: number, withPhoto: boolean, expectedRoute: any[], role: Role) {
    prepareFormAndSpies(roleIndex, withPhoto);
    clickSubmitAndFlush();

    expect(authServiceSpy.registerUser).toHaveBeenCalledWith(mockValidAuthRequest(role));
    if (withPhoto)
      expect(authServiceSpy.uploadProfilePhoto).toHaveBeenCalledWith(validAuthResponseMock.id, component.profilePhoto);

    expect(routerSpy.navigate).toHaveBeenCalledWith(expectedRoute);
  }

  it('should navigate to home if role is EVENT_ORGANIZER, without photo', fakeAsync(() => {
    performRegistrationAndCheckNavigation(0, false, ['/'], rolesMock[0]);
  }));

  it('should navigate to home if role is EVENT_ORGANIZER, with photo', fakeAsync(() => {
    performRegistrationAndCheckNavigation(0, true, ['/'], rolesMock[0]);
  }));

  it('should navigate to company registration if role is PROVIDER, without photo', fakeAsync(() => {
    performRegistrationAndCheckNavigation(1, false, [`${validAuthResponseMock.id}/company-register`], rolesMock[1]);
  }));

  it('should navigate to company registration if role is PROVIDER, with photo', fakeAsync(() => {
    performRegistrationAndCheckNavigation(1, true, [`${validAuthResponseMock.id}/company-register`], rolesMock[1]);
  }));
});
