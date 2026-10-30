import type { NextRequest } from 'next/server';
import { startOAuth } from '../../../lib/oauth.ts';

export const GET = (request: NextRequest) => startOAuth(request, 'google');
