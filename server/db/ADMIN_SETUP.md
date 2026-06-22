# Admin Setup

## Grant admin access to a user

Run this in your Supabase SQL editor, replacing the email address:

```sql
UPDATE users_profile SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');
```
