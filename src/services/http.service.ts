import axios, { AxiosPromise, AxiosResponse, AxiosInstance } from 'axios';
export class HttpService {
  private _axios: AxiosInstance;

  constructor() {
    this._axios = axios.create();
  }

  public async get<T = any>(url: string, params?: any): Promise<AxiosResponse<T>> {
    return this._axios.get(url, { params });
  }

  public async post<T = any>(url: string, params?: any): Promise<AxiosResponse<T>> {
    return this._axios.post(url, { params });
  }

  public async head<T = any>(url: string, params?: any): Promise<AxiosResponse<T>> {
    return this._axios.head(url, { params });
  }

  public async patch<T = any>(url: string, params?: any): Promise<AxiosResponse<T>> {
    return this._axios.patch(url, { params });
  }

  public async delete<T = any>(url: string, params?: any): Promise<AxiosResponse<T>> {
    return this._axios.delete(url, { params });
  }

  public async put<T = any>(url: string, params?: any): Promise<AxiosResponse<T>> {
    return this._axios.put(url, { params });
  }
}
