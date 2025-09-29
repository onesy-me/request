/* tslint:disable: no-shadowed-variable */
import path from 'path';
import http from 'http';
import https from 'https';
import FormData from 'form-data';
import events from 'events';

import { assert } from '@onesy/test';
import { wait } from '@onesy/utils';
import OnesyNode from '@onesy/node';

import { evaluate, evaluateBrowser, utils } from '../utils/js/test/utils';

import OnesyRequest from '../src';
import { OnesyRequestResponse } from '../src/OnesyRequest';

if (!global.onesyEvents) global.onesyEvents = new events.EventEmitter();

group('OnesyRequest', () => {
  const filePath = path.resolve(__dirname, '../LICENSE');

  preEveryGroupTo(async () => {
    OnesyRequest.reset();
  });

  group('AmaRequestResponse', () => {

    to('AmaRequestResponse', () => {
      const onesyRequestResponse = new OnesyRequestResponse(
        'a',
        201,
        { a: 'a' },
        { r: 'a' } as any,
        { url: 'a' }
      );

      assert(onesyRequestResponse).eql({
        response: 'a',
        status: 201,
        headers: {
          a: 'a',
        },
        request: {
          r: 'a',
        },
        options: {
          url: 'a',
        },
      });
    });

  });

  group('OnesyRequest', () => {
    const interceptors = {
      pre: [],
      post: [],
      success: [],
      error: [],
      fail: [],
    };

    to('onesyRequest', async () => {
      const values_ = [
        OnesyRequest.onesyRequest instanceof OnesyRequest,
      ];

      const valueBrowsers = await evaluate((window: any) => [
        window.OnesyRequest.onesyrequest instanceof window.OnesyRequest,
      ]);
      const valueNode = values_;
      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        true,
      ]));
    });

    group('request', () => {

      pre(() => {
        const method = (property: string) => async (value: any) => {
          await wait(140);

          interceptors[property].push(value);
        };

        const preMethod = method('pre');
        const preMethod2 = method('pre');

        // Methods of same ref are not duplicated when subscribing
        OnesyRequest.interceptors.request.pre.subscribe(preMethod);
        OnesyRequest.interceptors.request.pre.subscribe(preMethod);

        // Unsubscribe works properly as well
        OnesyRequest.interceptors.request.pre.subscribe(preMethod2);
        OnesyRequest.interceptors.request.pre.unsubscribe(preMethod2);

        OnesyRequest.interceptors.request.post.subscribe(method('post'));
        OnesyRequest.interceptors.response.success.subscribe(method('success'));
        OnesyRequest.interceptors.response.error.subscribe(method('error'));
        OnesyRequest.interceptors.response.fail.subscribe(method('fail'));
      });

      to('success', async () => {
        const values_ = [
          (await OnesyRequest.request({ method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts/1' })).response,
        ];

        const valueBrowsers = await evaluate(async (window: any) => [
          (await window.OnesyRequest.request({ method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts/1' })).response,
        ]);
        const valueNode = values_;
        const values = [valueNode, ...valueBrowsers];

        values.forEach(value => assert(value).eql([
          {
            "userId": 1,
            "id": 1,
            "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
          },
        ]));
      });

      to('error', async () => {
        const values_ = [
          (await OnesyRequest.request({ method: 'GET', url: 'https://jsonplaceholder.typicode.com/postsa/1' })).status,
        ];

        const valueBrowsers = await evaluate(async (window: any) => [
          (await window.OnesyRequest.request({ method: 'GET', url: 'https://jsonplaceholder.typicode.com/postsa/1' })).status,
        ]);
        const valueNode = values_;
        const values = [valueNode, ...valueBrowsers];

        values.forEach(value => assert(value).eql([
          404,
        ]));
      });

      to('fail', async () => {
        const method = new Promise(resolve => {
          const cancel = OnesyRequest.cancel;

          (global.onesyEvents as events.EventEmitter).on('onesy-request-sent', () => cancel.cancel());

          OnesyRequest.request({ method: 'GET', cancel, url: 'https://jsonplaceholder.typicode.com/posts/1' }).then().catch(error => resolve(error));
        });

        const values_ = [
          await method,
        ];

        const valueBrowsers = await evaluate(async (window: any) => {
          const method = new Promise(resolve => {
            const cancel = window.OnesyRequest.cancel;

            window.addEventListener('onesy-request-sent', () => cancel.cancel());

            window.OnesyRequest.request({ method: 'GET', cancel, url: 'https://jsonplaceholder.typicode.com/posts/1' }).then().catch((error: any) => resolve(error));
          });

          return [
            await method,
          ];
        });
        const valueNode = values_;
        const values = [valueNode, ...valueBrowsers];

        values.forEach(value => assert(['abort', 'error'].indexOf(value[0].type) > -1).eq(true));
      });

      to('interceptors', () => {
        // Pre
        assert(interceptors.pre[0].url).eq('https://jsonplaceholder.typicode.com/posts/1');
        assert(interceptors.pre[1].url).eq('https://jsonplaceholder.typicode.com/postsa/1');
        assert(interceptors.pre[2].cancel).exist;

        // Post
        assert(interceptors.post[0].status).eq(200);
        assert(interceptors.post[1].status).eq(404);
        assert(interceptors.post[2].type).eq('error');

        // Success
        assert(interceptors.success[0].status).eq(200);

        // Error
        assert(interceptors.error[0].status).eq(404);

        // Fail
        assert(interceptors.fail[0].type).eq('error');
      });

    });

    group('defaults', () => {

      group('request', () => {

        group('request', () => {

          to('withCredentials', async () => {
            const valueBrowsers = await evaluate(async (window: any) => {
              window.document.cookie = 'AMAUI_CSRF-TOKEN=a4';

              window.OnesyRequest.defaults.request.request.withCredentials = true;

              const onesyrequest = new window.OnesyRequest();

              const response = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1');

              window.OnesyRequest.defaults.request.request.withCredentials = false;

              const response1 = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1');

              return [
                (response.request as any).headers,
                (response1.request as any).headers,
              ];
            });
            const values = [...valueBrowsers];

            values.forEach(value => {
              assert(value[0]['X-CSRF-TOKEN']).eq('a4');
              assert(value[1]['X-CSRF-TOKEN']).eq(undefined);
            });
          });

          to('headers', async () => {
            OnesyRequest.defaults.request.request.headers = { 'AMAUI-TOKEN': 'a4' };

            const onesyrequest = new OnesyRequest();

            const values_ = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1');

            const valueBrowsers = await evaluate(async (window: any) => {
              window.OnesyRequest.defaults.request.request.headers = { 'AMAUI-TOKEN': 'a4' };

              const onesyrequest = new window.OnesyRequest();

              const response = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1');

              return (response.request as any).headers;
            });
            const valueNode = (values_.request as any).headers;
            const values = [valueNode, ...valueBrowsers];

            values.forEach(value => assert(value['AMAUI-TOKEN']).eq('a4'));
          });

          group('zip', () => {

            group('onesy', () => {

              group('zip', () => {

                to('true', async () => {
                  OnesyRequest.defaults.request.request.zip = { onesy: { zip: true, only_positive: false } };

                  const valueBrowsers = await evaluate(async (window: any) => {
                    window.OnesyRequest.defaults.request.request.zip = { onesy: { zip: true, only_positive: false } };

                    return [
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', 'a')).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', 4)).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', new Uint8Array([97, 97, 97]))).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', [1, 4, 1])).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', true)).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', undefined)).response,
                    ];
                  });
                  const valueNode = [
                    (await OnesyRequest.post('http://localhost:4000/unzip', 'a')).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', 4)).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', new Uint8Array([97, 97, 97]))).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', [1, 4, 1])).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', true)).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', undefined)).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      data: 'a',
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: 4,
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {
                        0: 97,
                        1: 97,
                        2: 97
                      },
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {
                        a: 4
                      },
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: [
                        1,
                        4,
                        1
                      ],
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: true,
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {},
                      headers: {}
                    }
                  ]));
                });

                to('false', async () => {
                  OnesyRequest.defaults.request.request.zip = { onesy: { zip: false, only_positive: false } };

                  const valueBrowsers = await evaluate(async (window: any) => {
                    window.OnesyRequest.defaults.request.request.zip = { onesy: { zip: false, only_positive: false } };

                    return [
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', [1, 4, 1])).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', undefined)).response,
                    ];
                  });
                  const valueNode = [
                    (await OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', [1, 4, 1])).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', undefined)).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      data: {
                        a: 4
                      },
                      headers: {
                        'content-type': 'application/json'
                      }
                    },
                    {
                      data: [
                        1,
                        4,
                        1
                      ],
                      headers: {
                        'content-type': 'application/json'
                      }
                    },
                    {
                      data: {},
                      headers: {}
                    }
                  ]));
                });

              });

              group('only_positive', () => {

                to('true', async () => {
                  OnesyRequest.defaults.request.request.zip = { onesy: { zip: true, only_positive: true } };

                  const valueBrowsers = await evaluate(async (window: any) => {
                    window.OnesyRequest.defaults.request.request.zip = { onesy: { zip: true, only_positive: true } };

                    return [
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.')).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                    ];
                  });
                  const valueNode = [
                    (await OnesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.')).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      data: 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.',
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {
                        a: 4
                      },
                      headers: {
                        'content-type': 'application/json'
                      }
                    }
                  ]));
                });

                to('false', async () => {
                  OnesyRequest.defaults.request.request.zip = { onesy: { zip: true, only_positive: false } };

                  const valueBrowsers = await evaluate(async (window: any) => {
                    window.OnesyRequest.defaults.request.request.zip = { onesy: { zip: true, only_positive: false } };

                    return [
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.')).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                    ];
                  });
                  const valueNode = [
                    (await OnesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.')).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      data: 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.',
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {
                        a: 4
                      },
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    }
                  ]));
                });

              });

              group('unzip', () => {

                to('true', async () => {
                  OnesyRequest.defaults.request.request.zip = { onesy: { unzip: true } };
                  OnesyRequest.defaults.request.response.type = 'text';

                  const valueBrowsers = await evaluate(async (window: any) => {
                    window.OnesyRequest.defaults.request.request.zip = { onesy: { unzip: true } };
                    window.OnesyRequest.defaults.request.response.type = 'text';

                    return [
                      (await window.OnesyRequest.get('http://localhost:4000/zip')).response,
                    ];
                  });
                  const valueNode = [
                    (await OnesyRequest.get('http://localhost:4000/zip')).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      a: 4
                    }
                  ]));
                });

                to('false', async () => {
                  OnesyRequest.defaults.request.request.zip = { onesy: { unzip: false } };
                  OnesyRequest.defaults.request.response.type = 'text';

                  const valueBrowsers = await evaluate(async (window: any) => {
                    window.OnesyRequest.defaults.request.request.zip = { onesy: { unzip: false } };
                    window.OnesyRequest.defaults.request.response.type = 'text';

                    return [
                      (await window.OnesyRequest.get('http://localhost:4000/zip')).response,
                    ];
                  });
                  const valueNode = [
                    (await OnesyRequest.get('http://localhost:4000/zip')).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    '1;00 " 1 4  2 {a 1 :},   AAJwplM='
                  ]));
                });

              });

            });

          });

          to('agents', async () => {
            OnesyRequest.defaults.request.request.agents = {
              http: new http.Agent(),
              https: new https.Agent(),
            };

            const onesyrequest = new OnesyRequest();

            const value = (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response;

            assert(value).eql({
              "userId": 1,
              "id": 1,
              "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
              "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
            });
          });

          to('timeout', async () => {
            OnesyRequest.defaults.request.request.timeout = 4;

            const method = new Promise(resolve => {
              const onesyrequest = new OnesyRequest();

              onesyrequest.get('https://jsonplaceholder.typicode.com/posts/14').then(value => resolve(value)).catch(error => resolve(error));
            });

            const values_ = [
              await method,
            ];

            const valueBrowsers = await evaluate(async (window: any) => {
              window.OnesyRequest.defaults.request.request.timeout = 4;

              const method = new Promise(resolve => {
                const onesyrequest = new window.OnesyRequest();

                onesyrequest.get('https://jsonplaceholder.typicode.com/posts/14').then(value => resolve(value)).catch(error => resolve(error));
              });

              return [
                await method,
              ];
            });
            const valueNode = values_;
            const values = [valueNode, ...valueBrowsers];

            values.forEach(value => assert(['timeout', 'error'].indexOf(value[0].type) > -1).eq(true));
          });

        });

        group('response', () => {

          to('pure', async () => {
            OnesyRequest.defaults.request.response.pure = true;

            const onesyrequest = new OnesyRequest();

            const values_ = [
              await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1'),
            ];

            OnesyRequest.defaults.request.response.pure = false;

            values_.push(await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1'));

            const valueBrowsers = await evaluate(async (window: any) => {
              window.OnesyRequest.defaults.request.response.pure = true;

              const onesyrequest = new window.OnesyRequest();

              const values_ = [
                await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1'),
              ];

              window.OnesyRequest.defaults.request.response.pure = false;

              values_.push(await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1'));

              return values_;
            });
            const valueNode = values_;
            const values = [valueNode, ...valueBrowsers];

            values.forEach(value => {
              assert(value[0]).eql({
                "userId": 1,
                "id": 1,
                "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
                "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
              });

              assert(value[1].response).eql({
                "userId": 1,
                "id": 1,
                "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
                "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
              });
            });
          });

          to('resolveOnError', async () => {
            const method: any = () => new Promise(resolve => {
              const onesyrequest = new OnesyRequest();

              onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1').then().catch(resolve);
            });

            const method1: any = () => new Promise(resolve => {
              const onesyrequest = new OnesyRequest();

              onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1').then(resolve);
            });

            const values_ = [
              (OnesyRequest.defaults.request.response.resolveOnError = false) || (await method()).status,
              (OnesyRequest.defaults.request.response.resolveOnError = true) && (await method1()).status,
            ];

            const valueBrowsers = await evaluate(async (window: any) => {
              const method: any = () => new Promise(resolve => {
                const onesyrequest = new window.OnesyRequest();

                onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1').then().catch(resolve);
              });

              const method1: any = () => new Promise(resolve => {
                const onesyrequest = new window.OnesyRequest();

                onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1').then(resolve);
              });

              const values_ = [
                (window.OnesyRequest.defaults.request.response.resolveOnError = false) || (await method()).status,
                (window.OnesyRequest.defaults.request.response.resolveOnError = true) && (await method1()).status,
              ];

              return values_;
            });
            const valueNode = values_;
            const values = [valueNode, ...valueBrowsers];

            values.forEach(value => assert(value).eql([
              404,
              404,
            ]));
          });

          group('type', () => {

            group('browser', () => {

              to('text', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  window.OnesyRequest.defaults.request.response.type = 'text';

                  const onesyrequest = new window.OnesyRequest();

                  return [
                    typeof (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response === 'string',
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

              to('json', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  window.OnesyRequest.defaults.request.response.type = 'json';

                  const onesyrequest = new window.OnesyRequest();

                  return [
                    (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof Object,
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

              to('arraybuffer', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  window.OnesyRequest.defaults.request.response.type = 'arraybuffer';

                  const onesyrequest = new window.OnesyRequest();

                  return [
                    (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof ArrayBuffer,
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

              to('blob', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  window.OnesyRequest.defaults.request.response.type = 'blob';

                  const onesyrequest = new window.OnesyRequest();

                  return [
                    (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof Blob,
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

              to('document', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  window.OnesyRequest.defaults.request.response.type = 'document';

                  const onesyrequest = new window.OnesyRequest();

                  return [
                    (await onesyrequest.get('https://jsonplaceholder.typicode.com')).response instanceof Document,
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

            });

            group('node', () => {

              to('text', async () => {
                OnesyRequest.defaults.request.response.type = 'text';

                const onesyrequest = new OnesyRequest();

                const value = typeof (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response === 'string';

                assert(value).eq(true);
              });

              to('json', async () => {
                OnesyRequest.defaults.request.response.type = 'json';

                const onesyrequest = new OnesyRequest();

                const value = (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof Object;

                assert(value).eq(true);
              });

              to('buffer', async () => {
                OnesyRequest.defaults.request.response.type = 'buffer';

                const onesyrequest = new OnesyRequest();

                const value = (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof Buffer;

                assert(value).eq(true);
              });

            });

          });

          group('parse', () => {

            to('json', async () => {
              OnesyRequest.defaults.request.response.type = undefined;
              OnesyRequest.defaults.request.response.parse.json = true;

              const onesyrequest = new OnesyRequest();

              const values_ = [
                (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response,
              ];

              OnesyRequest.defaults.request.response.parse.json = false;

              values_.push((await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response);

              const valueBrowsers = await evaluate(async (window: any) => {
                window.OnesyRequest.defaults.request.response.type = undefined;
                window.OnesyRequest.defaults.request.response.parse.json = true;

                const onesyrequest = new window.OnesyRequest();

                const values_ = [
                  (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response,
                ];

                window.OnesyRequest.defaults.request.response.parse.json = false;

                values_.push((await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response);

                return values_;
              });
              const valueNode = values_;
              const values = [valueNode, ...valueBrowsers];

              values.forEach(value => assert(value).eql([
                {
                  "userId": 1,
                  "id": 1,
                  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
                  "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
                },
                '{\n  "userId": 1,\n  "id": 1,\n  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",\n  "body": "quia et suscipit\\nsuscipit recusandae consequuntur expedita et cum\\nreprehenderit molestiae ut ut quas totam\\nnostrum rerum est autem sunt rem eveniet architecto"\n}',
              ]));
            });

          });

        });

      });

      group('get', () => {

        group('request', () => {

          to('withCredentials', async () => {
            const valueBrowsers = await evaluate(async (window: any) => {
              window.document.cookie = 'AMAUI_CSRF-TOKEN=a4';

              window.OnesyRequest.defaults.get.request = { withCredentials: true };

              const onesyrequest = new window.OnesyRequest();

              const response = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1');

              window.OnesyRequest.defaults.get.request.withCredentials = false;

              const response1 = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1');

              return [
                (response.request as any).headers,
                (response1.request as any).headers,
              ];
            });
            const values = [...valueBrowsers];

            values.forEach(value => {
              assert(value[0]['X-CSRF-TOKEN']).eq('a4');
              assert(value[1]['X-CSRF-TOKEN']).eq(undefined);
            });
          });

          to('headers', async () => {
            OnesyRequest.defaults.get.request = { headers: { 'AMAUI-TOKEN': 'a4' } };

            const onesyrequest = new OnesyRequest();

            const values_ = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1');

            const valueBrowsers = await evaluate(async (window: any) => {
              window.OnesyRequest.defaults.get.request = { headers: { 'AMAUI-TOKEN': 'a4' } };

              const onesyrequest = new window.OnesyRequest();

              const response = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1');

              return (response.request as any).headers;
            });
            const valueNode = (values_.request as any).headers;
            const values = [valueNode, ...valueBrowsers];

            values.forEach(value => assert(value['AMAUI-TOKEN']).eq('a4'));
          });

          group('zip', () => {

            group('onesy', () => {

              group('zip', () => {

                to('true', async () => {
                  OnesyRequest.defaults.post.request.zip = { onesy: { zip: true, only_positive: false } };

                  const valueBrowsers = await evaluate(async (window: any) => {
                    window.OnesyRequest.defaults.post.request.zip = { onesy: { zip: true, only_positive: false } };

                    return [
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', 'a')).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', 4)).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', new Uint8Array([97, 97, 97]))).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', [1, 4, 1])).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', true)).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', undefined)).response,
                    ];
                  });
                  const valueNode = [
                    (await OnesyRequest.post('http://localhost:4000/unzip', 'a')).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', 4)).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', new Uint8Array([97, 97, 97]))).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', [1, 4, 1])).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', true)).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', undefined)).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      data: 'a',
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: 4,
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {
                        0: 97,
                        1: 97,
                        2: 97
                      },
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {
                        a: 4
                      },
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: [
                        1,
                        4,
                        1
                      ],
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: true,
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {},
                      headers: {}
                    }
                  ]));
                });

                to('false', async () => {
                  OnesyRequest.defaults.post.request.zip = { onesy: { zip: false, only_positive: false } };

                  const valueBrowsers = await evaluate(async (window: any) => {
                    window.OnesyRequest.defaults.post.request.zip = { onesy: { zip: false, only_positive: false } };

                    return [
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', [1, 4, 1])).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', undefined)).response,
                    ];
                  });
                  const valueNode = [
                    (await OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', [1, 4, 1])).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', undefined)).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      data: {
                        a: 4
                      },
                      headers: {
                        'content-type': 'application/json'
                      }
                    },
                    {
                      data: [
                        1,
                        4,
                        1
                      ],
                      headers: {
                        'content-type': 'application/json'
                      }
                    },
                    {
                      data: {},
                      headers: {}
                    }
                  ]));
                });

              });

              group('only_positive', () => {

                to('true', async () => {
                  OnesyRequest.defaults.post.request.zip = { onesy: { zip: true, only_positive: true } };

                  const valueBrowsers = await evaluate(async (window: any) => {
                    window.OnesyRequest.defaults.post.request.zip = { onesy: { zip: true, only_positive: true } };

                    return [
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.')).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                    ];
                  });
                  const valueNode = [
                    (await OnesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.')).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      data: 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.',
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {
                        a: 4
                      },
                      headers: {
                        'content-type': 'application/json'
                      }
                    }
                  ]));
                });

                to('false', async () => {
                  OnesyRequest.defaults.post.request.zip = { onesy: { zip: true, only_positive: false } };

                  const valueBrowsers = await evaluate(async (window: any) => {
                    window.OnesyRequest.defaults.post.request.zip = { onesy: { zip: true, only_positive: false } };

                    return [
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.')).response,
                      (await window.OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                    ];
                  });
                  const valueNode = [
                    (await OnesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.')).response,
                    (await OnesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      data: 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.',
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {
                        a: 4
                      },
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    }
                  ]));
                });

              });

              group('unzip', () => {

                to('true', async () => {
                  OnesyRequest.defaults.get.request = { zip: { onesy: { unzip: true } } };
                  OnesyRequest.defaults.get.response = { type: 'text' };

                  const valueBrowsers = await evaluate(async (window: any) => {
                    window.OnesyRequest.defaults.get.request = { zip: { onesy: { unzip: true } } };
                    window.OnesyRequest.defaults.get.response = { type: 'text' };

                    return [
                      (await window.OnesyRequest.get('http://localhost:4000/zip')).response,
                    ];
                  });
                  const valueNode = [
                    (await OnesyRequest.get('http://localhost:4000/zip')).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      a: 4
                    }
                  ]));
                });

                to('false', async () => {
                  OnesyRequest.defaults.get.request = { zip: { onesy: { unzip: false } } };
                  OnesyRequest.defaults.get.response = { type: 'text' };

                  const valueBrowsers = await evaluate(async (window: any) => {
                    window.OnesyRequest.defaults.get.request = { zip: { onesy: { unzip: false } } };
                    window.OnesyRequest.defaults.get.response = { type: 'text' };

                    return [
                      (await window.OnesyRequest.get('http://localhost:4000/zip')).response,
                    ];
                  });
                  const valueNode = [
                    (await OnesyRequest.get('http://localhost:4000/zip')).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    '1;00 " 1 4  2 {a 1 :},   AAJwplM='
                  ]));
                });

              });

            });

          });

          to('agents', async () => {
            OnesyRequest.defaults.get.request = {
              agents: {
                http: new http.Agent(),
                https: new https.Agent(),
              },
            };

            const onesyrequest = new OnesyRequest();

            const value = (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response;

            assert(value).eql({
              "userId": 1,
              "id": 1,
              "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
              "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
            });
          });

          to('timeout', async () => {
            OnesyRequest.defaults.get.request = { timeout: 4 };

            const method = new Promise(resolve => {
              const onesyrequest = new OnesyRequest();

              onesyrequest.get('https://jsonplaceholder.typicode.com/posts/14').then(value => resolve(value)).catch(error => resolve(error));
            });

            const values_ = [
              await method,
            ];

            const valueBrowsers = await evaluate(async (window: any) => {
              window.OnesyRequest.defaults.get.request = { timeout: 4 };

              const method = new Promise(resolve => {
                const onesyrequest = new window.OnesyRequest();

                onesyrequest.get('https://jsonplaceholder.typicode.com/posts/14').then(value => resolve(value)).catch(error => resolve(error));
              });

              return [
                await method,
                window.navigator.userAgent,
              ];
            });
            const valueNode = values_;
            const values = [valueNode, ...valueBrowsers];

            values.forEach(value => assert(['timeout', 'error'].indexOf(value[0].type) > -1).eq(true));
          });

        });

        group('response', () => {

          to('pure', async () => {
            OnesyRequest.defaults.get.response = { pure: true };

            const onesyrequest = new OnesyRequest();

            const values_ = [
              await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1'),
            ];

            OnesyRequest.defaults.get.response.pure = false;

            values_.push(await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1'));

            const valueBrowsers = await evaluate(async (window: any) => {
              window.OnesyRequest.defaults.get.response = { pure: true };

              const onesyrequest = new window.OnesyRequest();

              const values_ = [
                await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1'),
              ];

              window.OnesyRequest.defaults.get.response.pure = false;

              values_.push(await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1'));

              return values_;
            });
            const valueNode = values_;
            const values = [valueNode, ...valueBrowsers];

            values.forEach(value => {
              assert(value[0]).eql({
                "userId": 1,
                "id": 1,
                "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
                "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
              });

              assert(value[1].response).eql({
                "userId": 1,
                "id": 1,
                "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
                "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
              });
            });
          });

          to('resolveOnError', async () => {
            const method: any = () => new Promise(resolve => {
              const onesyrequest = new OnesyRequest();

              onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1').then().catch(resolve);
            });

            const method1: any = () => new Promise(resolve => {
              const onesyrequest = new OnesyRequest();

              onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1').then(resolve);
            });

            const values_ = [
              (OnesyRequest.defaults.get.response = { resolveOnError: false }) && (await method()).status,
              (OnesyRequest.defaults.get.response.resolveOnError = true) && (await method1()).status,
            ];

            const valueBrowsers = await evaluate(async (window: any) => {
              const method: any = () => new Promise(resolve => {
                const onesyrequest = new window.OnesyRequest();

                onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1').then().catch(resolve);
              });

              const method1: any = () => new Promise(resolve => {
                const onesyrequest = new window.OnesyRequest();

                onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1').then(resolve);
              });

              const values_ = [
                (window.OnesyRequest.defaults.get.response = { resolveOnError: false }) && (await method()).status,
                (window.OnesyRequest.defaults.get.response.resolveOnError = true) && (await method1()).status,
              ];

              return values_;
            });
            const valueNode = values_;
            const values = [valueNode, ...valueBrowsers];

            values.forEach(value => assert(value).eql([
              404,
              404,
            ]));
          });

          group('type', () => {

            group('browser', () => {

              to('text', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  window.OnesyRequest.defaults.get.response = { type: 'text' };

                  const onesyrequest = new window.OnesyRequest();

                  return [
                    typeof (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response === 'string',
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

              to('json', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  window.OnesyRequest.defaults.get.response = { type: 'json' };

                  const onesyrequest = new window.OnesyRequest();

                  return [
                    (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof Object,
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

              to('arraybuffer', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  window.OnesyRequest.defaults.get.response = { type: 'arraybuffer' };

                  const onesyrequest = new window.OnesyRequest();

                  return [
                    (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof ArrayBuffer,
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

              to('blob', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  window.OnesyRequest.defaults.get.response = { type: 'blob' };

                  const onesyrequest = new window.OnesyRequest();

                  return [
                    (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof Blob,
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

              to('document', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  window.OnesyRequest.defaults.get.response = { type: 'document' };

                  const onesyrequest = new window.OnesyRequest();

                  return [
                    (await onesyrequest.get('https://jsonplaceholder.typicode.com')).response instanceof Document,
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

            });

            group('node', () => {

              to('text', async () => {
                OnesyRequest.defaults.get.response = { type: 'text' };

                const onesyrequest = new OnesyRequest();

                const value = typeof (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response === 'string';

                assert(value).eq(true);
              });

              to('json', async () => {
                OnesyRequest.defaults.get.response = { type: 'json' };

                const onesyrequest = new OnesyRequest();

                const value = (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof Object;

                assert(value).eq(true);
              });

              to('buffer', async () => {
                OnesyRequest.defaults.get.response = { type: 'buffer' };

                const onesyrequest = new OnesyRequest();

                const value = (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof Buffer;

                assert(value).eq(true);
              });

            });

          });

          group('parse', () => {

            to('json', async () => {
              OnesyRequest.defaults.get.response = { type: undefined, parse: { json: true } };

              const onesyrequest = new OnesyRequest();

              const values_ = [
                (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response,
              ];

              OnesyRequest.defaults.get.response.parse.json = false;

              values_.push((await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response);

              const valueBrowsers = await evaluate(async (window: any) => {
                window.OnesyRequest.defaults.get.response = { type: undefined, parse: { json: true } };

                const onesyrequest = new window.OnesyRequest();

                const values_ = [
                  (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response,
                ];

                window.OnesyRequest.defaults.get.response.parse.json = false;

                values_.push((await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response);

                return values_;
              });
              const valueNode = values_;
              const values = [valueNode, ...valueBrowsers];

              values.forEach(value => assert(value).eql([
                {
                  "userId": 1,
                  "id": 1,
                  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
                  "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
                },
                '{\n  "userId": 1,\n  "id": 1,\n  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",\n  "body": "quia et suscipit\\nsuscipit recusandae consequuntur expedita et cum\\nreprehenderit molestiae ut ut quas totam\\nnostrum rerum est autem sunt rem eveniet architecto"\n}',
              ]));
            });

          });

        });

      });

    });

    to('get', async () => {
      const values_ = [
        (await OnesyRequest.get('https://jsonplaceholder.typicode.com/posts/1')).response,
      ];

      const valueBrowsers = await evaluate(async (window: any) => [
        (await window.OnesyRequest.get('https://jsonplaceholder.typicode.com/posts/1')).response,
      ]);
      const valueNode = values_;
      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        {
          userId: 1,
          id: 1,
          title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
          body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto'
        },
      ]));
    });

    to('post', async () => {
      const values_ = [
        (await OnesyRequest.post('https://jsonplaceholder.typicode.com/posts', { a: 4 })).response,
      ];

      const valueBrowsers = await evaluate(async (window: any) => [
        (await window.OnesyRequest.post('https://jsonplaceholder.typicode.com/posts', { a: 4 })).response,
      ]);
      const valueNode = values_;
      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        {
          "id": 101,
          "a": 4
        },
      ]));
    });

    to('put', async () => {
      const values_ = [
        (await OnesyRequest.put('https://jsonplaceholder.typicode.com/posts/1', { a: 4 })).response,
      ];

      const valueBrowsers = await evaluate(async (window: any) => [
        (await window.OnesyRequest.put('https://jsonplaceholder.typicode.com/posts/1', { a: 4 })).response,
      ]);
      const valueNode = values_;
      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        {
          "id": 1,
          "a": 4,
        },
      ]));
    });

    to('patch', async () => {
      const values_ = [
        (await OnesyRequest.patch('https://jsonplaceholder.typicode.com/posts/1', { a: 4 })).response,
      ];

      const valueBrowsers = await evaluate(async (window: any) => [
        (await window.OnesyRequest.patch('https://jsonplaceholder.typicode.com/posts/1', { a: 4 })).response,
      ]);
      const valueNode = values_;
      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        {
          "a": 4,
          "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
          "id": 1,
          "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
          "userId": 1,
        },
      ]));
    });

    to('head', async () => {
      const values_ = [
        (await OnesyRequest.head('https://jsonplaceholder.typicode.com/posts/1')).status,
      ];

      const valueBrowsers = await evaluate(async (window: any) => [
        (await window.OnesyRequest.head('https://jsonplaceholder.typicode.com/posts/1')).status,
      ]);
      const valueNode = values_;
      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        200,
      ]));
    });

    to('options', async () => {
      const valueBrowsers = await evaluate(async (window: any) => {
        const method = new Promise(resolve => {
          window.OnesyRequest.options('https://jsonplaceholder.typicode.com/posts/1').then().catch((error: any) => resolve(error));
        });

        return [
          (await method as any).type,
        ];
      });
      const valueNode = (await OnesyRequest.options('https://jsonplaceholder.typicode.com/posts/1')).headers['access-control-allow-methods'];

      assert(valueNode).eq('GET,HEAD,PUT,PATCH,POST,DELETE');

      valueBrowsers.forEach((value: any) => assert(value).eql([
        'error',
      ]));
    });

    to('delete', async () => {
      const values_ = [
        (await OnesyRequest.delete('https://jsonplaceholder.typicode.com/posts/1')).status,
      ];

      const valueBrowsers = await evaluate(async (window: any) => [
        (await window.OnesyRequest.delete('https://jsonplaceholder.typicode.com/posts/1')).status,
      ]);
      const valueNode = values_;
      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        200,
      ]));
    });

    to('reset', async () => {
      OnesyRequest.defaults.request.response.pure = true;

      const values_: any = [
        OnesyRequest.defaults.request.response.pure,
      ];

      const valueBrowsers = await evaluate(async (window: any) => {
        window.OnesyRequest.defaults.request.response.pure = true;

        const result: any = [
          window.OnesyRequest.defaults.request.response.pure,
        ];

        window.OnesyRequest.reset();

        result.push(window.OnesyRequest.defaults);

        return result;
      });

      values_.push(OnesyRequest.defaults);

      const valueNode = values_;

      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        true,
        OnesyRequest.defaults,
      ]));
    });

  });

  group('onesyRequest', () => {

    group('options', () => {

      group('request', () => {

        to('withCredentials', async () => {
          const valueBrowsers = await evaluate(async (window: any) => {
            window.document.cookie = 'AMAUI_CSRF-TOKEN=a4';

            const onesyrequest = new window.OnesyRequest({ request: { withCredentials: true } });

            const response = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1');

            const onesyrequest1 = new window.OnesyRequest({ request: { withCredentials: false } });

            const response1 = await onesyrequest1.get('https://jsonplaceholder.typicode.com/posts/1');

            return [
              (response.request as any).headers,
              (response1.request as any).headers,
            ];
          });
          const values = [...valueBrowsers];

          values.forEach(value => {
            assert(value[0]['X-CSRF-TOKEN']).eq('a4');
            assert(value[1]['X-CSRF-TOKEN']).eq(undefined);
          });
        });

        to('headers', async () => {
          const onesyrequest = new OnesyRequest({ request: { headers: { 'AMAUI-TOKEN': 'a4' } } });

          const values_ = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1');

          const valueBrowsers = await evaluate(async (window: any) => {
            const onesyrequest = new window.OnesyRequest({ request: { headers: { 'AMAUI-TOKEN': 'a4' } } });

            const response = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1');

            return (response.request as any).headers;
          });
          const valueNode = (values_.request as any).headers;
          const values = [valueNode, ...valueBrowsers];

          values.forEach(value => assert(value['AMAUI-TOKEN']).eq('a4'));
        });

        group('zip', () => {

          group('onesy', () => {

            group('zip', () => {

              to('true', async () => {
                const onesyRequest = new OnesyRequest({ request: { zip: { onesy: { zip: true, only_positive: false } } } });

                const valueBrowsers = await evaluate(async (window: any) => {
                  const onesyRequest = new window.OnesyRequest({ request: { zip: { onesy: { zip: true, only_positive: false } } } });

                  return [
                    (await onesyRequest.post('http://localhost:4000/unzip', 'a')).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', 4)).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', new Uint8Array([97, 97, 97]))).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', [1, 4, 1])).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', true)).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', undefined)).response,
                  ];
                });
                const valueNode = [
                  (await onesyRequest.post('http://localhost:4000/unzip', 'a')).response,
                  (await onesyRequest.post('http://localhost:4000/unzip', 4)).response,
                  (await onesyRequest.post('http://localhost:4000/unzip', new Uint8Array([97, 97, 97]))).response,
                  (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                  (await onesyRequest.post('http://localhost:4000/unzip', [1, 4, 1])).response,
                  (await onesyRequest.post('http://localhost:4000/unzip', true)).response,
                  (await onesyRequest.post('http://localhost:4000/unzip', undefined)).response,
                ];
                const values = [valueNode, ...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  {
                    data: 'a',
                    headers: {
                      'content-type': 'text/plain',
                      'onesy-encoding': 'onesy-zip'
                    }
                  },
                  {
                    data: 4,
                    headers: {
                      'content-type': 'text/plain',
                      'onesy-encoding': 'onesy-zip'
                    }
                  },
                  {
                    data: {
                      0: 97,
                      1: 97,
                      2: 97
                    },
                    headers: {
                      'content-type': 'text/plain',
                      'onesy-encoding': 'onesy-zip'
                    }
                  },
                  {
                    data: {
                      a: 4
                    },
                    headers: {
                      'content-type': 'text/plain',
                      'onesy-encoding': 'onesy-zip'
                    }
                  },
                  {
                    data: [
                      1,
                      4,
                      1
                    ],
                    headers: {
                      'content-type': 'text/plain',
                      'onesy-encoding': 'onesy-zip'
                    }
                  },
                  {
                    data: true,
                    headers: {
                      'content-type': 'text/plain',
                      'onesy-encoding': 'onesy-zip'
                    }
                  },
                  {
                    data: {},
                    headers: {}
                  }
                ]));
              });

              to('false', async () => {
                const onesyRequest = new OnesyRequest({ request: { zip: { onesy: { zip: false, only_positive: false } } } });

                const valueBrowsers = await evaluate(async (window: any) => {
                  const onesyRequest = new window.OnesyRequest({ request: { zip: { onesy: { zip: false, only_positive: false } } } });

                  return [
                    (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', [1, 4, 1])).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', undefined)).response,
                  ];
                });
                const valueNode = [
                  (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                  (await onesyRequest.post('http://localhost:4000/unzip', [1, 4, 1])).response,
                  (await onesyRequest.post('http://localhost:4000/unzip', undefined)).response,
                ];
                const values = [valueNode, ...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  {
                    data: {
                      a: 4
                    },
                    headers: {
                      'content-type': 'application/json'
                    }
                  },
                  {
                    data: [
                      1,
                      4,
                      1
                    ],
                    headers: {
                      'content-type': 'application/json'
                    }
                  },
                  {
                    data: {},
                    headers: {}
                  }
                ]));
              });

            });

            group('only_positive', () => {

              to('true', async () => {
                const onesyRequest = new OnesyRequest({ request: { zip: { onesy: { zip: true, only_positive: true } } } });

                const valueBrowsers = await evaluate(async (window: any) => {
                  const onesyRequest = new window.OnesyRequest({ request: { zip: { onesy: { zip: true, only_positive: true } } } });

                  return [
                    (await onesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.')).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                  ];
                });
                const valueNode = [
                  (await onesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.')).response,
                  (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                ];
                const values = [valueNode, ...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  {
                    data: 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.',
                    headers: {
                      'content-type': 'text/plain',
                      'onesy-encoding': 'onesy-zip'
                    }
                  },
                  {
                    data: {
                      a: 4
                    },
                    headers: {
                      'content-type': 'application/json'
                    }
                  }
                ]));
              });

              to('false', async () => {
                const onesyRequest = new OnesyRequest({ request: { zip: { onesy: { zip: true, only_positive: false } } } });

                const valueBrowsers = await evaluate(async (window: any) => {
                  const onesyRequest = new window.OnesyRequest({ request: { zip: { onesy: { zip: true, only_positive: false } } } });

                  return [
                    (await onesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.')).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                  ];
                });
                const valueNode = [
                  (await onesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.')).response,
                  (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 })).response,
                ];
                const values = [valueNode, ...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  {
                    data: 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.',
                    headers: {
                      'content-type': 'text/plain',
                      'onesy-encoding': 'onesy-zip'
                    }
                  },
                  {
                    data: {
                      a: 4
                    },
                    headers: {
                      'content-type': 'text/plain',
                      'onesy-encoding': 'onesy-zip'
                    }
                  }
                ]));
              });

            });

            group('unzip', () => {

              to('true', async () => {
                const onesyRequest = new OnesyRequest({ request: { zip: { onesy: { unzip: true } } }, response: { type: 'text' } });

                const valueBrowsers = await evaluate(async (window: any) => {
                  const onesyRequest = new window.OnesyRequest({ request: { zip: { onesy: { unzip: true } } }, response: { type: 'text' } });

                  return [
                    (await onesyRequest.get('http://localhost:4000/zip')).response,
                  ];
                });
                const valueNode = [
                  (await onesyRequest.get('http://localhost:4000/zip')).response,
                ];
                const values = [valueNode, ...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  {
                    a: 4
                  }
                ]));
              });

              to('false', async () => {
                const onesyRequest = new OnesyRequest({ request: { zip: { onesy: { unzip: false } } }, response: { type: 'text' } });

                const valueBrowsers = await evaluate(async (window: any) => {
                  const onesyRequest = new window.OnesyRequest({ request: { zip: { onesy: { unzip: false } } }, response: { type: 'text' } });

                  return [
                    (await onesyRequest.get('http://localhost:4000/zip')).response,
                  ];
                });
                const valueNode = [
                  (await onesyRequest.get('http://localhost:4000/zip')).response,
                ];
                const values = [valueNode, ...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  '1;00 " 1 4  2 {a 1 :},   AAJwplM='
                ]));
              });

            });

          });

        });

        to('agents', async () => {
          const onesyrequest = new OnesyRequest({
            request: {
              agents: {
                http: new http.Agent(),
                https: new https.Agent(),
              },
            },
          });

          const value = (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response;

          assert(value).eql({
            "userId": 1,
            "id": 1,
            "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
          });
        });

        to('timeout', async () => {
          const method = new Promise(resolve => {
            const onesyrequest = new OnesyRequest({ request: { timeout: 4 } });

            onesyrequest.get('https://jsonplaceholder.typicode.com/posts/14').then(value => resolve(value)).catch(error => resolve(error));
          });

          const values_ = [
            await method,
          ];

          const valueBrowsers = await evaluate(async (window: any) => {
            const method = new Promise(resolve => {
              const onesyrequest = new window.OnesyRequest({ request: { timeout: 4 } });

              onesyrequest.get('https://jsonplaceholder.typicode.com/posts/14').then(value => resolve(value)).catch(error => resolve(error));
            });

            return [
              await method,
            ];
          });
          const valueNode = values_;
          const values = [valueNode, ...valueBrowsers];

          values.forEach(value => assert(['timeout', 'error'].indexOf(value[0].type) > -1).eq(true));
        });

      });

      group('response', () => {

        to('pure', async () => {
          const values_ = [
            await new OnesyRequest({ response: { pure: true } }).get('https://jsonplaceholder.typicode.com/posts/1'),
          ];

          values_.push(await new OnesyRequest({ response: { pure: false } }).get('https://jsonplaceholder.typicode.com/posts/1'));

          const valueBrowsers = await evaluate(async (window: any) => {
            const values_ = [
              await new window.OnesyRequest({ response: { pure: true } }).get('https://jsonplaceholder.typicode.com/posts/1'),
            ];

            values_.push(await new window.OnesyRequest({ response: { pure: false } }).get('https://jsonplaceholder.typicode.com/posts/1'));

            return values_;
          });
          const valueNode = values_;
          const values = [valueNode, ...valueBrowsers];

          values.forEach(value => {
            assert(value[0]).eql({
              "userId": 1,
              "id": 1,
              "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
              "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
            });

            assert(value[1].response).eql({
              "userId": 1,
              "id": 1,
              "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
              "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
            });
          });
        });

        to('resolveOnError', async () => {
          const method: any = new Promise(resolve => {
            const onesyrequest = new OnesyRequest({ response: { resolveOnError: true } });

            onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1').then(resolve);
          });

          const method1: any = new Promise(resolve => {
            const onesyrequest = new OnesyRequest({ response: { resolveOnError: false } });

            onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1').then().catch(resolve);
          });

          const values_ = [
            (await method).status,
            (await method1).status,
          ];

          const valueBrowsers = await evaluate(async (window: any) => {
            const method: any = new Promise(resolve => {
              const onesyrequest = new window.OnesyRequest({ response: { resolveOnError: true } });

              onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1').then(resolve);
            });

            const method1: any = new Promise(resolve => {
              const onesyrequest = new window.OnesyRequest({ response: { resolveOnError: false } });

              onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1').then().catch(resolve);
            });

            const values_ = [
              (await method).status,
              (await method1).status,
            ];

            return values_;
          });
          const valueNode = values_;
          const values = [valueNode, ...valueBrowsers];

          values.forEach(value => assert(value).eql([
            404,
            404,
          ]));
        });

        group('type', () => {

          group('browser', () => {

            to('text', async () => {
              const valueBrowsers = await evaluate(async (window: any) => {
                const onesyrequest = new window.OnesyRequest({ response: { type: 'text' } });

                return [
                  typeof (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response === 'string',
                ];
              });
              const values = [...valueBrowsers];

              values.forEach(value => assert(value).eql([
                true,
              ]));
            });

            to('json', async () => {
              const valueBrowsers = await evaluate(async (window: any) => {
                const onesyrequest = new window.OnesyRequest({ response: { type: 'json' } });

                return [
                  (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof Object,
                ];
              });
              const values = [...valueBrowsers];

              values.forEach(value => assert(value).eql([
                true,
              ]));
            });

            to('arraybuffer', async () => {
              const valueBrowsers = await evaluate(async (window: any) => {
                const onesyrequest = new window.OnesyRequest({ response: { type: 'arraybuffer' } });

                return [
                  (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof ArrayBuffer,
                ];
              });
              const values = [...valueBrowsers];

              values.forEach(value => assert(value).eql([
                true,
              ]));
            });

            to('blob', async () => {
              const valueBrowsers = await evaluate(async (window: any) => {
                const onesyrequest = new window.OnesyRequest({ response: { type: 'blob' } });

                return [
                  (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof Blob,
                ];
              });
              const values = [...valueBrowsers];

              values.forEach(value => assert(value).eql([
                true,
              ]));
            });

            to('document', async () => {
              const valueBrowsers = await evaluate(async (window: any) => {
                const onesyrequest = new window.OnesyRequest({ response: { type: 'document' } });

                return [
                  (await onesyrequest.get('https://jsonplaceholder.typicode.com')).response instanceof Document,
                ];
              });
              const values = [...valueBrowsers];

              values.forEach(value => assert(value).eql([
                true,
              ]));
            });

          });

          group('node', () => {

            to('text', async () => {
              const onesyrequest = new OnesyRequest({ response: { type: 'text' } });

              const value = typeof (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response === 'string';

              assert(value).eq(true);
            });

            to('json', async () => {
              const onesyrequest = new OnesyRequest({ response: { type: 'json' } });

              const value = (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof Object;

              assert(value).eq(true);
            });

            to('buffer', async () => {
              const onesyrequest = new OnesyRequest({ response: { type: 'buffer' } });

              const value = (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response instanceof Buffer;

              assert(value).eq(true);
            });

          });

        });

        group('parse', () => {

          to('json', async () => {
            const onesyrequest = new OnesyRequest({ response: { type: undefined, parse: { json: true } } });

            const values_ = [
              (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response,
            ];

            const onesyrequest1 = new OnesyRequest({ response: { type: undefined, parse: { json: false } } });

            values_.push((await onesyrequest1.get('https://jsonplaceholder.typicode.com/posts/1')).response);

            const valueBrowsers = await evaluate(async (window: any) => {
              const onesyrequest = new window.OnesyRequest({ response: { type: undefined, parse: { json: true } } });

              const values_ = [
                (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1')).response,
              ];

              const onesyrequest1 = new window.OnesyRequest({ response: { type: undefined, parse: { json: false } } });

              values_.push((await onesyrequest1.get('https://jsonplaceholder.typicode.com/posts/1')).response);

              return values_;
            });
            const valueNode = values_;
            const values = [valueNode, ...valueBrowsers];

            values.forEach(value => assert(value).eql([
              {
                "userId": 1,
                "id": 1,
                "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
                "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
              },
              '{\n  "userId": 1,\n  "id": 1,\n  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",\n  "body": "quia et suscipit\\nsuscipit recusandae consequuntur expedita et cum\\nreprehenderit molestiae ut ut quas totam\\nnostrum rerum est autem sunt rem eveniet architecto"\n}',
            ]));
          });

        });

      });

    });

    group('request', () => {

      to('request', async () => {
        const values_ = [
          (await new OnesyRequest().request({ method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts/1' })).response,
        ];

        const valueBrowsers = await evaluate(async (window: any) => [
          (await new window.OnesyRequest().request({ method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts/1' })).response,
        ]);
        const valueNode = values_;
        const values = [valueNode, ...valueBrowsers];

        values.forEach(value => assert(value).eql([
          {
            "userId": 1,
            "id": 1,
            "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
          },
        ]));
      });

      group('options', () => {

        to('cancel', async () => {
          const method = new Promise(resolve => {
            const cancel = OnesyRequest.cancel;

            const onesyrequest = new OnesyRequest();

            (global.onesyEvents as events.EventEmitter).on('onesy-request-sent', () => cancel.cancel());

            onesyrequest.request({ method: 'GET', cancel, url: 'https://jsonplaceholder.typicode.com/posts/1' }).then().catch(error => resolve(error));
          });

          const values_ = [
            await method,
          ];

          const valueBrowsers = await evaluate(async (window: any) => {
            const method = new Promise(resolve => {
              const cancel = window.OnesyRequest.cancel;

              const onesyrequest = new window.OnesyRequest();

              window.addEventListener('onesy-request-sent', () => cancel.cancel());

              onesyrequest.request({ method: 'GET', cancel, url: 'https://jsonplaceholder.typicode.com/posts/1' }).then().catch(error => resolve(error));
            });

            return [
              await method,
            ];
          });
          const valueNode = values_;
          const values = [valueNode, ...valueBrowsers];

          values.forEach(value => assert(['abort', 'error'].indexOf(value[0].type) > -1).eq(true));
        });

        group('request', () => {

          to('withCredentials', async () => {
            const valueBrowsers = await evaluate(async (window: any) => {
              window.document.cookie = 'AMAUI_CSRF-TOKEN=a4';

              const onesyrequest = new window.OnesyRequest();

              const response = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { request: { withCredentials: true } });

              const response1 = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { request: { withCredentials: false } });

              return [
                (response.request as any).headers,
                (response1.request as any).headers,
              ];
            });
            const values = [...valueBrowsers];

            values.forEach(value => {
              assert(value[0]['X-CSRF-TOKEN']).eq('a4');
              assert(value[1]['X-CSRF-TOKEN']).eq(undefined);
            });
          });

          to('headers', async () => {
            const onesyrequest = new OnesyRequest();

            const values_ = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { request: { headers: { 'AMAUI-TOKEN': 'a4' } } });

            const valueBrowsers = await evaluate(async (window: any) => {
              const onesyrequest = new window.OnesyRequest();

              const response = await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { request: { headers: { 'AMAUI-TOKEN': 'a4' } } });

              return (response.request as any).headers;
            });
            const valueNode = (values_.request as any).headers;
            const values = [valueNode, ...valueBrowsers];

            values.forEach(value => assert(value['AMAUI-TOKEN']).eq('a4'));
          });

          group('zip', () => {

            group('onesy', () => {

              group('zip', () => {

                to('true', async () => {
                  const onesyRequest = new OnesyRequest();

                  const valueBrowsers = await evaluate(async (window: any) => {
                    const onesyRequest = new window.OnesyRequest();

                    return [
                      (await onesyRequest.post('http://localhost:4000/unzip', 'a', { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                      (await onesyRequest.post('http://localhost:4000/unzip', 4, { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                      (await onesyRequest.post('http://localhost:4000/unzip', new Uint8Array([97, 97, 97]), { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                      (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 }, { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                      (await onesyRequest.post('http://localhost:4000/unzip', [1, 4, 1], { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                      (await onesyRequest.post('http://localhost:4000/unzip', true, { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                      (await onesyRequest.post('http://localhost:4000/unzip', undefined, { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                    ];
                  });
                  const valueNode = [
                    (await onesyRequest.post('http://localhost:4000/unzip', 'a', { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', 4, { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', new Uint8Array([97, 97, 97]), { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 }, { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', [1, 4, 1], { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', true, { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', undefined, { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      data: 'a',
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: 4,
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {
                        0: 97,
                        1: 97,
                        2: 97
                      },
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {
                        a: 4
                      },
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: [
                        1,
                        4,
                        1
                      ],
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: true,
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {},
                      headers: {}
                    }
                  ]));
                });

                to('false', async () => {
                  const onesyRequest = new OnesyRequest();

                  const valueBrowsers = await evaluate(async (window: any) => {
                    const onesyRequest = new window.OnesyRequest();

                    return [
                      (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 }, { request: { zip: { onesy: { zip: false, only_positive: false } } } })).response,
                      (await onesyRequest.post('http://localhost:4000/unzip', [1, 4, 1], { request: { zip: { onesy: { zip: false, only_positive: false } } } })).response,
                      (await onesyRequest.post('http://localhost:4000/unzip', undefined, { request: { zip: { onesy: { zip: false, only_positive: false } } } })).response,
                    ];
                  });
                  const valueNode = [
                    (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 }, { request: { zip: { onesy: { zip: false, only_positive: false } } } })).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', [1, 4, 1], { request: { zip: { onesy: { zip: false, only_positive: false } } } })).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', undefined, { request: { zip: { onesy: { zip: false, only_positive: false } } } })).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      data: {
                        a: 4
                      },
                      headers: {
                        'content-type': 'application/json'
                      }
                    },
                    {
                      data: [
                        1,
                        4,
                        1
                      ],
                      headers: {
                        'content-type': 'application/json'
                      }
                    },
                    {
                      data: {},
                      headers: {}
                    }
                  ]));
                });

              });

              group('only_positive', () => {

                to('true', async () => {
                  const onesyRequest = new OnesyRequest();

                  const valueBrowsers = await evaluate(async (window: any) => {
                    const onesyRequest = new window.OnesyRequest();

                    return [
                      (await onesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.', { request: { zip: { onesy: { zip: true, only_positive: true } } } })).response,
                      (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 }, { request: { zip: { onesy: { zip: true, only_positive: true } } } })).response,
                    ];
                  });
                  const valueNode = [
                    (await onesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.', { request: { zip: { onesy: { zip: true, only_positive: true } } } })).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 }, { request: { zip: { onesy: { zip: true, only_positive: true } } } })).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      data: 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.',
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {
                        a: 4
                      },
                      headers: {
                        'content-type': 'application/json'
                      }
                    }
                  ]));
                });

                to('false', async () => {
                  const onesyRequest = new OnesyRequest();

                  const valueBrowsers = await evaluate(async (window: any) => {
                    const onesyRequest = new window.OnesyRequest();

                    return [
                      (await onesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.', { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                      (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 }, { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                    ];
                  });
                  const valueNode = [
                    (await onesyRequest.post('http://localhost:4000/unzip', 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.', { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                    (await onesyRequest.post('http://localhost:4000/unzip', { a: 4 }, { request: { zip: { onesy: { zip: true, only_positive: false } } } })).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      data: 'Lorem u ipsum dolor sit amet, consectetur adipiscing elit.Fuscem dolor em, facilisis sed eratr sit amet,pharetra blandit augue.Sed id placerat felis, malesuada rutrum nisl.In ultrices sed mauris finibus mmalesuad. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.Integer cursus, odio id rutrum blandit, neque velit aliquam odio, at rhoncus elit est nec erat.Proin egestassed maurelit, eratr sit molestie nisi semper at.Cras interdum massa nec mmolestierutrum.Duis commodo venenatis justo, ac porta tellus pellentesque sed.Donec et nisi aumus.',
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    },
                    {
                      data: {
                        a: 4
                      },
                      headers: {
                        'content-type': 'text/plain',
                        'onesy-encoding': 'onesy-zip'
                      }
                    }
                  ]));
                });

              });

              group('unzip', () => {

                to('true', async () => {
                  const onesyRequest = new OnesyRequest();

                  const valueBrowsers = await evaluate(async (window: any) => {
                    const onesyRequest = new window.OnesyRequest();

                    return [
                      (await onesyRequest.get('http://localhost:4000/zip', { request: { zip: { onesy: { unzip: true } } }, response: { type: 'text' } })).response,
                    ];
                  });
                  const valueNode = [
                    (await onesyRequest.get('http://localhost:4000/zip', { request: { zip: { onesy: { unzip: true } } }, response: { type: 'text' } })).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    {
                      a: 4
                    }
                  ]));
                });

                to('false', async () => {
                  const onesyRequest = new OnesyRequest();

                  const valueBrowsers = await evaluate(async (window: any) => {
                    const onesyRequest = new window.OnesyRequest();

                    return [
                      (await onesyRequest.get('http://localhost:4000/zip', { request: { zip: { onesy: { unzip: false } } }, response: { type: 'text' } })).response,
                    ];
                  });
                  const valueNode = [
                    (await onesyRequest.get('http://localhost:4000/zip', { request: { zip: { onesy: { unzip: false } } }, response: { type: 'text' } })).response,
                  ];
                  const values = [valueNode, ...valueBrowsers];

                  values.forEach(value => assert(value).eql([
                    '1;00 " 1 4  2 {a 1 :},   AAJwplM='
                  ]));
                });

              });

            });

          });

          to('agents', async () => {
            const onesyrequest = new OnesyRequest();

            const value = (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', {
              request: {
                agents: {
                  http: new http.Agent(),
                  https: new https.Agent(),
                },
              },
            })).response;

            assert(value).eql({
              "userId": 1,
              "id": 1,
              "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
              "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
            });
          });

          to('timeout', async () => {
            const method = new Promise(resolve => {
              const onesyrequest = new OnesyRequest();

              onesyrequest.get('https://jsonplaceholder.typicode.com/posts/14', { request: { timeout: 4 } }).then(value => resolve(value)).catch(error => resolve(error));
            });

            const values_ = [
              await method,
            ];

            const valueBrowsers = await evaluate(async (window: any) => {
              const method = new Promise(resolve => {
                const onesyrequest = new window.OnesyRequest();

                onesyrequest.get('https://jsonplaceholder.typicode.com/posts/14', { request: { timeout: 4 } }).then(value => resolve(value)).catch(error => resolve(error));
              });

              return [
                await method,
              ];
            });
            const valueNode = values_;
            const values = [valueNode, ...valueBrowsers];

            values.forEach(value => assert(['timeout', 'error'].indexOf(value[0].type) > -1).eq(true));
          });

        });

        group('response', () => {

          to('pure', async () => {
            const values_ = [
              await new OnesyRequest().get('https://jsonplaceholder.typicode.com/posts/1', { response: { pure: true } }),
            ];

            values_.push(await new OnesyRequest().get('https://jsonplaceholder.typicode.com/posts/1', { response: { pure: false } }));

            const valueBrowsers = await evaluate(async (window: any) => {
              const values_ = [
                await new window.OnesyRequest().get('https://jsonplaceholder.typicode.com/posts/1', { response: { pure: true } }),
              ];

              values_.push(await new window.OnesyRequest().get('https://jsonplaceholder.typicode.com/posts/1', { response: { pure: false } }));

              return values_;
            });
            const valueNode = values_;
            const values = [valueNode, ...valueBrowsers];

            values.forEach(value => {
              assert(value[0]).eql({
                "userId": 1,
                "id": 1,
                "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
                "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
              });

              assert(value[1].response).eql({
                "userId": 1,
                "id": 1,
                "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
                "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
              });
            });
          });

          to('resolveOnError', async () => {
            const method: any = new Promise(resolve => {
              const onesyrequest = new OnesyRequest();

              onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1', { response: { resolveOnError: true } }).then(resolve);
            });

            const method1: any = new Promise(resolve => {
              const onesyrequest = new OnesyRequest();

              onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1', { response: { resolveOnError: false } }).then().catch(resolve);
            });

            const values_ = [
              (await method).status,
              (await method1).status,
            ];

            const valueBrowsers = await evaluate(async (window: any) => {
              const method: any = new Promise(resolve => {
                const onesyrequest = new window.OnesyRequest();

                onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1', { response: { resolveOnError: true } }).then(resolve);
              });

              const method1: any = new Promise(resolve => {
                const onesyrequest = new window.OnesyRequest();

                onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1', { response: { resolveOnError: false } }).then().catch(resolve);
              });

              const values_ = [
                (await method).status,
                (await method1).status,
              ];

              return values_;
            });
            const valueNode = values_;
            const values = [valueNode, ...valueBrowsers];

            values.forEach(value => assert(value).eql([
              404,
              404,
            ]));
          });

          group('type', () => {

            group('browser', () => {

              to('text', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  const onesyrequest = new window.OnesyRequest();

                  return [
                    typeof (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { response: { type: 'text' } })).response === 'string',
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

              to('json', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  const onesyrequest = new window.OnesyRequest();

                  return [
                    (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { response: { type: 'json' } })).response instanceof Object,
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

              to('arraybuffer', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  const onesyrequest = new window.OnesyRequest();

                  return [
                    (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { response: { type: 'arraybuffer' } })).response instanceof ArrayBuffer,
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

              to('blob', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  const onesyrequest = new window.OnesyRequest();

                  return [
                    (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { response: { type: 'blob' } })).response instanceof Blob,
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

              to('document', async () => {
                const valueBrowsers = await evaluate(async (window: any) => {
                  const onesyrequest = new window.OnesyRequest();

                  return [
                    (await onesyrequest.get('https://jsonplaceholder.typicode.com', { response: { type: 'document' } })).response instanceof Document,
                  ];
                });
                const values = [...valueBrowsers];

                values.forEach(value => assert(value).eql([
                  true,
                ]));
              });

            });

            group('node', () => {

              to('text', async () => {
                const onesyrequest = new OnesyRequest();

                const value = typeof (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { response: { type: 'text' } })).response === 'string';

                assert(value).eq(true);
              });

              to('json', async () => {
                const onesyrequest = new OnesyRequest();

                const value = (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { response: { type: 'json' } })).response instanceof Object;

                assert(value).eq(true);
              });

              to('buffer', async () => {
                const onesyrequest = new OnesyRequest();

                const value = (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { response: { type: 'buffer' } })).response instanceof Buffer;

                assert(value).eq(true);
              });

            });

          });

          group('parse', () => {

            to('json', async () => {
              const onesyrequest = new OnesyRequest();

              const values_ = [
                (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { response: { type: undefined, parse: { json: true } } })).response,
              ];

              values_.push((await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { response: { type: undefined, parse: { json: false } } })).response);

              const valueBrowsers = await evaluate(async (window: any) => {
                const onesyrequest = new window.OnesyRequest();

                const values_ = [
                  (await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { response: { type: undefined, parse: { json: true } } })).response,
                ];

                values_.push((await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { response: { type: undefined, parse: { json: false } } })).response);

                return values_;
              });
              const valueNode = values_;
              const values = [valueNode, ...valueBrowsers];

              values.forEach(value => assert(value).eql([
                {
                  "userId": 1,
                  "id": 1,
                  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
                  "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
                },
                '{\n  "userId": 1,\n  "id": 1,\n  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",\n  "body": "quia et suscipit\\nsuscipit recusandae consequuntur expedita et cum\\nreprehenderit molestiae ut ut quas totam\\nnostrum rerum est autem sunt rem eveniet architecto"\n}',
              ]));
            });

          });

        });

      });

    });

    to('get', async () => {
      const values_ = [
        (await new OnesyRequest().get('https://jsonplaceholder.typicode.com/posts/1')).response,
      ];

      const valueBrowsers = await evaluate(async (window: any) => [
        (await new window.OnesyRequest().get('https://jsonplaceholder.typicode.com/posts/1')).response,
      ]);
      const valueNode = values_;
      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        {
          "userId": 1,
          "id": 1,
          "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
          "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
        },
      ]));
    });

    to('post', async () => {
      const values_ = [
        (await new OnesyRequest().post('https://jsonplaceholder.typicode.com/posts', { a: 4 })).response,
      ];

      const valueBrowsers = await evaluate(async (window: any) => [
        (await new window.OnesyRequest().post('https://jsonplaceholder.typicode.com/posts', { a: 4 })).response,
      ]);
      const valueNode = values_;
      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        {
          "id": 101,
          "a": 4
        },
      ]));
    });

    to('put', async () => {
      const values_ = [
        (await new OnesyRequest().put('https://jsonplaceholder.typicode.com/posts/1', { a: 4 })).response,
      ];

      const valueBrowsers = await evaluate(async (window: any) => [
        (await new window.OnesyRequest().put('https://jsonplaceholder.typicode.com/posts/1', { a: 4 })).response,
      ]);
      const valueNode = values_;
      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        {
          "id": 1,
          "a": 4,
        },
      ]));
    });

    to('patch', async () => {
      const values_ = [
        (await new OnesyRequest().patch('https://jsonplaceholder.typicode.com/posts/1', { a: 4 })).response,
      ];

      const valueBrowsers = await evaluate(async (window: any) => [
        (await new window.OnesyRequest().patch('https://jsonplaceholder.typicode.com/posts/1', { a: 4 })).response,
      ]);
      const valueNode = values_;
      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        {
          "a": 4,
          "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
          "id": 1,
          "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
          "userId": 1,
        },
      ]));
    });

    to('head', async () => {
      const values_ = [
        (await new OnesyRequest().head('https://jsonplaceholder.typicode.com/posts/1')).status,
      ];

      const valueBrowsers = await evaluate(async (window: any) => [
        (await new window.OnesyRequest().head('https://jsonplaceholder.typicode.com/posts/1')).status,
      ]);
      const valueNode = values_;
      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        200,
      ]));
    });

    to('options', async () => {
      const valueBrowsers = await evaluate(async (window: any) => {
        const method = new Promise(resolve => {
          new window.OnesyRequest().options('https://jsonplaceholder.typicode.com/posts/1').then().catch(error => resolve(error));
        });

        return [
          (await method as any).type,
        ];
      });
      const valueNode = (await new OnesyRequest().options('https://jsonplaceholder.typicode.com/posts/1')).headers['access-control-allow-methods'];

      assert(valueNode).eq('GET,HEAD,PUT,PATCH,POST,DELETE');

      valueBrowsers.forEach((value: any) => assert(value).eql([
        'error',
      ]));
    });

    to('delete', async () => {
      const values_ = [
        (await new OnesyRequest().delete('https://jsonplaceholder.typicode.com/posts/1')).status,
      ];

      const valueBrowsers = await evaluate(async (window: any) => [
        (await new window.OnesyRequest().delete('https://jsonplaceholder.typicode.com/posts/1')).status,
      ]);
      const valueNode = values_;
      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        200,
      ]));
    });

    group('interceptors', () => {

      to('success', async () => {
        const interceptors = {
          pre: [],
          post: [],
          success: [],
        };
        const onesyrequest = new OnesyRequest();

        onesyrequest.interceptors.request.pre.subscribe(value => interceptors.pre.push(value));
        OnesyRequest.interceptors.request.pre.subscribe(value => interceptors.pre.push(value));
        onesyrequest.interceptors.request.post.subscribe(value => interceptors.post.push(value));
        OnesyRequest.interceptors.request.post.subscribe(value => interceptors.post.push(value));
        onesyrequest.interceptors.response.success.subscribe(value => interceptors.success.push(value));
        OnesyRequest.interceptors.response.success.subscribe(value => interceptors.success.push(value));

        await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1');

        const values_ = [
          interceptors.pre[0].url,
          interceptors.pre[1].url,
          interceptors.post[0].status,
          interceptors.post[1].status,
          interceptors.success[0].status,
          interceptors.success[1].status,
        ];

        const valueBrowsers = await evaluate(async (window: any) => {
          const interceptors = {
            pre: [],
            post: [],
            success: [],
          };
          const onesyrequest = new window.OnesyRequest();

          onesyrequest.interceptors.request.pre.subscribe(value => interceptors.pre.push(value));
          window.OnesyRequest.interceptors.request.pre.subscribe(value => interceptors.pre.push(value));
          onesyrequest.interceptors.request.post.subscribe(value => interceptors.post.push(value));
          window.OnesyRequest.interceptors.request.post.subscribe(value => interceptors.post.push(value));
          onesyrequest.interceptors.response.success.subscribe(value => interceptors.success.push(value));
          window.OnesyRequest.interceptors.response.success.subscribe(value => interceptors.success.push(value));

          await onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1');

          return [
            interceptors.pre[0].url,
            interceptors.pre[1].url,
            interceptors.post[0].status,
            interceptors.post[1].status,
            interceptors.success[0].status,
            interceptors.success[1].status,
          ];
        });
        const valueNode = values_;
        const values = [valueNode, ...valueBrowsers];

        values.forEach(value => assert(value).eql([
          'https://jsonplaceholder.typicode.com/posts/1',
          'https://jsonplaceholder.typicode.com/posts/1',
          200,
          200,
          200,
          200,
        ]));
      });

      to('error', async () => {
        const interceptors = {
          pre: [],
          post: [],
          error: [],
        };
        const onesyrequest = new OnesyRequest();

        onesyrequest.interceptors.request.pre.subscribe(value => interceptors.pre.push(value));
        OnesyRequest.interceptors.request.pre.subscribe(value => interceptors.pre.push(value));
        onesyrequest.interceptors.request.post.subscribe(value => interceptors.post.push(value));
        OnesyRequest.interceptors.request.post.subscribe(value => interceptors.post.push(value));
        onesyrequest.interceptors.response.error.subscribe(value => interceptors.error.push(value));
        OnesyRequest.interceptors.response.error.subscribe(value => interceptors.error.push(value));

        await onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1');

        const values_ = [
          interceptors.pre[0].url,
          interceptors.pre[1].url,
          interceptors.post[0].status,
          interceptors.post[1].status,
          interceptors.error[0].status,
          interceptors.error[1].status,
        ];

        const valueBrowsers = await evaluate(async (window: any) => {
          const interceptors = {
            pre: [],
            post: [],
            error: [],
          };
          const onesyrequest = new window.OnesyRequest();

          onesyrequest.interceptors.request.pre.subscribe(value => interceptors.pre.push(value));
          window.OnesyRequest.interceptors.request.pre.subscribe(value => interceptors.pre.push(value));
          onesyrequest.interceptors.request.post.subscribe(value => interceptors.post.push(value));
          window.OnesyRequest.interceptors.request.post.subscribe(value => interceptors.post.push(value));
          onesyrequest.interceptors.response.error.subscribe(value => interceptors.error.push(value));
          window.OnesyRequest.interceptors.response.error.subscribe(value => interceptors.error.push(value));

          await onesyrequest.get('https://jsonplaceholder.typicode.com/postsa/1');

          return [
            interceptors.pre[0].url,
            interceptors.pre[1].url,
            interceptors.post[0].status,
            interceptors.post[1].status,
            interceptors.error[0].status,
            interceptors.error[1].status,
          ];
        });
        const valueNode = values_;
        const values = [valueNode, ...valueBrowsers];

        values.forEach(value => assert(value).eql([
          'https://jsonplaceholder.typicode.com/postsa/1',
          'https://jsonplaceholder.typicode.com/postsa/1',
          404,
          404,
          404,
          404,
        ]));
      });

      to('fail', async () => {
        const interceptors = {
          pre: [],
          post: [],
          fail: [],
        };
        const onesyrequest = new OnesyRequest();
        const cancel = OnesyRequest.cancel;

        onesyrequest.interceptors.request.pre.subscribe(value => interceptors.pre.push(value));
        OnesyRequest.interceptors.request.pre.subscribe(value => interceptors.pre.push(value));
        onesyrequest.interceptors.request.post.subscribe(value => interceptors.post.push(value));
        OnesyRequest.interceptors.request.post.subscribe(value => interceptors.post.push(value));
        onesyrequest.interceptors.response.fail.subscribe(value => interceptors.fail.push(value));
        OnesyRequest.interceptors.response.fail.subscribe(value => interceptors.fail.push(value));

        const method = new Promise(resolve => {
          (global.onesyEvents as events.EventEmitter).on('onesy-request-sent', () => cancel.cancel());

          onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { cancel }).then().catch(error => resolve(error));
        });

        await method;

        const values_ = [
          interceptors.pre[0].cancel instanceof Object,
          interceptors.pre[1].cancel instanceof Object,
          interceptors.post[0].type === 'error',
          interceptors.post[1].type === 'error',
          interceptors.fail[0].type === 'error',
          interceptors.fail[1].type === 'error',
        ];

        const valueBrowsers = await evaluate(async (window: any) => {
          const interceptors = {
            pre: [],
            post: [],
            fail: [],
          };
          const onesyrequest = new window.OnesyRequest();
          const cancel = window.OnesyRequest.cancel;

          onesyrequest.interceptors.request.pre.subscribe(value => interceptors.pre.push(value));
          window.OnesyRequest.interceptors.request.pre.subscribe(value => interceptors.pre.push(value));
          onesyrequest.interceptors.request.post.subscribe(value => interceptors.post.push(value));
          window.OnesyRequest.interceptors.request.post.subscribe(value => interceptors.post.push(value));
          onesyrequest.interceptors.response.fail.subscribe(value => interceptors.fail.push(value));
          window.OnesyRequest.interceptors.response.fail.subscribe(value => interceptors.fail.push(value));

          const method = new Promise(resolve => {
            window.addEventListener('onesy-request-sent', () => cancel.cancel());

            onesyrequest.get('https://jsonplaceholder.typicode.com/posts/1', { cancel }).then(a => resolve(a)).catch(error => resolve(error));
          });

          await method;

          return [
            interceptors.pre[0].cancel instanceof Object,
            interceptors.pre[1].cancel instanceof Object,
            interceptors.post[0].type === 'abort',
            interceptors.post[1].type === 'abort',
            interceptors.fail[0].type === 'abort',
            interceptors.fail[1].type === 'abort',
          ];
        });
        const valueNode = values_;
        const values = [valueNode, ...valueBrowsers];

        values.forEach(value => assert(value).eql([
          true,
          true,
          true,
          true,
          true,
          true,
        ]));
      });

    });

  });

  group('variants', () => {

    to('application/x-www-form-urlencoded', async () => {
      const form = new URLSearchParams();

      form.append('a', 4 as any);
      form.append('ad', 'a4');

      const values_ = [
        (await OnesyRequest.post('http://localhost:4000/api', form.toString(), {
          request: {
            headers: {
              'content-type': 'application/x-www-form-urlencoded',
            },
          },
        })).response,
      ];

      const valueBrowsers = await evaluate(async (window: any) => {
        const form = new URLSearchParams();

        form.append('a', 4 as any);
        form.append('ad', 'a4');

        return [
          (await window.OnesyRequest.post('http://localhost:4000/api', form, {
            request: {
              headers: {
                'content-type': 'application/x-www-form-urlencoded',
              },
            },
          })).response,
        ];
      });
      const valueNode = values_;
      const values = [valueNode, ...valueBrowsers];

      values.forEach(value => assert(value).eql([
        {
          variant: 'application/x-www-form-urlencoded',
          data: {
            a: '4',
            ad: 'a4',
          },
        },
      ]));
    });

    to('multipart/form-data', async () => {
      const file = await OnesyNode.file.get(filePath, false);

      const form = new FormData();

      form.append('a', 4 as any);
      form.append('ad', 'a4');
      form.append('file', file);

      const values_ = [
        (await OnesyRequest.post('http://localhost:4000/multipart', form.getBuffer(), {
          request: {
            headers: {
              ...form.getHeaders(),
            },
          },
        })).response,
      ];

      const valueBrowsers = await evaluate(async (window: any) => {
        const input = window.document.getElementById('a') as HTMLInputElement;

        const file = input.files[0];

        const form = new window.FormData();

        form.append('a', 4 as any);
        form.append('ad', 'a4');
        form.append('file', file);

        return [
          (await window.OnesyRequest.post('http://localhost:4000/multipart', form)).response,
        ];
      }, {
        preEvaluate: async browser => {
          // Note that Promise.all prevents a race condition
          // between clicking and waiting for the file chooser.
          const [_, fileChooser] = await Promise.all([
            // Add the input element
            evaluateBrowser((window: any) => {
              const input = window.document.createElement('input');

              input.type = 'file';
              input.id = 'a';

              if (!window.document.getElementById('a')) window.document.body.appendChild(input);
            }, { browser }),

            // It is important to call waitForEvent before click to set up waiting.
            browser.page.waitForEvent('filechooser'),

            // Opens the file chooser.
            browser.page.locator('#a').click(),
          ]);

          await fileChooser.setFiles(filePath);
        }
      });
      const valueNode = values_;

      assert(valueNode).eql([
        {
          variant: 'multipart/form-data',
          data: {
            fields: {
              a: '4',
              ad: 'a4',
              file: `MIT License\n\nCopyright (c) Lazar Erić <lazareric1@proton.me>\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n`,
            },
          },
        },
      ]);

      valueBrowsers.forEach(value => assert(value).eql([
        {
          variant: 'multipart/form-data',
          data: {
            fields: {
              a: '4',
              ad: 'a4',
            },
            file: `MIT License\n\nCopyright (c) Lazar Erić <lazareric1@proton.me>\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n`,
          },
        },
      ]));
    });

    group('binary', async () => {

      to('blob', async () => {
        const valueBrowsers = await evaluate(async (window: any) => {
          const input = window.document.getElementById('a') as HTMLInputElement;
          const file = input.files[0];

          return [
            (await window.OnesyRequest.post('http://localhost:4000/api', file, {
              request: {
                headers: {
                  'content-type': 'application/octet-stream',
                },
              },
            })).response,
          ];
        }, {
          preEvaluate: async browser => {
            // Note that Promise.all prevents a race condition
            // between clicking and waiting for the file chooser.
            const [_, fileChooser] = await Promise.all([
              // Add the input element
              evaluateBrowser((window: any) => {
                const input = window.document.createElement('input');

                input.type = 'file';
                input.id = 'a';

                if (!window.document.getElementById('a')) window.document.body.appendChild(input);
              }, { browser }),

              // It is important to call waitForEvent before click to set up waiting.
              browser.page.waitForEvent('filechooser'),

              // Opens the file chooser.
              browser.page.locator('#a').click(),
            ]);

            await fileChooser.setFiles(filePath);
          }
        });

        const values = [...valueBrowsers];

        values.forEach(value => assert(value).eql([
          {
            variant: 'application/octet-stream',
            data: `MIT License\n\nCopyright (c) Lazar Erić <lazareric1@proton.me>\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n`,
          },
        ]));
      });

      to('uint8array', async () => {
        const values_ = [
          (await OnesyRequest.post('http://localhost:4000/api', new Uint8Array([97]), {
            request: {
              headers: {
                'content-type': 'text/plain',
              },
            },
          })).response,
        ];

        const valueBrowsers = await evaluate(async (window: any) => {
          return [
            (await window.OnesyRequest.post('http://localhost:4000/api', new Uint8Array([97]), {
              request: {
                headers: {
                  'content-type': 'text/plain',
                },
              },
            })).response,
          ];
        });

        const valueNode = values_;

        const values = [valueNode, ...valueBrowsers];

        values.forEach(value => assert(value).eql([
          {
            variant: 'text/plain',
            data: 'a',
          },
        ]));
      });

      to('buffer', async () => {
        const file = await OnesyNode.file.get(filePath, false);

        const valueNode = [
          (await OnesyRequest.post('http://localhost:4000/api', file, {
            request: {
              headers: {
                'content-type': 'application/octet-stream',
              },
            },
          })).response,
        ];

        const values = [valueNode];

        values.forEach(value => assert(value).eql([
          {
            variant: 'application/octet-stream',
            data: `MIT License\n\nCopyright (c) Lazar Erić <lazareric1@proton.me>\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n`,
          },
        ]));
      });

    });

    group('raw', () => {

      to('text/plain', async () => {
        const values_ = [
          (await OnesyRequest.post('http://localhost:4000/api', Buffer.from('a'), {
            request: {
              headers: {
                'content-type': 'text/plain',
              },
            },
          })).response,
        ];

        const valueBrowsers = await evaluate(async (window: any) => {
          return [
            (await window.OnesyRequest.post('http://localhost:4000/api', new TextEncoder().encode('a'), {
              request: {
                headers: {
                  'content-type': 'text/plain',
                },
              },
            })).response,
          ];
        });
        const valueNode = values_;
        const values = [valueNode, ...valueBrowsers];

        values.forEach(value => assert(value).eql([
          {
            variant: 'text/plain',
            data: 'a',
          },
        ]));
      });

      to('text/html', async () => {
        const values_ = [
          (await OnesyRequest.post('http://localhost:4000/api', Buffer.from('<a>a</a>'), {
            request: {
              headers: {
                'content-type': 'text/html',
              },
            },
          })).response,
        ];

        const valueBrowsers = await evaluate(async (window: any) => {
          return [
            (await window.OnesyRequest.post('http://localhost:4000/api', new TextEncoder().encode('<a>a</a>'), {
              request: {
                headers: {
                  'content-type': 'text/html',
                },
              },
            })).response,
          ];
        });
        const valueNode = values_;
        const values = [valueNode, ...valueBrowsers];

        values.forEach(value => assert(value).eql([
          {
            variant: 'text/html',
            data: '<a>a</a>',
          },
        ]));
      });

      to('application/javascript', async () => {
        const values_ = [
          (await OnesyRequest.post('http://localhost:4000/api', Buffer.from('const a = 4;'), {
            request: {
              headers: {
                'content-type': 'application/javascript',
              },
            },
          })).response,
        ];

        const valueBrowsers = await evaluate(async (window: any) => {
          return [
            (await window.OnesyRequest.post('http://localhost:4000/api', new TextEncoder().encode('const a = 4;'), {
              request: {
                headers: {
                  'content-type': 'application/javascript',
                },
              },
            })).response,
          ];
        });
        const valueNode = values_;
        const values = [valueNode, ...valueBrowsers];

        values.forEach(value => assert(value).eql([
          {
            variant: 'application/javascript',
            data: 'const a = 4;',
          },
        ]));
      });

      to('application/json', async () => {
        const values_ = [
          (await OnesyRequest.post('http://localhost:4000/api', {
            a: 4,
            ad: 'a4',
          })).response,
        ];

        const valueBrowsers = await evaluate(async (window: any) => {
          return [
            (await window.OnesyRequest.post('http://localhost:4000/api', {
              a: 4,
              ad: 'a4',
            })).response,
          ];
        });
        const valueNode = values_;
        const values = [valueNode, ...valueBrowsers];

        values.forEach(value => assert(value).eql([
          {
            variant: 'application/json',
            data: {
              a: 4,
              ad: 'a4',
            },
          },
        ]));
      });

      to('application/xml', async () => {
        const values_ = [
          (await OnesyRequest.post('http://localhost:4000/api', Buffer.from('<a>a</a>'), {
            request: {
              headers: {
                'content-type': 'application/xml',
              },
            },
          })).response,
        ];

        const valueBrowsers = await evaluate(async (window: any) => {
          return [
            (await window.OnesyRequest.post('http://localhost:4000/api', new TextEncoder().encode('<a>a</a>'), {
              request: {
                headers: {
                  'content-type': 'application/xml',
                },
              },
            })).response,
          ];
        });
        const valueNode = values_;
        const values = [valueNode, ...valueBrowsers];

        values.forEach(value => assert(value).eql([
          {
            variant: 'application/xml',
            data: '<a>a</a>',
          },
        ]));
      });

    });

  });

});
