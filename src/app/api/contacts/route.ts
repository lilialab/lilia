import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { addContactBodySchema } from '@/schemas/api/contacts/post';
import { addContact, listContacts } from '@/services/character/contacts.service';
import { type NextRequest } from 'next/server';

export const GET = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const contacts = await listContacts(userId);
  return successResponse({ contacts });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const { characterId } = await parseJsonBody(addContactBodySchema, req);
  const contact = await addContact(userId, characterId);
  return successResponse({ contact });
});
