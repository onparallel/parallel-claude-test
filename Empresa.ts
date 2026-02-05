export class Empresa {
  constructor(
    public id: string,
    public name: string,
    public org_id: string,
    public rfc: string,
  ) {}

  getEmpresaInfo() {
    console.log(`Empresa ID: ${this.id}, Name: ${this.name}, RFC: ${this.rfc}`);
  }

  updateEmpresaName(newName: string) {
    this.name = newName;
    console.log(`Empresa name updated to: ${this.name}`);
  }

  deleteEmpresa() {
    console.log(`Empresa with ID: ${this.id} has been deleted.`);
  }
}
