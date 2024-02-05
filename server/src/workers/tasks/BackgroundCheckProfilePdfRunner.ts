import { isDefined } from "remeda";
import { parseBackgroundCheckToken } from "../../graphql/integrations/utils";
import { TaskRunner } from "../helpers/TaskRunner";

export class BackgroundCheckProfilePdfRunner extends TaskRunner<"BACKGROUND_CHECK_PROFILE_PDF"> {
  async run() {
    await using _ = await this.ctx.redis.withConnection();
    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }

    const { token, entity_id: entityId } = this.task.input;

    const params = parseBackgroundCheckToken(token);

    const replies = await this.ctx.petitions.loadRepliesForField(params.fieldId);

    const reply = replies.find(
      (r) =>
        r.type === "BACKGROUND_CHECK" &&
        r.content.entity?.id === entityId &&
        r.parent_petition_field_reply_id === (params.parentReplyId ?? null),
    );

    const props = isDefined(reply)
      ? {
          entity: reply.content.entity,
          query: reply.content.query,
          search: reply.content.search,
        }
      : {
          entity: await this.ctx.backgroundCheck.entityProfileDetails(entityId, this.task.user_id),
        };

    await this.onProgress(50);

    const data = await this.ctx.backgroundCheck.entityProfileDetailsPdf(this.task.user_id, props);

    const tmpFile = await this.uploadTemporaryFile({
      stream: data.binary_stream,
      filename: `${props.entity.type}-${props.entity.id}.pdf`,
      contentType: data.mime_type,
    });

    return { temporary_file_id: tmpFile.id };
  }
}
