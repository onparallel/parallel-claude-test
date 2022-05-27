import Excel from "exceljs";
import { ApiContext, WorkerContext } from "../../context";
import { Contact, PetitionField, PetitionFieldComment, UserData } from "../../db/__types";
import { fullName } from "../../util/fullName";
import { Maybe } from "../../util/types";
import { ExcelWorksheet } from "./ExcelWorksheet";

export type FieldCommentRow = {
  content: string;
  fieldName: Maybe<string>;
  authorFullName: string;
  authorEmail: string;
  createdAt: string;
  isInternal: string;
};

export class FieldCommentsExcelWorksheet extends ExcelWorksheet<FieldCommentRow> {
  constructor(
    worksheetName: string,
    locale: string,
    wb: Excel.Workbook,
    private context: ApiContext | WorkerContext
  ) {
    super(worksheetName, locale, wb);
    this.locale = locale;
  }

  public async init() {
    const intl = await this.context.i18n.getIntl(this.locale);

    this.page.columns = [
      {
        key: "content",
        header: intl.formatMessage({
          id: "field-comments-excel-worksheet.message",
          defaultMessage: "Message",
        }),
      },
      {
        key: "fieldName",
        header: intl.formatMessage({
          id: "field-comments-excel-worksheet.field",
          defaultMessage: "Field",
        }),
      },
      {
        key: "authorFullName",
        header: intl.formatMessage({
          id: "field-comments-excel-worksheet.full-name",
          defaultMessage: "Full name",
        }),
      },
      {
        key: "authorEmail",
        header: intl.formatMessage({
          id: "field-comments-excel-worksheet.email",
          defaultMessage: "Email",
        }),
      },
      {
        key: "createdAt",
        header: intl.formatMessage({
          id: "field-comments-excel-worksheet.message-sent-at",
          defaultMessage: "Message sent at",
        }),
      },
      {
        key: "isInternal",
        header: intl.formatMessage({
          id: "field-comments-excel-worksheet.internal-comment",
          defaultMessage: "Internal comment?",
        }),
      },
    ];
  }

  public async addFieldComments(field: PetitionField) {
    const fieldComments = await this.context.petitions.loadPetitionFieldCommentsForField({
      petitionFieldId: field.id,
      petitionId: field.petition_id,
      loadInternalComments: true,
    });

    for (const comment of fieldComments) {
      await this.addCommentRow(comment, field.title);
    }
  }

  private async addCommentRow(comment: PetitionFieldComment, fieldTitle: Maybe<string>) {
    const author = await this.loadCommentAuthor(comment);
    const intl = await this.context.i18n.getIntl(this.locale);
    this.addRows({
      authorEmail: author.email,
      authorFullName: fullName(author.first_name, author.last_name),
      content: comment.content,
      createdAt: comment.created_at.toISOString(),
      fieldName: fieldTitle,
      isInternal: comment.is_internal
        ? intl.formatMessage({
            id: "generic.yes",
            defaultMessage: "Yes",
          })
        : intl.formatMessage({
            id: "generic.no",
            defaultMessage: "No",
          }),
    });
  }

  private async loadCommentAuthor(comment: PetitionFieldComment): Promise<Contact | UserData> {
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
          `Contact not found for PetitionAccess with id ${comment.petition_access_id}`
        );
      }
      return author;
    }

    throw new Error(
      `expected user_id or petition_access_id to be defined in PetitionFieldComment with id ${comment.id}`
    );
  }
}
