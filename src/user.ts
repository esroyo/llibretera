import { GrammyCommandContext, GrammyContext } from '../deps.ts';
import { UserLike } from './types.ts';

export class User {
    static from(ctx: GrammyCommandContext<GrammyContext>): UserLike | null {
        const msgFrom = ctx.update?.message?.from;
        if (!msgFrom) {
            return null;
        }
        const sender: UserLike = {
            firstName: msgFrom.first_name,
            languageCode: msgFrom.language_code,
            lastName: msgFrom.last_name,
            telegramId: String(msgFrom.id),
            userId: crypto.randomUUID(),
            userName: msgFrom.username,
        };
        return sender;
    }
}
