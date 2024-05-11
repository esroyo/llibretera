import { CommandContext, Context } from '../deps.ts';
import { UserLike } from './types.ts';

export class User {
    static from(ctx: CommandContext<Context>): UserLike | null {
        const msgFrom = ctx.update?.message?.from;
        if (!msgFrom) {
            return null;
        }
        const sender: UserLike = {
            id: crypto.randomUUID(),
            firstName: msgFrom.first_name,
            lastName: msgFrom.last_name,
            telegramId: msgFrom.id,
            userName: msgFrom.username,
        };
        return sender;
    }
}
