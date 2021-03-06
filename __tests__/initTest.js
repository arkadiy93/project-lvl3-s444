import nock from 'nock';
import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import loadPage, { gatherLocalResources, editSourceLinks } from '../src';

describe('download http test', () => {
  let dir;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
  });

  afterEach(async () => {
    await rimraf(dir, () => {});
  });

  test('test 1', async () => {
    const testFilePath = path.join(__dirname, '__fixtures__/html/test1.html');
    const resourcesFolderName = path.join(dir, 'hexlet-io-courses_files');
    const body = await fs.readFile(testFilePath, 'utf-8');
    const localResources = gatherLocalResources(body);

    const fileName = 'hexlet-io-courses.html';
    const hostname = 'https://hexlet.io';
    const pathname = '/courses';
    nock(hostname).get(pathname).reply(200, body);

    await loadPage(dir, 'https://hexlet.io/courses');
    const data = await fs.readFile(path.join(dir, fileName), 'utf-8');
    const editedData = editSourceLinks(data, localResources, resourcesFolderName);
    expect(data).toBe(editedData);
  });

  test('test 2', async () => {
    const testFilePath = path.join(__dirname, '__fixtures__/html/test2.html');
    const resourcesFolderName = path.join(dir, 'hexlet-io-courses_files');
    const body = await fs.readFile(testFilePath, 'utf-8');
    const localResources = gatherLocalResources(body);

    const fileName = 'hexlet-io-courses.html';
    const hostname = 'https://hexlet.io';
    const pathname = '/courses';
    nock(hostname).get(pathname).reply(200, body)
      .get('/courses/photo.jpg')
      .reply(200, 'image')
      .get('/pix/samples/15m.jpg')
      .reply(200, 'second image');
    await loadPage(dir, 'https://hexlet.io/courses');
    const data = await fs.readFile(path.join(dir, fileName), 'utf-8');

    const editedBody = editSourceLinks(body, localResources, resourcesFolderName);
    expect(data).toBe(editedBody);
  });
});

describe('additional functions testing', () => {
  test('gather local resources', async () => {
    const testFilePath = path.join(__dirname, '__fixtures__/html/test.html');
    const data = await fs.readFile(testFilePath, 'utf-8');
    const localResources = gatherLocalResources(data);
    expect(localResources.length).toBe(4);
  });
});

describe('error cases testing', () => {
  test('wrong dir test', async () => {
    const testFilePath = path.join(__dirname, '__fixtures__/html/test1.html');
    const body = await fs.readFile(testFilePath, 'utf-8');
    const dir = '/unknown';

    const hostname = 'https://hexlet.io';
    const pathname = '/courses';
    nock(hostname).get(pathname).reply(200, body);

    await expect(loadPage(dir, 'https://hexlet.io/courses')).rejects.toThrow("ENOENT: no such file or directory, open '/unknown/hexlet-io-courses.html'");
  });

  test('restricted dir test', async () => {
    const testFilePath = path.join(__dirname, '__fixtures__/html/test1.html');
    const body = await fs.readFile(testFilePath, 'utf-8');
    const dir = '/root';

    const hostname = 'https://hexlet.io';
    const pathname = '/courses';
    nock(hostname).get(pathname).reply(200, body);
    await expect(loadPage(dir, 'https://hexlet.io/courses')).rejects.toThrow("EACCES: permission denied, open '/root/hexlet-io-courses.html'");
  });

  test('page not found error', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
    const hostname = 'https://hexlet.io';
    const pathname = '/courses';
    nock(hostname).get(pathname).reply(404);

    await expect(loadPage(dir, 'https://hexlet.io/courses')).rejects.toThrow('Request failed with status code 404');
    await rimraf(dir, () => {});
  });
});
