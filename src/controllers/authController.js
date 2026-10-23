const { User } = require('../models');

class AuthController {
  static renderRegister(req, res) {
    res.render('pages/auth/register', {
      title: 'Create an Account - QuickPulse',
      formData: {},
      errors: []
    });
  }

  static async register(req, res) {
    const { name, email, password, confirmPassword } = req.body;
    const errors = [];

    if (!name || name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long.');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please provide a valid email address.');
    }

    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }

    if (password !== confirmPassword) {
      errors.push('Passwords do not match.');
    }

    if (errors.length > 0) {
      return res.status(400).render('pages/auth/register', {
        title: 'Create an Account - QuickPulse',
        formData: { name, email },
        errors
      });
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({ where: { email: normalizedEmail } });

      if (existingUser) {
        return res.status(409).render('pages/auth/register', {
          title: 'Create an Account - QuickPulse',
          formData: { name, email },
          errors: ['An account with this email address already exists. Please log in.']
        });
      }

      // Check if this is the first registered user, make admin if desired, otherwise regular 'user'
      const userCount = await User.count();
      const role = userCount === 0 ? 'admin' : 'user';

      const newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role,
        isActive: true
      });

      // Session regeneration to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error('[SESSION ERROR]:', err);
        }
        req.session.userId = newUser.id;
        req.flash('success', `Welcome to QuickPulse, ${newUser.name}! Your account has been created.`);
        return res.redirect('/dashboard');
      });
    } catch (err) {
      console.error('[REGISTRATION ERROR]:', err);
      return res.status(500).render('pages/auth/register', {
        title: 'Create an Account - QuickPulse',
        formData: { name, email },
        errors: ['An unexpected error occurred while creating your account. Please try again.']
      });
    }
  }

  static renderLogin(req, res) {
    res.render('pages/auth/login', {
      title: 'Sign In - QuickPulse',
      formData: {},
      errors: []
    });
  }

  static async login(req, res) {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !password) {
      errors.push('Please enter both your email address and password.');
      return res.status(400).render('pages/auth/login', {
        title: 'Sign In - QuickPulse',
        formData: { email },
        errors
      });
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const user = await User.findOne({ where: { email: normalizedEmail } });

      if (!user) {
        return res.status(401).render('pages/auth/login', {
          title: 'Sign In - QuickPulse',
          formData: { email },
          errors: ['Invalid email or password combination.']
        });
      }

      if (!user.isActive) {
        return res.status(403).render('pages/auth/login', {
          title: 'Sign In - QuickPulse',
          formData: { email },
          errors: ['Your account has been deactivated. Please contact an administrator.']
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).render('pages/auth/login', {
          title: 'Sign In - QuickPulse',
          formData: { email },
          errors: ['Invalid email or password combination.']
        });
      }

      // Regenerate session ID to prevent session fixation attacks
      const returnTo = req.session.returnTo;
      req.session.regenerate((err) => {
        if (err) {
          console.error('[SESSION REGENERATE ERROR]:', err);
        }
        req.session.userId = user.id;
        req.flash('success', `Welcome back, ${user.name}!`);
        const destination = returnTo || '/dashboard';
        return res.redirect(destination);
      });
    } catch (err) {
      console.error('[LOGIN ERROR]:', err);
      return res.status(500).render('pages/auth/login', {
        title: 'Sign In - QuickPulse',
        formData: { email },
        errors: ['An internal error occurred during login. Please try again.']
      });
    }
  }

  static logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('[LOGOUT ERROR]:', err);
      }
      res.clearCookie('quickpulse.sid');
      return res.redirect('/auth/login');
    });
  }
}

module.exports = AuthController;
