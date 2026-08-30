import { http, HttpResponse, type DefaultBodyType, type JsonBodyType } from 'msw';

export const API_URL = 'http://api.test';

/** Atalhos para descrever respostas da API nos testes, sempre na URL base do ambiente de teste. */
export const api = {
  get: (path: string, resolver: Parameters<typeof http.get>[1]) =>
    http.get(`${API_URL}${path}`, resolver),
  post: (path: string, resolver: Parameters<typeof http.post>[1]) =>
    http.post(`${API_URL}${path}`, resolver),
  json: <T extends JsonBodyType>(body: T, status = 200) => HttpResponse.json<T>(body, { status }),
  error: (status: number, message: string, errors?: { path: string; message: string }[]) =>
    HttpResponse.json<DefaultBodyType>(
      { statusCode: status, message, ...(errors === undefined ? {} : { errors }) },
      { status },
    ),
};
