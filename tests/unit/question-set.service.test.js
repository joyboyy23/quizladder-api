jest.mock('../../src/repositories/question-set.repository', () => ({
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  removeWithContent: jest.fn(),
}));
jest.mock('../../src/repositories/session.repository', () => ({
  countByQuestionSet: jest.fn(),
}));
jest.mock('../../src/lib/cover-files', () => ({
  removeCover: jest.fn(),
}));

const questionSetRepository = require('../../src/repositories/question-set.repository');
const sessionRepository = require('../../src/repositories/session.repository');
const coverFiles = require('../../src/lib/cover-files');
const questionSetService = require('../../src/services/question-set.service');

beforeEach(() => jest.resetAllMocks());

test('getOwned allows the owner', async () => {
  questionSetRepository.findById.mockResolvedValue({ question_set_id: 1, owner_id: 10 });
  await expect(questionSetService.getOwned(1, { user_id: 10, role: 'HOST' })).resolves.toBeDefined();
});

test('getOwned allows an ADMIN', async () => {
  questionSetRepository.findById.mockResolvedValue({ question_set_id: 1, owner_id: 10 });
  await expect(questionSetService.getOwned(1, { user_id: 1, role: 'ADMIN' })).resolves.toBeDefined();
});

test('getOwned rejects another HOST', async () => {
  questionSetRepository.findById.mockResolvedValue({ question_set_id: 1, owner_id: 10 });
  await expect(questionSetService.getOwned(1, { user_id: 11, role: 'HOST' }))
    .rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
});

test('getOwned makes a set without owner ADMIN-only', async () => {
  questionSetRepository.findById.mockResolvedValue({ question_set_id: 1, owner_id: null });
  await expect(questionSetService.getOwned(1, { user_id: 10, role: 'HOST' }))
    .rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
});

test('getEditable rejects a set used by a game', async () => {
  questionSetRepository.findById.mockResolvedValue({ question_set_id: 1, owner_id: 10 });
  sessionRepository.countByQuestionSet.mockResolvedValue(1);
  await expect(questionSetService.getEditable(1, { user_id: 10, role: 'HOST' }))
    .rejects.toMatchObject({ status: 409, code: 'QUESTION_SET_IN_USE' });
});

test('remove on a used set never calls removeWithContent', async () => {
  questionSetRepository.findById.mockResolvedValue({ question_set_id: 1, owner_id: 10 });
  sessionRepository.countByQuestionSet.mockResolvedValue(1);
  await expect(questionSetService.remove(1, { user_id: 10, role: 'HOST' }))
    .rejects.toMatchObject({ status: 409, code: 'QUESTION_SET_IN_USE' });
  expect(questionSetRepository.removeWithContent).not.toHaveBeenCalled();
  expect(coverFiles.removeCover).not.toHaveBeenCalled();
});

test('get missing id rejects 404', async () => {
  questionSetRepository.findById.mockResolvedValue(null);
  await expect(questionSetService.get(999))
    .rejects.toMatchObject({ status: 404, code: 'QUESTION_SET_NOT_FOUND' });
});
