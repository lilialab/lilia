import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseRouteParams } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { contactCharacterParamsSchema } from '@/schemas/api/contacts/params';
import { removeContact } from '@/services/character/contacts.service';
import { type NextRequest } from 'next/server';

export const DELETE = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/contacts/[characterId]'>) => {
    const userId = await resolveRequestUserId(req);
    const { characterId } = await parseRouteParams(contactCharacterParamsSchema, context.params);
    await removeContact(userId, characterId);
    return successResponse({ ok: true });
  },
);
