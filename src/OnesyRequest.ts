import http from 'http';
import https from 'https';
import events from 'events';

import is from '@onesy/utils/is';
import isValid from '@onesy/utils/isValid';
import isEnvironment from '@onesy/utils/isEnvironment';
import merge from '@onesy/utils/merge';
import parse from '@onesy/utils/parse';
import copy from '@onesy/utils/copy';
import getURL from '@onesy/utils/getURL';
import serialize from '@onesy/utils/serialize';
import castParam from '@onesy/utils/castParam';
import OnesyCookie from '@onesy/cookie';
import OnesySubscription from '@onesy/subscription';
import OnesyZip from '@onesy/zip';

if (isEnvironment('nodejs') && !global.onesyEvents) global.onesyEvents = new events.EventEmitter();

export type TMethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';

export type TResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text';
export type TResponseTypeNode = 'buffer' | 'json' | 'text';

export type TBody = Blob | BufferSource | FormData | URLSearchParams | Record<any, any> | string | any;

export type TXhrEvent = ProgressEvent<EventTarget>;

export interface IInterceptorsSetRequest {
  pre: OnesySubscription;
  post: OnesySubscription;
}

export interface IInterceptorsSetResponse {
  success: OnesySubscription;
  error: OnesySubscription;
  fail: OnesySubscription;
}

export interface IInterceptorsSet {
  request: IInterceptorsSetRequest;
  response: IInterceptorsSetResponse;
}

export interface IRequestProperties {
  url?: string;
  urlStart?: string;
  urlEnd?: string;
  method?: TMethodType;
  body?: TBody;

  cancel?: OnesySubscription;
}

export interface IOptionsRequest extends IOptions {
  url?: string;
  urlStart?: string;
  urlEnd?: string;
  method?: TMethodType;
  body?: TBody;

  cancel?: OnesySubscription;
}

const optionsRequestDefault: IOptionsRequest = {
  method: 'GET',
};

export interface IOnesyRequestResponse {
  response: any;
  status: number;
  headers: object;
  request: XMLHttpRequest | http.ClientRequest;
  options: IOptionsRequest;
}

export class OnesyRequestResponse implements IOnesyRequestResponse {

  constructor(
    public response: any,
    public status: number,
    public headers: object,
    public request: XMLHttpRequest | http.ClientRequest,
    public options: IOptionsRequest
  ) { }

}

export interface IOptionsZipOnesy {
  zip?: boolean;
  unzip?: boolean;
  only_positive?: boolean;
}

export interface IOptionsZip {
  onesy?: IOptionsZipOnesy;
}

export interface IOptionsCsrf {
  cookie?: string;
  headers?: string;
}

export interface IOptionsAgents {
  http?: http.Agent,
  https?: https.Agent,
}

export interface IOptionsRequestOptions extends IRequestProperties {
  withCredentials?: boolean;

  headers?: Record<string, string | number>;

  zip?: IOptionsZip;

  csrf?: IOptionsCsrf;

  agents?: IOptionsAgents;

  timeout?: number;
}

export interface IOptionsResponseParse {
  json?: boolean;
}

export interface IOptionsResponseOptions {
  pure?: boolean;

  resolveOnError?: boolean;

  type?: TResponseType | TResponseTypeNode;

  parse?: IOptionsResponseParse;
}

export interface IOptions {
  request?: IOptionsRequestOptions;
  response?: IOptionsResponseOptions;
}

const optionsDefault: IOptions = {};

type TOnesyRequestDefaults = Record<'request' | 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options', IOptionsRequest>;

export const OnesyRequestDefaults: TOnesyRequestDefaults = {
  request: {
    request: {
      headers: {
        'accept': 'application/json, text/plain, */*'
      },

      zip: {
        onesy: {
          zip: false,
          unzip: true,
          only_positive: true
        }
      },

      csrf: {
        cookie: 'CSRF-TOKEN',
        headers: 'X-CSRF-TOKEN'
      }
    },

    response: {
      resolveOnError: true,

      type: 'json',

      parse: {
        json: true
      }
    }
  },
  get: {},
  post: {
    request: {
      headers: {
        'content-type': 'application/json'
      }
    }
  },
  put: {
    request: {
      headers: {
        'content-type': 'application/json'
      }
    }
  },
  patch: {
    request: {
      headers: {
        'content-type': 'application/json'
      }
    }
  },
  delete: {},
  head: {},
  options: {}
};

interface IOnesyRequestOnesySub extends OnesySubscription {
  cancel?(...args: any[]): void;
}

class OnesyRequest {
  private options_: IOptions;

  public interceptors: IInterceptorsSet = {
    request: {
      pre: new OnesySubscription(),
      post: new OnesySubscription()
    },
    response: {
      success: new OnesySubscription(),
      error: new OnesySubscription(),
      fail: new OnesySubscription()
    }
  };

  public static interceptors: IInterceptorsSet = {
    request: {
      pre: new OnesySubscription(),
      post: new OnesySubscription()
    },
    response: {
      success: new OnesySubscription(),
      error: new OnesySubscription(),
      fail: new OnesySubscription()
    }
  };
  public static defaults: TOnesyRequestDefaults = copy(OnesyRequestDefaults);

  public static get cancel(): IOnesyRequestOnesySub {
    const onesySubscription: IOnesyRequestOnesySub = new OnesySubscription();

    // Add a custom cancel method for this use case
    onesySubscription.cancel = onesySubscription.emit;

    return onesySubscription as IOnesyRequestOnesySub;
  }

  public static get onesyRequest(): OnesyRequest { return new OnesyRequest(); }

  public static request(...args: [IOptionsRequest]) { return new OnesyRequest().request(...args); }

  public static get(...args: [string, IOptionsRequest?]) { return new OnesyRequest().get(...args); }

  public static post(...args: [string, TBody, IOptionsRequest?]) { return new OnesyRequest().post(...args); }

  public static put(...args: [string, TBody, IOptionsRequest?]) { return new OnesyRequest().put(...args); }

  public static delete(...args: [string, IOptionsRequest?]) { return new OnesyRequest().delete(...args); }

  public static head(...args: [string, IOptionsRequest?]) { return new OnesyRequest().head(...args); }

  public static options(...args: [string, IOptionsRequest?]) { return new OnesyRequest().options(...args); }

  public static patch(...args: [string, TBody, IOptionsRequest?]) { return new OnesyRequest().patch(...args); }

  // Mostly for testing purposes
  public static reset() {
    this.defaults = copy(OnesyRequestDefaults);
  }

  public constructor(options: IOptions = optionsDefault) {
    this.options_ = merge(options, optionsDefault, { copy: true });
  }

  public request(options_: IOptionsRequest): Promise<IOnesyRequestResponse> {
    let options = merge(options_, this.options_, { copy: true });

    options = merge(options, OnesyRequest.defaults.request, { copy: true });

    const optionsMethodDefault = OnesyRequest.defaults[options.method?.toLowerCase()];

    if (optionsMethodDefault) options = merge(options, optionsMethodDefault, { copy: true });

    // url
    options.url = this.url(options);

    if (
      isValid('http-method', options.method) &&
      (options.url && is('string', options.url))
    ) {
      return isEnvironment('browser') ? this.xhr(options) : this.https(options);
    }
  }

  public get(url: string, options: IOptionsRequest = copy(optionsRequestDefault)) {
    options.url = url;
    options.method = 'GET';

    const options_ = merge(options, this.options_, { copy: true });

    return this.request(merge(options_, OnesyRequest.defaults.get, { copy: true }));
  }

  public post(url: string, body: TBody, options: IOptionsRequest = copy(optionsRequestDefault)) {
    options.url = url;
    options.body = body;
    options.method = 'POST';

    const options_ = merge(options, this.options_, { copy: true });

    return this.request(merge(options_, OnesyRequest.defaults.post, { copy: true }));
  }

  public put(url: string, body: TBody, options: IOptionsRequest = copy(optionsRequestDefault)) {
    options.url = url;
    options.body = body;
    options.method = 'PUT';

    const options_ = merge(options, this.options_, { copy: true });

    return this.request(merge(options_, OnesyRequest.defaults.put, { copy: true }));
  }

  public patch(url: string, body: TBody, options: IOptionsRequest = copy(optionsRequestDefault)) {
    options.url = url;
    options.body = body;
    options.method = 'PATCH';

    const options_ = merge(options, this.options_, { copy: true });

    return this.request(merge(options_, OnesyRequest.defaults.patch, { copy: true }));
  }

  public head(url: string, options: IOptionsRequest = copy(optionsRequestDefault)) {
    options.url = url;
    options.method = 'HEAD';

    const options_ = merge(options, this.options_, { copy: true });

    return this.request(merge(options_, OnesyRequest.defaults.head, { copy: true }));
  }

  public options(url: string, options: IOptionsRequest = copy(optionsRequestDefault)) {
    options.url = url;
    options.method = 'OPTIONS';

    const options_ = merge(options, this.options_, { copy: true });

    return this.request(merge(options_, OnesyRequest.defaults.options, { copy: true }));
  }

  public delete(url: string, options: IOptionsRequest = copy(optionsRequestDefault)) {
    options.url = url;
    options.method = 'DELETE';

    const options_ = merge(options, this.options_, { copy: true });

    return this.request(merge(options_, OnesyRequest.defaults.delete, { copy: true }));
  }

  private async onPre(value: IOptionsRequest) {
    for (const method of this.interceptors.request.pre.methods) await method(value);

    for (const method of OnesyRequest.interceptors.request.pre.methods) await method(value);
  }

  private async onPost(value: TXhrEvent | http.IncomingMessage) {
    for (const method of this.interceptors.request.post.methods) await method(value);

    for (const method of OnesyRequest.interceptors.request.post.methods) await method(value);
  }

  private async onSuccess(value: OnesyRequestResponse, done: () => Promise<void>) {
    for (const method of this.interceptors.response.success.methods) await method(value);

    for (const method of OnesyRequest.interceptors.response.success.methods) await method(value);

    if (done) await done();
  }

  private async onError(value: OnesyRequestResponse, done: () => Promise<void>) {
    for (const method of this.interceptors.response.error.methods) await method(value);

    for (const method of OnesyRequest.interceptors.response.error.methods) await method(value);

    if (done) await done();
  }

  private async onFail(value: { event: TXhrEvent | Event, type: string }, done: () => Promise<void>) {
    for (const method of this.interceptors.response.fail.methods) await method(value);

    for (const method of OnesyRequest.interceptors.response.fail.methods) await method(value);

    if (done) await done();
  }

  private parseHeaders(headers: string): object {
    const result = {};

    const items = headers.split('\r\n');

    items.forEach(item => {
      const [key, valueRaw] = item.split(': ');
      const value = parse(valueRaw, 'JSON', { returnSame: false }) || castParam(valueRaw);

      if (key && value !== undefined) result[key] = value;
    });

    return result;
  }

  private xhr(options: IOptionsRequest = {}): Promise<IOnesyRequestResponse> {
    return new Promise(async (resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Run request pre interceptors
      // Each method is provided with options object as a reference
      await this.onPre(options);

      const { url: urlOptions, method, request: requestOptions, response: responseOptions, cancel } = options;

      let body = options.body;

      const { headers = {}, timeout, withCredentials, csrf } = requestOptions;
      const { type: typeOptions, parse: parse_, pure, resolveOnError } = responseOptions;

      const url = getURL(urlOptions);

      // CSRF
      if (withCredentials || isValid('same-origin', url)) {
        const csrfValue = new OnesyCookie().get(csrf.cookie);

        if (csrfValue && csrf.headers) headers[csrf.headers] = csrfValue;
      }

      xhr.open(method.toUpperCase(), url, true);

      // Set a response type
      xhr.responseType = (typeOptions as TResponseType) || 'text';

      // Set withCredentials value
      xhr.withCredentials = withCredentials || false;

      // Set request timeout value
      xhr.timeout = timeout || 0;

      // Setup abort an method
      const onCancel = () => xhr.abort();

      if (cancel) cancel.subscribe(onCancel);

      const onDone = (value: any) => async () => {
        await this.onPost(value);

        // Unsubscribe, clean up methods
        if (cancel) cancel.unsubscribe(onCancel);
      };

      // Response success or error
      xhr.onloadend = async event => {
        const responseHeaders = this.parseHeaders(xhr.getAllResponseHeaders());

        let response = [undefined, '', 'text'].indexOf(typeOptions) > -1 ? xhr.responseText : xhr.response;

        if (responseHeaders['onesy-encoding'] === 'onesy-zip' && requestOptions.zip?.onesy?.unzip) {

          const unzipped = OnesyZip.decode(response);

          response = unzipped.value;
        }
        else {
          // Auto parse JSON response
          if (
            [undefined, 'json'].indexOf(typeOptions) > -1 &&
            parse_?.json
          ) response = parse(response);
        }

        const response_ = new OnesyRequestResponse(
          response,
          xhr.status,
          responseHeaders,
          xhr,
          options,
        );

        if (!xhr.status) return;

        const isSuccess = response_.status >= 200 && response_.status < 300;

        // Resolve or optionally reject on status code for error
        if (!isSuccess) {
          await this.onError(response_, onDone(response_));

          if (!resolveOnError) return reject(response_);
        }

        if (isSuccess) await this.onSuccess(response_, onDone(response_));

        return resolve(pure ? (response as any) : response_);
      };

      const onFail = (type: string) => async (event: Event) => {
        const response = new OnesyRequestResponse(
          undefined,
          xhr.status,
          this.parseHeaders(xhr.getAllResponseHeaders()),
          xhr,
          options,
        );
        const value = { event, type, response };

        await this.onFail(value, onDone(value));

        return reject(value);
      };

      // Body
      // In form data use case
      // browser sets their own multipart headers boundary
      if (body instanceof FormData) {
        Object.keys(headers).forEach(item => {
          if (item.toLowerCase() === 'content-type') delete headers[item];
        });
      }

      if ([undefined, null].indexOf(body) === -1) {
        // Zip
        if (requestOptions.zip?.onesy?.zip) {
          const zipped = new OnesyZip(body);

          if (zipped.response.positive || !requestOptions.zip?.onesy?.only_positive) {
            body = zipped.response.value;

            headers['onesy-encoding'] = 'onesy-zip';
            // As it will mostly make an issue
            // with middlewares handling ie. application/json parsing based
            // on content-type value, as on the other end
            // OnesyZip when decoding a value, will parse it back
            // to value's original value type either way
            headers['content-type'] = 'text/plain';
          }
        }

        if (
          !is('string', body) &&
          !(body instanceof FormData) &&
          (
            is('simple', body) ||
            is('object', body) ||
            is('array', body)
          )
        ) body = serialize(body);
      }

      // Apply request xhr headers
      Object.keys(headers).forEach(key => {
        if (key.toLowerCase() === 'content-type' && body === undefined) delete headers[key];
        else xhr.setRequestHeader(String(key).trim(), String(headers[key]).trim());
      });

      // Mostly for testing purposes
      (xhr as any).headers = headers;

      // Aborted xhr request
      xhr.onabort = onFail('abort');

      // Timed out xhr request
      xhr.ontimeout = onFail('timeout');

      // Overall failed request w/o a response at all
      xhr.onerror = onFail('error');

      // Initialize request send
      xhr.send(body as any);

      // For testing purposes only
      window.dispatchEvent(new CustomEvent('onesy-request-sent'));
    });
  }

  private https(options: IOptionsRequest = {}): Promise<IOnesyRequestResponse> {
    return new Promise(async (resolve, reject) => {
      // Run request pre interceptors
      // Each method is provided with options object as a reference
      await this.onPre(options);

      const { url: urlOptions, method, body: bodyOptions, request: requestOptions, response: responseOptions, cancel } = options;

      const { headers = {}, agents, timeout } = requestOptions;
      const { type: typeOptions, parse: parse_, pure, resolveOnError } = responseOptions;

      const headersNamesNormalized = Object.keys(headers).map(key => key.toLowerCase());

      // User agent value add optionally
      if (headersNamesNormalized.indexOf('user-agent') === -1) headers['user-agent'] = `OnesyRequest/1.0.0`;

      const url = new URL(getURL(urlOptions));

      let body: any = bodyOptions;

      // Body
      if (body !== undefined) {
        // Zip
        if (requestOptions.zip?.onesy?.zip) {
          const zipped = new OnesyZip(body);

          if (zipped.response.positive || !requestOptions.zip?.onesy?.only_positive) {
            body = zipped.response.value;

            headers['onesy-encoding'] = 'onesy-zip';
            // As it will mostly make an issue
            // with middlewares handling ie. application/json parsing based
            // on content-type value, as on the other end
            // OnesyZip when decoding a value, will parse it back
            // to value's original value type either way
            headers['content-type'] = 'text/plain';
          }
        }

        if (is('string', body)) body = Buffer.from(body, 'utf-8');
        else if (
          is('simple', body) ||
          is('object', body) ||
          is('array', body)
        ) body = Buffer.from(serialize(body), 'utf-8');
        else if (is('arraybuffer', body)) body = Buffer.from(new Uint8Array(body));
        else if (!is('buffer', body) && !is('uint8array', body)) body = undefined;
      }
      else {
        delete headers['content-type'];
      }

      // Add to headers content-length if body exists
      if (body) {
        headers['content-length'] = (body as Buffer).length;
      }

      const isProtocolSecure = url.protocol.slice(0, -1) === 'https';
      const protocolVariant = isProtocolSecure ? https : http;

      const agent = isProtocolSecure ? agents?.https : agents?.http;

      const optionsRequest: https.RequestOptions = {
        hostname: url.hostname,
        method,
        headers,
      };

      if (url.pathname) optionsRequest.path = url.pathname;

      if (url.search) optionsRequest.path += url.search;

      if (url.port) optionsRequest.port = url.port;

      optionsRequest.timeout = timeout || 0;

      if (agent) optionsRequest['agent'] = agent;

      const request = protocolVariant.request(optionsRequest, (res: http.IncomingMessage) => {
        const responseBufferArray = [];

        res.on('data', (chunk: Buffer) => {
          // Add data to array buffer value
          responseBufferArray.push(chunk);
        });

        res.on('end', async () => {
          let response: Buffer | string = Buffer.concat(responseBufferArray);

          if (res.headers['onesy-encoding'] === 'onesy-zip' && requestOptions.zip?.onesy?.unzip) {
            const unzipped = OnesyZip.decode(response.toString('binary'));

            response = unzipped.value;
          }
          else {
            if ([undefined, 'json', 'text'].indexOf(typeOptions) > -1) response = response.toString('utf-8');

            if (
              [undefined, 'json'].indexOf(typeOptions) > -1 &&
              parse_?.json
            ) response = parse(response);
          }

          const response_ = new OnesyRequestResponse(
            response,
            res.statusCode,
            res.headers,
            request,
            options
          );

          const isSuccess = response_.status >= 200 && response_.status < 300;

          // Resolve or optionally reject on status code for error
          if (!isSuccess) {
            await this.onError(response_, onDone(response_));

            if (!resolveOnError) return reject(response_);
          }

          if (isSuccess) await this.onSuccess(response_, onDone(response_));

          return resolve(pure ? (response as any) : response_);
        });
      });

      // Mostly for testing purposes
      (request as any).headers = headers;

      // Setup abort an method
      const onCancel = () => request.destroy();

      if (cancel) cancel.subscribe(onCancel);

      const onDone = (value: any) => async () => {
        await this.onPost(value);

        // Unsubscribe, clean up methods
        if (cancel) cancel.unsubscribe(onCancel);
      };

      const onFail = (type: string) => async (event?: Event) => {
        const response = new OnesyRequestResponse(
          undefined,
          undefined,
          headers,
          request,
          options
        );
        const value = { event, type, response };

        await this.onFail(value, onDone(value));

        return reject(value);
      };

      request.on('error', onFail('error'));

      request.on('abort', onFail('abort'));

      request.on('timeout', async () => {
        await onFail('timeout')();

        request.destroy();
      });

      // Send the request
      request.end(body);

      // For testing purposes only
      global.onesyEvents.emit('onesy-request-sent');
    });
  }

  private url(options: IOptionsRequest) {
    const start = (
      options.urlStart || options.request.urlStart ||
      OnesyRequest.defaults[(options.method || '').toLowerCase()]?.urlStart || OnesyRequest.defaults[(options.method || '').toLowerCase()]?.request?.urlStart ||
      OnesyRequest.defaults.request?.urlStart || OnesyRequest.defaults.request?.request?.urlStart
    );

    const end = (
      options.urlEnd || options.request.urlEnd ||
      OnesyRequest.defaults[(options.method || '').toLowerCase()]?.urlEnd || OnesyRequest.defaults[(options.method || '').toLowerCase()]?.request?.urlEnd ||
      OnesyRequest.defaults.request?.urlEnd || OnesyRequest.defaults.request?.request?.urlEnd
    );

    return `${start || ''}${options.url}${end || ''}`;
  }
}

export default OnesyRequest;
