
</br>
</br>

<p align='center'>
  <a target='_blank' rel='noopener noreferrer' href='#'>
    <img width='auto' height='84' src='https://raw.githubusercontent.com/onesy-me/onesy/refs/heads/main/utils/images/logo.png' alt='onesy logo' />
  </a>
</p>

<h1 align='center'>onesy Request</h1>

<h3 align='center'>
  <sub>MIT license&nbsp;&nbsp;&nbsp;&nbsp;</sub>
  <sub>Production ready&nbsp;&nbsp;&nbsp;&nbsp;</sub>
  <sub>UMD 18.1kb gzipped&nbsp;&nbsp;&nbsp;&nbsp;</sub>
  <sub>100% test cov&nbsp;&nbsp;&nbsp;&nbsp;</sub>
  <sub>Browser and Nodejs</sub>
</h3>

<p align='center'>
    <sub>Very simple code&nbsp;&nbsp;&nbsp;&nbsp;</sub>
    <sub>Modern code&nbsp;&nbsp;&nbsp;&nbsp;</sub>
    <sub>Junior friendly&nbsp;&nbsp;&nbsp;&nbsp;</sub>
    <sub>Typescript&nbsp;&nbsp;&nbsp;&nbsp;</sub>
    <sub>Made with :yellow_heart:</sub>
</p>

<br />

### Add

```sh
yarn add @onesy/request
```

### Use

```javascript
  import OnesyRequest from '@onesy/request';

  // Make a new OnesyRequest instance
  const onesyRequest = new OnesyRequest();

  await onesyRequest.get('https://jsonplaceholder.typicode.com/posts/4');

  // or as a static method without a new instance
  await OnesyRequest.get('https://jsonplaceholder.typicode.com/posts/4');

  // {
  //     response: {
  //         userId: 1,
  //         id: 4,
  //         title: 'eum et est occaecati',
  //         body: 'ullam et saepe reiciendis voluptatem adipisci\nsit amet autem assumenda provident rerum culpa\nquis hic commodi nesciunt rem tenetur doloremque ipsam iure\nquis sunt voluptatem rerum illo velit'
  //     },
  //     status: 200,
  //     headers: {
  //         cache-control: 'max-age=43200',
  //         content-type: 'application/json; charset=utf-8',
  //         expires: -1,
  //         pragma: 'no-cache'
  //     },
  //     request: {
  //         headers: {
  //             Accept: 'application/json, text/plain, */*'
  //         }
  //     },
  //     options: {
  //         method: 'GET',
  //         url: 'https://jsonplaceholder.typicode.com/posts/4',
  //         request: {
  //             headers: {
  //                 Accept: 'application/json, text/plain, */*'
  //             },
  //             csrf: {
  //                 cookie: 'CSRF-TOKEN',
  //                 headers: 'X-CSRF-TOKEN'
  //             }
  //         },
  //         response: {
  //             resolveOnError: true,
  //             type: 'json',
  //             parse: {
  //                 json: true
  //             }
  //         }
  //     }
  // }
```

### Dev

Install

```sh
yarn
```

Test

```sh
yarn test
```

### Prod

Build

```sh
yarn build
```
