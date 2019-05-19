import axios, { AxiosPromise, AxiosResponse, AxiosInstance } from 'axios';
export class HttpService {
  private _axios: AxiosInstance;

  constructor() {
    this._axios = axios.create();
  }

  public async get(url: string, params?: any): Promise<AxiosResponse<any>> {
    return this._axios.get(url, { params });
  }

  public async post(url: string, params?: any): Promise<AxiosResponse<any>> {
    return this._axios.post(url, { params });
  }

  public async head(url: string, params?: any): Promise<AxiosResponse<any>> {
    return this._axios.head(url, { params });
  }

  public async patch(url: string, params?: any): Promise<AxiosResponse<any>> {
    return this._axios.patch(url, { params });
  }

  public async delete(url: string, params?: any): Promise<AxiosResponse<any>> {
    return this._axios.delete(url, { params });
  }

  public async put(url: string, params?: any): Promise<AxiosResponse<any>> {
    return this._axios.put(url, { params });
  }
}
