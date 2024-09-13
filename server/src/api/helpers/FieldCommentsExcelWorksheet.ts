import Excel from "exceljs";
import pMap from "p-map";
import { IntlShape } from "react-intl";
import { Contact, PetitionField, PetitionFieldComment, UserData } from "../../db/__types";
import { ContactRepository } from "../../db/repositories/ContactRepository";
import { PetitionRepository } from "../../db/repositories/PetitionRepository";
import { UserRepository } from "../../db/repositories/UserRepository";
import { fullName } from "../../util/fullName";
import { pFlatMap } from "../../util/promises/pFlatMap";
import { renderSlateWithMentionsToText } from "../../util/slate/mentions";
import { Maybe } from "../../util/types";
import { ExcelWorksheet } from "./ExcelWorksheet";

export interface FieldCommentRow {
  content: string;
  fieldName: Maybe<string>;
  authorFullName: string;
  authorEmail: string;
  createdAt: string;
  isInternal: string;
}

export class FieldCommentsExcelWorksheet extends ExcelWorksheet<FieldCommentRow> {
  constructor(
    worksheetName: string,
    wb: Excel.Workbook,
    private intl: IntlShape,
    private context: {
      petitions: PetitionRepository;
      users: UserRepository;
      contacts: ContactRepository;
    },
  ) {
    super(worksheetName, wb);
  }

  public async init() {
    this.page.columns = [
      {
        key: "content",
        header: this.intl.formatMessage({
          id: "field-comments-excel-worksheet.message",
          defaultMessage: "Message",
        }),
      },
      {
        key: "fieldName",
        header: this.intl.formatMessage({
          id: "field-comments-excel-worksheet.field",
          defaultMessage: "Field",
        }),
      },
      {
        key: "authorFullName",
        header: this.intl.formatMessage({
          id: "field-comments-excel-worksheet.full-name",
          defaultMessage: "Full name",
        }),
      },
      {
        key: "authorEmail",
        header: this.intl.formatMessage({
          id: "field-comments-excel-worksheet.email",
          defaultMessage: "Email",
        }),
      },
      {
        key: "createdAt",
        header: this.intl.formatMessage({
          id: "field-comments-excel-worksheet.message-sent-at",
          defaultMessage: "Message sent at",
        }),
      },
      {
        key: "isInternal",
        header: this.intl.formatMessage({
          id: "field-comments-excel-worksheet.internal-comment",
          defaultMessage: "Internal comment?",
        }),
      },
    ];
  }

  public async addFieldComments(fields: Pick<PetitionField, "id" | "petition_id" | "title">[]) {
    const comments = await pFlatMap(fields, async (field) => {
      const comments = await this.context.petitions.loadPetitionFieldCommentsForField({
        petitionFieldId: field.id,
        petitionId: field.petition_id,
        loadInternalComments: true,
      });
      return await pMap(comments, async (comment) => {
        const author = await this.loadCommentAuthor(comment);
        return { comment, author, field };
      });
    });
    for (const { comment, field, author } of comments) {
      this.addRows({
        authorEmail: author.email,
        authorFullName: fullName(author.first_name, author.last_name),
        content: renderSlateWithMentionsToText(comment.content_json),
        createdAt: comment.created_at.toISOString(),
        fieldName: field.title,
        isInternal: comment.is_internal
          ? this.intl.formatMessage({ id: "generic.yes", defaultMessage: "Yes" })
          : this.intl.formatMessage({ id: "generic.no", defaultMessage: "No" }),
      });
    }
  }

  private async loadCommentAuthor(
    comment: Pick<PetitionFieldComment, "id" | "user_id" | "petition_access_id">,
  ): Promise<Contact | UserData> {
    if (comment.user_id) {
      const user = await this.context.users.loadUser(comment.user_id);
      const authorData = user ? await this.context.users.loadUserData(user.user_data_id) : null;
      if (!authorData) {
        throw new Error(`UserData for User:${comment.user_id} not found`);
      }
      return authorData;
    }

    if (comment.petition_access_id) {
      const author = await this.context.contacts.loadContactByAccessId(comment.petition_access_id);

      if (!author) {
        throw new Error(
          `Contact not found for PetitionAccess with id ${comment.petition_access_id}`,
        );
      }
      return author;
    }

    throw new Error(
      `expected user_id or petition_access_id to be defined in PetitionFieldComment with id ${comment.id}`,
    );
  }
}
