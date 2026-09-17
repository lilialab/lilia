import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { AppError } from '@/lib/server/app-error';
import { parseRouteParams } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { characterParamsSchema } from '@/schemas/api/characters/params';
import { getCharacterAvatar, saveCharacterAvatar } from '@/services/character/avatar.service';
import { API_ERROR_CODE } from '@/types/api-error';
import { type NextRequest, NextResponse } from 'next/server';

/** 公开：角色头像可读，无需登录（上传仍须登录且为创建者）。 */
export const GET = withApiHandler(
  async (_req: NextRequest, context: RouteContext<'/api/characters/[characterId]/avatar'>) => {
    const { characterId } = await parseRouteParams(characterParamsSchema, context.params);
    const avatar = await getCharacterAvatar(characterId);
    return new NextResponse(Buffer.from(avatar.body), {
      headers: {
        'Content-Type': avatar.contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  },
);

export const POST = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/characters/[characterId]/avatar'>) => {
    const userId = await resolveRequestUserId(req);
    const { characterId } = await parseRouteParams(characterParamsSchema, context.params);
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      throw AppError.badRequest('请选择图片', API_ERROR_CODE.AVATAR_REQUIRED);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const character = await saveCharacterAvatar(userId, characterId, bytes);
    return successResponse({ character });
  },
);
