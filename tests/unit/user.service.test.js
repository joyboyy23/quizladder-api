jest.mock('../../src/repositories/user.repository', () => ({
  findById: jest.fn(),
  update: jest.fn(),
}));

const userRepository = require('../../src/repositories/user.repository');
const userService = require('../../src/services/user.service');

beforeEach(() => jest.resetAllMocks());

test('changeRole rejects changing your own role', async () => {
  userRepository.findById.mockResolvedValue({ user_id: 1 });
  await expect(userService.changeRole(1, 'HOST', { user_id: 1 }))
    .rejects.toMatchObject({ status: 409, code: 'CANNOT_CHANGE_OWN_ROLE' });
  expect(userRepository.update).not.toHaveBeenCalled();
});

test('changeRole rejects unknown id', async () => {
  userRepository.findById.mockResolvedValue(null);
  await expect(userService.changeRole(999, 'HOST', { user_id: 1 }))
    .rejects.toMatchObject({ status: 404, code: 'USER_NOT_FOUND' });
});

test('changeRole calls update for a success', async () => {
  const user = { user_id: 2 };
  userRepository.findById.mockResolvedValue(user);
  userRepository.update.mockResolvedValue(user);
  await userService.changeRole(2, 'HOST', { user_id: 1 });
  expect(userRepository.update).toHaveBeenCalledWith(user, { role: 'HOST' });
});
