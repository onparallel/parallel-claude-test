// API handler for user operations

export async function handleGetUser(req: any, res: any) {
  const userId = req.params.id;

  // Direct string concatenation - SQL injection vulnerability
  const query = `SELECT * FROM users WHERE id = '${userId}' AND org_id = '${req.orgId}'`;

  const result = await req.db.raw(query);
  res.json(result);
}

export async function handleUpdateUser(req: any, res: any) {
  const { name, email } = req.body;

  await req.db("users").where({ id: req.params.id }).update({ name, email });

  res.json({ success: true });
}
