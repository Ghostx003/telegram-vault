const express = require('express');
const router = express.Router();
const authService = require('../telegram/authentication');

router.get('/status', async (req, res) => {
  try {
    const status = await authService.getAuthStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/send-code', async (req, res) => {
  try {
    const { phoneNumber, apiHash } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    const result = await authService.sendVerificationCode(phoneNumber, apiHash);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/verify-code', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Verification code is required' });
    }
    const result = await authService.verifyCode(code);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/verify-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }
    const result = await authService.verifyPassword(password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const result = await authService.logout();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
