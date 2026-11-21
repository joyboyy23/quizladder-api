jest.mock('../../src/repositories/user.repository', () => ({
  create: jest.fn(),
  findForLogin: jest.fn(),
}));
jest.mock('../../src/security/password', () => ({
  hash: jest.fn(),
  matches: jest.fn(),
}));
jest.mock('../../src/security/token', () => ({
  issue: jest.fn(),
}));

const userRepository = require('../../src/repositories/user.repository');
const password = require('../../src/security/password');
const token = require('../../src/security/token');
const authService = require('../../src/services/auth.service');

beforeEach(() => jest.resetAllMocks());

test('register always creates role PLAYER even for ADMIN input', async () => {
  password.hash.mockResolvedValue('hashed-password');
  userRepository.create.mockResolvedValue({ user_id: 1 });
  await authService.register({ school_id: '1234-12345', password: 'plain', role: 'ADMIN' });
  expect(password.hash).toHaveBeenCalledWith('plain');
  expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
    role: 'PLAYER',
    password_hash: 'hashed-password',
  }));
  expect(userRepository.create.mock.calls[0][0]).not.toHaveProperty('password');
});

test('unknown school ID rejects with INVALID_CREDENTIALS', async () => {
  userRepository.findForLogin.mockResolvedValue(null);
  password.matches.mockResolvedValue(false);
  await expect(authService.login({ school_id: '1234-99999', password: 'wrong' }))
    .rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS', message: 'School ID or password is incorrect.' });
});

test('wrong password rejects with INVALID_CREDENTIALS', async () => {
  userRepository.findForLogin.mockResolvedValue({ password_hash: 'hash' });
  password.matches.mockResolvedValue(false);
  await expect(authService.login({ school_id: '2023-00123', password: 'wrong' }))
    .rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS', message: 'School ID or password is incorrect.' });
});

test('login success returns token metadata', async () => {
  const user = { user_id: 1, password_hash: 'hash' };
  userRepository.findForLogin.mockResolvedValue(user);
  password.matches.mockResolvedValue(true);
  token.issue.mockReturnValue('signed-token');
  await expect(authService.login({ school_id: '2023-00123', password: 'quizladder' }))
    .resolves.toMatchObject({ token: 'signed-token', token_type: 'Bearer', expires_in: expect.any(String), user });
});

test('login refuses an account with null password_hash', async () => {
  userRepository.findForLogin.mockResolvedValue({ password_hash: null });
  password.matches.mockResolvedValue(false);
  await expect(authService.login({ school_id: '2023-00123', password: 'quizladder' }))
    .rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
  expect(password.matches).toHaveBeenCalledWith('quizladder', null);
});
