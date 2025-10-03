import { isNonNullish } from "remeda";
import { parseReplyToken } from "../../graphql/integrations/utils";
import { BackgroundCheckEntitySearchType } from "../../pdf/__types";
import {
  BackgroundCheckContent,
  EntitySearchRequest,
  EntitySearchResponse,
} from "../../services/BackgroundCheckService";
import { TaskRunner } from "../helpers/TaskRunner";

export class BackgroundCheckResultsPdfRunner extends TaskRunner<"BACKGROUND_CHECK_RESULTS_PDF"> {
  async run() {
    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }

    const { token, name, date, type, country, birth_country: birthCountry } = this.task.input;
    const params = parseReplyToken(token);

    // Prepare search query from task input
    const query = {
      name,
      date,
      type: type as BackgroundCheckEntitySearchType | null,
      country,
      birthCountry,
    };

    // Try to load existing saved search results, or fetch new results from the provider
    const content = await this.loadExtendedSearchContent(query, params);
    await this.onProgress(60); // 60% of the task is done

    // Generate PDF
    const pdfData = await this.ctx.backgroundCheck.entitySearchResultsPdf(
      this.task.user_id,
      content,
    );

    // Upload to temporary storage
    const tmpFile = await this.uploadTemporaryFile({
      stream: pdfData.binary_stream,
      filename: `background-check-results-${name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
      contentType: pdfData.mime_type,
    });

    return { temporary_file_id: tmpFile.id };
  }

  /**
   * Attempts to load previously saved search results from petition or profile
   * If no results are found, fetches new results from the provider
   */
  private async loadExtendedSearchContent(
    query: EntitySearchRequest,
    params: ReturnType<typeof parseReplyToken>,
  ): Promise<{ query: EntitySearchRequest; search: EntitySearchResponse<true> }> {
    let content: BackgroundCheckContent | null = null;
    if ("petitionId" in params) {
      const replies = await this.ctx.petitions.loadRepliesForField(params.fieldId);
      content =
        replies.find(
          (r) =>
            r.type === "BACKGROUND_CHECK" &&
            r.parent_petition_field_reply_id === (params.parentReplyId ?? null),
        )?.content ?? null;
    } else if ("profileId" in params) {
      const { value, draftValue } = await this.ctx.profiles.loadProfileFieldValueWithDraft(params);
      content = draftValue?.content ?? value?.content ?? null;
    }

    if (isNonNullish(content)) {
      return {
        query: content.query,
        search: this.ctx.backgroundCheck.mapBackgroundCheckSearch(content),
      };
    }

    // Fetch fresh results - no saved entity or false positives yet
    const orgId = await this.getOrganizationId(params);
    return {
      query,
      search: this.ctx.backgroundCheck.mapBackgroundCheckSearch({
        query,
        search: await this.ctx.backgroundCheck.entitySearch(query, orgId),
        entity: null,
        falsePositives: [],
      }),
    };
  }

  /**
   * Retrieves organization ID from petition or profile context
   */
  private async getOrganizationId(params: ReturnType<typeof parseReplyToken>): Promise<number> {
    if ("petitionId" in params) {
      const petition = await this.ctx.petitions.loadPetition(params.petitionId);
      if (!petition) {
        throw new Error("Petition not found");
      }
      return petition.org_id;
    }

    if ("profileId" in params) {
      const profile = await this.ctx.profiles.loadProfile(params.profileId);
      if (!profile) {
        throw new Error("Profile not found");
      }
      return profile.org_id;
    }

    throw new Error("Invalid token - missing petition or profile context");
  }
}
