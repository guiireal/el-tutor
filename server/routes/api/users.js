const router = require('express').Router();
const User = require('../../models/User');
const Student = require('../../models/Student');
const Teacher = require('../../models/Teacher');
const auth = require('../../config/auth');
const haveAdmin = require('../../utils/haveAdmin');
const isAdmin = require('../../utils/isAdmin');

/* Create a user */
router.post('/', haveAdmin, async (req, res) => {
  let student;
  let teacher;
  const { role } = req.body;
  const user = new User(req.body);

  if (role === 'student') {
    student = new Student({ _user: user._id });
    user._student = student._id;
    await student.save();
  }
  if (role === 'teacher') {
    teacher = new Teacher({ _user: user._id });
    user._teacher = teacher._id;
    await teacher.save();
  }

  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

/* Get all users */
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (e) {
    res.status(400).send(e);
  }
});

/* Get logged in user details */
router.get('/me', auth, async (req, res) => {
  try {
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

/* Get user by id */
router.get('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    return !user ? res.sendStatus(404) : res.send(user);
  } catch (e) {
    return res.sendStatus(400);
  }
});

/* Update logged in user */
router.patch('/me', auth, async (req, res) => {
  const validationErrors = [];
  const updates = Object.keys(req.body);
  const allowedUpdates = ['email', 'name', 'password', 'role'];
  const isValidOperation = updates.every(update => {
    const isValid = allowedUpdates.includes(update);
    if (!isValid) validationErrors.push(update);
    return isValid;
  });

  if (!isValidOperation)
    return res.status(400).send({ error: `Invalid updates: ${validationErrors.join(',')}` });

  try {
    const { user } = req;
    updates.forEach(update => {
      user[update] = req.body[update];
    });

    await user.save();
    return res.send(user);
  } catch (e) {
    return res.status(400).send(e);
  }
});

/* Update user by id */
router.patch('/:id', auth, isAdmin, async (req, res) => {
  const validationErrors = [];
  const updates = Object.keys(req.body);
  const allowedUpdates = ['email', 'name', 'password', 'role'];
  const isValidOperation = updates.every(update => {
    const isValid = allowedUpdates.includes(update);
    if (!isValid) validationErrors.push(update);
    return isValid;
  });

  if (!isValidOperation)
    return res.status(400).send({ error: `Invalid updates: ${validationErrors.join(',')}` });

  try {
    const _id = req.params.id;
    const user = await User.findById(_id);
    if (!user) return res.sendStatus(404);
    updates.forEach(update => {
      user[update] = req.body[update];
    });
    await user.save();

    return res.send(user);
  } catch (e) {
    return res.status(400).send(e);
  }
});

/* Delete logged in user */
router.delete('/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send({ message: 'User Deleted' });
  } catch (e) {
    res.sendStatus(400);
  }
});

/* Delete user by id */
router.delete('/:id', auth, isAdmin, async (req, res) => {
  const _id = req.params.id;
  try {
    const user = await User.findByIdAndDelete(_id);
    if (!user) return res.sendStatus(404);

    return res.send({ message: 'User Deleted' });
  } catch (e) {
    return res.sendStatus(400);
  }
});

/* Login User */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send({
      error: { message: 'You have entered an invalid email or password' }
    });
  }
});

/* Logout user */
router.post('/logout', auth, async (req, res) => {
  const { user } = req;
  try {
    user.tokens = user.tokens.filter(token => {
      return token.token !== req.token;
    });
    await user.save();
    res.send({ message: 'You have successfully logged out!' });
  } catch (e) {
    res.status(400).send(e);
  }
});

/* Logout user from all devices */
router.post('/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send({ message: 'You have successfully logged out!' });
  } catch (e) {
    res.status(400).send(e);
  }
});
module.exports = router;
