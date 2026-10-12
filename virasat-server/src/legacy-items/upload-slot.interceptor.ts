import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, defer, finalize } from 'rxjs';

const MAX_ACTIVE_UPLOADS = 8;
const MAX_ACTIVE_UPLOADS_PER_USER = 2;

/**
 * Uploads are buffered in memory before encryption. Bound how many can be in
 * flight so parallel requests cannot exhaust the API process memory. This runs
 * before the multipart interceptor, so a rejected request is never buffered.
 */
@Injectable()
export class UploadSlotInterceptor implements NestInterceptor {
  private active = 0;
  private readonly perUser = new Map<string, number>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const userId = context
      .switchToHttp()
      .getRequest<{ user?: { id?: string } }>().user?.id;
    if (!userId) return next.handle();
    const userActive = this.perUser.get(userId) ?? 0;
    if (
      this.active >= MAX_ACTIVE_UPLOADS ||
      userActive >= MAX_ACTIVE_UPLOADS_PER_USER
    ) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: 'UPLOAD_BUSY',
          message:
            'Too many uploads are in progress. Please try again shortly.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.active += 1;
    this.perUser.set(userId, userActive + 1);
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      this.active -= 1;
      const remaining = (this.perUser.get(userId) ?? 1) - 1;
      if (remaining > 0) this.perUser.set(userId, remaining);
      else this.perUser.delete(userId);
    };
    return defer(() => next.handle()).pipe(finalize(release));
  }
}
