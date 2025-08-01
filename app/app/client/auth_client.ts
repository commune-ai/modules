import Client from './client';
import Auth from './auth/auth';
import Key from '@/app/user/key';

export class AuthClient extends Client {
  private auth: Auth;

  constructor(url: string = config.url, mode: string = 'http', key: Key) {
    super(url, mode, key);
    this.auth = new Auth(key);
  }

  /**
   * Calls an API function with authentication headers.
   * @param fn - The function name to be called (default: 'info').
   * @param params - The request parameters as a key-value object.
   * @param headers - Additional headers for the request.
   * @returns A promise resolving to the API response.
   */
  public async call(
    fn: string = 'info',
    params: Record<string, any> = {},
    headers: Record<string, string> = {}
  ): Promise<any> {
    // Generate auth headers
    const authHeaders = this.auth.generate({ fn, params });
    
    // Merge auth headers with provided headers
    const mergedHeaders = {
      ...headers,
      ...authHeaders
    };

    // Call parent class method with auth headers
    return super.call(fn, params, mergedHeaders);
  }

  /**
   * Verify a response from the server
   * @param headers - The headers received from the server
   * @param data - Optional data to verify against
   * @returns The verified headers
   */
  public verifyResponse(headers: any, data?: any): any {
    return this.auth.verify(headers, data);
  }
}

export default AuthClient;
