import { of } from 'rxjs';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('should clear read-only mode when navigating to the login route', () => {
    const sessionStateService = {
      isReadOnly$: of(false),
      setReadOnly: jasmine.createSpy('setReadOnly'),
      acquireScreenLock: jasmine.createSpy('acquireScreenLock').and.returnValue(true),
      releaseScreenLock: jasmine.createSpy('releaseScreenLock')
    };

    const app = new AppComponent(
      { setDevice: jasmine.createSpy('setDevice') } as any,
      { isMobile: () => false } as any,
      sessionStateService as any,
      { url: '/login', events: of() } as any
    );

    app['syncRouteLock']('/login');

    expect(sessionStateService.setReadOnly).toHaveBeenCalledWith(false);
  });
});
