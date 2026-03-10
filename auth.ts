import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        isSignUp: { label: 'Sign Up', type: 'checkbox' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const name = credentials.name as string;
        const isSignUp = credentials.isSignUp === 'true' || credentials.isSignUp === true;

        try {
          if (isSignUp) {
            // Sign up: create new user
            if (!name) throw new Error('Name required for signup');

            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
              throw new Error('User already exists');
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await prisma.user.create({
              data: {
                email,
                name,
                password: hashedPassword,
                totalPoints: 0,
                streakDays: 0,
                level: 1,
              },
            });

            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
          } else {
            // Sign in: authenticate existing user
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
              throw new Error('User not found');
            }

            if (!user.password) {
              throw new Error('Invalid credentials');
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
              throw new Error('Invalid password');
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
          }
        } catch (error) {
          throw new Error(
            error instanceof Error ? error.message : 'Authentication failed'
          );
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
});
