import sanitizeFilename from "sanitize-filename";
import { Readable } from "stream";
import { TaskRunner } from "../helpers/TaskRunner";

export class DowJonesProfileDownloadRunner extends TaskRunner<"DOW_JONES_PROFILE_DOWNLOAD"> {
  async run() {
    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }

    const user = (await this.ctx.users.loadUser(this.task.user_id))!;

    const hasFeatureFlag = await this.ctx.featureFlags.userHasFeatureFlag(this.task.user_id, [
      "DOW_JONES_KYC",
    ]);

    const [dowJonesIntegration] = await this.ctx.integrations.loadIntegrationsByOrgId(
      user.org_id,
      "DOW_JONES_KYC"
    );

    if (!hasFeatureFlag) {
      throw new Error(`User ${this.task.user_id} has no access to DOW JONES feature`);
    }
    if (!dowJonesIntegration) {
      throw new Error(`DOW JONES integration not found for user ${this.task.user_id}`);
    }

    const response = await this.ctx.dowJonesKyc.riskEntityProfilePdf(
      dowJonesIntegration.id,
      this.task.input.profile_id
    );

    const tmpFile = await this.uploadTemporaryFile({
      stream: Readable.from(Buffer.from(response.binary_stream, "base64")),
      filename: sanitizeFilename(`${this.task.input.profile_id}.pdf`),
      contentType: response.mime_type,
    });

    return { temporary_file_id: tmpFile.id };
  }
}
