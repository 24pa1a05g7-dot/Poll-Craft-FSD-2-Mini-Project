const { User } = require('../models');

class ProfileController {
  static async renderProfile(req, res) {
    res.render('pages/profile/index', {
      title: 'Account Settings - QuickPulse',
      user: req.user,
      errors: [],
      success: req.flash('success')
    });
  }

  static async updateProfile(req, res) {
    const { name, email } = req.body;
    const errors = [];

    if (!name || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Valid email address is required.');
    }

    if (errors.length > 0) {
      return res.status(400).render('pages/profile/index', {
        title: 'Account Settings - QuickPulse',
        user: req.user,
        errors,
        success: []
      });
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== req.user.email) {
        const existing = await User.findOne({ where: { email: normalizedEmail } });
        if (existing) {
          return res.status(409).render('pages/profile/index', {
            title: 'Account Settings - QuickPulse',
            user: req.user,
            errors: ['This email address is already in use by another account.'],
            success: []
          });
        }
      }

      req.user.name = name.trim();
      req.user.email = normalizedEmail;
      await req.user.save();

      req.flash('success', 'Profile details updated successfully.');
      return res.redirect('/profile');
    } catch (err) {
      console.error('[PROFILE UPDATE ERROR]:', err);
      return res.status(500).render('pages/profile/index', {
        title: 'Account Settings - QuickPulse',
        user: req.user,
        errors: ['Failed to update profile details.'],
        success: []
      });
    }
  }

  static async changePassword(req, res) {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const errors = [];

    if (!currentPassword) errors.push('Current password is required.');
    if (!newPassword || newPassword.length < 8) errors.push('New password must be at least 8 characters.');
    if (newPassword !== confirmNewPassword) errors.push('New passwords do not match.');

    if (errors.length > 0) {
      return res.status(400).render('pages/profile/index', {
        title: 'Account Settings - QuickPulse',
        user: req.user,
        errors,
        success: []
      });
    }

    try {
      const isMatch = await req.user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).render('pages/profile/index', {
          title: 'Account Settings - QuickPulse',
          user: req.user,
          errors: ['Current password does not match records.'],
          success: []
        });
      }

      req.user.password = newPassword;
      await req.user.save();

      req.flash('success', 'Password updated successfully.');
      return res.redirect('/profile');
    } catch (err) {
      console.error('[PASSWORD CHANGE ERROR]:', err);
      return res.status(500).render('pages/profile/index', {
        title: 'Account Settings - QuickPulse',
        user: req.user,
        errors: ['Failed to change password.'],
        success: []
      });
    }
  }
}

module.exports = ProfileController;
