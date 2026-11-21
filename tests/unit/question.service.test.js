jest.mock('../../src/repositories/question.repository', () => ({
  createWithAnswers: jest.fn(),
  findInSet: jest.fn(),
  updateWithAnswers: jest.fn(),
  removeWithAnswers: jest.fn(),
}));
jest.mock('../../src/services/question-set.service', () => ({
  getEditable: jest.fn(),
}));

const questionRepository = require('../../src/repositories/question.repository');
const questionSetService = require('../../src/services/question-set.service');
const questionService = require('../../src/services/question.service');

beforeEach(() => jest.resetAllMocks());

test('create rejects QUESTION_LIMIT_REACHED', async () => {
  questionSetService.getEditable.mockResolvedValue({ question_set_id: 1 });
  questionRepository.createWithAnswers.mockResolvedValue({ limitReached: true });
  await expect(questionService.create(1, { text: 'Question?', choices: [] }, { user_id: 1 }))
    .rejects.toMatchObject({ status: 409, code: 'QUESTION_LIMIT_REACHED' });
});

test('create passes only text and is_correct to the repository', async () => {
  questionSetService.getEditable.mockResolvedValue({ question_set_id: 1 });
  questionRepository.createWithAnswers.mockResolvedValue({ question: { question_id: 2 } });
  await questionService.create(1, {
    text: 'Question?',
    choices: [{ text: 'A', is_correct: true }, { text: 'B', is_correct: false }],
  }, { user_id: 1 });
  expect(questionRepository.createWithAnswers).toHaveBeenCalledWith(
    1,
    'Question?',
    [{ text: 'A', is_correct: true }, { text: 'B', is_correct: false }],
    100
  );
});

test('update unknown question rejects and does not write', async () => {
  questionSetService.getEditable.mockResolvedValue({ question_set_id: 1 });
  questionRepository.findInSet.mockResolvedValue(null);
  await expect(questionService.update(1, 999, { text: 'Changed' }, { user_id: 1 }))
    .rejects.toMatchObject({ status: 404, code: 'QUESTION_NOT_FOUND' });
  expect(questionRepository.updateWithAnswers).not.toHaveBeenCalled();
});

test('remove unknown question rejects and does not write', async () => {
  questionSetService.getEditable.mockResolvedValue({ question_set_id: 1 });
  questionRepository.findInSet.mockResolvedValue(null);
  await expect(questionService.remove(1, 999, { user_id: 1 }))
    .rejects.toMatchObject({ status: 404, code: 'QUESTION_NOT_FOUND' });
  expect(questionRepository.removeWithAnswers).not.toHaveBeenCalled();
});
