import http from 'http';
import https from 'https';
import events from 'events';
import is from '@amaui/utils/is';
import isValid from '@amaui/utils/isValid';
import isEnvironment from '@amaui/utils/isEnvironment';
import merge from '@amaui/utils/merge';
import parse from '@amaui/utils/parse';
import copy from '@amaui/utils/copy';
import getURL from '@amaui/utils/getURL';
import serialize from '@amaui/utils/serialize';
import castParam from '@amaui/utils/castParam';
import AmauiCookie from '@amaui/cookie';
import AmauiSubscription from '@amaui/subscription';
import AmauiZip from '@amaui/zip';

if (isEnvironment('nodejs') && !global.amauiEvents) global.amauiEvents = new events.EventEmitter();

export type TMethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';

export type TResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text';
export type TResponseTypeNode = 'buffer' | 'json' | 'text';

export type TBody = Blob | BufferSource | FormData | URLSearchParams | Record<any, any> | string | any;

export type TXhrEvent = ProgressEvent<EventTarget>;

export interface IInterceptorsSetRequest {
  pre: AmauiSubscription;
  post: AmauiSubscription;
}

export interface IInterceptorsSetResponse {
  success: AmauiSubscription;
  error: AmauiSubscription;
  fail: AmauiSubscription;
}

export interface IInterceptorsSet {
  request: IInterceptorsSetRequest;
  response: IInterceptorsSetResponse;
}

export interface IOptionsRequest extends IOptions {
  url?: string;
  urlStart?: string;
  urlEnd?: string;
  method?: TMethodType;
  body?: TBody;

  cancel?: AmauiSubscription;
}

const optionsRequestDefault: IOptionsRequest = {
  method: 'GET',
};

export interface IAmauiRequestResponse {
  response: any;
  status: number;
  headers: object;
  request: XMLHttpRequest | http.ClientRequest;
  options: IOptionsRequest;
}

export class AmauiRequestResponse implements IAmauiRequestResponse {

  constructor(
    public response: any,
    public status: number,
    public headers: object,
    public request: XMLHttpRequest | http.ClientRequest,
    public options: IOptionsRequest
  ) { }

}

export interface IOptionsZipAmaui {
  zip?: boolean;
  unzip?: boolean;
  only_positive?: boolean;
}

export interface IOptionsZip {
  amaui?: IOptionsZipAmaui;
}

export interface IOptionsCsrf {
  cookie?: string;
  headers?: string;
}

export interface IOptionsAgents {
  http?: http.Agent,
  https?: https.Agent,
}

export interface IOptionsRequest {
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

export interface IOptionsResponse {
  pure?: boolean;

  resolveOnError?: boolean;

  type?: TResponseType | TResponseTypeNode;

  parse?: IOptionsResponseParse;
}

export interface IOptions {
  request?: IOptionsRequest;
  response?: IOptionsResponse;
}

const optionsDefault: IOptions = {};

type TAmauiRequestDefaults = Record<'request' | 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options', IOptions>;

export const AmauiRequestDefaults: TAmauiRequestDefaults = {
  request: {
    request: {
      headers: {
        'accept': 'application/json, text/plain, */*'
      },

      zip: {
        amaui: {
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

interface IAmauiRequestAmauiSub extends AmauiSubscription {
  cancel?(): void;
}

class AmauiRequest {
  private options_: IOptions;

  public interceptors: IInterceptorsSet = {
    request: {
      pre: new AmauiSubscription(),
      post: new AmauiSubscription()
    },
    response: {
      success: new AmauiSubscription(),
      error: new AmauiSubscription(),
      fail: new AmauiSubscription()
    }
  };

  public static interceptors: IInterceptorsSet = {
    request: {
      pre: new AmauiSubscription(),
      post: new AmauiSubscription()
    },
    response: {
      success: new AmauiSubscription(),
      error: new AmauiSubscription(),
      fail: new AmauiSubscription()
    }
  };
  public static defaults: TAmauiRequestDefaults = copy(AmauiRequestDefaults);

  public static get cancel(): IAmauiRequestAmauiSub {
    const amauiSubscription: IAmauiRequestAmauiSub = new AmauiSubscription();

    // Add a custom cancel method for this use case
    amauiSubscription.cancel = amauiSubscription.emit;

    return amauiSubscription as IAmauiRequestAmauiSub;
  }

  public static get amauiRequest(): AmauiRequest { return new AmauiRequest(); }

  public static request(...args: [IOptionsRequest]) { return new AmauiRequest().request(...args); }

  public static get(...args: [string, IOptionsRequest?]) { return new AmauiRequest().get(...args); }

  public static post(...args: [string, TBody, IOptionsRequest?]) { return new AmauiRequest().post(...args); }

  public static put(...args: [string, TBody, IOptionsRequest?]) { return new AmauiRequest().put(...args); }

  public static delete(...args: [string, IOptionsRequest?]) { return new AmauiRequest().delete(...args); }

  public static head(...args: [string, IOptionsRequest?]) { return new AmauiRequest().head(...args); }

  public static options(...args: [string, IOptionsRequest?]) { return new AmauiRequest().options(...args); }

  public static patch(...args: [string, TBody, IOptionsRequest?]) { return new AmauiRequest().patch(...args); }

  // Mostly for testing purposes
  public static reset() {
    this.defaults = copy(AmauiRequestDefaults);
  }

  public constructor(options: IOptions = optionsDefault) {
    this.options_ = merge(options, optionsDefault, { copy: true });
  }

  public request(options_: IOptionsRequest): Promise<IAmauiRequestResponse> {
    let options = merge(options_, this.options_, { copy: true });

    options = merge(options, AmauiRequest.defaults.request, { copy: true });

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

    return this.request(merge(options_, AmauiRequest.defaults.get, { copy: true }));
  }

  public post(url: string, body: TBody, options: IOptionsRequest = copy(optionsRequestDefault)) {
    options.url = url;
    options.body = body;
    options.method = 'POST';

    const options_ = merge(options, this.options_, { copy: true });

    return this.request(merge(options_, AmauiRequest.defaults.post, { copy: true }));
  }

  public put(url: string, body: TBody, options: IOptionsRequest = copy(optionsRequestDefault)) {
    options.url = url;
    options.body = body;
    options.method = 'PUT';

    const options_ = merge(options, this.options_, { copy: true });

    return this.request(merge(options_, AmauiRequest.defaults.put, { copy: true }));
  }

  public patch(url: string, body: TBody, options: IOptionsRequest = copy(optionsRequestDefault)) {
    options.url = url;
    options.body = body;
    options.method = 'PATCH';

    const options_ = merge(options, this.options_, { copy: true });

    return this.request(merge(options_, AmauiRequest.defaults.patch, { copy: true }));
  }

  public head(url: string, options: IOptionsRequest = copy(optionsRequestDefault)) {
    options.url = url;
    options.method = 'HEAD';

    const options_ = merge(options, this.options_, { copy: true });

    return this.request(merge(options_, AmauiRequest.defaults.head, { copy: true }));
  }

  public options(url: string, options: IOptionsRequest = copy(optionsRequestDefault)) {
    options.url = url;
    options.method = 'OPTIONS';

    const options_ = merge(options, this.options_, { copy: true });

    return this.request(merge(options_, AmauiRequest.defaults.options, { copy: true }));
  }

  public delete(url: string, options: IOptionsRequest = copy(optionsRequestDefault)) {
    options.url = url;
    options.method = 'DELETE';

    const options_ = merge(options, this.options_, { copy: true });

    return this.request(merge(options_, AmauiRequest.defaults.delete, { copy: true }));
  }

  private async onPre(value: IOptionsRequest) {
    for (const method of this.interceptors.request.pre.methods) await method(value);

    for (const method of AmauiRequest.interceptors.request.pre.methods) await method(value);
  }

  private async onPost(value: TXhrEvent | http.IncomingMessage) {
    for (const method of this.interceptors.request.post.methods) await method(value);

    for (const method of AmauiRequest.interceptors.request.post.methods) await method(value);
  }

  private async onSuccess(value: AmauiRequestResponse, done: () => Promise<void>) {
    for (const method of this.interceptors.response.success.methods) await method(value);

    for (const method of AmauiRequest.interceptors.response.success.methods) await method(value);

    if (done) await done();
  }

  private async onError(value: AmauiRequestResponse, done: () => Promise<void>) {
    for (const method of this.interceptors.response.error.methods) await method(value);

    for (const method of AmauiRequest.interceptors.response.error.methods) await method(value);

    if (done) await done();
  }

  private async onFail(value: { event: TXhrEvent | Event, type: string }, done: () => Promise<void>) {
    for (const method of this.interceptors.response.fail.methods) await method(value);

    for (const method of AmauiRequest.interceptors.response.fail.methods) await method(value);

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

  private xhr(options: IOptionsRequest = {}): Promise<IAmauiRequestResponse> {
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
        const csrfValue = new AmauiCookie().get(csrf.cookie);

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

        if (responseHeaders['amaui-encoding'] === 'amaui-zip' && requestOptions.zip?.amaui?.unzip) {

          const unzipped = AmauiZip.decode(response);

          response = unzipped.value;
        }
        else {
          // Auto parse JSON response
          if (
            [undefined, 'json'].indexOf(typeOptions) > -1 &&
            parse_?.json
          ) response = parse(response);
        }

        const response_ = new AmauiRequestResponse(
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
        const response = new AmauiRequestResponse(
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
      if (body instanceof FormData) delete headers['content-type'];

      if ([undefined, null].indexOf(body) === -1) {
        // Zip
        if (requestOptions.zip?.amaui?.zip) {
          const zipped = new AmauiZip(body);

          if (zipped.response.positive || !requestOptions.zip?.amaui?.only_positive) {
            body = zipped.response.value;

            headers['amaui-encoding'] = 'amaui-zip';
            // As it will mostly make an issue
            // with middlewares handling ie. application/json parsing based
            // on content-type value, as on the other end
            // AmauiZip when decoding a value, will parse it back
            // to value's original value type either way
            headers['content-type'] = 'text/plain';
          }
        }

        if (
          !is('string', body) &&
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
      window.dispatchEvent(new CustomEvent('amaui-request-sent'));
    });
  }

  private https(options: IOptionsRequest = {}): Promise<IAmauiRequestResponse> {
    return new Promise(async (resolve, reject) => {
      // Run request pre interceptors
      // Each method is provided with options object as a reference
      await this.onPre(options);

      const { url: urlOptions, method, body: bodyOptions, request: requestOptions, response: responseOptions, cancel } = options;

      const { headers = {}, agents, timeout } = requestOptions;
      const { type: typeOptions, parse: parse_, pure, resolveOnError } = responseOptions;

      const headersNamesNormalized = Object.keys(headers).map(key => key.toLowerCase());

      // User agent value add optionally
      if (headersNamesNormalized.indexOf('user-agent') === -1) headers['user-agent'] = `AmauiRequest/1.0.0`;

      const url = new URL(getURL(urlOptions));

      let body: any = bodyOptions;

      // Body
      if (body !== undefined) {
        // Zip
        if (requestOptions.zip?.amaui?.zip) {
          const zipped = new AmauiZip(body);

          if (zipped.response.positive || !requestOptions.zip?.amaui?.only_positive) {
            body = zipped.response.value;

            headers['amaui-encoding'] = 'amaui-zip';
            // As it will mostly make an issue
            // with middlewares handling ie. application/json parsing based
            // on content-type value, as on the other end
            // AmauiZip when decoding a value, will parse it back
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

          if (res.headers['amaui-encoding'] === 'amaui-zip' && requestOptions.zip?.amaui?.unzip) {
            const unzipped = AmauiZip.decode(response.toString('binary'));

            response = unzipped.value;
          }
          else {
            if ([undefined, 'json', 'text'].indexOf(typeOptions) > -1) response = response.toString('utf-8');

            if (
              [undefined, 'json'].indexOf(typeOptions) > -1 &&
              parse_?.json
            ) response = parse(response);
          }

          const response_ = new AmauiRequestResponse(
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
        const response = new AmauiRequestResponse(
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
      global.amauiEvents.emit('amaui-request-sent');
    });
  }

  private url(options: IOptionsRequest) {
    const start = options.request.urlStart || AmauiRequest.defaults[(options.method || '').toLowerCase()]?.request?.urlStart || AmauiRequest.defaults.request?.request?.urlStart;
    const end = options.request.urlEnd || AmauiRequest.defaults[(options.method || '').toLowerCase()]?.request?.urlEnd || AmauiRequest.defaults.request?.request?.urlEnd;

    return `${start || ''}${options.url}${end || ''}`;
  }
}

export default AmauiRequest;
