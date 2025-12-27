# Custom Authentication Setup

This project uses custom authentication (username/password) instead of Supabase Auth. This allows us to use only name + password without requiring email addresses.

## How It Works

1. **Password Hashing**: Passwords are hashed using bcrypt before storing in the database
2. **JWT Tokens**: Sessions are managed using JWT tokens stored in cookies
3. **Database**: User credentials are stored directly in the `users` table

## Environment Variables

Add the following to your `.env` file:

```
JWT_SECRET=your-secret-key-here-change-in-production
```

**Important**: Use a strong, random secret key in production. You can generate one using:
```bash
openssl rand -base64 32
```

## Database Setup

The password hashing function has been added via migration `008_add_password_hash_function.sql`. This uses PostgreSQL's `pgcrypto` extension.

## Migration from Supabase Auth

If you have existing users created with Supabase Auth, you'll need to:
1. Migrate their passwords (if possible) or have them reset passwords
2. Update the `users` table to use the new `name` field instead of `username`
3. Ensure `password_hash` is properly set for all users

## Security Notes

- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 7 days
- Tokens are stored in HTTP-only cookies (when implemented in production)
- The service role key is used for authentication operations to bypass RLS

## Testing

1. Register a new user with name + password
2. Login with name + password
3. Verify the JWT token is stored in cookies
4. Verify protected routes work correctly

