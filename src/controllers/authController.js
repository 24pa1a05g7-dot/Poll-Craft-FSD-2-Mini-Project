const { User } = require('../models');

class AuthController {
  static renderRegister(req, res) {
    res.render('pages/auth/register', {
      title: 'Create an Account - PollCraft',
      formData: {},
      errors: []
    });
  }

  static async register(req, res) {
    const { name, email, password, confirmPassword } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long.');
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push('Please provide a valid email address.');
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }

    if (password !== confirmPassword) {
      errors.push('Passwords do not match.');
    }

    if (errors.length > 0) {
      return res.status(400).render('pages/auth/register', {
        title: 'Create an Account - PollCraft',
        formData: { name, email },
        errors
      });
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({ where: { email: normalizedEmail } });

      if (existingUser) {
        return res.status(409).render('pages/auth/register', {
          title: 'Create an Account - PollCraft',
          formData: { name, email },
          errors: ['An account with this email address already exists. Please log in.']
        });
      }

      // Public registration ALWAYS creates a regular user account.
      // Roles supplied by the client are strictly ignored to prevent privilege escalation.
      const newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: 'user',
        isActive: true
      });

      // Session regeneration prevents session-fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error('[SESSION REGENERATE ERROR - REGISTER]:', err);
          return res.status(500).render('pages/auth/register', {
            title: 'Create an Account - PollCraft',
            formData: { name, email },
            errors: ['Unable to initialize a secure login session. Please try logging in directly.']
          });
        }

        req.session.userId = newUser.id;
        req.flash('success', `Welcome to PollCraft, ${newUser.name}! Your account has been created.`);

        // Explicitly persist session state before redirect to prevent race conditions
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('[SESSION SAVE ERROR - REGISTER]:', saveErr);
          }
          return res.redirect('/dashboard');
        });
      });
    } catch (err) {
      console.error('[REGISTRATION ERROR]:', err);
      return res.status(500).render('pages/auth/register', {
        title: 'Create an Account - PollCraft',
        formData: { name, email },
        errors: ['An unexpected error occurred while creating your account. Please try again.']
      });
    }
  }

  static renderLogin(req, res) {
    res.render('pages/auth/login', {
      title: 'Sign In - PollCraft',
      formData: {},
      errors: []
    });
  }

  static async login(req, res) {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      errors.push('Please enter both your email address and password.');
      return res.status(400).render('pages/auth/login', {
        title: 'Sign In - PollCraft',
        formData: { email: typeof email === 'string' ? email : '' },
        errors
      });
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const user = await User.findOne({ where: { email: normalizedEmail } });

      if (!user) {
        return res.status(401).render('pages/auth/login', {
          title: 'Sign In - PollCraft',
          formData: { email },
          errors: ['Invalid email or password combination.']
        });
      }

      if (!user.isActive) {
        return res.status(403).render('pages/auth/login', {
          title: 'Sign In - PollCraft',
          formData: { email },
          errors: ['Your account has been deactivated. Please contact an administrator.']
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).render('pages/auth/login', {
          title: 'Sign In - PollCraft',
          formData: { email },
          errors: ['Invalid email or password combination.']
        });
      }

      // Safe destination redirect (prevent open redirects)
      let destination = '/dashboard';
      if (req.session.returnTo && req.session.returnTo.startsWith('/') && !req.session.returnTo.startsWith('//')) {
        destination = req.session.returnTo;
      }

      req.session.regenerate((err) => {
        if (err) {
          console.error('[SESSION REGENERATE ERROR - LOGIN]:', err);
        }
        req.session.userId = user.id;
        req.flash('success', `Welcome back, ${user.name}!`);

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('[SESSION SAVE ERROR - LOGIN]:', saveErr);
          }
          return res.redirect(destination);
        });
      });
    } catch (err) {
      console.error('[LOGIN ERROR]:', err);
      return res.status(500).render('pages/auth/login', {
        title: 'Sign In - PollCraft',
        formData: { email },
        errors: ['An internal error occurred during login. Please try again.']
      });
    }
  }

  static logout(req, res) {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('[LOGOUT ERROR]:', err);
        }
        res.clearCookie('pollcraft.sid');
        res.clearCookie('quickpulse.sid');
        return res.redirect('/auth/login');
      });
    } else {
      return res.redirect('/auth/login');
    }
  }
}

module.exports = AuthController;
