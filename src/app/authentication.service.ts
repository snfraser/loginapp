import {Injectable} from '@angular/core';
import {Http, Headers, Response, RequestOptions} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';

import 'rxjs/add/observable/of';
import 'rxjs/add/observable/from';
import {Md5} from 'ts-md5/dist/md5';

@Injectable()
export class AuthenticationService {

  /** @type {string} Key used to obtain login username from gateway login.*/
  public static readonly OCEANIDS_USER = 'oceanids_user';

  /** @type {string} Key used to obtain an access token from gateway login.*/
  public static readonly OCEANIDS_ACCESS_TOKEN = 'oceanids_access_token';

  /** @type {string} Key used to obtaing a refresh token from gateway login.*/
  public static readonly OCEANIDS_REFRESH_TOKEN = 'oceanids_refresh_token';

  /** @type {string} Key used to obtain token expiry time from gateway login.*/
  public static readonly OCEANIDS_TOKEN_EXPIRY = 'oceanids_token_expiry';

  /** @type {string} Key used to get expiry time-to-go in seconds for any calls made to refresh or login.*/
  public static readonly APP_TOKEN_EXPIRES_IN = 'expires_in';

  private static readonly DEFAULT_BEARER_TOKEN = '2bd982b1-8c59-3ace-8d67-5b0996d34ebf';

  private static readonly AUTH_URL = 'https://apitst.linkedsystems.uk/account/v1/user/'

  constructor(private http: Http) {
  }

  /**
   * Login to C2 services through the gateway.
   * @param {string} username The username - usually this is an email which you registered with BODC.
   * @param {string} password The password for this username.
   * @return {Observable<any>} An observable of the authentication information - access_token etc.
   */
  login(username: string, password: string): Observable<any> {

    const headers: Headers = new Headers();
    headers.append('Content-Type', 'application/json');

    // MD5 hash password
    const md5pass = Md5.hashStr(password);

    // concat username with hashed password then truncate any trailing '=' symbols (padding)
    const userdata = username + ':' + md5pass;
    const b64data = btoa(userdata).replace(/\=+$/, '');
    headers.append('Accept', 'application/json');

    headers.append('Authorization', 'Bearer ' + AuthenticationService.DEFAULT_BEARER_TOKEN); // this token is FIXED
    // headers.append('Authorization', 'Bearer abc123def456'); // this token is FAKE for testing

    headers.append('AuthOcean', 'Basic ' + b64data); // This is the Base64 encoded user:password

    // headers.append('User-Agent', 'C2Piloting/v0.1'); // Cant set user-agent - browser security
    const options = new RequestOptions({headers: headers});

    // const tmpusername = 'kar';
    const tmpusername = btoa(username).replace(/\=+$/, '');
    console.log('LoginSvc:: GET /account/v1/user/' + tmpusername);
    console.log('LoginSvc:: AuthOcean: [' + b64data + ']');

    // .timeoutWith(15000, Observable.throw({status: 555, statusText: 'Timed out connecting to gateway'}))
    // .map((response: Response) => response.json());

    return this.http.get(AuthenticationService.AUTH_URL + tmpusername, options)
      .map((response: Response) => response.json());

  }

  /**
   * Refresh the gateway access_token already retrieved by login.
   * @return {Observable<any>} An observable containing the new access_token etc.
   */
  refresh(): Observable<any> {

    // GET /account/v1/user/<b64(user)>  RefreshOcean: <refresh_token>

    const headers: Headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Authorization', 'Bearer ' + AuthenticationService.DEFAULT_BEARER_TOKEN);

    const refresh_token = localStorage.getItem(AuthenticationService.OCEANIDS_REFRESH_TOKEN);
    headers.append('RefreshOcean', 'Basic ' + refresh_token);

    const options = new RequestOptions({headers: headers});

    const username = localStorage.getItem(AuthenticationService.OCEANIDS_USER);
    const tmpusername = btoa(username).replace(/\=+$/, '');

    return this.http.get(AuthenticationService.AUTH_URL + tmpusername, options)
      .map((response: Response) => response.json());
  }

  /**
   * Logout from the gateway. Delete anything stored in localStorage
   */
  logout() {

    localStorage.removeItem(AuthenticationService.OCEANIDS_USER);
    localStorage.removeItem(AuthenticationService.OCEANIDS_TOKEN_EXPIRY);
    localStorage.removeItem(AuthenticationService.OCEANIDS_REFRESH_TOKEN);
    localStorage.removeItem(AuthenticationService.OCEANIDS_ACCESS_TOKEN);
    localStorage.removeItem(AuthenticationService.APP_TOKEN_EXPIRES_IN);

    // redirect to login page if this is running on deployment env otherwise dont
  }


}
