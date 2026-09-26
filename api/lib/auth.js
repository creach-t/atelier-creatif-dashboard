function requireDashboardAuth(req, res) {
  const expected = process.env.DASHBOARD_ACCESS_TOKEN;
  if (!expected) {
    res.status(500).json({ error: 'DASHBOARD_ACCESS_TOKEN is not configured on the server.' });
    return false;
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token || token !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  return true;
}

module.exports = { requireDashboardAuth };
