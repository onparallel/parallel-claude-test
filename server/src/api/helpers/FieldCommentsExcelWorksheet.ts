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
  constructor(locale: string, wb: Excel.Workbook, private context: ApiContext | WorkerContext) {
    super(locale === "en" ? "Comments" : "Comentarios", locale, wb);
    this.page.columns = [
      {
        key: "content",
        header: this.locale === "en" ? "Message" : "Mensaje",
      },
      { key: "fieldName", header: this.locale === "en" ? "Field" : "Campo" },
      {
        key: "authorFullName",
        header: this.locale === "en" ? "Full name" : "Nombre completo",
      },
      { key: "authorEmail", header: "Email" },
      {
        key: "createdAt",
        header: this.locale === "en" ? "Message sent at" : "Hora de envío del mensaje",
      },
      {
        key: "isInternal",
        header: this.locale === "en" ? "Internal comment?" : "¿Comentario interno?",
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
    this.addRows({
      authorEmail: author.email,
      authorFullName: fullName(author.first_name, author.last_name),
      content: comment.content,
      createdAt: comment.created_at.toISOString(),
      fieldName: fieldTitle,
      isInternal: this.boolToLocaleString(comment.is_internal, this.locale),
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

  private boolToLocaleString(value: boolean, locale: string) {
    if (value) {
      return locale === "en" ? "Yes" : "Si";
    }
    return locale === "en" ? "No" : "No";
  }
}
