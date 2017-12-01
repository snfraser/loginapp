import {Component, OnInit, AfterViewInit} from '@angular/core';
import {Md5} from 'ts-md5/dist/md5';
import {AuthenticationService} from './authentication.service';
import * as moment from 'moment';
import {Moment} from 'moment';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {

  accessToken;
  refreshToken;
  userName;
  expiresAt;
  nextRefresh;
  countDown = 0;
  refreshCount = 0;

  timer;

  constructor(private authService: AuthenticationService) {}

/**
* Initializer: Checks if we are already logged in and redirects if needed.
*/
  ngOnInit() {
    const c_accessToken = localStorage.getItem(AuthenticationService.OCEANIDS_ACCESS_TOKEN);

    // log this value it may be what we are looking for...
    console.log('OnInit:: read value of access_token: [' + c_accessToken + '] - must be logged in already');

    if (c_accessToken) {

      // set items to display on UI
      this.accessToken = c_accessToken;
      this.expiresAt = localStorage.getItem(AuthenticationService.OCEANIDS_TOKEN_EXPIRY);
      this.refreshToken = localStorage.getItem(AuthenticationService.OCEANIDS_REFRESH_TOKEN);
      this.userName = localStorage.getItem(AuthenticationService.OCEANIDS_USER);


    } else {
      console.log('OnInit:: accessToken is NOT defined - either redirect to login page or get one ourselves');

    }

    // setup countdown timer
    setInterval(() => {
      if (this.countDown >= 2) {
        this.countDown -= 2;
      }
    }, 2000);


  }

  ngAfterViewInit() {


    // console.log('Setting local storage accordingly');
    // localStorage.setItem('oceanids_user', 'snf@sams.ac.uk');
    // localStorage.setItem('oceanids_access_token', 'ZXvGSTstSu8jsj3S3jjEW3ke4SKSksiemjdi34mjrdik4jkk');
//  localStorage.setItem('oceanids_token_expires', '2017-11-28T15:00:00');

    // const b64user = btoa('stephen.fraser@sams.ac.uk').replace(/\=+$/, '');
    // const md5pass = Md5.hashStr('notarealpassword');
//  const b64upass = btoa('stephen.fraser@sams.ac.uk:' + md5pass).replace(/\=+$/, '');

// console.log('MD5 pass: [' + md5pass + ']');

// console.log('Url: [https://apitst.linkedsystems.uk/account/v1/user/' + b64user + ']');
// console.log('Header: [AuthOcean: Basic ' + b64upass + ']');
  }

  /** Perform login.*/
  login() {
    this.authService.login('USER_ID', 'SECRET_PASSWORD')
      .subscribe(
        auth => {
          console.log('Login successfull...');
          // extract useful data
          const c_accessToken = auth.access_token;
          const c_refreshToken = auth.refresh_token;
          const c_expiresIn = auth.expires_in;

          // fill local storage
          localStorage.setItem(AuthenticationService.OCEANIDS_ACCESS_TOKEN, c_accessToken);
          localStorage.setItem(AuthenticationService.OCEANIDS_REFRESH_TOKEN, c_refreshToken);
          localStorage.setItem(AuthenticationService.APP_TOKEN_EXPIRES_IN, c_expiresIn);
          localStorage.setItem(AuthenticationService.OCEANIDS_USER, 'stephen.fraser@sams.ac.uk');

          // compute expiry time as now plus expires in
          const mnow = moment();
          const m_expiryTime = mnow.add(+c_expiresIn, 'seconds');

          localStorage.setItem(AuthenticationService.OCEANIDS_TOKEN_EXPIRY, m_expiryTime.format());

          console.log('Access token:  ' + c_accessToken);
          console.log('  expires in:  ' + c_expiresIn + ' secs');
          console.log('Refresh token: ' + c_refreshToken);

          // display variables
          this.userName = localStorage.getItem(AuthenticationService.OCEANIDS_USER);
          this.accessToken = c_accessToken;
          this.refreshToken = c_refreshToken;
          this.expiresAt = m_expiryTime.format();

        },
        error => {
          console.log('Error logging in...');
          console.log(error);
        }
      );
  }

refresh(auto: boolean) {

  console.log('Refresh auto=' + auto);

    this.authService.refresh()
      .subscribe(
        auth => {
          const c_accessToken = auth.access_token;
          const c_expiresIn = auth.expires_in;
          const c_refreshToken = auth.refresh_token;


          localStorage.setItem(AuthenticationService.OCEANIDS_ACCESS_TOKEN, c_accessToken);
          localStorage.setItem(AuthenticationService.OCEANIDS_REFRESH_TOKEN, c_refreshToken);
          localStorage.setItem(AuthenticationService.APP_TOKEN_EXPIRES_IN, c_expiresIn);

          // compute expiry time as now plus expires in
          const mnow = moment();
          const m_expiryTime = mnow.add(+c_expiresIn, 'seconds');
          const timeToGo = +c_expiresIn - 2700; // secs

          localStorage.setItem(AuthenticationService.OCEANIDS_TOKEN_EXPIRY, m_expiryTime.format());

          console.log('Access token:  ' + c_accessToken);
          console.log('  expires in:  ' + c_expiresIn + ' secs');
          console.log('Refresh token: ' + c_refreshToken);


          // display variables
          this.userName = localStorage.getItem(AuthenticationService.OCEANIDS_USER);
          this.accessToken = c_accessToken;
          this.refreshToken = c_refreshToken;
          this.expiresAt = m_expiryTime.format();
          this.refreshCount += 1;

          // if this is an auto refresh we will wait until 60 sec before the timeout then make the call
          if (auto === true) {

            // calc time of next refresh..
            const c_refreshTime: Moment = moment().add(timeToGo, 'seconds');
            console.log('Waiting for ' + timeToGo + ' sec before refreshing again at: ' + c_refreshTime.format());
            this.nextRefresh = c_refreshTime.format();

            this.countDown = timeToGo;

            // TODO - we should really clear any existing timers here
            // clearTimeout(this.timer);

            this.timer = setTimeout(() => {
              this.refresh(true);
            }, timeToGo * 1000);
          }

        },
        error => {
          console.log('Error refreshing token...');
          console.log(error);
        }
      );

}

logout() {

  this.authService.logout();

  // get rid of anything else lying around
  localStorage.clear();

  // stop any timer
  clearTimeout(this.timer);

}
  /**
   * Called to test the locally stored access info.
   */
  testTokens() {
    const accessToken = localStorage.getItem(AuthenticationService.OCEANIDS_ACCESS_TOKEN);

    // log this value it may be what we are looking for...
    console.log('AVI:: read value of access_token: [' + accessToken + ']');

    if (accessToken) {
      // if there is an access token we are logged in, we will use the token for now
      // but need to know when it will run out. We then need to set a repeating refresh
      const expiresAfter = localStorage.getItem(AuthenticationService.APP_TOKEN_EXPIRES_IN);
      console.log('AVI:: accessToken is defined - use for ' + expiresAfter + ' secs');
    }
  }


}
