import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { AppError } from '@/lib/server/app-error';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { uploadUserAvatar } from '@/services/user/avatar.service';
import { API_ERROR_CODE } from '@/types/api-error';
import { type NextRequest } from 'next/server';

export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    throw AppError.badRequest('请选择图片', API_ERROR_CODE.AVATAR_REQUIRED);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const user = await uploadUserAvatar(userId, bytes);
  return successResponse({ user });
});
