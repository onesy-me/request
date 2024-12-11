const path = require('path');
const http = require('http');
const fg = require('fast-glob');

const express = require('express');
const cors = require('cors');
const formidable = require('formidable');

const OnesyUtils = require('@onesy/utils');
const OnesyZip = require('@onesy/zip').default;
const OnesyNode = require('@onesy/node').default;

const port = process.env.PORT || 4000;

const formParse = req => new Promise((resolve, reject) => {
  const form = formidable();

  form.parse(req, async (error, fields, files) => {
    if (error) {
      console.log(error);

      return reject(error);
    }

    return resolve({ fields, files });
  });
});

const run = async () => {
  const app = express();

  app.set('view engine', 'html');
  app.set('json spaces', 2);
  app.set('subdomain offset', 1);

  app.use(cors({ origin: '*' }));

  app.use(express.static(path.join(__dirname, '../../../')));

  // All the body parsers
  app.use(express.urlencoded({ extended: false }));
  app.use(express.text());

  const onesyUnzip = (req, res, next) => {
    let value = req.body;

    if (OnesyUtils.is('buffer', value)) value = Buffer.from(value).toString('utf-8');

    if (req.headers['onesy-encoding'] === 'onesy-zip') value = OnesyZip.decode(value).value;

    req.body = value;

    return next();
  };

  app.get('/zip', async (req, res) => {
    res.set('onesy-encoding', 'onesy-zip');

    return res.status(200).send(new OnesyZip({ a: 4 }).response.value);
  });

  app.post('/unzip', express.json(), express.raw({ type: '*/*' }), onesyUnzip, async (req, res) => {
    let data = req.body;

    const response = {
      data,
      headers: {
        'content-type': req.headers['content-type'],
        'onesy-encoding': req.headers['onesy-encoding'],
      },
    };

    return res.status(200).json(response);
  });

  app.post('/multipart', async (req, res) => {
    let data = req.body;

    const response = {
      variant: req.headers['content-type'].split('; ')[0],
      data,
    };

    const { fields, files } = await formParse(req);

    response.data = {
      fields,
      file: files?.file?.filepath && await OnesyNode.file.get(files?.file?.filepath, false),
    };

    return res.status(200).json(response);
  });

  app.post('/api', express.json(), express.raw({ type: '*/*' }), async (req, res) => {
    let data = req.body;

    if (OnesyUtils.is('buffer', data)) data = Buffer.from(data).toString('utf-8');

    const response = {
      variant: req.headers['content-type'],
      data,
    };

    return res.status(200).json(response);
  });

  app.get('*', async (req, res) => {
    const paths = (await fg('build/umd/*.prod.min.js', { onlyFiles: true }));

    paths.push(
      'https://unpkg.com/@onesy/utils@latest/umd/onesy-utils.prod.min.js'
    );

    let value = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  scripts
</head>
<body>
  a
</body>
</html>
`;

    let scripts = ``;

    paths.forEach(item => scripts += `<script src='${item}'></script>\n`);

    value = value.replace('scripts', scripts);

    return res.send(value);
  });

  const server = http.createServer(app);

  server.listen(port, error => {
    if (error) throw error;

    console.log(`Website started 🌱 at port ${port}`);
  });
};

run();
