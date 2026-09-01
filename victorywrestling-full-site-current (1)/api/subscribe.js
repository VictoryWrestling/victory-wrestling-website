const HUBSPOT_LIST_ID = process.env.HUBSPOT_LIST_ID || '14';

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function hubspotRequest(path, options = {}) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    throw new Error('Missing HUBSPOT_ACCESS_TOKEN');
  }

  const response = await fetch(`https://api.hubapi.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = body?.message || `HubSpot request failed with ${response.status}`;
    throw new Error(message);
  }

  return body;
}

module.exports = async function subscribe(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, message: 'Method not allowed' });
  }

  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!isValidEmail(email)) {
      return json(res, 400, { ok: false, message: 'Please enter a valid email address.' });
    }

    const upsert = await hubspotRequest('/crm/v3/objects/contacts/batch/upsert', {
      method: 'POST',
      body: JSON.stringify({
        inputs: [
          {
            idProperty: 'email',
            id: email,
            properties: {
              email,
            },
          },
        ],
      }),
    });

    const contactId = upsert.results?.[0]?.id;
    if (!contactId) {
      throw new Error('HubSpot did not return a contact ID.');
    }

    await hubspotRequest(`/crm/v3/lists/${HUBSPOT_LIST_ID}/memberships/add`, {
      method: 'PUT',
      body: JSON.stringify([contactId]),
    });

    return json(res, 200, {
      ok: true,
      message: 'Thanks — you are on the Victory Wrestling email list.',
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return json(res, 500, {
      ok: false,
      message: 'We could not add that email right now. Please email info@victorywrestling.org.',
    });
  }
};
